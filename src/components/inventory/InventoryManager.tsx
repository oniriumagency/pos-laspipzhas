'use client';

import React, { useState, useTransition } from 'react';
import { adjustInventoryStock, createIngredient } from '@/server/actions/inventory';
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, PackageSearch, Settings2, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

type Ingrediente = {
  id: string;
  nombre: string;
  stock_actual: number;
  unidad_medida: string;
  punto_reorden: number;
};

export function InventoryManager({ ingredientes }: { ingredientes: Ingrediente[] }) {
  // Estado para el modal de ajuste
  const [selectedItem, setSelectedItem] = useState<Ingrediente | null>(null);
  const [modalType, setModalType] = useState<'merma' | 'ajuste'>('ajuste');
  const [cambioCantidad, setCambioCantidad] = useState<string>('');
  
  // Estado para el nuevo insumo
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newUnidad, setNewUnidad] = useState('pz');
  const [newReorden, setNewReorden] = useState('10');

  const [isPending, startTransition] = useTransition();

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const numCantidad = Number(cambioCantidad);
    if (isNaN(numCantidad) || numCantidad <= 0) {
      toast.error('Ingresa una cantidad válida a modificar.');
      return;
    }

    const isMerma = modalType === 'merma';
    const delta = isMerma ? -numCantidad : numCantidad;

    startTransition(async () => {
      const res = await adjustInventoryStock(selectedItem.id, delta, modalType);
      
      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success(
          isMerma 
            ? `Merma de ${numCantidad}${selectedItem.unidad_medida} descontada de ${selectedItem.nombre}.` 
            : `Ingreso de ${numCantidad}${selectedItem.unidad_medida} a ${selectedItem.nombre} aplicado.`
        );
        setSelectedItem(null);
        setCambioCantidad('');
      }
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNombre.trim()) {
      toast.error('El nombre es requerido.');
      return;
    }

    const stockNum = Number(newStock) || 0;
    const reordenNum = Number(newReorden) || 0;

    startTransition(async () => {
      const res = await createIngredient({
        nombre: newNombre.trim(),
        stock_actual: stockNum,
        unidad_medida: newUnidad.trim(),
        punto_reorden: reordenNum
      });

      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success(`Insumo ${newNombre} creado exitosamente.`);
        setIsNewOpen(false);
        setNewNombre('');
        setNewStock('0');
        setNewUnidad('pz');
        setNewReorden('10');
      }
    });
  };

  return (
    <div className="mt-8 relative">
      <div className="flex justify-end mb-6 absolute -top-20 right-0 sm:-top-24">
        <button 
          onClick={() => setIsNewOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-500 transition-all hover:-translate-y-0.5"
        >
          <PlusCircle size={18} /> Nuevo Insumo
        </button>
      </div>

      {/* Tarjetas de Resumen / Alertas Rápida */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-orange-50 text-orange-500 rounded-xl p-3 shrink-0">
             <PackageSearch size={24} />
          </div>
          <div>
             <p className="text-sm font-medium text-slate-500">Insumos Registrados</p>
             <p className="text-2xl font-bold text-slate-900">{ingredientes.length}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-50 flex items-center gap-4 group hover:bg-red-50 transition-colors">
          <div className="bg-red-100 text-red-600 rounded-xl p-3 shrink-0">
             <AlertCircle size={24} />
          </div>
          <div>
             <p className="text-sm font-medium text-red-600/70">En Alerta de Stock</p>
             <p className="text-2xl font-bold text-red-700">
               {ingredientes.filter(i => i.stock_actual <= i.punto_reorden).length}
             </p>
          </div>
        </div>
      </div>

      {/* Tabla Central */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Insumo</th>
                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Actual</th>
                <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {ingredientes.map((ing) => {
                const enAlerta = ing.stock_actual <= ing.punto_reorden;
                
                return (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-slate-900">
                      {ing.nombre}
                      <span className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {ing.unidad_medida}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-black text-slate-800">
                      {ing.stock_actual.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      {enAlerta ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-100">
                          <AlertCircle size={12} /> Requiere Re-abastecer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                           Stock Óptimo
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedItem(ing); setModalType('ajuste'); }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Ingreso de Mercadería"
                        >
                          <ArrowUpCircle size={20} />
                        </button>
                        <button 
                          onClick={() => { setSelectedItem(ing); setModalType('merma'); }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Registrar Merma/Pérdida"
                        >
                          <ArrowDownCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Insumo */}
      {isNewOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="absolute -top-6 inset-x-0 flex justify-center">
               <div className="p-4 rounded-full shadow-lg bg-orange-500 text-white">
                  <PackageSearch size={28} />
               </div>
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold text-slate-900">Nuevo Insumo</h3>
              <p className="text-sm text-slate-500 mt-1">Registra un nuevo material en bodega.</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Insumo</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  placeholder="Ej: Aceite de Oliva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Unidad Medida</label>
                  <input
                    type="text"
                    required
                    value={newUnidad}
                    onChange={(e) => setNewUnidad(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all uppercase"
                    placeholder="KG, L, PZ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Punto de Reorden (Alerta)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newReorden}
                  onChange={(e) => setNewReorden(e.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  disabled={isPending}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 bg-slate-900 shadow-slate-900/20 hover:bg-black"
                >
                  {isPending ? 'Guardando...' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste (Inline para MVP) */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <div className="absolute -top-6 inset-x-0 flex justify-center">
               <div className={`p-4 rounded-full shadow-lg ${modalType === 'merma' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
                  {modalType === 'merma' ? <ArrowDownCircle size={28} /> : <Settings2 size={28} />}
               </div>
            </div>

            <div className="mt-8 text-center">
              <h3 className="text-xl font-bold text-slate-900">
                {modalType === 'merma' ? 'Registrar Merma' : 'Ingreso de Inventario'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Para el insumo <strong className="text-slate-700">{selectedItem.nombre}</strong>
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Cantidad a {modalType === 'merma' ? 'descontar' : 'ingresar'} ({selectedItem.unidad_medida})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  required
                  value={cambioCantidad}
                  onChange={(e) => setCambioCantidad(e.target.value)}
                  className="w-full text-center text-2xl font-black rounded-2xl border-slate-200 bg-slate-50 py-4 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  disabled={isPending}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex justify-center items-center ${modalType === 'merma' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-slate-900 shadow-slate-900/20 hover:bg-black'}`}
                >
                  {isPending ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
