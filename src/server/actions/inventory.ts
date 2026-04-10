'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Ajusta el stock de un ingrediente y registra el movimiento en historial.
 * El tipo de movimiento determina si es ingreso o descuento.
 */
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

// ─── Verificación de Dependencias (Pre-borrado seguro) ───────────────────────

/**
 * Verifica cuántos sabores dependen de un ingrediente antes de eliminarlo.
 * Devuelve la lista de nombres de sabores vinculados para mostrar al usuario
 * en el modal de alerta de dependencias.
 */
export async function verificarDependenciasIngrediente(ingredienteId: string) {
  const supabase = await createClient();

  // Buscar todos los sabores vinculados a este ingrediente via la tabla pivot
  const { data: relaciones, error } = await supabase
    .from('sabor_ingredientes')
    .select('sabor_id')
    .eq('ingrediente_id', ingredienteId);

  if (error) {
    return { error: `Error verificando dependencias: ${error.message}`, saboresVinculados: [] };
  }

  if (!relaciones || relaciones.length === 0) {
    return { cantidadDependencias: 0, saboresVinculados: [] };
  }

  // Obtener los nombres de los sabores para mostrarlos en el modal
  const saborIds = relaciones.map(r => r.sabor_id);
  const { data: sabores } = await supabase
    .from('sabores')
    .select('nombre')
    .in('id', saborIds);

  const nombresSabores = (sabores || []).map(s => s.nombre);

  return {
    cantidadDependencias: relaciones.length,
    saboresVinculados: nombresSabores,
  };
}

/**
 * Soft Delete de un ingrediente:
 * 1. Desvincula el ingrediente de TODOS los sabores (sabor_ingredientes).
 * 2. Desvincula el ingrediente de TODAS las recetas de toppings (recetas_toppings).
 * 3. Marca el ingrediente como activo = false (NO lo borra físicamente).
 *
 * El historial_inventario se preserva intacto para reportes financieros.
 */
export async function desactivarIngrediente(ingredienteId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'No autorizado para eliminar insumos.' };
  }

  // 1. Desvincular de sabores (tabla pivot sabor_ingredientes)
  const { error: errorSabor } = await supabase
    .from('sabor_ingredientes')
    .delete()
    .eq('ingrediente_id', ingredienteId);

  if (errorSabor) {
    return { error: `Error desvinculando de sabores: ${errorSabor.message}` };
  }

  // 2. Desvincular de recetas de toppings (tabla recetas_toppings)
  const { error: errorRecetas } = await supabase
    .from('recetas_toppings')
    .delete()
    .eq('ingrediente_id', ingredienteId);

  if (errorRecetas) {
    return { error: `Error desvinculando de recetas: ${errorRecetas.message}` };
  }

  // 3. Soft Delete: marcar como inactivo en lugar de borrar el registro
  const { error: errorUpdate } = await supabase
    .from('ingredientes')
    .update({ activo: false })
    .eq('id', ingredienteId);

  if (errorUpdate) {
    return { error: `Error desactivando ingrediente: ${errorUpdate.message}` };
  }

  revalidatePath('/inventario');
  revalidatePath('/sabores');
  revalidatePath('/raciones');
  return { success: true };
}

// ─── Actualización en Batch de Umbrales (punto_reorden) ──────────────────────

/**
 * Actualiza el punto_reorden de múltiples ingredientes en una sola operación.
 * Recibe un array de { id, punto_reorden } y los actualiza secuencialmente.
 * Diseñado para el "Modo Edición" inline del inventario.
 */
export async function actualizarUmbralesBatch(
  cambios: { id: string; punto_reorden: number }[]
) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'No autorizado para modificar umbrales.' };
  }

  const errores: string[] = [];

  for (const cambio of cambios) {
    const { error } = await supabase
      .from('ingredientes')
      .update({ punto_reorden: cambio.punto_reorden })
      .eq('id', cambio.id);

    if (error) {
      errores.push(`${cambio.id}: ${error.message}`);
    }
  }

  if (errores.length > 0) {
    return { error: `Errores al actualizar umbrales: ${errores.join(', ')}` };
  }

  revalidatePath('/inventario');
  return { success: true };
}
