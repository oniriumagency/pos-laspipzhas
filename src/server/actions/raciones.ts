'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los datos necesarios para la grilla de raciones:
 * - tamanos_pizza (columnas)
 * - ingredientes (filas - los que ya están en bodega)
 * - recetas_toppings (celdas de la grilla)
 * - datos base de cada tamaño (masa_gr, salsa_gr, queso_base_gr)
 */
export async function getRacionesData() {
  const supabase = await createClient();

  const [tamanos, ingredientes, recetas] = await Promise.all([
    supabase.from('tamanos_pizza').select('*').order('masa_gr', { ascending: true }),
    supabase.from('ingredientes').select('id, nombre, unidad_medida').order('nombre'),
    supabase.from('recetas_toppings').select('*')
  ]);

  return {
    tamanos: tamanos.data || [],
    ingredientes: ingredientes.data || [],
    recetas: recetas.data || []
  };
}

/**
 * Actualiza la porción de un topping existente para un tamaño de pizza.
 * Si la porción es 0 o null, se elimina la fila de recetas_toppings.
 */
export async function updateRecetaTopping(ingredienteId: string, tamanoId: string, porcionGr: number | null) {
  const supabase = await createClient();

  if (!porcionGr || porcionGr <= 0) {
    // Eliminar la receta si porción es 0
    const { error } = await supabase
      .from('recetas_toppings')
      .delete()
      .eq('ingrediente_id', ingredienteId)
      .eq('tamano_id', tamanoId);

    if (error) return { error: error.message };
  } else {
    // Reemplazar: primero borrar y luego insertar
    await supabase
      .from('recetas_toppings')
      .delete()
      .eq('ingrediente_id', ingredienteId)
      .eq('tamano_id', tamanoId);

    const { error } = await supabase
      .from('recetas_toppings')
      .insert({
        ingrediente_id: ingredienteId,
        tamano_id: tamanoId,
        porcion_gr: porcionGr
      });

    if (error) return { error: error.message };
  }

  revalidatePath('/raciones');
  return { success: true };
}

/**
 * Guarda cambios masivos en la grilla de raciones.
 * Recibe un array de cambios { ingrediente_id, tamano_id, porcion_gr }.
 */
export async function saveRacionesBatch(
  cambios: { ingrediente_id: string; tamano_id: string; porcion_gr: number }[]
) {
  const supabase = await createClient();

  // Separar: los que tienen porcion > 0 se upsertean, los que tienen 0 se eliminan
  const toUpsert = cambios.filter(c => c.porcion_gr > 0);
  const toDelete = cambios.filter(c => c.porcion_gr <= 0);

  // Insert / Update en batch (Borrando previos para emular upsert sin constraints)
  if (toUpsert.length > 0) {
    for (const u of toUpsert) {
      await supabase
        .from('recetas_toppings')
        .delete()
        .eq('ingrediente_id', u.ingrediente_id)
        .eq('tamano_id', u.tamano_id);
    }

    const { error } = await supabase
      .from('recetas_toppings')
      .insert(toUpsert);

    if (error) return { error: error.message };
  }

  // Delete individually
  for (const d of toDelete) {
    const { error } = await supabase
      .from('recetas_toppings')
      .delete()
      .eq('ingrediente_id', d.ingrediente_id)
      .eq('tamano_id', d.tamano_id);

    if (error) return { error: error.message };
  }

  revalidatePath('/raciones');
  return { success: true };
}

/**
 * Actualiza los insumos base (masa, salsa, queso) en tamanos_pizza directamente.
 */
export async function updateTamanoBase(tamanoId: string, field: 'masa_gr' | 'salsa_gr' | 'queso_base_gr', value: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tamanos_pizza')
    .update({ [field]: value })
    .eq('id', tamanoId);

  if (error) return { error: error.message };

  revalidatePath('/raciones');
  return { success: true };
}

/**
 * Elimina un ingrediente de TODAS las recetas de toppings (No lo borra de bodega)
 */
export async function removeIngredienteFromRecetas(ingredienteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('recetas_toppings')
    .delete()
    .eq('ingrediente_id', ingredienteId);

  if (error) return { error: error.message };

  revalidatePath('/raciones');
  return { success: true };
}

/**
 * Agrega un ingrediente de bodega a la tabla de recetas con porción 0 para todos los tamaños.
 * Esto lo hace visible en la grilla para que se le asignen porciones.
 */
export async function addIngredienteToRecetas(ingredienteId: string, tamanoIds: string[]) {
  const supabase = await createClient();

  const rows = tamanoIds.map(tamanoId => ({
    ingrediente_id: ingredienteId,
    tamano_id: tamanoId,
    porcion_gr: 0
  }));

  // Emular upsert borrando primero
  for (const row of rows) {
    await supabase
      .from('recetas_toppings')
      .delete()
      .eq('ingrediente_id', row.ingrediente_id)
      .eq('tamano_id', row.tamano_id);
  }

  const { error } = await supabase
    .from('recetas_toppings')
    .insert(rows);

  if (error) return { error: error.message };

  revalidatePath('/raciones');
  return { success: true };
}
