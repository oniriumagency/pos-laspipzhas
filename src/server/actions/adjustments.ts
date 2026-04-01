'use server';

// Usamos un mock require de `@supabase/ssr` u otro paquete en base a tu stack.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Registra un movimiento manual de stock (Compras a proveedores, Mermas o Ajustes de inventario)
 *
 * @param ingredienteId El ID del ingrediente al que le aplicaremos el movimiento
 * @param cantidadCambio Cantidad a sumar (número positivo para compras) o restar (número negativo para mermas)
 * @param tipoMovimiento Tipo de concepto para la trazabilidad
 * @param userId Quién autorizó/ejecutó el ajuste en el sistema
 * @param notas Campo opcional (ej: número de factura de proveedor, razón de la merma)
 */
export async function adjustStock(
  ingredienteId: string, 
  cantidadCambio: number, 
  tipoMovimiento: 'merma' | 'ajuste' | 'compra', 
  userId: string,
  notas: string = ''
): Promise<ActionResponse> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );

  try {
    // 1. Obtener el stock histórico actual
    const { data: ingData, error: ingError } = await supabase
      .from('ingredientes')
      .select('stock_actual')
      .eq('id', ingredienteId)
      .single();

    if (ingError || !ingData) {
      throw new Error(`Inconsistencia en DB: No se puede leer el ingrediente ${ingredienteId}`);
    }

    // 2. Calcular nuevo stock (si es merma, cantidadCambio ya viene con negativo o se resta explícitamente)
    // Asumimos que el front end manda -500 para merma y +1000 para compras.
    const nuevoStock = ingData.stock_actual + cantidadCambio;

    // 3. Escribir el nuevo stock real en la BD
    const { error: updateError } = await supabase
      .from('ingredientes')
      .update({ stock_actual: nuevoStock })
      .eq('id', ingredienteId);

    if (updateError) {
      throw new Error(`Fallo al actualizar el stock del ingrediente. Detalles: ${updateError.message}`);
    }

    // 4. Escribir la trazabilidad (Auditoría) en el historial de Movimientos
    const { error: historyError } = await supabase
      .from('historial_inventario')
      .insert({
        ingrediente_id: ingredienteId,
        tipo_movimiento: tipoMovimiento,
        cantidad: cantidadCambio, // Dejar rastro numérico puro de la operación
        stock_resultante: nuevoStock,
        usuario_id: userId,
        notas: notas || `Operación manual de tipo: ${tipoMovimiento}`
      });

    if (historyError) {
      console.error(`Omitida escritura en historial para ${ingredienteId}:`, historyError);
      // No frenamos la transacción de actualización por fallar la auditoría
    }

    // 5. Revalidar la vista en Caché para que Next.js repinte la tabla de la ruta '/inventario' con los datos frescos
    revalidatePath('/inventario');

    return { success: true };

  } catch (error: any) {
    console.error('[Adjustment Action Error]:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno al procesar el ajuste' 
    };
  }
}
