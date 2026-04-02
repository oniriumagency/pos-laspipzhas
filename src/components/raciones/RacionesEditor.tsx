'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { 
  saveRacionesBatch, 
  updateTamanoBase, 
  removeIngredienteFromRecetas, 
  addIngredienteToRecetas 
} from '@/server/actions/raciones';
import { createIngredient } from '@/server/actions/inventory';
import { toast } from 'sonner';
import { Save, Trash2, PlusCircle, PackageSearch, X } from 'lucide-react';

type Tamano = {
  id: string;
  nombre: string;
  masa_gr: number;
  salsa_gr: number;
  queso_base_gr: number;
  caja_id: string;
  servilletas_und: number;
};

type Ingrediente = {
  id: string;
  nombre: string;
  unidad_medida: string;
};

type Receta = {
  ingrediente_id: string;
  tamano_id: string;
  porcion_gr: number;
};

interface Props {
  tamanos: Tamano[];
  ingredientes: Ingrediente[];
  recetas: Receta[];
}

// Los 3 ingredientes "base" se manejan distinto — viven en tamanos_pizza, no en recetas_toppings
const BASE_FIELDS: { key: 'masa_gr' | 'salsa_gr' | 'queso_base_gr'; label: string }[] = [
  { key: 'masa_gr', label: 'Masa (Bollo crudo)' },
  { key: 'salsa_gr', label: 'Salsa de Tomate' },
  { key: 'queso_base_gr', label: 'Queso Mozzarella' },
];

