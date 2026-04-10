'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePosStore } from '@/store/usePosStore';
import { ShoppingCart } from 'lucide-react';

/**
 * MobileCartHandle — Indicador visual y gestor de swipe para el carrito.
 *
 * RESTRICCIÓN DE RUTA: Solo se monta y renderiza en /pos.
 * - Swipe derecha→izquierda: abre el CartSidebar.
 * - Swipe izquierda→derecha (con sidebar abierto): cierra el CartSidebar.
 * - Z-Index: 40 para no interferir con MasterFAB (z-[9999]) ni modales (z-60).
 */
export function MobileCartHandle() {
  const { isCartOpen, setCartOpen, getCartItemCount } = usePosStore();
  const pathname = usePathname();

  // Solo habilitar en la ruta del POS
  const estaEnPos = pathname === '/pos';

  useEffect(() => {
    if (!estaEnPos) return;

    let inicioX = 0;
    let inicioY = 0;

    const handleTouchStart = (evento: TouchEvent) => {
      inicioX = evento.touches[0].clientX;
      inicioY = evento.touches[0].clientY;
    };

    const handleTouchEnd = (evento: TouchEvent) => {
      if (!inicioX) return;

      const finX = evento.changedTouches[0].clientX;
      const finY = evento.changedTouches[0].clientY;
      const diferenciaX = inicioX - finX;
      const diferenciaY = Math.abs(inicioY - finY);

      // Ignorar gestos verticales (scroll) — solo reconocer swipes horizontales claros
      if (diferenciaY > Math.abs(diferenciaX)) return;

      const umbralMinimo = 60; // px mínimos de desplazamiento para activar el gesto

      if (diferenciaX > umbralMinimo && inicioX > window.innerWidth - 60) {
        // Swipe izquierda desde borde derecho → abrir carrito
        setCartOpen(true);
      } else if (diferenciaX < -umbralMinimo && isCartOpen) {
        // Swipe derecha con carrito abierto → cerrar carrito
        setCartOpen(false);
      }

      inicioX = 0;
      inicioY = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [estaEnPos, isCartOpen, setCartOpen]);

  // No renderizar fuera de /pos ni en desktop
  if (!estaEnPos) return null;

  const cantidadItems = getCartItemCount();

  return (
    <div
      // Z-Index: 40 para no interferir con el MasterFAB (z-[9999]) o modales (z-60).
      className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-[40] cursor-pointer"
      onClick={() => setCartOpen(true)}
    >
      <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 text-white p-2.5 rounded-l-2xl shadow-[0_4px_24px_-2px_rgba(234,88,12,0.4)] border border-r-0 border-orange-500/30 transition-transform active:scale-95 hover:scale-105">
        <ShoppingCart size={20} strokeWidth={2.5} />

        {/* Badge de cantidad de items */}
        {cantidadItems > 0 && (
          <span className="absolute -top-2 -left-2 w-5 h-5 bg-white text-orange-600 text-[10px] font-black rounded-full flex items-center justify-center border border-orange-200 shadow-sm">
            {cantidadItems > 9 ? '9+' : cantidadItems}
          </span>
        )}
      </div>
    </div>
  );
}
