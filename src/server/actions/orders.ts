'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CartItem } from '@/store/usePosStore';

/**
 * processSale — Server Action principal del POS.
 *
 * Orquesta la venta de un carrito mixto (pizzas + productos):
 *  1. Verifica sesión activa.
 *  2. Para items tipo 'pizza': resuelve los ingredientes de cada sabor desde la tabla pivot.
 *  3. Para items tipo 'producto': los incluye en el payload con tamano_id = null
 *     para que el RPC los omita en la deducción de inventario.
 *  4. Calcula el total con los descuentos por ítem aplicados.
 *  5. Llama al RPC `procesar_venta` de forma atómica.
 *  6. Invalida el caché de Next.js para las vistas de inventario y ventas.
 *
 * @param cart            - Items del carrito Zustand (tipo 'pizza' o 'producto')
 * @param origenVenta     - Canal: 'Propio' | 'Rappi' | 'DiDi'
 */
export async function processSale(
  cart: CartItem[],
  origenVenta: string = 'Propio'
) {
  try {
    const supabase = await createClient();

    // ── 1. Verificar sesión ──────────────────────────────────────────────────
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    // ── 2. Resolver ingredientes solo para los items tipo 'pizza' ────────────
    const itemsPizza = cart.filter((i) => i.tipo === 'pizza');
    const saborIds = [
      ...itemsPizza.map((i) => i.sabor_1?.id),
      ...itemsPizza.map((i) => i.sabor_2?.id),
    ].filter(Boolean) as string[];

    let relacionesSabor: { sabor_id: string; ingrediente_id: string }[] = [];
    if (saborIds.length > 0) {
      const { data: relacionesData } = await supabase
        .from('sabor_ingredientes')
        .select('sabor_id, ingrediente_id')
        .in('sabor_id', Array.from(new Set(saborIds)));
      relacionesSabor = relacionesData || [];
    }

    // ── 3. Construir el payload para el RPC ──────────────────────────────────
    // Los items pizza incluyen tamano_id y arrays de ingredientes.
    // Los items producto incluyen tamano_id = null, arrays vacíos (el RPC los saltea).
    const payload = cart.map((item) => {
      if (item.tipo === 'producto') {
        return {
          tamano_id:            null,     // Señal para el RPC: no deducir inventario
          tamano_nombre:        null,
          sabor_1_nombre:       null,
          sabor_2_nombre:       null,
          producto_id:          item.producto_id,
          producto_nombre:      item.producto_nombre,
          precio_unitario:      item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje || 0,
          cantidad:             item.cantidad,
          mitad_1:              [],
          mitad_2:              [],
          extras:               [],
        };
      }

      // Item tipo 'pizza'
      const ingMitad1 = relacionesSabor
        .filter((r) => r.sabor_id === item.sabor_1?.id)
        .map((r) => ({ ingrediente_id: r.ingrediente_id }));

      const ingMitad2 = item.es_mitades
        ? relacionesSabor
            .filter((r) => r.sabor_id === item.sabor_2?.id)
            .map((r) => ({ ingrediente_id: r.ingrediente_id }))
        : [];

      return {
        tamano_id:            item.tamano_id,
        tamano_nombre:        item.tamano_nombre,
        sabor_1_nombre:       item.sabor_1?.nombre ?? null,
        sabor_2_nombre:       item.sabor_2?.nombre ?? null,
        producto_id:          null,
        producto_nombre:      null,
        precio_unitario:      item.precio_unitario,
        descuento_porcentaje: item.descuento_porcentaje || 0,
        cantidad:             item.cantidad,
        mitad_1:              ingMitad1,
        mitad_2:              ingMitad2,
        extras:               (item.extras || []).map((t) => ({ ingrediente_id: t.ingrediente_id })),
      };
    });

    // ── 4. Calcular totales con descuento por ítem ───────────────────────────
    const subtotal = cart.reduce((acumulado, item) => {
      const itemDescuento = item.descuento_porcentaje || 0;
      const baseTotal = item.precio_unitario * item.cantidad;
      return acumulado + (baseTotal * (1 - itemDescuento / 100));
    }, 0);
    const totalFinal = Math.round(subtotal);

    // ── 5. Ejecutar RPC atómico ──────────────────────────────────────────────
    // El RPC saltea la deducción de inventario para los items con tamano_id = null.
    const { data, error } = await supabase.rpc('procesar_venta', {
      cart_payload:       payload,
      p_total_precio:     totalFinal,
      p_user_id:          user.id,
      p_origen_venta:     origenVenta,
      p_descuento_global: 0,
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

    // ── 6. Invalidar caché de Next.js ────────────────────────────────────────
    revalidatePath('/inventario');
    revalidatePath('/alertas');
    revalidatePath('/ventas');

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error inesperado en el servidor.';
    console.error('[processSale] Unexpected error:', err);
    return { success: false, error: errorMsg };
  }
}
