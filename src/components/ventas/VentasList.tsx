'use client';

import React, { useState, useTransition } from 'react';
import { deleteVenta } from '@/server/actions/ventas';
import { toast } from 'sonner';
import { Trash2, ChevronDown, ChevronUp, Clock, DollarSign, Pizza, Package2 } from 'lucide-react';

interface Venta {
  id: string;
  created_at: string;
  total_precio: number;
  cart_payload: any[];
  deducciones: { ing_id: string; cantidad_descontar: number }[];
}

interface IngredienteMap {
  [id: string]: { nombre: string; unidad_medida: string };
}

interface VentasListProps {
  ventas: Venta[];
  ingredientes: IngredienteMap;
}

export default function VentasList({ ventas, ingredientes }: VentasListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('⚠️ ¿Seguro que deseas ANULAR esta venta?\n\nEsta acción eliminará el registro y devolverá todos los ingredientes al inventario.')) {
      return;
    }

    setDeletingId(id);
    startTransition(async () => {
      const toastId = toast.loading('Reversando venta y restaurando inventario...');
      const result = await deleteVenta(id);
      
      if (result.success) {
        toast.success('La venta ha sido anulada con éxito. Inventario restaurado.', { id: toastId });
      } else {
        toast.error(result.error || 'Error al anular la venta', { id: toastId });
      }
      setDeletingId(null);
    });
  };

  if (ventas.length === 0) {
    return (
      <div className="mt-12 bg-white border border-gray-100 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6 ring-4 ring-gray-50/50">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">Caja Vacía</h2>
        <p className="text-gray-500 font-medium mt-2 max-w-sm">No hay ventas registradas en el historial. Tus próximas ventas aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ventas.map((venta) => {
        const date = new Date(venta.created_at);
        const formatOptions: Intl.DateTimeFormatOptions = { 
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        };
        const prettyDate = date.toLocaleDateString('es-ES', formatOptions);

        const isExpanded = expandedId === venta.id;
        const isDeleting = deletingId === venta.id;

        // Contar pizzas totales en la orden
        const totalPizzas = venta.cart_payload.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0);

        return (
          <div key={venta.id} className={`bg-white border rounded-[1.5rem] shadow-sm overflow-hidden transition-all hover:shadow-md ${isDeleting ? 'opacity-50 border-red-200' : 'border-gray-100'}`}>
            {/* Venta Header / Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4">
              
              <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => toggleExpand(venta.id)}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-sm">
                  <DollarSign strokeWidth={2.5} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="font-black text-xl text-gray-900">${venta.total_precio.toLocaleString('es-ES')}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-widest">Pagado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{prettyDate}</span>
                    <span className="text-gray-300">•</span>
                    <span className="shrink-0">{totalPizzas} {totalPizzas === 1 ? 'pizza' : 'pizzas'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button 
                  onClick={() => toggleExpand(venta.id)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 uppercase tracking-wider"
                >
                  {isExpanded ? 'Ocultar' : 'Detalle'}
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => handleDelete(venta.id)}
                  disabled={isPending}
                  className="w-10 h-10 flex items-center justify-center border border-red-200 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:border-red-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
                  aria-label="Anular Venta"
                  title="Anular Venta y Restaurar Inventario"
                >
                  <Trash2 className="w-[1.1rem] h-[1.1rem] shrink-0" />
                </button>
              </div>
            </div>

            {/* Venta Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-5 sm:p-6 bg-gray-50/50 flex flex-col xl:flex-row gap-6">
                
                {/* Lista de Items Comprados */}
                <div className="flex-1">
                   <h4 className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-gray-500 mb-3 flex items-center gap-2">
                     <Pizza className="w-3.5 h-3.5"/> Pizzas Vendidas
                   </h4>
                   <ul className="space-y-2">
                     {venta.cart_payload.map((item: any, idx: number) => {
                       // Build a descriptive label from the enriched payload
                       const tamanoLabel = item.tamano_nombre || 'Pizza';
                       const sabor1 = item.sabor_1_nombre;
                       const sabor2 = item.sabor_2_nombre;
                       
                       let saborLabel = '';
                       if (sabor1 && sabor2) {
                         saborLabel = `${sabor1} / ${sabor2}`;
                       } else if (sabor1) {
                         saborLabel = sabor1;
                       }

                       const precioUnit = item.precio_unitario;

                       return (
                         <li key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center gap-3">
                           <div className="min-w-0 flex-1">
                              <span className="font-bold text-gray-800 block text-sm">
                                {item.cantidad}x {tamanoLabel}
                              </span>
                              {saborLabel && (
                                <span className="text-xs text-gray-500 font-medium mt-0.5 block truncate">🍕 {saborLabel}</span>
                              )}
                           </div>
                           <div className="flex flex-col items-end shrink-0">
                             {item.descuento_porcentaje ? (
                               <>
                                 <span className="line-through text-[0.65rem] text-gray-400 font-semibold mb-0.5">${(precioUnit * item.cantidad).toLocaleString('es-ES')}</span>
                                 <div className="flex items-center gap-1.5">
                                   <span className="bg-orange-100 text-orange-600 text-[0.6rem] font-bold px-1 rounded">- {item.descuento_porcentaje}%</span>
                                   <span className="text-sm font-black text-gray-800">${((precioUnit * (1 - item.descuento_porcentaje/100)) * item.cantidad).toLocaleString('es-ES')}</span>
                                 </div>
                               </>
                             ) : (
                               precioUnit && (
                                 <span className="text-sm font-black text-gray-800">
                                   ${(precioUnit * item.cantidad).toLocaleString('es-ES')}
                                 </span>
                               )
                             )}
                           </div>
                         </li>
                       );
                     })}
                   </ul>
                </div>

                {/* Lista de Ingredientes Descontados */}
                <div className="flex-1">
                   <h4 className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-orange-600 mb-3 flex items-center gap-2">
                     <Package2 className="w-3.5 h-3.5"/> Salida de Inventario
                   </h4>
                   <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-[0.6rem] uppercase font-black text-gray-500 tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Insumo</th>
                            <th className="px-4 py-3 text-right">Descontado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {venta.deducciones.map((d, idx) => {
                             const ing = ingredientes[d.ing_id];
                             return (
                               <tr key={idx} className="hover:bg-gray-50/50">
                                 <td className="px-4 py-2.5 font-semibold text-gray-800 text-sm">{ing ? ing.nombre : <span className="text-gray-400 italic">Insumo Eliminado</span>}</td>
                                 <td className="px-4 py-2.5 text-right font-black text-orange-600 text-sm">
                                   -{d.cantidad_descontar} <span className="text-[0.65rem] font-bold text-gray-400">{ing?.unidad_medida || 'u'}</span>
                                 </td>
                               </tr>
                             );
                          })}
                        </tbody>
                     </table>
                   </div>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
