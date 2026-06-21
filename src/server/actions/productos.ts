'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Categorías válidas para la tabla productos
export type CategoriaProducto = 'gaseosa' | 'cerveza' | 'bebida' | 'pizza' | 'cigarrillo' | 'licor';

export type Producto = {
  id: string;
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  imagen_url?: string | null;
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
  // Sincronizar con la tabla ingredientes si no es pizza
  if (categoria !== 'pizza') {
    const { error: errorBodega } = await supabase.from('ingredientes').insert({
      nombre: nombre.trim(),
      precio: precio,
      categoria: categoria,
      stock_actual: 0,
      unidad_medida: 'unidad',
      punto_reorden: 0
    });
    if (errorBodega) {
      console.error('Error sincronizando ingrediente en bodega:', errorBodega);
    }
  }

  revalidatePath('/pos');
  revalidatePath('/productos');
  revalidatePath('/inventario');
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

  // Para sincronizar actualizaciones, necesitamos el nombre anterior
  const { data: oldProducto } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', productoId)
    .single();

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

  // Sincronizar con bodega
  if (oldProducto && categoria !== 'pizza') {
    const { error: errorBodega } = await supabase
      .from('ingredientes')
      .update({
        nombre: nombre.trim(),
        precio: precio,
        categoria: categoria
      })
      .eq('nombre', oldProducto.nombre);
    
    if (errorBodega) {
      console.error('Error sincronizando actualización en bodega:', errorBodega);
    }
  }

  revalidatePath('/pos');
  revalidatePath('/productos');
  revalidatePath('/inventario');
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
