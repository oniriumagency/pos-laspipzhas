import { createClient } from '@/lib/supabase/server';
import { InventoryManager } from '@/components/inventory/InventoryManager'; // Importación local del componente cliente

// Este React Server Component se delega exclusivamente la recolección inicial de los
// datos de inventario del lado del servidor (Velocidad, zero latency en hidratación) y pasa la 
// batuta al Client Component <InventoryManager /> para que maneje el Modal y la Tabla Reactiva.
export default async function InventarioPage() {
  const supabase = await createClient();

  // 1. Obtener los ingredientes garantizados del lado del servidor.
  const { data: ingredientes, error } = await supabase
    .from('ingredientes')
    .select('id, nombre, stock_actual, unidad_medida, punto_reorden')
    .order('nombre', { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-8">
        <p className="font-bold">Error cargando inventario:</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Cabecera de la sección puramente estática */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Maestro de Insumos</h1>
          <p className="mt-2 text-sm text-gray-500">
            Vista general del inventario en tiempo real, alertas de stock bajo y entradas/salidas de almacén.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {/* El botón de agregar estará dentro de InventoryManager */}
        </div>
      </div>
      
      {/* Componente Orquestador Cliente de UI (Tabla reactiva + Modales) */}
      <InventoryManager ingredientes={ingredientes || []} />

    </div>
  );
}
