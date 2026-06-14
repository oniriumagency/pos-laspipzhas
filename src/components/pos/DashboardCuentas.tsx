'use client';

import { useState } from 'react';
import { usePosStore, OrigenVenta } from '@/store/usePosStore';
import { PlusCircle, Utensils, X, Check, Save, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardCuentas() {
  const { cuentas, abrirCuenta, setCuentaActiva, cerrarCuenta } = usePosStore();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [origen, setOrigen] = useState<OrigenVenta | ''>('');
  const [expandedCuentaId, setExpandedCuentaId] = useState<string | null>(null);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedCuentaId(prev => prev === id ? null : id);
  };

  const handleBorrarCuenta = (e: React.MouseEvent, id: string, nombre: string) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar la cuenta "${nombre}"?\nEsta acción no se puede deshacer.`)) {
      cerrarCuenta(id);
      toast.success(`Cuenta "${nombre}" eliminada.`);
    }
  };

  const handleAbrirCuenta = () => {
    if (!nombreCuenta.trim()) {
      toast.error('El nombre de la cuenta es obligatorio.');
      return;
    }
    if (!origen) {
      toast.error('Selecciona el origen de la venta.');
      return;
    }

    abrirCuenta(nombreCuenta.trim(), origen);
    setModalAbierto(false);
    setNombreCuenta('');
    setOrigen('');
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard de Cuentas</h1>
          <p className="text-sm text-slate-500 mt-1">Administra las mesas y pedidos abiertos.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/20"
        >
          <PlusCircle size={20} />
          Nueva Cuenta
        </button>
      </div>

      {cuentas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <Utensils size={48} className="text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">No hay cuentas abiertas</h2>
          <p className="text-slate-500 mt-2 text-center max-w-md">
            Haz clic en "Nueva Cuenta" para comenzar a tomar el pedido de una mesa o para llevar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {cuentas.map((cuenta) => {
            const totalItems = cuenta.cart.reduce((acc, item) => acc + item.cantidad, 0);
            const subtotal = cuenta.cart.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
            const totalDesc = cuenta.cart.reduce((totDesc, item) => {
              const base = item.precio_unitario * item.cantidad;
              return totDesc + (base * ((item.descuento_porcentaje || 0) / 100));
            }, 0);
            const total = subtotal - totalDesc;

            return (
              <div
                key={cuenta.id}
                onClick={() => setCuentaActiva(cuenta.id)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Utensils size={100} />
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <h3 className="text-xl font-black text-slate-800 line-clamp-1 pr-2">{cuenta.nombre}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {cuenta.origenVenta}
                    </span>
                    <button
                      onClick={(e) => handleBorrarCuenta(e, cuenta.id, cuenta.nombre)}
                      className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors bg-white shadow-sm border border-slate-100 ml-1"
                      title="Eliminar cuenta"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={(e) => toggleExpand(e, cuenta.id)}
                      className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors ml-1 bg-slate-50 border border-slate-100 shadow-sm"
                      title={expandedCuentaId === cuenta.id ? "Colapsar detalle" : "Ver ítems de la cuenta"}
                    >
                      {expandedCuentaId === cuenta.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto space-y-3 relative z-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Items:</span>
                    <span className="font-semibold text-slate-700">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tiempo:</span>
                    <span className="font-semibold text-slate-700">
                      {Math.floor((new Date().getTime() - new Date(cuenta.createdAt).getTime()) / 60000)} min
                    </span>
                  </div>

                  {/* Vista expandida de items */}
                  {expandedCuentaId === cuenta.id && cuenta.cart.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detalle de la Orden</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {cuenta.cart.map(item => (
                          <div key={item.id} className="flex justify-between text-sm items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="font-medium text-slate-700 truncate mr-2">
                              <span className="font-bold text-orange-600 mr-1">{item.cantidad}x</span> 
                              {item.tipo === 'pizza' ? item.tamano_nombre || 'Pizza' : item.producto_nombre}
                            </span>
                            <span className="font-bold text-slate-900 shrink-0">
                              ${((item.precio_unitario * item.cantidad) * (1 - (item.descuento_porcentaje || 0) / 100)).toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Total:</span>
                    <span className="text-xl font-black text-orange-600">${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Nueva Cuenta ── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Nueva Cuenta</h3>
                <p className="text-sm text-slate-500 mt-1">Identifica el pedido o la mesa.</p>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nombre de la Cuenta (Ej: Mesa 1, Juan)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={nombreCuenta}
                  onChange={(e) => setNombreCuenta(e.target.value)}
                  placeholder="Escribe el identificador..."
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 bg-slate-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Origen de Venta
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Propio', 'Rappi', 'DiDi'] as OrigenVenta[]).map((opcion) => (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => setOrigen(opcion)}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        origen === opcion
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        origen === opcion ? 'border-orange-500 bg-orange-500' : 'border-slate-300'
                      }`}>
                        {origen === opcion && <Check size={10} className="text-white" />}
                      </div>
                      {opcion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleAbrirCuenta}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-xl transition-all shadow-lg shadow-orange-500/25"
                >
                  <Save size={20} />
                  Abrir Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
