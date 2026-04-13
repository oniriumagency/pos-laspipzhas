'use client';

import { useState, useTransition } from 'react';
import { usePosStore, OrigenVenta } from '@/store/usePosStore';
import {
  Trash2, Plus, Minus, ShoppingBag, Receipt, X, Tag,
  Store, Bike, UtensilsCrossed, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { processSale } from '@/server/actions/orders';

// ─── Configuración de los 3 orígenes válidos ────────────────────────────────
const ORIGENES: {
  value: OrigenVenta;
  label: string;
  icon: React.ElementType;
  activeClass: string;
}[] = [
  { value: 'Propio',  label: 'Propio',  icon: Store,           activeClass: 'bg-orange-500 text-white shadow-orange-200' },
  { value: 'Rappi',   label: 'Rappi',   icon: Bike,            activeClass: 'bg-orange-500 text-white shadow-orange-200'  },
  { value: 'DiDi',    label: 'DiDi',    icon: UtensilsCrossed, activeClass: 'bg-orange-500 text-white shadow-orange-200'  },
];



export function CartSidebar() {
  const {
    cart, isCartOpen, setCartOpen,
    removeFromCart, updateQuantity, clearCart,
    getSubtotal, getDescuentoAmount, getTotal, getCartItemCount,
    origenVenta, setOrigenVenta,
  } = usePosStore();

  const [isPending, startTransition] = useTransition();

  const itemCount       = getCartItemCount();
  const subtotal        = getSubtotal();
  const descuentoAmount = getDescuentoAmount();
  const total           = getTotal();

  // El checkout se bloquea si no hay origen seleccionado o el carrito está vacío
  const canCheckout = cart.length > 0 && origenVenta !== null && !isPending;



  const handleCheckout = () => {
    if (!canCheckout) return;

    startTransition(async () => {
      // origenVenta está garantizado no-null por canCheckout
      const result = await processSale(cart, origenVenta!);

      if (result.success) {
        toast.success('✅ Venta procesada. Inventario actualizado.');
        clearCart();
        setCartOpen(false);
      } else {
        toast.error(result.error || 'Error al procesar la venta.');
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-[100vw] sm:w-[420px]
          bg-white border-l border-slate-200 shadow-2xl
          flex flex-col z-[60]
          transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
          ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-hidden={!isCartOpen}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">

          {/* ── Header ── */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800 leading-tight">Orden Actual</h2>
                <p className="text-xs text-slate-500">{itemCount} artículos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors text-xs font-bold"
                >
                  Vaciar
                </button>
              )}
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Cerrar carrito"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Lista de Items ── */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/40">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center mt-8 opacity-60">
                <Receipt size={56} className="mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">Tu orden está vacía</p>
                <p className="text-xs mt-1">Selecciona una pizza para empezar.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2.5 hover:shadow-md hover:border-orange-100 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">Pizza {item.tamano_nombre}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-bold text-sm">
                          ${item.precio_unitario.toLocaleString()} c/u
                        </span>
                        {(item.descuento_porcentaje ?? 0) > 0 && (
                          <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            -{item.descuento_porcentaje}%
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-1.5 rounded-xl transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100/80 space-y-1">
                    {item.es_mitades ? (
                      <>
                        <p><span className="font-semibold text-slate-700">M1:</span> {item.sabor_1?.nombre}</p>
                        <p><span className="font-semibold text-slate-700">M2:</span> {item.sabor_2?.nombre}</p>
                      </>
                    ) : (
                      <p><span className="font-semibold text-slate-700">Sabor:</span> {item.sabor_1?.nombre}</p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="text-orange-600 pt-1 border-t border-slate-200">
                        <span className="font-semibold">Extras:</span>{' '}
                        {item.extras.map((t) => t.nombre).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-bold w-5 text-center text-slate-700 text-sm">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-black text-slate-800 text-base">
                      ${Math.round(item.precio_unitario * item.cantidad * (1 - (item.descuento_porcentaje || 0) / 100)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Panel de Configuración de Venta + Checkout ── */}
          <div className="flex-shrink-0 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">

            {/* ── ORIGEN DE VENTA ── */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">
                  Canal de Venta
                </p>
                {!origenVenta && cart.length > 0 && (
                  <span className="flex items-center gap-1 text-[0.6rem] text-amber-600 font-bold animate-pulse">
                    <AlertCircle size={10} /> Requerido
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {ORIGENES.map((o) => {
                  const Icon = o.icon;
                  const isSelected = origenVenta === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setOrigenVenta(o.value)}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5
                        py-2.5 px-2 rounded-xl text-sm font-bold
                        transition-all duration-200 border-2
                        shadow-sm
                        ${isSelected
                          ? `${o.activeClass} border-transparent shadow-md`
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-100'}
                      `}
                      id={`origen-${o.value}-btn`}
                      aria-pressed={isSelected}
                    >
                      <Icon size={14} className="flex-shrink-0" />
                      <span>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>



            {/* ── DESGLOSE DE PRECIOS ── */}
            {cart.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal orden</span>
                  <span className="font-semibold text-slate-700">${subtotal.toLocaleString()}</span>
                </div>
                {descuentoAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1 text-orange-600">
                      <Tag size={10} /> Descuento por items
                    </span>
                    <span className="font-bold text-orange-600">
                      -${Math.round(descuentoAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-600 text-sm">Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* ── BOTÓN DE CHECKOUT ── */}
            <div className="px-5 pb-5 pt-2">
              <button
                id="carrito-procesar-btn"
                onClick={handleCheckout}
                disabled={!canCheckout}
                className={`
                  w-full font-bold py-4 rounded-[1.25rem] transition-all duration-300
                  ${canCheckout
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                `}
              >
                {isPending
                  ? '⏳ Procesando...'
                  : !origenVenta && cart.length > 0
                    ? 'Selecciona el canal de venta'
                    : 'Procesar Venta'}
              </button>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}
