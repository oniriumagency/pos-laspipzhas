'use client';

import React, { useState, useTransition } from 'react';
import { deleteVenta, editarOrigenVenta, agregarItemsAVenta } from '@/server/actions/ventas';
import { toast } from 'sonner';
import {
  Trash2, ChevronDown, ChevronUp, Clock, DollarSign, Pizza,
  Package2, Pencil, X, Plus, Minus, Store, Bike, UtensilsCrossed,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Venta {
  id: string;
  created_at: string;
  total_precio: number;
  origen_venta: string;
  cart_payload: any[];
  deducciones: { ing_id: string; cantidad_descontar: number }[];
}

interface IngredienteMap {
  [id: string]: { nombre: string; unidad_medida: string };
}

interface TamanoPizza {
  id: string;
  nombre: string;
  precio: number;
}

interface SaborPizza {
  id: string;
  nombre: string;
}

interface VentasListProps {
  ventas: Venta[];
  ingredientes: IngredienteMap;
  tamanos: TamanoPizza[];
  sabores: SaborPizza[];
}

// ─── Orígenes de venta con colores diferenciados ─────────────────────────────
const ORIGENES_EDICION = [
  { valor: 'Propio', etiqueta: 'Propio', icono: Store, claseActiva: 'bg-slate-800 text-white border-slate-900' },
  { valor: 'Rappi', etiqueta: 'Rappi', icono: Bike, claseActiva: 'bg-pink-500 text-white border-pink-500' },
  { valor: 'DiDi', etiqueta: 'DiDi', icono: UtensilsCrossed, claseActiva: 'bg-orange-500 text-white border-orange-500' },
];

// ─── Componente Principal ────────────────────────────────────────────────────

export default function VentasList({ ventas, ingredientes, tamanos, sabores }: VentasListProps) {
  const [idExpandido, setIdExpandido] = useState<string | null>(null);
  const [idEliminando, setIdEliminando] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ─── Estado de edición ────────────────────────────────────────────────────
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [origenEditado, setOrigenEditado] = useState<string>('');

  // ─── Estado del modal "Agregar Items" ─────────────────────────────────────
  const [modalAgregarVentaId, setModalAgregarVentaId] = useState<string | null>(null);
  const [tamanoSeleccionado, setTamanoSeleccionado] = useState<TamanoPizza | null>(null);
  const [saborSeleccionado, setSaborSeleccionado] = useState<SaborPizza | null>(null);
  const [cantidadNueva, setCantidadNueva] = useState(1);

  // ─── Filtro multi-origen ──────────────────────────────────────────────────
  const [filtrosOrigen, setFiltrosOrigen] = useState<string[]>(['Propio', 'Rappi', 'DiDi']);

  const alternarFiltro = (origen: string) => {
    setFiltrosOrigen(previo =>
      previo.includes(origen)
        ? previo.filter(origenActual => origenActual !== origen)
        : [...previo, origen]
    );
  };

  const alternarExpansion = (id: string) => {
    setIdExpandido(idExpandido === id ? null : id);
  };

  // ─── Construir resumen inteligente del cart_payload ────────────────────────
  const construirResumen = (cartPayload: any[]) => {
    let totalPizzas = 0;
    const detalles: string[] = [];
    cartPayload.forEach(item => {
      const cantidad = item.cantidad || 1;
      totalPizzas += cantidad;
      const sabor1 = item.sabor_1_nombre;
      const sabor2 = item.sabor_2_nombre;
      let etiquetaSabor = sabor1 || 'Pizza';
      if (sabor1 && sabor2) {
        // Reducimos el nombre a la primera palabra para mantenerlo compacto
        etiquetaSabor = `${sabor1.split(' ')[0]}/${sabor2.split(' ')[0]}`;
      } else if (sabor1) {
        etiquetaSabor = sabor1.split(' ')[0];
      }
      detalles.push(`${cantidad} ${etiquetaSabor}`);
    });
    return `${totalPizzas} Pizza${totalPizzas !== 1 ? 's' : ''} (${detalles.join(', ')})`;
  };

  // ─── Badge visual de origen con colores de marca ──────────────────────────
  const obtenerBadge = (origen: string) => {
    switch (origen) {
      case 'Rappi':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500 text-white uppercase tracking-widest border border-pink-500">Rappi</span>;
      case 'DiDi':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-widest border border-orange-200">DiDi</span>;
      case 'Propio':
      default:
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-widest border border-slate-200">Propio</span>;
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleEliminar = (id: string) => {
    if (!window.confirm('⚠️ ¿Seguro que deseas ANULAR esta venta?\n\nEsta acción eliminará el registro y devolverá todos los ingredientes al inventario.')) {
      return;
    }

    setIdEliminando(id);
    startTransition(async () => {
      const toastId = toast.loading('Reversando venta y restaurando inventario...');
      const resultado = await deleteVenta(id);

      if (resultado.success) {
        toast.success('La venta ha sido anulada con éxito. Inventario restaurado.', { id: toastId });
      } else {
        toast.error(resultado.error || 'Error al anular la venta', { id: toastId });
      }
      setIdEliminando(null);
    });
  };

  const iniciarEdicion = (venta: Venta) => {
    setIdEditando(venta.id);
    setOrigenEditado(venta.origen_venta);
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setOrigenEditado('');
  };

  const guardarOrigen = (ventaId: string) => {
    startTransition(async () => {
      const toastId = toast.loading('Actualizando canal de venta...');
      const resultado = await editarOrigenVenta(ventaId, origenEditado);

      if (resultado.success) {
        toast.success('Canal de venta actualizado.', { id: toastId });
        setIdEditando(null);
      } else {
        toast.error(resultado.error || 'Error al actualizar origen.', { id: toastId });
      }
    });
  };

  const abrirModalAgregar = (ventaId: string) => {
    setModalAgregarVentaId(ventaId);
    setTamanoSeleccionado(null);
    setSaborSeleccionado(null);
    setCantidadNueva(1);
  };

  const cerrarModalAgregar = () => {
    setModalAgregarVentaId(null);
    setTamanoSeleccionado(null);
    setSaborSeleccionado(null);
    setCantidadNueva(1);
  };

  const confirmarAgregarItem = () => {
    if (!tamanoSeleccionado || !saborSeleccionado || !modalAgregarVentaId) {
      toast.error('Selecciona un tamaño y un sabor.');
      return;
    }

    if (!window.confirm('⚠️ Esta acción modificará el inventario actual. ¿Deseas continuar?')) {
      return;
    }

    startTransition(async () => {
      const toastId = toast.loading('Agregando item y descontando inventario...');
      const resultado = await agregarItemsAVenta(modalAgregarVentaId, [{
        tamano_id: tamanoSeleccionado.id,
        tamano_nombre: tamanoSeleccionado.nombre,
        sabor_1_id: saborSeleccionado.id,
        sabor_1_nombre: saborSeleccionado.nombre,
        sabor_2_id: null,
        sabor_2_nombre: null,
        precio_unitario: tamanoSeleccionado.precio,
        cantidad: cantidadNueva,
        es_mitades: false,
      }]);

      if (resultado.success) {
        toast.success('Item agregado. Inventario actualizado.', { id: toastId });
        cerrarModalAgregar();
      } else {
        toast.error(resultado.error || 'Error al agregar item.', { id: toastId });
      }
    });
  };

  // ─── Empty State ───────────────────────────────────────────────────────────

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

  const ventasFiltradas = ventas.filter(venta => filtrosOrigen.length === 0 || filtrosOrigen.includes(venta.origen_venta));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── MULTIFILTRO DE ORIGEN ── */}
      <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-fit flex-wrap">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Origen:</span>
        {['Propio', 'Rappi', 'DiDi'].map(origen => {
          const estaSeleccionado = filtrosOrigen.includes(origen);
          return (
            <button
              key={origen}
              onClick={() => alternarFiltro(origen)}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-200 border ${estaSeleccionado
                ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm'
                : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 hover:text-gray-600'
                }`}
            >
              {origen}
            </button>
          );
        })}
      </div>

      {ventasFiltradas.length === 0 && (
        <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-[1.5rem]">
          <p className="text-gray-500 font-bold">No hay ventas que coincidan con los filtros.</p>
        </div>
      )}

      {/* ── LISTA DE VENTAS ── */}
      {ventasFiltradas.map((venta) => {
        const fecha = new Date(venta.created_at);
        const opcionesFormato: Intl.DateTimeFormatOptions = {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        };
        const fechaBonita = fecha.toLocaleDateString('es-ES', opcionesFormato);

        const estaExpandido = idExpandido === venta.id;
        const seEstaEliminando = idEliminando === venta.id;
        const seEstaEditando = idEditando === venta.id;

        // Resumen Inteligente
        const resumen = construirResumen(venta.cart_payload);

        return (
          <div key={venta.id} className={`bg-white border rounded-[1.5rem] shadow-sm overflow-hidden transition-all hover:shadow-md ${seEstaEliminando ? 'opacity-50 border-red-200' : 'border-gray-100'}`}>
            {/* Venta Header / Main Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 gap-4">

              <div className="flex items-center gap-4 cursor-pointer flex-1 min-w-0" onClick={() => alternarExpansion(venta.id)}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-sm">
                  <DollarSign strokeWidth={2.5} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span className="font-black text-xl text-gray-900">${venta.total_precio.toLocaleString('es-ES')}</span>
                    {obtenerBadge(venta.origen_venta)}
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-widest">Pagado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{fechaBonita}</span>
                    <span className="text-gray-300">•</span>
                    <span className="shrink-0 truncate" title={resumen}>{resumen}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Botón Editar */}
                <button
                  onClick={() => iniciarEdicion(venta)}
                  disabled={isPending}
                  className="w-10 h-10 flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
                  aria-label="Editar Venta"
                  title="Editar Venta"
                >
                  <Pencil className="w-[1.1rem] h-[1.1rem] shrink-0" />
                </button>

                <button
                  onClick={() => alternarExpansion(venta.id)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 uppercase tracking-wider"
                >
                  {estaExpandido ? 'Ocultar' : 'Detalle'}
                  {estaExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleEliminar(venta.id)}
                  disabled={isPending}
                  className="w-10 h-10 flex items-center justify-center border border-red-200 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:border-red-600 hover:text-white transition-all disabled:opacity-50 shadow-sm"
                  aria-label="Anular Venta"
                  title="Anular Venta y Restaurar Inventario"
                >
                  <Trash2 className="w-[1.1rem] h-[1.1rem] shrink-0" />
                </button>
              </div>
            </div>

            {/* ── Panel de Edición Rápida ── */}
            {seEstaEditando && (
              <div className="border-t border-blue-100 bg-blue-50/30 p-5 sm:p-6 space-y-4" style={{ animation: 'slideDown 200ms ease-out' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-blue-600 flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Editar Venta
                  </h4>
                  <button onClick={cancelarEdicion} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={16} />
                  </button>
                </div>

                {/* Cambiar Origen de Venta */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">Canal de Venta</p>
                  <div className="flex gap-2">
                    {ORIGENES_EDICION.map((origen) => {
                      const Icono = origen.icono;
                      const estaActivo = origenEditado === origen.valor;
                      return (
                        <button
                          key={origen.valor}
                          onClick={() => setOrigenEditado(origen.valor)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 shadow-sm ${estaActivo
                            ? `${origen.claseActiva} shadow-md`
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          <Icono size={14} className="flex-shrink-0" />
                          <span>{origen.etiqueta}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Acciones de edición */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => guardarOrigen(venta.id)}
                    disabled={isPending || origenEditado === venta.origen_venta}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isPending ? 'Guardando...' : 'Guardar Canal'}
                  </button>
                  <button
                    onClick={() => abrirModalAgregar(venta.id)}
                    disabled={isPending}
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-40 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Agregar Items
                  </button>
                </div>
              </div>
            )}

            {/* Venta Expanded Content */}
            {estaExpandido && (
              <div className="border-t border-gray-100 p-5 sm:p-6 bg-gray-50/50 flex flex-col xl:flex-row gap-6">

                {/* Lista de Items Comprados */}
                <div className="flex-1">
                  <h4 className="text-[0.65rem] font-black uppercase tracking-[0.15em] text-gray-500 mb-3 flex items-center gap-2">
                    <Pizza className="w-3.5 h-3.5" /> Pizzas Vendidas
                  </h4>
                  <ul className="space-y-2">
                    {venta.cart_payload.map((item: any, indice: number) => {
                      // Construir etiqueta descriptiva del payload enriquecido
                      const etiquetaTamano = item.tamano_nombre || 'Pizza';
                      const sabor1 = item.sabor_1_nombre;
                      const sabor2 = item.sabor_2_nombre;

                      let etiquetaSabor = '';
                      if (sabor1 && sabor2) {
                        etiquetaSabor = `${sabor1} / ${sabor2}`;
                      } else if (sabor1) {
                        etiquetaSabor = sabor1;
                      }

                      const precioUnitario = item.precio_unitario;

                      return (
                        <li key={indice} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-gray-800 block text-sm">
                              {item.cantidad}x {etiquetaTamano}
                            </span>
                            {etiquetaSabor && (
                              <span className="text-xs text-gray-500 font-medium mt-0.5 block truncate">🍕 {etiquetaSabor}</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            {item.descuento_porcentaje ? (
                              <>
                                <span className="line-through text-[0.65rem] text-gray-400 font-semibold mb-0.5">${(precioUnitario * item.cantidad).toLocaleString('es-ES')}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-orange-100 text-orange-600 text-[0.6rem] font-bold px-1 rounded">- {item.descuento_porcentaje}%</span>
                                  <span className="text-sm font-black text-gray-800">${((precioUnitario * (1 - item.descuento_porcentaje / 100)) * item.cantidad).toLocaleString('es-ES')}</span>
                                </div>
                              </>
                            ) : (
                              precioUnitario && (
                                <span className="text-sm font-black text-gray-800">
                                  ${(precioUnitario * item.cantidad).toLocaleString('es-ES')}
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
                    <Package2 className="w-3.5 h-3.5" /> Salida de Inventario
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
                        {venta.deducciones.map((deduccion, indice) => {
                          const ingrediente = ingredientes[deduccion.ing_id];
                          return (
                            <tr key={indice} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2.5 font-semibold text-gray-800 text-sm">{ingrediente ? ingrediente.nombre : <span className="text-gray-400 italic">Insumo Eliminado</span>}</td>
                              <td className="px-4 py-2.5 text-right font-black text-orange-600 text-sm">
                                -{deduccion.cantidad_descontar} <span className="text-[0.65rem] font-bold text-gray-400">{ingrediente?.unidad_medida || 'u'}</span>
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

      {/* ═══ MODAL: Agregar Items a Venta ═══ */}
      {modalAgregarVentaId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]" style={{ animation: 'fadeIn 150ms ease-out' }}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">

            {/* Header del modal */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Agregar Pizza a la Orden</h3>
                <p className="text-sm text-slate-500 mt-1">Selecciona tamaño, sabor y cantidad. Se descontará del inventario actual.</p>
              </div>
              <button onClick={cerrarModalAgregar} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Selector de Tamaño */}
            <div className="mb-5">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Tamaño</p>
              <div className="grid grid-cols-2 gap-2">
                {tamanos.map((tamano) => (
                  <button
                    key={tamano.id}
                    onClick={() => setTamanoSeleccionado(tamano)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${tamanoSeleccionado?.id === tamano.id
                      ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    <span className="block">{tamano.nombre}</span>
                    <span className="text-xs font-semibold text-gray-400">${tamano.precio.toLocaleString('es-ES')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Sabor */}
            <div className="mb-5">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Sabor</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {sabores.map((sabor) => (
                  <button
                    key={sabor.id}
                    onClick={() => setSaborSeleccionado(sabor)}
                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-left ${saborSeleccionado?.id === sabor.id
                      ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {sabor.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div className="mb-6">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Cantidad</p>
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2 border border-slate-200 w-fit">
                <button
                  onClick={() => setCantidadNueva(Math.max(1, cantidadNueva - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="font-black text-lg w-8 text-center text-slate-800">{cantidadNueva}</span>
                <button
                  onClick={() => setCantidadNueva(cantidadNueva + 1)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Resumen y precio */}
            {tamanoSeleccionado && saborSeleccionado && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{cantidadNueva}x {tamanoSeleccionado.nombre}</span>
                    <span className="text-xs text-slate-500 block">🍕 {saborSeleccionado.nombre}</span>
                  </div>
                  <span className="font-black text-lg text-slate-900">
                    ${(tamanoSeleccionado.precio * cantidadNueva).toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={cerrarModalAgregar}
                disabled={isPending}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAgregarItem}
                disabled={isPending || !tamanoSeleccionado || !saborSeleccionado}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                {isPending ? '⏳ Procesando...' : 'Confirmar y Descontar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animaciones CSS */}
      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 500px; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
