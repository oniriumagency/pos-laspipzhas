import { createClient } from '@/lib/supabase/server';

export default async function AlertasDashboardPage() {
  const supabase = await createClient();

  // 1. Extraemos todo el inventario activo de Supabase
  const { data: ingredientes, error } = await supabase
    .from('ingredientes')
    .select('id, nombre, stock_actual, punto_reorden, unidad_medida')
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

  // 2. Filtramos en tiempo de servidor los elementos que ya pasaron la línea roja o amarilla de stock
  const insumosCriticos = ingredientes?.filter(ing => ing.stock_actual <= ing.punto_reorden) || [];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* HEADER DE SECCIÓN */}
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard de Alertas</h1>
        <p className="text-gray-500 font-medium mt-1 text-lg">Reporte de insumos próximos a agotarse. Revisa qué pedirle al proveedor.</p>
      </header>

      {insumosCriticos.length === 0 ? (
        
        // ESTADO DE ÉXITO: Inventario Sano
        <div className="mt-12 bg-green-50/50 border border-green-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm ring-8 ring-green-50">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-green-800 tracking-tight">¡Todo bajo control!</h2>
          <p className="text-green-600 font-medium mt-3 text-lg max-w-md">
            Ningún insumo de tu catálogo se encuentra por debajo de su punto crítico de reorden en este momento.
          </p>
        </div>
        
      ) : (
        
        // ESTADO DE ALERTA: Grilla de Insumos Críticos
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {insumosCriticos.map((ing) => {
            // Lógica visual: Si tocó el 0, es ROJO urgencia pura. Si no, pero bajó del reorden, es NARANJA preventivo.
            const isZero = ing.stock_actual <= 0;
            
            return (
              <div 
                key={ing.id} 
                className={`rounded-[2rem] p-7 shadow-sm border relative overflow-hidden transition-all hover:shadow-md ${
                  isZero ? 'bg-red-50/50 border-red-200' : 'bg-orange-50/30 border-orange-200'
                }`}
              >
                {/* Figura abstracta de fondo */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 ${
                  isZero ? 'bg-red-500' : 'bg-orange-500'
                }`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-5">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight pr-4">{ing.nombre}</h3>
                    <span className={`px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest rounded-full shrink-0 ${
                      isZero ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {isZero ? 'Agotado' : 'Crítico'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-2">
                    {/* Fila: Muestra Stock Actual */}
                    <div className="flex justify-between items-end border-b border-gray-200/60 pb-3">
                       <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Stock Actual</span>
                       <span className={`text-4xl leading-none font-black ${isZero ? 'text-red-600' : 'text-orange-600'}`}>
                         {ing.stock_actual.toLocaleString('es-ES')} <span className="text-sm font-bold text-gray-500">{ing.unidad_medida}</span>
                       </span>
                    </div>
                    
                    {/* Fila: Muestra Punto Reorden */}
                    <div className="flex justify-between items-end">
                       <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Punto de Reorden sugerido</span>
                       <span className="text-xl font-black text-gray-400">
                         {ing.punto_reorden.toLocaleString('es-ES')} <span className="text-xs font-bold text-gray-400">{ing.unidad_medida}</span>
                       </span>
                    </div>
                  </div>
                  
                  {/* Botón Call To Action */}
                  <div className="mt-8">
                    {/* Por ahora visual. En el siguiente paso podríamos meterle un href a inventario o al admin */}
                    <button className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 outline-none focus:ring-4 ${
                      isZero 
                       ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-100' 
                       : 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-100'
                    }`}>
                      <svg className="w-5 h-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {isZero ? 'Pedir Inmediatamente' : 'Reportar Compra'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
