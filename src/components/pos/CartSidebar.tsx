'use client';

import { useTransition } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { Trash2, Plus, Minus, ShoppingBag, Receipt, X, Tag, MapPin, Bike, MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { processSale } from '@/server/actions/orders';

// Mapa de ícono y color por origen de venta
const ORIGEN_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  local:    { label: 'Local / Mostrador', icon: MapPin,          color: 'text-orange-500' },
  delivery: { label: 'Delivery',          icon: Bike,            color: 'text-blue-500'   },
  whatsapp: { label: 'WhatsApp',          icon: MessageCircle,   color: 'text-green-500'  },
  telefono: { label: 'Teléfono',          icon: Phone,           color: 'text-purple-500' },
};

export function CartSidebar() {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getDescuentoAmount,
    getTotal,
    getCartItemCount,
    origenVenta,
    descuentoGlobal,
  } = usePosStore();

  const [isPending, startTransition] = useTransition();

  const itemCount = getCartItemCount();
  const subtotal = getSubtotal();
  const descuentoAmount = getDescuentoAmount();
  const total = getTotal();

  const origenInfo = ORIGEN_META[origenVenta] ?? ORIGEN_META.local;
  const OrigenIcon = origenInfo.icon;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    startTransition(async () => {
      const result = await processSale(cart, origenVenta, descuentoGlobal);

      if (result.success) {
        toast.success('✅ Venta procesada. Inventario actualizado.');
        clearCart();
        setCartOpen(false);
      } else {
        toast.error(result.error || 'Ocurrió un error al procesar la venta.');
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50 transition-opacity"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-[100vw] sm:w-[400px] xl:w-[420px]
          bg-white border-l border-slate-200 shadow-2xl flex flex-col
          z-[60] transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] transform
          ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        aria-hidden={!isCartOpen}
      >
        <div className="flex-1 flex flex-col h-full overflow-hidden">

          {/* ── Header ── */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-800">Orden Actual</h2>
                <p className="text-sm text-slate-500">{itemCount} artículos</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-sm font-medium"
                >
                  Vaciar
                </button>
              )}
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Cerrar carrito"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ── Indicador de Origen + Descuento activos ── */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-b border-slate-100 gap-3">
            {/* Origen */}
            <div className={`flex items-center gap-1.5 ${origenInfo.color}`}>
              <OrigenIcon size={13} />
              <span className="text-xs font-bold">{origenInfo.label}</span>
            </div>
            {/* Descuento si aplica */}
            {descuentoGlobal > 0 && (
              <div className="flex items-center gap-1.5 text-orange-600">
                <Tag size={13} />
                <span className="text-xs font-bold">Descuento {descuentoGlobal}%</span>
              </div>
            )}
          </div>

          {/* ── Lista de Items ── */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/30 pb-4">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center opacity-60 mt-12">
                <Receipt size={64} className="mb-4 text-slate-300" />
                <p className="font-medium text-lg text-slate-500">Tu orden está vacía</p>
                <p className="text-sm mt-1">Selecciona una pizza para empezar.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md hover:border-orange-100 transition-all"
                >
                  {/* Nombre + precio unitario + botón eliminar */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-[1.05rem]">
                        Pizza {item.tamano_nombre}
                      </h4>
                      <span className="text-orange-500 font-bold text-sm">
                        ${item.precio_unitario.toLocaleString()} c/u
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      aria-label="Eliminar ítem"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Detalles del sabor */}
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100/50 space-y-1">
                    {item.es_mitades ? (
                      <>
                        <p><span className="font-semibold text-slate-700">Mitad 1:</span> {item.sabor_1?.nombre}</p>
                        <p><span className="font-semibold text-slate-700">Mitad 2:</span> {item.sabor_2?.nombre}</p>
                      </>
                    ) : (
                      <p><span className="font-semibold text-slate-700">Sabor:</span> {item.sabor_1?.nombre}</p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="text-orange-600 pt-1 border-t border-slate-200 mt-1">
                        <span className="font-semibold">Extras:</span>{' '}
                        {item.extras.map((t) => t.nombre).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Cantidad + subtotal del ítem */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                        aria-label="Reducir cantidad"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-bold w-5 text-center text-slate-700 text-sm">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <span className="font-black text-slate-800 text-lg">
                      ${(item.precio_unitario * item.cantidad).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Footer con Resumen y Checkout ── */}
          <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            
            {/* Desglose de precios */}
            {cart.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">${subtotal.toLocaleString()}</span>
                </div>
                {descuentoGlobal > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1.5 text-orange-600">
                      <Tag size={13} />
                      Descuento ({descuentoGlobal}%)
                    </span>
                    <span className="font-bold text-orange-600">
                      -${Math.round(descuentoAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Total a cobrar</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${Math.round(total).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <button
              id="carrito-procesar-btn"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-[1.25rem] shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isPending ? '⏳ Procesando...' : 'Procesar Venta'}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
