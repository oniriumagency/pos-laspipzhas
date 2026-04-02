import { getVentas } from '@/server/actions/ventas';
import { createClient } from '@/lib/supabase/server';
import VentasList from '@/components/ventas/VentasList';

export default async function VentasPage() {
  const ventas = await getVentas();
  const supabase = await createClient();

  // Dictionary of ingredients for UI mapping
  const { data: ingData } = await supabase.from('ingredientes').select('id, nombre, unidad_medida');
  
  const ingredientesMap: Record<string, { nombre: string; unidad_medida: string }> = {};
  if (ingData) {
    ingData.forEach(ing => {
      ingredientesMap[ing.id] = { nombre: ing.nombre, unidad_medida: ing.unidad_medida };
    });
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Historial de Ventas</h1>
        <p className="text-gray-500 font-medium mt-1 text-lg">
          Revisa las transacciones pasadas, el desglose de productos y la salida de inventario exacta de cada orden.
        </p>
      </header>

      <VentasList ventas={ventas} ingredientes={ingredientesMap} />
    </div>
  );
}
