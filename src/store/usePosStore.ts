'use client';

import { create } from 'zustand';

export type Topping = {
  ingrediente_id: string;
  nombre: string;
};

export type Sabor = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
};

export type OrigenVenta = 'local' | 'delivery' | 'whatsapp' | 'telefono';

export type CartItem = {
  id: string; // ID local único del frontend (para iterar listas y borrar items)
  tamano_id: string;
  tamano_nombre: string;
  precio_unitario: number; 
  es_mitades: boolean;
  sabor_1?: Sabor;
  sabor_2?: Sabor;
  extras: Topping[];
  cantidad: number;
};

interface PosState {
  // Carrito
  cart: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  clearCart: () => void;

  // Configuración de la venta (persiste entre items)
  origenVenta: OrigenVenta;
  setOrigenVenta: (origen: OrigenVenta) => void;

  // Descuento Global (% sobre el total de la orden)
  descuentoGlobal: number; // 0–100
  setDescuentoGlobal: (pct: number) => void;

  // Selectores derivados
  getSubtotal: () => number;
  getDescuentoAmount: () => number;
  getTotal: () => number;
  getCartItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  isCartOpen: false,
  origenVenta: 'local',
  descuentoGlobal: 0,

  setCartOpen: (open) => set({ isCartOpen: open }),
  setOrigenVenta: (origen) => set({ origenVenta: origen }),
  setDescuentoGlobal: (pct) => set({ descuentoGlobal: Math.min(100, Math.max(0, pct)) }),

  addToCart: (item) => {
    const id =
      typeof crypto !== 'undefined'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(7);
    set((state) => ({
      cart: [...state.cart, { ...item, id }],
    }));
  },

  removeFromCart: (itemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== itemId),
    }));
  },

  updateQuantity: (itemId, cantidad) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === itemId
          ? { ...item, cantidad: Math.max(1, cantidad) }
          : item
      ),
    }));
  },

  clearCart: () => {
    set({ cart: [], descuentoGlobal: 0 });
  },

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce(
      (total, item) => total + item.precio_unitario * item.cantidad,
      0
    );
  },

  getDescuentoAmount: () => {
    const { getSubtotal, descuentoGlobal } = get();
    return getSubtotal() * (descuentoGlobal / 100);
  },

  getTotal: () => {
    const { getSubtotal, getDescuentoAmount } = get();
    return getSubtotal() - getDescuentoAmount();
  },

  // Alias de compatibilidad que algunos componentes todavía pueden usar
  getCartItemCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.cantidad, 0);
  },
}));
