'use client';

import { useTransition } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { Trash2, Plus, Minus, ShoppingBag, Receipt, X } from 'lucide-react';
import { toast } from 'sonner';
import { processSale } from '@/server/actions/orders';

export function CartSidebar() {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount } = usePosStore();
  const [isPending, startTransition] = useTransition();

  const itemCount = getCartItemCount();
  const total = getCartTotal();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    startTransition(async () => {
       const result = await processSale(cart);
       
       if (result.success) {
         toast.success('Venta procesada con éxito. Inventario actualizado.');
         clearCart();
         setCartOpen(false);
       } else {
         toast.error(result.error || 'Ocurrió un error misterioso al procesar la venta.');
       }
    });
  };

  return (
    <>
      {/* Botón Flotante para Móviles (Bottom Navigation Pattern) */}
      <div className="lg:hidden fixed bottom-24 left-0 right-0 px-4 z-40">
        <button 
          onClick={() => setCartOpen(true)}
          className="w-full bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between hover:bg-black transition-colors ring-4 ring-white/10"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
              {itemCount}
            </div>
            <span className="font-semibold">Ver Orden Actual</span>
          </div>
          <span className="font-black text-xl">${total.toLocaleString()}</span>
        </button>
      </div>

      {/* Backdrop para Móviles y Desktop si está abierto */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50 transition-opacity lg:hidden" 
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Sidebar Panel (Slide In from Right) */}
      <aside className={`fixed top-0 right-0 h-full w-[100vw] sm:w-[400px] xl:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col z-[60] transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex-1 flex flex-col h-full pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
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
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-sm font-medium mr-2"
                >
                  Vaciar
                </button>
              )}
              <button 
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/30 pb-32">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center opacity-60">
                <Receipt size={64} className="mb-4 text-slate-300" />
                <p className="font-medium text-lg text-slate-500">Tu orden está vacía</p>
                <p className="text-sm mt-1">Selecciona una pizza para empezar a configurar.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 group hover:shadow-md hover:border-orange-100 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">Pizza {item.tamano_nombre}</h4>
                      <span className="text-orange-500 font-bold">${item.precio_unitario.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-300 hover:text-red-500 bg-slate-50 hover:bg-red-50 p-2 rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100/50 space-y-1.5">
                    {item.es_mitades ? (
                      <>
                        <p><span className="font-semibold text-slate-700">Mitad 1:</span> {item.sabor_1?.nombre}</p>
                        <p><span className="font-semibold text-slate-700">Mitad 2:</span> {item.sabor_2?.nombre}</p>
                      </>
                    ) : (
                       <p><span className="font-semibold text-slate-700">Sabor:</span> {item.sabor_1?.nombre}</p>
                    )}
                    
                    {item.extras.length > 0 && (
                      <p className="text-orange-600 pt-1 border-t border-slate-200 mt-1"><span className="font-semibold">Extras:</span> {item.extras.map(t => t.nombre).join(', ')}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                      <button 
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-4 text-center text-slate-700">{item.cantidad}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="font-black text-slate-800 text-lg">
                      ${(item.precio_unitario * item.cantidad).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 w-full">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="font-medium text-slate-500">Total a cobrar</span>
              <span className="text-3xl font-black text-slate-900">${total.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || isPending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-[1.25rem] shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {isPending ? 'Validando Inventario...' : 'Procesar Venta'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
