'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store,
  Package,
  Bell,
  UtensilsCrossed,
  Receipt,
  Settings,
  X,
  Pizza,
  ChefHat,
} from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { SettingsModal } from './SettingsModal';

// ─── Rutas del menú interno del FAB ─────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Caja POS',  href: '/pos',        icon: Store          },
  { label: 'Recetas',   href: '/sabores',     icon: ChefHat        },
  { label: 'Gramajes',  href: '/raciones',    icon: UtensilsCrossed },
  { label: 'Bodega',    href: '/inventario',  icon: Package        },
  { label: 'Alertas',   href: '/alertas',     icon: Bell           },
  { label: 'Historial', href: '/ventas',      icon: Receipt        },
];

/**
 * MasterFAB — Botón de navegación flotante para móvil.
 *
 * ARQUITECTURA:
 * - Se renderiza vía createPortal directamente al document.body
 *   para evitar cualquier overflow:hidden de contenedores padre.
 * - Usa un patrón isMounted para evitar Hydration Mismatch (SSR vs Client).
 * - Posición fija simple: bottom-6 right-6 con z-[9999].
 * - Solo visible en móvil (md:hidden aplicado al contenedor del portal).
 */
export function MasterFAB() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettings, setIsSettings] = useState(false);

  const { getCartItemCount } = usePosStore();
  const itemCount = getCartItemCount();

  // Evitar Hydration Mismatch: solo renderizar en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cierre del menú al navegar
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // Items de navegación con estado activo
  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: pathname?.startsWith(item.href) ?? false,
  }));

  // No renderizar en SSR ni antes del montaje del cliente
  if (!isMounted) return null;

  const contenidoFab = (
    <>
      {/* ────────────────────────────────────────────────────────
          SOLO VISIBLE EN MÓVIL — el sidebar de escritorio
          cubre la navegación en pantallas grandes (md+).
          ──────────────────────────────────────────────────────── */}
      <div className="md:hidden">

        {/* Backdrop al abrir el menú */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            style={{ animation: 'fadeIn 150ms ease-out' }}
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* ── Menú radial (aparece encima del FAB cuando isOpen) ── */}
        {isOpen && (
          <div
            className="fixed bottom-24 right-6 z-[9999]"
            style={{ animation: 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div
              className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden"
              style={{ minWidth: 200 }}
            >
              {/* Navegación */}
              <nav className="p-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 font-semibold
                        ${item.isActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      `}
                    >
                      <Icon
                        size={18}
                        strokeWidth={item.isActive ? 2.5 : 2}
                        className="flex-shrink-0"
                      />
                      <span className="text-sm">{item.label}</span>
                      {item.isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Separador + Configuración */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => { setIsOpen(false); setIsSettings(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors font-semibold"
                >
                  <Settings size={18} strokeWidth={2} className="flex-shrink-0" />
                  <span className="text-sm">Configuración</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FAB principal — Posición fija simple ── */}
        <button
          id="master-fab-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`
            fixed bottom-6 right-6 z-[9999]
            w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-200 focus:outline-none select-none
            active:scale-95
            ${isOpen
              ? 'bg-gray-900 text-white rotate-0'
              : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'}
          `}
          style={{ boxShadow: '0 8px 32px rgba(234,88,12,0.35)' }}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir navegación'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X size={22} strokeWidth={2.5} />
          ) : (
            <>
              <Pizza size={24} className="drop-shadow-sm" />
              {/* Badge de carrito */}
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-600 text-[10px] font-black rounded-full flex items-center justify-center border border-orange-100 shadow-sm"
                  aria-label={`${itemCount} artículos en el carrito`}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </>
          )}
        </button>

      </div>

      {/* Settings Modal — disponible para ambas resoluciones */}
      <SettingsModal
        isOpen={isSettings}
        onClose={() => setIsSettings(false)}
      />

      {/* Animaciones CSS inyectadas */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );

  // Renderizar vía Portal directamente al body del documento
  // para evitar cualquier contenedor padre con overflow:hidden
  return createPortal(contenidoFab, document.body);
}
