'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Categorías válidas para la tabla productos
export type CategoriaProducto = 'gaseosa' | 'cerveza' | 'bebida';

export type Producto = {
  id: string;
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

type ResultadoAccion = { success: boolean; error?: string };

/**
 * getProductos — Obtiene todos los productos activos ordenados por categoría y nombre.
 * Se usa tanto en la página POS como en el panel de administración.
 */
export async function getProductos(): Promise<Producto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) {
    console.error('[getProductos] Error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * getTodosLosProductos — Obtiene todos los productos (activos e inactivos) para el panel admin.
 */
export async function getTodosLosProductos(): Promise<Producto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) {
    console.error('[getTodosLosProductos] Error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * crearProducto — Da de alta un nuevo producto en el catálogo.
 * Verifica que el nombre sea único antes de insertar.
 */
export async function crearProducto(
  nombre: string,
  precio: number,
  categoria: CategoriaProducto
): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const { error: authError, data: { user } } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No tienes sesión administrativa activa.' };
  }

  if (!nombre.trim()) {
    return { success: false, error: 'El nombre del producto es obligatorio.' };
  }
  if (precio <= 0) {
    return { success: false, error: 'El precio debe ser mayor a cero.' };
  }

  const { error } = await supabase
    .from('productos')
    .insert({ nombre: nombre.trim(), precio, categoria });

  if (error) {
    // Violación del constraint UNIQUE en nombre
    if (error.code === '23505') {
      return { success: false, error: `Ya existe un producto con el nombre "${nombre.trim()}".` };
    }
    return { success: false, error: `Error al crear el producto: ${error.message}` };
  }

  revalidatePath('/pos');
  revalidatePath('/productos');
  return { success: true };
}

/**
 * actualizarProducto — Modifica nombre, precio y/o categoría de un producto existente.
 */
export async function actualizarProducto(
  productoId: string,
  nombre: string,
  precio: number,
  categoria: CategoriaProducto
): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const { error: authError, data: { user } } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No tienes sesión administrativa activa.' };
  }

  if (!nombre.trim()) {
    return { success: false, error: 'El nombre del producto es obligatorio.' };
  }
  if (precio <= 0) {
    return { success: false, error: 'El precio debe ser mayor a cero.' };
  }

  const { error } = await supabase
    .from('productos')
    .update({
      nombre: nombre.trim(),
      precio,
      categoria,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productoId);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `Ya existe un producto con el nombre "${nombre.trim()}".` };
    }
    return { success: false, error: `Error al actualizar el producto: ${error.message}` };
  }

  revalidatePath('/pos');
  revalidatePath('/productos');
  return { success: true };
}

/**
 * desactivarProducto — Soft delete: marca el producto como inactivo.
 * El historial de ventas que lo referencia permanece intacto.
 */
export async function desactivarProducto(productoId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const { error: authError, data: { user } } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No tienes sesión administrativa activa.' };
  }

  const { error } = await supabase
    .from('productos')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', productoId);

  if (error) {
    return { success: false, error: `Error al desactivar el producto: ${error.message}` };
  }

  revalidatePath('/pos');
  revalidatePath('/productos');
  return { success: true };
}

/**
 * reactivarProducto — Reactiva un producto previamente desactivado.
 */
export async function reactivarProducto(productoId: string): Promise<ResultadoAccion> {
  const supabase = await createClient();

  const { error: authError, data: { user } } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'No tienes sesión administrativa activa.' };
  }

  const { error } = await supabase
    .from('productos')
    .update({ activo: true, updated_at: new Date().toISOString() })
    .eq('id', productoId);

  if (error) {
    return { success: false, error: `Error al reactivar el producto: ${error.message}` };
  }

  revalidatePath('/pos');
  revalidatePath('/productos');
  return { success: true };
}
