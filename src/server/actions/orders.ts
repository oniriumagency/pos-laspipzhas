'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CartItem } from '@/store/usePosStore';

/**
 * processSale — Server Action
 * 
 * Orquesta una venta completa:
 *  1. Verifica la sesión del usuario.
 *  2. Resuelve los ingredientes base por tamaño.
 *  3. Resuelve los ingredientes de cada sabor.
 *  4. Calcula el total con el descuento global.
 *  5. Llama al RPC `procesar_venta` en Supabase de forma atómica.
 *  6. Invalida las vistas de inventario y ventas.
 *
 * @param cart           - Items del carrito Zustand
 * @param origenVenta    - Canal de la venta ('local' | 'delivery' | 'whatsapp' | 'telefono')
 * @param descuentoGlobal - Porcentaje de descuento sobre el total (0–100)
 */
export async function processSale(
  cart: CartItem[],
  origenVenta: string = 'local',
  descuentoGlobal: number = 0
) {
  try {
    const supabase = await createClient();

    // ── 1. Verificar sesión ──
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    // ── 2. Traer ingredientes base con los nombres exactos de la BD ──
    const NOMBRES_BASE = [
      'Masa (Bollo crudo)',
      'Salsa de Tomate',
      'Queso Mozzarella',
      'Servilletas',
    ];

    const { data: baseIng } = await supabase
      .from('ingredientes')
      .select('id, nombre')
      .in('nombre', NOMBRES_BASE);

    /**
     * Construye la lista de ingredientes base que se descuentan automáticamente
     * por cada pizza vendida. Las Servilletas se cuentan 3 veces por pizza.
     */
    const getBaseList = () => {
      if (!baseIng) return [];
      const items: { ingrediente_id: string }[] = [];

      const masa      = baseIng.find(i => i.nombre === 'Masa (Bollo crudo)');
      const salsa     = baseIng.find(i => i.nombre === 'Salsa de Tomate');
      const queso     = baseIng.find(i => i.nombre === 'Queso Mozzarella');
      const servi     = baseIng.find(i => i.nombre === 'Servilletas');

      if (masa)  items.push({ ingrediente_id: masa.id });
      if (salsa) items.push({ ingrediente_id: salsa.id });
      if (queso) items.push({ ingrediente_id: queso.id });
      // 3 servilletas por pizza
      if (servi) {
        items.push({ ingrediente_id: servi.id });
        items.push({ ingrediente_id: servi.id });
        items.push({ ingrediente_id: servi.id });
      }

      return items;
    };

    // ── 3. Resolver ingredientes de sabores ──
    const saborIds = [
      ...cart.map(i => i.sabor_1?.id),
      ...cart.map(i => i.sabor_2?.id),
    ].filter(Boolean) as string[];

    let relacionesSabor: { sabor_id: string; ingrediente_id: string }[] = [];
    if (saborIds.length > 0) {
      const { data: rel } = await supabase
        .from('sabor_ingredientes')
        .select('sabor_id, ingrediente_id')
        .in('sabor_id', Array.from(new Set(saborIds)));
      relacionesSabor = rel || [];
    }

    // ── 4. Construir el payload para el RPC ──
    const payload = cart.map((item) => {
      const ingMitad1 = relacionesSabor
        .filter(r => r.sabor_id === item.sabor_1?.id)
        .map(r => ({ ingrediente_id: r.ingrediente_id }));

      const ingMitad2 = item.es_mitades
        ? relacionesSabor
            .filter(r => r.sabor_id === item.sabor_2?.id)
            .map(r => ({ ingrediente_id: r.ingrediente_id }))
        : [];

      const extrasReal = item.extras.map(t => ({ ingrediente_id: t.ingrediente_id }));
      const bases = getBaseList();

      return {
        tamano_id:       item.tamano_id,
        tamano_nombre:   item.tamano_nombre,
        sabor_1_nombre:  item.sabor_1?.nombre ?? null,
        sabor_2_nombre:  item.sabor_2?.nombre ?? null,
        precio_unitario: item.precio_unitario,
        cantidad:        item.cantidad,
        mitad_1:         ingMitad1,
        mitad_2:         ingMitad2,
        extras:          [...bases, ...extrasReal],
      };
    });

    // ── 5. Calcular totales ──
    const subtotal = cart.reduce(
      (acc, item) => acc + item.precio_unitario * item.cantidad,
      0
    );
    const descuentoAmount = subtotal * (descuentoGlobal / 100);
    const totalFinal = Math.round(subtotal - descuentoAmount);

    // ── 6. Ejecutar RPC atómico ──
    const { data, error } = await supabase.rpc('procesar_venta', {
      cart_payload:       payload,
      p_total_precio:     totalFinal,
      p_user_id:          user.id,
      p_origen_venta:     origenVenta,
      p_descuento_global: descuentoGlobal,
    });

    if (error) {
      console.error('[processSale] RPC Error:', error);
      return { success: false, error: 'Error crítico al comunicar con la base de datos.' };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, error: result.error || 'La BD abortó la transacción.' };
    }

    // ── 7. Invalidar cachés de Next.js ──
    revalidatePath('/inventario');
    revalidatePath('/alertas');
    revalidatePath('/ventas');

    return { success: true };

  } catch (err: any) {
    console.error('[processSale] Unexpected error:', err);
    return { success: false, error: err.message || 'Error inesperado.' };
  }
}
