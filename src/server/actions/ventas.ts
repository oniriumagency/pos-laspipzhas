'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getVentas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching ventas:", error);
    return [];
  }
  return data;
}

export async function deleteVenta(ventaId: string) {
  try {
    const supabase = await createClient();
    
    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    const { data, error } = await supabase.rpc('revertir_venta', {
      p_venta_id: ventaId,
      p_user_id: user.id
    });

    if (error) {
       console.error("RPC Fatal Error en revertir_venta:", error);
       return { success: false, error: 'Ocurrió un error comunicándose con la base de datos.' };
    }

    const result = data as { success: boolean, error?: string };
    
    if (!result.success) {
      return { success: false, error: result.error || 'No se pudo cancelar la venta.' };
    }

    // Invalidar rutas para actualizar UI
    revalidatePath('/ventas');
    revalidatePath('/inventario');
    revalidatePath('/alertas');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado.' };
  }
}

/**
 * Actualiza el origen de venta (canal) de una venta existente.
 * Solo modifica el campo origen_venta, no afecta inventario ni totales.
 */
export async function editarOrigenVenta(ventaId: string, nuevoOrigen: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: errorAutenticacion } = await supabase.auth.getUser();
    if (errorAutenticacion || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    const originesValidos = ['Propio', 'Rappi', 'DiDi'];
    if (!originesValidos.includes(nuevoOrigen)) {
      return { success: false, error: `Origen de venta inválido: "${nuevoOrigen}". Valores permitidos: ${originesValidos.join(', ')}` };
    }

    const { error } = await supabase
      .from('ventas')
      .update({ origen_venta: nuevoOrigen })
      .eq('id', ventaId);

    if (error) {
      return { success: false, error: `Error al actualizar origen de venta: ${error.message}` };
    }

    revalidatePath('/ventas');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado al editar origen.' };
  }
}

/**
 * Agrega items adicionales a una venta existente.
 *
 * FLUJO:
 *  1. Verifica sesión y existencia de la venta.
 *  2. Resuelve ingredientes de cada sabor desde la tabla pivot.
 *  3. Calcula el total de los items nuevos.
 *  4. Llama al RPC procesar_venta_adicional para descontar inventario atómicamente.
 *  5. Actualiza cart_payload, deducciones y total_precio de la venta original.
 *
 * NOTA: Esta acción modifica el inventario actual de la bodega.
 */
export async function agregarItemsAVenta(
  ventaId: string,
  itemsNuevos: {
    tamano_id: string;
    tamano_nombre: string;
    sabor_1_id: string | null;
    sabor_1_nombre: string | null;
    sabor_2_id: string | null;
    sabor_2_nombre: string | null;
    precio_unitario: number;
    cantidad: number;
    es_mitades: boolean;
  }[]
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: errorAutenticacion } = await supabase.auth.getUser();
    if (errorAutenticacion || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    // Obtener la venta existente para fusionar datos
    const { data: ventaExistente, error: errorVenta } = await supabase
      .from('ventas')
      .select('*')
      .eq('id', ventaId)
      .single();

    if (errorVenta || !ventaExistente) {
      return { success: false, error: `La venta con ID "${ventaId}" no existe o fue eliminada.` };
    }

    // Resolver ingredientes de cada sabor nuevo desde la tabla pivot
    const saborIds = [
      ...itemsNuevos.map(item => item.sabor_1_id),
      ...itemsNuevos.map(item => item.sabor_2_id),
    ].filter(Boolean) as string[];

    let relacionesSabor: { sabor_id: string; ingrediente_id: string }[] = [];
    if (saborIds.length > 0) {
      const { data: relaciones } = await supabase
        .from('sabor_ingredientes')
        .select('sabor_id, ingrediente_id')
        .in('sabor_id', Array.from(new Set(saborIds)));
      relacionesSabor = relaciones || [];
    }

    // Construir deducciones de inventario para los items nuevos
    const deduccionesNuevas: { ing_id: string; cantidad_descontar: number }[] = [];

    for (const item of itemsNuevos) {
      const ingredientesMitad1 = relacionesSabor
        .filter(relacion => relacion.sabor_id === item.sabor_1_id)
        .map(relacion => relacion.ingrediente_id);

      const ingredientesMitad2 = item.es_mitades
        ? relacionesSabor
            .filter(relacion => relacion.sabor_id === item.sabor_2_id)
            .map(relacion => relacion.ingrediente_id)
        : [];

      // Cada ingrediente se descuenta 1 unidad × cantidad de pizzas
      // Si es mitad-y-mitad, cada mitad aporta 0.5 unidades por ingrediente
      const factorMitad = item.es_mitades ? 0.5 : 1;

      for (const ingredienteId of ingredientesMitad1) {
        deduccionesNuevas.push({
          ing_id: ingredienteId,
          cantidad_descontar: item.cantidad * factorMitad,
        });
      }

      for (const ingredienteId of ingredientesMitad2) {
        deduccionesNuevas.push({
          ing_id: ingredienteId,
          cantidad_descontar: item.cantidad * 0.5,
        });
      }
    }

    // Descontar inventario en la base de datos
    for (const deduccion of deduccionesNuevas) {
      const { error: errorDeduccion } = await supabase.rpc('descontar_ingrediente', {
        p_ingrediente_id: deduccion.ing_id,
        p_cantidad: deduccion.cantidad_descontar,
      });

      if (errorDeduccion) {
        return {
          success: false,
          error: `Error al descontar inventario del ingrediente "${deduccion.ing_id}": ${errorDeduccion.message}`,
        };
      }
    }

    // Construir payloads enriquecidos para fusionar con la venta existente
    const payloadsNuevos = itemsNuevos.map(item => ({
      tamano_id: item.tamano_id,
      tamano_nombre: item.tamano_nombre,
      sabor_1_nombre: item.sabor_1_nombre,
      sabor_2_nombre: item.sabor_2_nombre,
      precio_unitario: item.precio_unitario,
      cantidad: item.cantidad,
      descuento_porcentaje: 0,
    }));

    // Calcular precio adicional
    const precioAdicional = itemsNuevos.reduce(
      (acumulador, item) => acumulador + item.precio_unitario * item.cantidad,
      0
    );

    // Fusionar con la venta existente
    const cartPayloadActualizado = [...(ventaExistente.cart_payload || []), ...payloadsNuevos];
    const deduccionesActualizadas = [...(ventaExistente.deducciones || []), ...deduccionesNuevas];
    const totalActualizado = (ventaExistente.total_precio || 0) + precioAdicional;

    const { error: errorActualizacion } = await supabase
      .from('ventas')
      .update({
        cart_payload: cartPayloadActualizado,
        deducciones: deduccionesActualizadas,
        total_precio: totalActualizado,
      })
      .eq('id', ventaId);

    if (errorActualizacion) {
      return { success: false, error: `Error al actualizar la venta: ${errorActualizacion.message}` };
    }

    revalidatePath('/ventas');
    revalidatePath('/inventario');
    revalidatePath('/alertas');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado al agregar items.' };
  }
}
