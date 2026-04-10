'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  crearSabor,
  eliminarSabor,
  agregarIngredienteASabor,
  removerIngredienteDeSabor,
} from '@/server/actions/recipes';
import { toast } from 'sonner';
import { PlusCircle, Trash2, X, ChefHat, Search, Package } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Sabor = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
};

type Relacion = {
  sabor_id: string;
  ingrediente_id: string;
};

type Ingrediente = {
  id: string;
  nombre: string;
  unidad_medida: string;
};

interface SaboresManagerProps {
  sabores: Sabor[];
  relaciones: Relacion[];
  ingredientes: Ingrediente[];
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function SaboresManager({ sabores, relaciones, ingredientes }: SaboresManagerProps) {
  const [isPending, startTransition] = useTransition();

  // ─── Estado del modal "Crear Sabor" ──────────────────────────────────────
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');

  // ─── Estado del popover "Agregar Insumo" por tarjeta ─────────────────────
  const [popoverSaborId, setPopoverSaborId] = useState<string | null>(null);
  const [busquedaIngrediente, setBusquedaIngrediente] = useState('');

  // ─── Mapeo: saborId → lista de ingredientes vinculados ───────────────────
  const ingredientesPorSabor = useMemo(() => {
    const mapa: Record<string, Ingrediente[]> = {};
    for (const sabor of sabores) {
      const idsVinculados = relaciones
        .filter(r => r.sabor_id === sabor.id)
        .map(r => r.ingrediente_id);
      mapa[sabor.id] = ingredientes.filter(i => idsVinculados.includes(i.id));
    }
    return mapa;
  }, [sabores, relaciones, ingredientes]);

  // ─── Ingredientes disponibles para agregar a un sabor específico ─────────
  const ingredientesDisponiblesParaSabor = (saborId: string) => {
    const yaVinculados = new Set(
      relaciones.filter(r => r.sabor_id === saborId).map(r => r.ingrediente_id)
    );
    return ingredientes
      .filter(i => !yaVinculados.has(i.id))
      .filter(i =>
        busquedaIngrediente.trim() === '' ||
        i.nombre.toLowerCase().includes(busquedaIngrediente.toLowerCase())
      );
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCrearSabor = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (!nuevoNombre.trim()) {
      toast.error('El nombre del sabor es obligatorio.');
      return;
    }

    startTransition(async () => {
      const resultado = await crearSabor(nuevoNombre, nuevaDescripcion);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success(`Sabor "${nuevoNombre}" creado exitosamente.`);
        setMostrarModalCrear(false);
        setNuevoNombre('');
        setNuevaDescripcion('');
      }
    });
  };

