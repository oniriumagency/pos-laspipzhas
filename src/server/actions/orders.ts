'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CartItem } from '@/store/usePosStore';

export async function processSale(cart: CartItem[]) {
  try {
    const supabase = await createClient();

    // 1. Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'No tienes sesión administrativa activa.' };
    }

    // 2. Traer ingredientes base dinámicamente
    const { data: baseIng } = await supabase
      .from('ingredientes')
      .select('id, nombre')
      .in('nombre', ['Masa', 'Salsa', 'Queso', 'Servilletas', 'Cajas Personal', 'Cajas Mediana', 'Cajas Grande']);

    const getBaseList = (tamano: string) => {
      if (!baseIng) return [];
      const boxName = `Cajas ${tamano}`;
      const needed = ['Masa', 'Salsa', 'Queso', 'Servilletas', boxName];
      const found = baseIng.filter(i => needed.includes(i.nombre)).map(i => ({ ingrediente_id: i.id }));
      // Añadir 3 servilletas
      const servilleta = baseIng.find(i => i.nombre === 'Servilletas');
      if (servilleta) {
        found.push({ ingrediente_id: servilleta.id });
        found.push({ ingrediente_id: servilleta.id }); // Total 3
      }
      return found;
    };

    // 3. Prepara el JSON Payload encriptando IDs al formato aceptado, resolviendo sabores.
    // Para simplificar y mantener la compatibilidad con el RPC actual, traduciremos los "Sabores" 
    // a listas de ingredientes consultando la tabla pivot.
    
    // Obtener las relaciones de todos los sabores involucrados:
    const saborIds = cart.map(i => i.sabor_1?.id).concat(cart.map(i => i.sabor_2?.id)).filter(Boolean) as string[];
    
    let relacionesSabor: any[] = [];
    if (saborIds.length > 0) {
      const { data: rel } = await supabase
        .from('sabor_ingredientes')
        .select('sabor_id, ingrediente_id')
        .in('sabor_id', Array.from(new Set(saborIds)));
      relacionesSabor = rel || [];
    }

    const payload = cart.map((item) => {
      const ingMitad1 = relacionesSabor.filter(r => r.sabor_id === item.sabor_1?.id).map(r => ({ ingrediente_id: r.ingrediente_id }));
      const ingMitad2 = item.es_mitades 
        ? relacionesSabor.filter(r => r.sabor_id === item.sabor_2?.id).map(r => ({ ingrediente_id: r.ingrediente_id }))
        : [];
      
      const extrasReal = item.extras.map(t => ({ ingrediente_id: t.ingrediente_id }));
      const bases = getBaseList(item.tamano_nombre);

      return {
        tamano_id: item.tamano_id,
        cantidad: item.cantidad,
        mitad_1: ingMitad1,
        mitad_2: ingMitad2,
        // Inyectar los items base "ocultos" como extras para la deducción automática por parte del RPC
        extras: [...bases, ...extrasReal]
      };
    });

    // 4. Calcular el total del pedido
    const totalPedido = cart.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);

    // 5. Ejecuta la Función de Base de Datos para asegurar Control de Concurrencia (Atomicidad)
    const { data, error } = await supabase.rpc('procesar_venta', {
      cart_payload: payload, 
      p_total_precio: totalPedido,
      p_user_id: user.id
    });

    if (error) {
       console.error("RPC Fatal Error:", error);
       return { success: false, error: 'Ocurrió un error crítico intentando comunicar con el Servidor PG.' };
    }

    const result = data as { success: boolean, error?: string };
    
    if (!result.success) {
      return { success: false, error: result.error || 'La base de datos abortó la transacción.' };
    }

    // 5. Invalida vistas de stock
    revalidatePath('/inventario');
    revalidatePath('/alertas');

    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message || 'Error inesperado.' };
  }
}
