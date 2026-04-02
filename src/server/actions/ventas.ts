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
