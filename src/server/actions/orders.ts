'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CartItem } from '@/store/usePosStore';

/**
 * processSale — Server Action principal del POS.
 *
 * Orquesta la venta:
 *  1. Verifica sesión activa.
 *  2. Resuelve los ingredientes de cada sabor desde la tabla pivot.
 *  3. Calcula el total con el descuento global aplicado.
 *  4. Llama al RPC `procesar_venta` de forma atómica.
 *  5. Invalida el caché de Next.js para las vistas de inventario y ventas.
 *
 * NOTA SOBRE EL SCHEMA:
 *  La tabla `ventas` usa `created_by` (UUID → auth.users), NO `usuario_id`.
 *  El RPC recibe el user.id como `p_user_id` y lo guarda en `created_by` internamente.
 *
 * @param cart            - Items del carrito Zustand
 * @param origenVenta     - Canal: 'propio' | 'rappi' | 'didi'
 * @param descuentoGlobal - Porcentaje de descuento 0–100
 */
export async function processSale(
  cart: CartItem[],
  origenVenta: string = 'propio',
  descuentoGlobal: number = 0
) {
  try {
    const supabase = await createClient();

    // ── 1. Verificar sesión ──────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    // ── 2. Resolver ingredientes de cada sabor desde la tabla pivot ──────
    const saborIds = [
      ...cart.map((i) => i.sabor_1?.id),
      ...cart.map((i) => i.sabor_2?.id),
    ].filter(Boolean) as string[];

    let relacionesSabor: { sabor_id: string; ingrediente_id: string }[] = [];
    if (saborIds.length > 0) {
      const { data: rel } = await supabase
        .from('sabor_ingredientes')
        .select('sabor_id, ingrediente_id')
        .in('sabor_id', Array.from(new Set(saborIds)));
      relacionesSabor = rel || [];
    }

    // ── 3. Construir el payload para el RPC ──────────────────────────────
    const payload = cart.map((item) => {
      const ingMitad1 = relacionesSabor
        .filter((r) => r.sabor_id === item.sabor_1?.id)
        .map((r) => ({ ingrediente_id: r.ingrediente_id }));

      const ingMitad2 = item.es_mitades
        ? relacionesSabor
            .filter((r) => r.sabor_id === item.sabor_2?.id)
            .map((r) => ({ ingrediente_id: r.ingrediente_id }))
        : [];

      return {
        tamano_id:       item.tamano_id,
        tamano_nombre:   item.tamano_nombre,
        sabor_1_nombre:  item.sabor_1?.nombre ?? null,
        sabor_2_nombre:  item.sabor_2?.nombre ?? null,
        precio_unitario: item.precio_unitario,
        cantidad:        item.cantidad,
        mitad_1:         ingMitad1,
        mitad_2:         ingMitad2,
        extras:          item.extras.map((t) => ({ ingrediente_id: t.ingrediente_id })),
      };
    });

    // ── 4. Calcular totales con descuento ────────────────────────────────
    const subtotal      = cart.reduce((acc, item) => acc + item.precio_unitario * item.cantidad, 0);
    const descuentoAmt  = subtotal * (descuentoGlobal / 100);
    const totalFinal    = Math.round(subtotal - descuentoAmt);

    // ── 5. Ejecutar RPC atómico ──────────────────────────────────────────
    // IMPORTANTE: la firma del RPC usa p_user_id → lo guarda como `created_by`
    // No existe columna `usuario_id` en la tabla `ventas`.
    const { data, error } = await supabase.rpc('procesar_venta', {
      cart_payload:       payload,
      p_total_precio:     totalFinal,
      p_user_id:          user.id,
      p_origen_venta:     origenVenta,
      p_descuento_global: descuentoGlobal,
    });

    if (error) {
      console.error('[processSale] RPC Error:', error);
      return { success: false, error: `Error en la base de datos: ${error.message}` };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'La base de datos abortó la transacción.',
      };
    }

    // ── 6. Invalidar caché de Next.js ────────────────────────────────────
    revalidatePath('/inventario');
    revalidatePath('/alertas');
    revalidatePath('/ventas');

    return { success: true };
  } catch (err: any) {
    console.error('[processSale] Unexpected error:', err);
    return { success: false, error: err.message || 'Error inesperado en el servidor.' };
  }
}
