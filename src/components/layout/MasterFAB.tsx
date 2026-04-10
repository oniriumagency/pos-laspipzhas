'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useAnimation, PanInfo } from 'framer-motion';
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
} from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { SettingsModal } from './SettingsModal';

// ─── Rutas del menú interno del FAB ─────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Caja POS',  href: '/pos',        icon: Store          },
  { label: 'Bodega',    href: '/inventario',  icon: Package        },
  { label: 'Recetas',   href: '/raciones',    icon: UtensilsCrossed },
  { label: 'Alertas',   href: '/alertas',     icon: Bell           },
  { label: 'Historial', href: '/ventas',      icon: Receipt        },
];

// ─── Constantes de posicionamiento ──────────────────────────────────────────
const FAB_SIZE   = 56;   // px — lado del botón circular
const SNAP_MARGIN = 16;  // px — distancia mínima desde el borde de pantalla

export function MasterFAB() {
  const pathname     = usePathname();
  const [isOpen,     setIsOpen]     = useState(false);
  const [isSettings, setIsSettings] = useState(false);

  const { getCartItemCount } = usePosStore();
  const itemCount = getCartItemCount();

  // ── Framer Motion state ──────────────────────────────────────────────────
  const x       = useMotionValue(0);
  const y       = useMotionValue(0);
  const controls = useAnimation();
  const fabRef  = useRef<HTMLDivElement>(null);

  // Posición inicial: esquina inferior derecha sobre el bottom tab bar
  useEffect(() => {
    const setInitialPosition = () => {
      const vw    = window.innerWidth;
      const vh    = window.innerHeight;
      const initX = vw  - FAB_SIZE - SNAP_MARGIN;
      const initY = vh  - FAB_SIZE - SNAP_MARGIN - 80; // 80px encima del bottom tab bar
      x.set(initX);
      y.set(initY);
    };
    setInitialPosition();
    window.addEventListener('resize', setInitialPosition);
    return () => window.removeEventListener('resize', setInitialPosition);
  }, [x, y]);

  // ── Lógica de snap al borde más cercano ─────────────────────────────────
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const vw  = window.innerWidth;
      const vh  = window.innerHeight;
      const cx  = x.get() + FAB_SIZE / 2;   // centro X actual
      const cy  = y.get() + FAB_SIZE / 2;   // centro Y actual

      // Snapping horizontal: izquierdo o derecho
      const snapX =
        cx < vw / 2
          ? SNAP_MARGIN                           // borde izquierdo
          : vw - FAB_SIZE - SNAP_MARGIN;          // borde derecho

      // Mantener dentro de los límites verticales
      const clampedY = Math.min(
        Math.max(SNAP_MARGIN, cy - FAB_SIZE / 2),
        vh - FAB_SIZE - SNAP_MARGIN - 80
      );

      controls.start({
        x: snapX,
        y: clampedY,
        transition: { type: 'spring', stiffness: 400, damping: 35 },
      });
    },
    [x, y, controls]
  );

  // ── Cierre del menú al navegar ───────────────────────────────────────────
  useEffect(() => { setIsOpen(false); }, [pathname]);

  // ── Items de navegación con estado activo ────────────────────────────────
  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    isActive: pathname?.startsWith(item.href) ?? false,
  }));

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────
          SOLO VISIBLE EN MÓVIL — el sidebar de escritorio cubre la navegación
          ───────────────────────────────────────────────────────────────────── */}
      <div className="md:hidden">

        {/* Backdrop al abrir el menú */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[88] bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* ── Menú radial (aparece encima del FAB cuando isOpen) ── */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[95]"
            style={{
              left: x,
              top: y,
              transform: 'translateY(calc(-100% - 8px))',
            }}
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
          </motion.div>
        )}

        {/* ── FAB principal — Draggable ── */}
        <motion.div
          ref={fabRef}
          drag
          dragMomentum={false}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x, y, position: 'fixed', zIndex: 96, touchAction: 'none' }}
          whileDrag={{ scale: 1.1, zIndex: 100 }}
        >
          <motion.button
            id="master-fab-btn"
            onTap={() => setIsOpen((prev) => !prev)}
            whileTap={{ scale: 0.93 }}
            className={`
              w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
              transition-colors duration-200 focus:outline-none select-none
              ${isOpen
                ? 'bg-gray-900 text-white'
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
          </motion.button>
        </motion.div>

      </div>

      {/* Settings Modal — disponible para ambas resoluciones */}
      <SettingsModal
        isOpen={isSettings}
        onClose={() => setIsSettings(false)}
      />
    </>
  );
}
