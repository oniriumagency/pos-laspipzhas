import { getVentas } from '@/server/actions/ventas';
import { createClient } from '@/lib/supabase/server';
import VentasList from '@/components/ventas/VentasList';

export default async function VentasPage() {
  const ventas = await getVentas();
  const supabase = await createClient();

  // Diccionario de ingredientes para mapeo de UI en desglose
  const { data: datosIngredientes } = await supabase.from('ingredientes').select('id, nombre, unidad_medida');
  
  const ingredientesMap: Record<string, { nombre: string; unidad_medida: string }> = {};
  if (datosIngredientes) {
    datosIngredientes.forEach(ingrediente => {
      ingredientesMap[ingrediente.id] = { nombre: ingrediente.nombre, unidad_medida: ingrediente.unidad_medida };
    });
  }

  // Tamaños y sabores necesarios para el modal de edición (agregar items)
  const { data: tamanos } = await supabase
    .from('tamanos_pizza')
    .select('id, nombre, precio')
    .order('created_at', { ascending: true });

  const { data: sabores } = await supabase
    .from('sabores')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Ventas</h1>
        <p className="text-gray-500 font-medium mt-1 text-lg">
          Revisa las transacciones pasadas, el desglose de productos y la salida de inventario exacta de cada orden.
        </p>
      </header>

      <VentasList
        ventas={ventas}
        ingredientes={ingredientesMap}
        tamanos={tamanos || []}
        sabores={sabores || []}
      />
    </div>
  );
}
