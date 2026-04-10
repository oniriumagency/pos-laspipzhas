'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los sabores con sus ingredientes vinculados.
 * Se usa en la página /sabores para renderizar las tarjetas.
 * Incluye los ingredientes activos de la bodega para el popover de agregar.
 */
export async function getSaboresConIngredientes() {
  const supabase = await createClient();

  const [saboresResponse, relacionesResponse, ingredientesResponse] = await Promise.all([
    supabase.from('sabores').select('*').order('nombre'),
    supabase.from('sabor_ingredientes').select('sabor_id, ingrediente_id'),
    // Solo ingredientes activos (Soft Delete)
    supabase.from('ingredientes').select('id, nombre, unidad_medida').eq('activo', true).order('nombre'),
  ]);

  return {
    sabores: saboresResponse.data || [],
    relaciones: relacionesResponse.data || [],
    ingredientes: ingredientesResponse.data || [],
  };
}

/**
 * Crea un nuevo sabor de pizza con nombre y descripción.
 * El sabor inicia vacío (sin ingredientes vinculados).
 */
export async function crearSabor(nombre: string, descripcion: string = '') {
  const supabase = await createClient();

  if (!nombre.trim()) {
    return { error: 'El nombre del sabor es obligatorio.' };
  }

  const { data, error } = await supabase
    .from('sabores')
    .insert({ nombre: nombre.trim(), descripcion: descripcion.trim() })
    .select('id')
    .single();

  if (error) {
    // Violación de UNIQUE en nombre
    if (error.code === '23505') {
      return { error: `Ya existe un sabor con el nombre "${nombre}".` };
    }
    return { error: `Error al crear sabor: ${error.message}` };
  }

  revalidatePath('/sabores');
  return { success: true, saborId: data.id };
}

/**
 * Elimina un sabor y todas sus relaciones (CASCADE en sabor_ingredientes).
 * No afecta los ingredientes de bodega, solo la relación.
 */
export async function eliminarSabor(saborId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sabores')
    .delete()
    .eq('id', saborId);

  if (error) {
    return { error: `Error al eliminar sabor: ${error.message}` };
  }

  revalidatePath('/sabores');
  return { success: true };
}

/**
 * Vincula un ingrediente de bodega a un sabor de pizza.
 * Crea la relación en la tabla pivot sabor_ingredientes.
 */
export async function agregarIngredienteASabor(saborId: string, ingredienteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sabor_ingredientes')
    .insert({ sabor_id: saborId, ingrediente_id: ingredienteId });

  if (error) {
    // Duplicado: el ingrediente ya está vinculado a este sabor
    if (error.code === '23505') {
      return { error: 'Este ingrediente ya está vinculado a este sabor.' };
    }
    return { error: `Error al vincular ingrediente: ${error.message}` };
  }

  revalidatePath('/sabores');
  return { success: true };
}

/**
 * Desvincula un ingrediente de un sabor (elimina la relación pivot).
 * No borra ni desactiva el ingrediente de la bodega.
 */
export async function removerIngredienteDeSabor(saborId: string, ingredienteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('sabor_ingredientes')
    .delete()
    .eq('sabor_id', saborId)
    .eq('ingrediente_id', ingredienteId);

  if (error) {
    return { error: `Error al desvincular ingrediente: ${error.message}` };
  }

  revalidatePath('/sabores');
  return { success: true };
}
