'use client';

import { useEffect, useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { ChevronLeft } from 'lucide-react';

export function MobileCartHandle() {
  const { setCartOpen } = usePosStore();

  useEffect(() => {
    let startX = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      // Capturar si el toque empieza en los últimos 40px de la pantalla derecha
      if (e.touches[0].clientX > window.innerWidth - 40) {
        startX = e.touches[0].clientX;
      } else {
        startX = 0;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX) return;
      const endX = e.changedTouches[0].clientX;
      // Si se deslizó al menos 50px a la izquierda
      if (startX - endX > 50) {
        setCartOpen(true);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [setCartOpen]);

  return (
    <div 
      // Z-Index: 40 para no interferir con el MasterFAB (z-50) o modales (z-60).
      className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 z-[40] bg-white text-orange-500 p-1.5 rounded-l-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] border border-r-0 border-slate-200 opacity-90 cursor-pointer hover:bg-orange-50 transition-colors"
      onClick={() => setCartOpen(true)}
    >
      <ChevronLeft size={18} strokeWidth={3} />
    </div>
  );
}
