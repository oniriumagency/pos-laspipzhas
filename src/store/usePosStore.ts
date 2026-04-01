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
  cart: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  clearCart: () => void;
  // Derivados / Selectores
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  isCartOpen: false,

  setCartOpen: (open) => set({ isCartOpen: open }),

  addToCart: (item) => {
    // Generación de ID compatible nativamente
    const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    
    set((state) => ({
      cart: [...state.cart, { ...item, id }]
    }));
  },

  removeFromCart: (itemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== itemId)
    }));
  },

  updateQuantity: (itemId, cantidad) => {
    set((state) => ({
      cart: state.cart.map((item) => 
        item.id === itemId 
          ? { ...item, cantidad: Math.max(1, cantidad) } // Prevenir bajar de 1
          : item
      )
    }));
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
  },

  getCartItemCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.cantidad, 0);
  }
}));
