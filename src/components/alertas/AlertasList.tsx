'use client';

import React, { useState } from 'react';
import { ShoppingBasket, PackageSearch } from 'lucide-react';

type Ingrediente = {
  id: string;
  nombre: string;
  stock_actual: number;
  punto_reorden: number;
  unidad_medida: string;
  categoria?: 'insumo' | 'bebida' | 'cigarrillo' | 'gaseosa' | 'cerveza';
};

export function AlertasList({ ingredientes }: { ingredientes: Ingrediente[] }) {
  type TabId = 'todo' | 'insumo' | 'bebida' | 'cigarrillo' | 'gaseosa' | 'cerveza';
  const TABS: { id: TabId; label: string }[] = [
    { id: 'todo', label: 'Todo' },
    { id: 'insumo', label: 'Insumos' },
    { id: 'bebida', label: 'Bebidas' },
    { id: 'gaseosa', label: 'Gaseosas' },
    { id: 'cerveza', label: 'Cervezas' },
    { id: 'cigarrillo', label: 'Cigarrillos' },
  ];

  const [activeTab, setActiveTab] = useState<TabId>('todo');

  const ingredientesFiltrados = ingredientes.filter(i => activeTab === 'todo' || (i.categoria || 'insumo') === activeTab);

  return (
    <div className="mt-8 relative">
      {/* ═══ Barra de Pestañas ═══ */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 overflow-x-auto overflow-y-hidden pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {ingredientesFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <PackageSearch size={48} className="mb-3 opacity-30" />
            <p className="font-semibold">No hay items en esta categoría.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[0.65rem] uppercase font-black text-gray-400 tracking-widest">
                  <th className="px-5 py-4">Artículo</th>
                  <th className="px-5 py-4">Categoría</th>
                  <th className="px-5 py-4 text-right">Stock Actual</th>
                  <th className="px-5 py-4 text-right">Punto Reorden</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acción Sugerida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ingredientesFiltrados.map((ing) => {
                  const isZero = ing.stock_actual <= 0;
                  const isCritical = ing.stock_actual > 0 && ing.stock_actual <= ing.punto_reorden;
                  const isHealthy = ing.stock_actual > ing.punto_reorden;

                  return (
                    <tr
                      key={ing.id}
                      className={`hover:bg-gray-50/50 transition-colors ${isZero ? 'bg-red-50/20' : isCritical ? 'bg-orange-50/20' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <span className="font-bold text-gray-900">
                          {ing.nombre}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {ing.categoria || 'insumo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-xl font-black ${isZero ? 'text-red-600' : isCritical ? 'text-orange-600' : 'text-gray-900'}`}>
                          {ing.stock_actual.toLocaleString('es-ES')}
                        </span>
                        <span className="text-xs font-bold text-gray-400 ml-1">{ing.unidad_medida}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-gray-400">
                          {ing.punto_reorden.toLocaleString('es-ES')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {isZero ? (
                          <span className="px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest rounded-full bg-red-100 text-red-700">
                            Agotado
                          </span>
                        ) : isCritical ? (
                          <span className="px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest rounded-full bg-orange-100 text-orange-700">
                            Crítico
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest rounded-full bg-green-100 text-green-700">
                            Sano
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!isHealthy && (
                          <button className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5 shadow-sm ${
                            isZero ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'
                          }`}>
                            <ShoppingBasket size={14} />
                            {isZero ? 'Pedir Ya' : 'Reportar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