  const handleEliminarSabor = (saborId: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar el sabor "${nombre}"?\n\nSe desvincularán todos sus ingredientes. Los insumos de bodega NO se afectan.`)) return;

    startTransition(async () => {
      const resultado = await eliminarSabor(saborId);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success(`Sabor "${nombre}" eliminado.`);
      }
    });
  };

  const handleAgregarIngrediente = (saborId: string, ingredienteId: string, nombreIngrediente: string) => {
    startTransition(async () => {
      const resultado = await agregarIngredienteASabor(saborId, ingredienteId);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success(`"${nombreIngrediente}" vinculado al sabor.`);
        setPopoverSaborId(null);
        setBusquedaIngrediente('');
      }
    });
  };

  const handleRemoverIngrediente = (saborId: string, ingredienteId: string, nombreIngrediente: string) => {
    startTransition(async () => {
      const resultado = await removerIngredienteDeSabor(saborId, ingredienteId);
      if (resultado.error) {
        toast.error(resultado.error);
      } else {
        toast.success(`"${nombreIngrediente}" desvinculado del sabor.`);
      }
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative">

      {/* ═══ Barra de Acciones ═══ */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setMostrarModalCrear(true)}
          className="flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-500 transition-all hover:-translate-y-0.5"
        >
          <PlusCircle size={18} /> Nuevo Sabor
        </button>
      </div>

      {/* ═══ Grilla de Tarjetas ═══ */}
      {sabores.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <ChefHat size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium text-lg">No hay sabores creados aún.</p>
          <p className="text-slate-400 text-sm mt-1">Crea tu primer sabor de pizza para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sabores.map((sabor) => {
            const ingredientesDelSabor = ingredientesPorSabor[sabor.id] || [];
            const popoverAbierto = popoverSaborId === sabor.id;

            return (
              <div
                key={sabor.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
              >
                {/* Cabecera de Tarjeta */}
                <div className="px-5 pt-5 pb-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-slate-900 truncate">{sabor.nombre}</h3>
                    {sabor.descripcion && (
                      <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{sabor.descripcion}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEliminarSabor(sabor.id, sabor.nombre)}
                    disabled={isPending}
                    className="ml-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
                    title={`Eliminar sabor ${sabor.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Pills de Ingredientes */}
                <div className="px-5 pb-4 flex-1">
                  <div className="flex flex-wrap gap-2">
                    {ingredientesDelSabor.length === 0 ? (
                      <span className="text-xs text-slate-300 italic py-1">Sin ingredientes vinculados</span>
                    ) : (
                      ingredientesDelSabor.map((ingrediente) => (
                        <span
                          key={ingrediente.id}
                          className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full px-3 py-1.5 text-xs font-bold transition-colors hover:bg-orange-100 group"
                        >
                          {ingrediente.nombre}
                          <button
                            onClick={() => handleRemoverIngrediente(sabor.id, ingrediente.id, ingrediente.nombre)}
                            disabled={isPending}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-orange-400 hover:text-red-600 hover:bg-red-100 transition-colors disabled:opacity-30"
                            title={`Quitar ${ingrediente.nombre}`}
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Botón de Agregar Insumo — despliega popover */}
                <div className="px-5 pb-4 relative">
                  <button
                    onClick={() => {
                      setPopoverSaborId(popoverAbierto ? null : sabor.id);
                      setBusquedaIngrediente('');
                    }}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500 py-2.5 text-sm font-bold transition-all disabled:opacity-30"
                  >
                    <PlusCircle size={16} /> Agregar Insumo
                  </button>

                  {/* ── Popover de selección de ingredientes ── */}
                  {popoverAbierto && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[60] overflow-hidden"
                      style={{ animation: 'slideUp 150ms ease-out' }}
                    >
                      {/* Buscador */}
                      <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                          <input
                            type="text"
                            autoFocus
                            value={busquedaIngrediente}
                            onChange={(evento) => setBusquedaIngrediente(evento.target.value)}
                            placeholder="Buscar insumo..."
                            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-100 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Lista de ingredientes disponibles */}
                      <div className="max-h-48 overflow-y-auto">
                        {ingredientesDisponiblesParaSabor(sabor.id).length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-400">
                            <Package size={20} className="mx-auto mb-2 text-slate-300" />
                            No hay insumos disponibles.
                          </div>
                        ) : (
                          ingredientesDisponiblesParaSabor(sabor.id).map((ingrediente) => (
                            <button
                              key={ingrediente.id}
                              onClick={() => handleAgregarIngrediente(sabor.id, ingrediente.id, ingrediente.nombre)}
                              disabled={isPending}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between disabled:opacity-30 border-b border-slate-50 last:border-0"
                            >
                              <span className="font-semibold text-slate-700">{ingrediente.nombre}</span>
                              <span className="text-xs text-slate-400">{ingrediente.unidad_medida}</span>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Cerrar popover */}
                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={() => setPopoverSaborId(null)}
                          className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Modal: Crear Nuevo Sabor ═══ */}
      {mostrarModalCrear && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="absolute -top-6 inset-x-0 flex justify-center">
              <div className="p-4 rounded-full shadow-lg bg-orange-500 text-white">
                <ChefHat size={28} />
              </div>
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold text-slate-900">Nuevo Sabor de Pizza</h3>
              <p className="text-sm text-slate-500 mt-1">Crea un sabor y luego agrégale ingredientes.</p>
            </div>

            <form onSubmit={handleCrearSabor} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Sabor</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nuevoNombre}
                  onChange={(evento) => setNuevoNombre(evento.target.value)}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  placeholder="Ej: Hawaiana, Mexicana..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descripción (Opcional)</label>
                <textarea
                  value={nuevaDescripcion}
                  onChange={(evento) => setNuevaDescripcion(evento.target.value)}
                  rows={2}
                  className="w-full rounded-xl border-slate-200 bg-slate-50 py-3 px-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none"
                  placeholder="Ej: Jamón, piña y queso mozzarella"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalCrear(false)}
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
                  {isPending ? 'Creando...' : 'Crear Sabor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estilos de animación para el popover */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
