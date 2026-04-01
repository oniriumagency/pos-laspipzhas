'use client';

import { usePosStore } from '@/store/usePosStore';
import { ShoppingBag } from 'lucide-react';

export function CartToggle() {
  const { getCartItemCount, setCartOpen } = usePosStore();
  const itemCount = getCartItemCount();

  return (
    <button 
      onClick={() => setCartOpen(true)}
      className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors hidden lg:block"
    >
      <ShoppingBag size={24} />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
          {itemCount}
        </span>
      )}
    </button>
  );
}
