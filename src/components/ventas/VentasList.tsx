'use client';

import React, { useState, useTransition } from 'react';
import { deleteVenta } from '@/server/actions/ventas';
import { toast } from 'sonner';
import { Trash2, ChevronDown, ChevronUp, Clock, DollarSign, Package } from 'lucide-react';

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
  const [isPending, startTransition] = useTransition();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta venta? Esta gran acción cancelará el pedido y devolverá todos los ingredientes al inventario.')) {
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading('Reversando venta y restaurando inventario...');
      const result = await deleteVenta(id);
      
      if (result.success) {
        toast.success('La venta ha sido anulada con éxito.', { id: toastId });
      } else {
        toast.error(result.error || 'Error al anular la venta', { id: toastId });
      }
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

        return (
          <div key={venta.id} className="bg-white border border-gray-100 rounded-[1.5rem] shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Venta Header / Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4">
              
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleExpand(venta.id)}>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <DollarSign strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-xl text-gray-900">${venta.total_precio.toLocaleString('es-ES')}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Pagado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium tracking-wide">
                    <Clock className="w-4 h-4" />
                    {prettyDate} &bull; {venta.cart_payload.length} items
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleExpand(venta.id)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => handleDelete(venta.id)}
                  disabled={isPending}
                  className="w-10 h-10 flex items-center justify-center border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                  aria-label="Anular Venta"
                  title="Anular Venta y Restaurar Inventario"
                >
                  <Trash2 className="w-[1.2rem] h-[1.2rem] shrink-0" />
                </button>
              </div>
            </div>

            {/* Venta Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-6 bg-gray-50/50 flex flex-col xl:flex-row gap-8">
                
                {/* Lista de Items Comprados */}
                <div className="flex-1">
                   <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                     <Package className="w-4 h-4"/> Productos Vendidos
                   </h4>
                   <ul className="space-y-3">
                     {venta.cart_payload.map((item: any, idx) => (
                       <li key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                         <div>
                            <span className="font-bold text-gray-800 block text-sm">
                              {item.cantidad}x Pizza {item.tamano_id} {/* Ideally tamano_nombre, but cart_payload only saved IDs unless tamano_nombre was added. The existing RPC was simple. Wait: processSale in server actually receives cart_item logic. Let's just say "Pizza" */} 
                            </span>
                            <span className="text-xs text-gray-500 font-medium">Mitades o Sabores incluidos</span>
                         </div>
                       </li>
                     ))}
                   </ul>
                </div>

                {/* Lista de Ingredientes Descontados */}
                <div className="flex-1">
                   <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 mb-4 flex items-center gap-2">
                     Salida de Inventario
                   </h4>
                   <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase font-black text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Insumo</th>
                            <th className="px-4 py-3 text-right">Cantidad Descontada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {venta.deducciones.map((d, idx) => {
                             const ing = ingredientes[d.ing_id];
                             return (
                               <tr key={idx} className="hover:bg-gray-50/50">
                                 <td className="px-4 py-3 font-semibold text-gray-800">{ing ? ing.nombre : 'Insumo Eliminado'}</td>
                                 <td className="px-4 py-3 text-right font-black text-orange-600">
                                   -{d.cantidad_descontar} <span className="text-xs font-bold text-gray-400">{ing?.unidad_medida || 'u'}</span>
                                 </td>
                               </tr>
                             )
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
