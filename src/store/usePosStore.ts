'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

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
export type OrigenVenta = 'Propio' | 'Rappi' | 'DiDi';

// Discriminador de tipo de item en el carrito
export type TipoItemCarrito = 'pizza' | 'producto';

export type CartItem = {
  id: string;
  tipo: TipoItemCarrito;
  precio_unitario: number;
  descuento_porcentaje?: number; // Descuento individual por ítem (0-100)
  cantidad: number;

  // ── Campos exclusivos para tipo = 'pizza' ──────────────────────────────────
  tamano_id?: string;
  tamano_nombre?: string;
  es_mitades?: boolean;
  sabor_1?: Sabor;
  sabor_2?: Sabor;
  extras?: Topping[];

  // ── Campos exclusivos para tipo = 'producto' ───────────────────────────────
  producto_id?: string;
  producto_nombre?: string;
  producto_imagen?: string | null;
};

export type Cuenta = {
  id: string;
  nombre: string;
  origenVenta: OrigenVenta | null;
  cart: CartItem[];
  createdAt: string;
};

interface PosState {
  // ── Cuentas ─────────────────────────────────────────────────────────────
  cuentas: Cuenta[];
  cuentaActivaId: string | null;
  cargarCuentasAbiertas: () => Promise<void>;
  abrirCuenta: (nombre: string, origen: OrigenVenta) => Promise<void>;
  cerrarCuenta: (id: string) => Promise<void>;
  setCuentaActiva: (id: string | null) => void;
  getCuentaActiva: () => Cuenta | undefined;

  // ── Carrito (aplica a la cuenta activa) ─────────────────────────────────
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, cantidad: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // ── Configuración de la Venta (cuenta activa) ───────────────────────────
  setOrigenVenta: (origen: OrigenVenta) => Promise<void>;

  // ── PWA Install Prompt ───────────────────────────────────────────────────
  pwaInstallPrompt: BeforeInstallPromptEvent | null;
  setPwaInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;

