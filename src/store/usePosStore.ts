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

// Estrictamente los 3 orígenes válidos para el negocio
export type OrigenVenta = 'propio' | 'rappi' | 'didi';

export type CartItem = {
  id: string;
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

  // ── Configuración de la Venta ─────────────────────────
  // null = sin seleccionar (bloquea el checkout)
  origenVenta: OrigenVenta | null;
  setOrigenVenta: (origen: OrigenVenta) => void;

  // Descuento Global (% sobre el total de la orden)
  descuentoGlobal: number; // 0–100
  setDescuentoGlobal: (pct: number) => void;

  // ── PWA Install Prompt ───────────────────────────────
  // El evento se guarda aquí desde el PwaInstaller y se consume en el SettingsModal
  pwaInstallPrompt: BeforeInstallPromptEvent | null;
  setPwaInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;

  // ── Selectores Derivados ─────────────────────────────
  getSubtotal: () => number;
  getDescuentoAmount: () => number;
  getTotal: () => number;
  getCartItemCount: () => number;
}

// Tipo global para el evento PWA (no está en el TS lib estándar)
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  isCartOpen: false,
  origenVenta: null,       // ← null hasta que el cajero seleccione
  descuentoGlobal: 0,
  pwaInstallPrompt: null,

  setCartOpen: (open) => set({ isCartOpen: open }),
  setOrigenVenta: (origen) => set({ origenVenta: origen }),
  setDescuentoGlobal: (pct) =>
    set({ descuentoGlobal: Math.min(100, Math.max(0, pct)) }),
  setPwaInstallPrompt: (event) => set({ pwaInstallPrompt: event }),

  addToCart: (item) => {
    const id =
      typeof crypto !== 'undefined'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(7);
    set((state) => ({ cart: [...state.cart, { ...item, id }] }));
  },

  removeFromCart: (itemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== itemId),
    }));
  },

  updateQuantity: (itemId, cantidad) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === itemId ? { ...item, cantidad: Math.max(1, cantidad) } : item
      ),
    }));
  },

  clearCart: () => {
    set({ cart: [], descuentoGlobal: 0, origenVenta: null });
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

  getCartItemCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.cantidad, 0);
  },
}));