export default function RacionesEditor({ tamanos, ingredientes, recetas }: Props) {
  const [isPending, startTransition] = useTransition();

  // Track local edits as a map: `${ingredienteId}-${tamanoId}` -> porcion_gr
  const [localEdits, setLocalEdits] = useState<Record<string, number>>({});
  // Track base edits: `${tamanoId}-${field}` -> value
  const [baseEdits, setBaseEdits] = useState<Record<string, number>>({});
  // Track which rows have been modified
  const [hasChanges, setHasChanges] = useState(false);

  // Modal state for adding ingredients
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewInsumoModal, setShowNewInsumoModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newUnidad, setNewUnidad] = useState('gr');
  const [newReorden, setNewReorden] = useState('10');

  // Ingredients currently in the recetas table (shown in the grid)
  const ingredientesEnReceta = useMemo(() => {
    const idsInReceta = new Set(recetas.map(r => r.ingrediente_id));
    return ingredientes.filter(i => idsInReceta.has(i.id));
  }, [recetas, ingredientes]);

  // Ingredients NOT in the recetas table (available to add)
  const ingredientesDisponibles = useMemo(() => {
    const idsInReceta = new Set(recetas.map(r => r.ingrediente_id));
    // Also exclude the base ingredients that are handled separately
    const baseNames = BASE_FIELDS.map(b => b.label);
    return ingredientes.filter(i => !idsInReceta.has(i.id) && !baseNames.includes(i.nombre));
  }, [recetas, ingredientes]);

  // Get the value for a recipe cell
  const getCellValue = (ingredienteId: string, tamanoId: string): number => {
    const key = `${ingredienteId}-${tamanoId}`;
    if (key in localEdits) return localEdits[key];
    const receta = recetas.find(r => r.ingrediente_id === ingredienteId && r.tamano_id === tamanoId);
    return receta?.porcion_gr ?? 0;
  };

  // Get the value for a base field
  const getBaseValue = (tamanoId: string, field: 'masa_gr' | 'salsa_gr' | 'queso_base_gr'): number => {
    const key = `${tamanoId}-${field}`;
    if (key in baseEdits) return baseEdits[key];
    const tamano = tamanos.find(t => t.id === tamanoId);
    return tamano ? tamano[field] : 0;
  };

  const handleCellChange = (ingredienteId: string, tamanoId: string, value: string) => {
    const key = `${ingredienteId}-${tamanoId}`;
    setLocalEdits(prev => ({ ...prev, [key]: Number(value) || 0 }));
    setHasChanges(true);
  };

  const handleBaseChange = (tamanoId: string, field: 'masa_gr' | 'salsa_gr' | 'queso_base_gr', value: string) => {
    const key = `${tamanoId}-${field}`;
    setBaseEdits(prev => ({ ...prev, [key]: Number(value) || 0 }));
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    startTransition(async () => {
      const toastId = toast.loading('Guardando cambios en las raciones...');
      let hadError = false;

      // 1. Save base changes
      for (const [key, value] of Object.entries(baseEdits)) {
        const [tamanoId, field] = key.split('-') as [string, 'masa_gr' | 'salsa_gr' | 'queso_base_gr'];
        const res = await updateTamanoBase(tamanoId, field, value);
        if (res.error) {
          toast.error(`Error actualizando base: ${res.error}`, { id: toastId });
          hadError = true;
          break;
        }
      }

      // 2. Save topping changes
      if (!hadError && Object.keys(localEdits).length > 0) {
        const cambios = Object.entries(localEdits).map(([key, value]) => {
          const [ingrediente_id, tamano_id] = key.split('-');
          return { ingrediente_id, tamano_id, porcion_gr: value };
        });

        const res = await saveRacionesBatch(cambios);
        if (res.error) {
          toast.error(`Error actualizando toppings: ${res.error}`, { id: toastId });
          hadError = true;
        }
      }

      if (!hadError) {
        toast.success('¡Raciones actualizadas correctamente!', { id: toastId });
        setLocalEdits({});
        setBaseEdits({});
        setHasChanges(false);
      }
    });
  };

  const handleRemoveIngrediente = (ingredienteId: string, nombre: string) => {
    if (!window.confirm(`¿Quitar "${nombre}" de las recetas?\n\nEsto solo lo elimina de la tabla de raciones, NO lo borra de la bodega.`)) return;

    startTransition(async () => {
      const res = await removeIngredienteFromRecetas(ingredienteId);
      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success(`"${nombre}" removido de las recetas.`);
      }
    });
  };

  const handleAddExistingIngrediente = (ingredienteId: string) => {
    const tamanoIds = tamanos.map(t => t.id);
    startTransition(async () => {
      const res = await addIngredienteToRecetas(ingredienteId, tamanoIds);
      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success('Ingrediente añadido a las recetas. Asígnale las porciones por tamaño.');
        setShowAddModal(false);
      }
    });
  };

  const handleCreateNewInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) { toast.error('El nombre es requerido.'); return; }

    startTransition(async () => {
      const res = await createIngredient({
        nombre: newNombre.trim(),
        stock_actual: Number(newStock) || 0,
        unidad_medida: newUnidad.trim(),
        punto_reorden: Number(newReorden) || 0,
      });

      if (res.error) {
        toast.error(`Error: ${res.error}`);
      } else {
        toast.success(`Insumo "${newNombre}" creado en bodega. Ahora agrégalo desde la lista.`);
        setShowNewInsumoModal(false);
        setNewNombre('');
        setNewStock('0');
        setNewUnidad('gr');
        setNewReorden('10');
      }
    });
  };

  return (
    <div className="relative">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-black transition-all hover:-translate-y-0.5"
        >
          <PlusCircle size={18} /> Agregar Ingrediente
        </button>

        {hasChanges && (
          <button
            onClick={handleSaveAll}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-500 transition-all hover:-translate-y-0.5 disabled:opacity-50 animate-in fade-in slide-in-from-left-2 duration-300"
          >
            <Save size={18} /> {isPending ? 'Guardando...' : 'Guardar Todos los Cambios'}
          </button>
        )}
      </div>

      {/* The Grid / Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-4 px-6 text-left text-xs font-black uppercase tracking-widest min-w-[200px] sticky left-0 bg-slate-800 z-10">
                  Ingrediente
                </th>
                {tamanos.map(t => (
                  <th key={t.id} className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest min-w-[140px]">
                    {t.nombre}
                  </th>
                ))}
                <th className="py-4 px-4 text-center text-xs font-black uppercase tracking-widest w-16">
                  
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* ===== BASE INGREDIENTS SECTION ===== */}
              <tr className="bg-orange-50/50">
                <td colSpan={tamanos.length + 2} className="py-2.5 px-6 text-[0.6rem] font-black uppercase tracking-[0.2em] text-orange-700">
                  🍕 Insumos Base (por tamaño)
                </td>
              </tr>

              {BASE_FIELDS.map(baseField => (
                <tr key={baseField.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-6 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-50">
                    {baseField.label}
                    <span className="ml-2 text-[0.6rem] font-bold text-slate-400 uppercase">gr</span>
                  </td>
                  {tamanos.map(t => (
                    <td key={t.id} className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={getBaseValue(t.id, baseField.key)}
                        onChange={(e) => handleBaseChange(t.id, baseField.key, e.target.value)}
                        className="w-20 text-center font-bold text-sm rounded-lg border border-slate-200 bg-slate-50 py-2 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition-all"
                      />
                    </td>
                  ))}
                  <td></td>
                </tr>
              ))}

              {/* ===== TOPPINGS SECTION ===== */}
              <tr className="bg-emerald-50/50">
                <td colSpan={tamanos.length + 2} className="py-2.5 px-6 text-[0.6rem] font-black uppercase tracking-[0.2em] text-emerald-700">
                  🧀 Toppings / Ingredientes de Sabor
                </td>
              </tr>

              {ingredientesEnReceta.length === 0 ? (
                <tr>
                  <td colSpan={tamanos.length + 2} className="py-8 text-center text-sm text-slate-400 font-medium">
                    No hay toppings en las recetas. Agrega uno usando el botón de arriba.
                  </td>
                </tr>
              ) : (
                ingredientesEnReceta.map(ing => (
                  <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-3 px-6 text-sm font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-50">
                      {ing.nombre}
                      <span className="ml-2 text-[0.6rem] font-bold text-slate-400 uppercase">{ing.unidad_medida}</span>
                    </td>
                    {tamanos.map(t => (
                      <td key={t.id} className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={getCellValue(ing.id, t.id)}
                          onChange={(e) => handleCellChange(ing.id, t.id, e.target.value)}
                          className="w-20 text-center font-bold text-sm rounded-lg border border-slate-200 bg-slate-50 py-2 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none transition-all"
                        />
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemoveIngrediente(ing.id, ing.nombre)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                        title={`Quitar ${ing.nombre} de recetas`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL: Agregar Ingrediente existente de Bodega ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative max-h-[80vh] flex flex-col">
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Agregar Ingrediente</h3>
                <p className="text-sm text-slate-500 mt-1">Selecciona un insumo de bodega para agregarlo a las recetas.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {ingredientesDisponibles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 font-medium mb-4">Todos los insumos de bodega ya están en las recetas.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 mb-4">
                {ingredientesDisponibles.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => handleAddExistingIngrediente(ing.id)}
                    disabled={isPending}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-100 hover:bg-orange-50 hover:border-orange-200 transition-all flex items-center justify-between disabled:opacity-50"
                  >
                    <div>
                      <span className="font-bold text-sm text-slate-800">{ing.nombre}</span>
                      <span className="ml-2 text-xs text-slate-400 font-medium">{ing.unidad_medida}</span>
                    </div>
                    <PlusCircle size={18} className="text-slate-300" />
                  </button>
                ))}
              </div>
            )}

            {/* Botón para crear insumo nuevo */}
            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => { setShowAddModal(false); setShowNewInsumoModal(true); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-black transition-all"
              >
                <PackageSearch size={18} /> Crear Nuevo Insumo en Bodega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Crear Nuevo Insumo (Reutilizado de Bodega) ===== */}
      {showNewInsumoModal && (
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

            <form onSubmit={handleCreateNewInsumo} className="mt-6 space-y-4">
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
                    placeholder="gr, und, L"
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
                  onClick={() => setShowNewInsumoModal(false)}
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
    </div>
  );
}
