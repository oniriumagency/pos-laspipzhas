'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function adjustInventoryStock(
  ingredienteId: string, 
  cantidadCambio: number, 
  tipoMovimiento: 'merma' | 'ajuste'
) {
  const supabase = await createClient();

  // 1. Obtener el usuario actual
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'No autorizado para modificar inventario' };
  }

  // 2. Obtener el stock actual para calcular el nuevo
  // (En MVP sin RPC, hacemos Read -> Update -> Insert secuencial. En Fase 2 usaremos RPC para Atomicidad)
  const { data: ingrediente, error: readError } = await supabase
    .from('ingredientes')
    .select('stock_actual')
    .eq('id', ingredienteId)
    .single();

  if (readError || !ingrediente) {
    return { error: 'Ingrediente no encontrado' };
  }

  const nuevoStock = Number(ingrediente.stock_actual) + cantidadCambio;

  // 3. Actualizar la tabla ingredientes
  const { error: updateError } = await supabase
    .from('ingredientes')
    .update({ stock_actual: nuevoStock })
    .eq('id', ingredienteId);

  if (updateError) {
    return { error: updateError.message };
  }

  // 4. Registrar en el historial de trazabilidad
  const { error: historyError } = await supabase
    .from('historial_inventario')
    .insert({
      ingrediente_id: ingredienteId,
      cantidad_cambio: cantidadCambio,
      tipo_movimiento: tipoMovimiento,
      created_by: user.id
    });

  if (historyError) {
    // Nota: Aunque esto falle, el stock ya se actualizó. En un sistema crítico, agruparíamos esto en un sp de Postgres.
    console.error('Error insertando en historial:', historyError);
  }

  // 5. Revalidar la vista de inventario para que Next.js refresque los datos del servidor a los clientes
  revalidatePath('/inventario');
  
  return { success: true };
}

export async function createIngredient(data: { nombre: string, stock_actual: number, unidad_medida: string, punto_reorden: number }) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'No autorizado para modificar inventario' };
  }

  const { error } = await supabase.from('ingredientes').insert({
    nombre: data.nombre,
    stock_actual: data.stock_actual,
    unidad_medida: data.unidad_medida,
    punto_reorden: data.punto_reorden
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/inventario');
  return { success: true };
}
