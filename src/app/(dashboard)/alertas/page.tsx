import { createClient } from '@/lib/supabase/server';
import { AlertasList } from '@/components/alertas/AlertasList';

export default async function AlertasDashboardPage() {
  const supabase = await createClient();

  // 1. Extraemos todo el inventario activo de Supabase
  const { data: ingredientes, error } = await supabase
    .from('ingredientes')
    .select('id, nombre, stock_actual, punto_reorden, unidad_medida, categoria')
    .eq('activo', true)
    .order('stock_actual', { ascending: true }); // Ordenados por los más bajos primero

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-20 text-center bg-red-50 border border-red-200 rounded-2xl">
         <span className="text-4xl mb-4 block">⚠️</span>
        <h2 className="text-xl font-bold text-red-700">Error Crítico</h2>
        <p className="text-red-500 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER DE SECCIÓN */}
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Por Comprar (Alertas)</h1>
        <p className="text-gray-500 font-medium mt-1 text-lg">Reporte de inventario completo. Filtra por categoría y revisa el estado del stock.</p>
      </header>

      <AlertasList ingredientes={ingredientes || []} />
    </div>
  );
}