  // ── Selectores Derivados (leídos desde la cuenta activa) ────────────────
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

// Helper para sincronizar la cuenta en Supabase
const syncCuentaToSupabase = async (cuenta: Cuenta) => {
  const supabase = createClient();
  const { error } = await supabase
    .from('cuentas_abiertas')
    .update({ 
      cart: cuenta.cart,
      origen_venta: cuenta.origenVenta,
      updated_at: new Date().toISOString()
    })
    .eq('id', cuenta.id);

  if (error) {
    console.error(`Error al sincronizar la cuenta ${cuenta.id} en Supabase:`, error.message, error.details);
  }
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cuentas: [],
      cuentaActivaId: null,
      isCartOpen: false,
      pwaInstallPrompt: null,

  cargarCuentasAbiertas: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cuentas_abiertas')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al cargar las cuentas abiertas desde Supabase:', error.message, error.details);
      return;
    }

    if (data) {
      const cuentasMapeadas: Cuenta[] = data.map((row: any) => ({
        id: row.id,
        nombre: row.nombre,
        origenVenta: row.origen_venta as OrigenVenta | null,
        cart: row.cart as CartItem[],
        createdAt: row.created_at,
      }));

      set({ cuentas: cuentasMapeadas });
    }
  },

  getCuentaActiva: () => {
    const { cuentas, cuentaActivaId } = get();
    return cuentas.find((c) => c.id === cuentaActivaId);
  },

  abrirCuenta: async (nombre, origen) => {
    const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7);
    const nuevaCuenta: Cuenta = {
      id,
      nombre,
      origenVenta: origen,
      cart: [],
      createdAt: new Date().toISOString(),
    };

    // Actualización optimista
    set((state) => ({ cuentas: [...state.cuentas, nuevaCuenta], cuentaActivaId: id }));

    // Sincronizar con servidor
    const supabase = createClient();
    const { error } = await supabase.from('cuentas_abiertas').insert({
      id: nuevaCuenta.id,
      nombre: nuevaCuenta.nombre,
      origen_venta: nuevaCuenta.origenVenta,
      cart: nuevaCuenta.cart,
      created_at: nuevaCuenta.createdAt,
    });

    if (error) {
      console.error('Error al insertar la cuenta abierta en Supabase:', error.message, error.details);
      // En un sistema estricto, revertiríamos el estado o emitiríamos un error visible al usuario.
    }
  },

  cerrarCuenta: async (id) => {
    // Actualización optimista
    set((state) => ({
      cuentas: state.cuentas.filter((c) => c.id !== id),
      cuentaActivaId: state.cuentaActivaId === id ? null : state.cuentaActivaId,
    }));

    // Sincronizar con servidor
    const supabase = createClient();
    const { error } = await supabase.from('cuentas_abiertas').delete().eq('id', id);

    if (error) {
      console.error(`Error al eliminar la cuenta abierta ${id} en Supabase:`, error.message, error.details);
    }
  },

  setCuentaActiva: (id) => set({ cuentaActivaId: id }),

  setCartOpen: (open) => set({ isCartOpen: open }),

  setOrigenVenta: async (origen) => {
    let cuentaModificada: Cuenta | undefined;

    set((state) => {
      if (!state.cuentaActivaId) return state;
      return {
        cuentas: state.cuentas.map((c) => {
          if (c.id === state.cuentaActivaId) {
            cuentaModificada = { ...c, origenVenta: origen };
            return cuentaModificada;
          }
          return c;
        }),
      };
    });

    if (cuentaModificada) {
      await syncCuentaToSupabase(cuentaModificada);
    }
  },

  setPwaInstallPrompt: (event) => set({ pwaInstallPrompt: event }),

  addToCart: async (item) => {
    let cuentaModificada: Cuenta | undefined;

    set((state) => {
      if (!state.cuentaActivaId) return state;

      return {
        cuentas: state.cuentas.map((c) => {
          if (c.id !== state.cuentaActivaId) return c;

          // 1. Intentar agrupar si es un producto simple idéntico
          if (item.tipo === 'producto') {
            const index = c.cart.findIndex(
              (i) =>
                i.tipo === 'producto' &&
                i.producto_id === item.producto_id &&
                i.descuento_porcentaje === item.descuento_porcentaje &&
                i.precio_unitario === item.precio_unitario
            );
            
            if (index !== -1) {
              const newCart = [...c.cart];
              newCart[index] = {
                ...newCart[index],
                cantidad: newCart[index].cantidad + item.cantidad,
              };
              cuentaModificada = { ...c, cart: newCart };
              return cuentaModificada;
            }
          }
          
          // 2. Intentar agrupar si es una pizza idéntica
          if (item.tipo === 'pizza') {
            const index = c.cart.findIndex((i) => {
              if (i.tipo !== 'pizza') return false;
              
              // Comparamos los atributos clave de configuración
              const mismoTamano = i.tamano_id === item.tamano_id;
              const mismaPromo = i.descuento_porcentaje === item.descuento_porcentaje;
              const mismoEsMitades = i.es_mitades === item.es_mitades;
              const mismoSabor1 = i.sabor_1?.id === item.sabor_1?.id;
              const mismoSabor2 = i.sabor_2?.id === item.sabor_2?.id;
              
              // Comparamos extras (ordenando ids para asegurar match)
              const idsExtrasI = (i.extras || []).map(e => e.ingrediente_id).sort().join(',');
              const idsExtrasItem = (item.extras || []).map(e => e.ingrediente_id).sort().join(',');
              const mismosExtras = idsExtrasI === idsExtrasItem;

              return mismoTamano && mismaPromo && mismoEsMitades && mismoSabor1 && mismoSabor2 && mismosExtras;
            });

            if (index !== -1) {
              const newCart = [...c.cart];
              newCart[index] = {
                ...newCart[index],
                cantidad: newCart[index].cantidad + item.cantidad,
              };
              cuentaModificada = { ...c, cart: newCart };
              return cuentaModificada;
            }
          }

          // Si no se agrupó, se inserta como ítem nuevo
          const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7);
          cuentaModificada = { ...c, cart: [...c.cart, { ...item, id }] };
          return cuentaModificada;
        }),
      };
    });

    if (cuentaModificada) {
      await syncCuentaToSupabase(cuentaModificada);
    }
  },

  removeFromCart: async (itemId) => {
    let cuentaModificada: Cuenta | undefined;

    set((state) => {
      if (!state.cuentaActivaId) return state;
      return {
        cuentas: state.cuentas.map((c) => {
          if (c.id === state.cuentaActivaId) {
            cuentaModificada = { ...c, cart: c.cart.filter((i) => i.id !== itemId) };
            return cuentaModificada;
          }
          return c;
        }),
      };
    });

    if (cuentaModificada) {
      await syncCuentaToSupabase(cuentaModificada);
    }
  },

  updateQuantity: async (itemId, cantidad) => {
    let cuentaModificada: Cuenta | undefined;

    set((state) => {
      if (!state.cuentaActivaId) return state;
      return {
        cuentas: state.cuentas.map((c) => {
          if (c.id === state.cuentaActivaId) {
            cuentaModificada = {
              ...c,
              cart: c.cart.map((item) =>
                item.id === itemId ? { ...item, cantidad: Math.max(1, cantidad) } : item
              ),
            };
            return cuentaModificada;
          }
          return c;
        }),
      };
    });

    if (cuentaModificada) {
      await syncCuentaToSupabase(cuentaModificada);
    }
  },

  clearCart: async () => {
    let cuentaModificada: Cuenta | undefined;

    set((state) => {
      if (!state.cuentaActivaId) return state;
      return {
        cuentas: state.cuentas.map((c) => {
          if (c.id === state.cuentaActivaId) {
            cuentaModificada = { ...c, cart: [] };
            return cuentaModificada;
          }
          return c;
        }),
      };
    });

    if (cuentaModificada) {
      await syncCuentaToSupabase(cuentaModificada);
    }
  },

  getSubtotal: () => {
    const cuenta = get().getCuentaActiva();
    if (!cuenta) return 0;
    return cuenta.cart.reduce((total, item) => {
      const baseTotal = item.precio_unitario * item.cantidad;
      return total + baseTotal;
    }, 0);
  },

  getDescuentoAmount: () => {
    const cuenta = get().getCuentaActiva();
    if (!cuenta) return 0;
    return cuenta.cart.reduce((totalDesc, item) => {
      const itemDiscount = item.descuento_porcentaje || 0;
      const baseTotal = item.precio_unitario * item.cantidad;
      return totalDesc + baseTotal * (itemDiscount / 100);
    }, 0);
  },

  getTotal: () => {
    const { getSubtotal, getDescuentoAmount } = get();
    return getSubtotal() - getDescuentoAmount();
  },

  getCartItemCount: () => {
    const cuenta = get().getCuentaActiva();
    if (!cuenta) return 0;
    return cuenta.cart.reduce((count, item) => count + item.cantidad, 0);
  },
    }),
    {
      name: 'pipzhas-pos-storage',
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos la cuentaActivaId y si el carrito está abierto en este dispositivo
      // Las cuentas en sí vienen del servidor para asegurar que todas las pestañas vean lo mismo si recargan.
      partialize: (state) => ({ 
        cuentaActivaId: state.cuentaActivaId,
        isCartOpen: state.isCartOpen
      }),
    }
  )
);
