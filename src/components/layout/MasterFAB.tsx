'use client';

import React, { useState, useCallback } from 'react';
import { ShoppingCart, Settings, Pizza } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { SettingsModal } from './SettingsModal';

/**
 * MasterFAB — Floating Action Button
 * 
 * Un único botón flotante naranja que al pulsarse expande un menú radial con:
 *  - Botón principal: muestra el conteo del carrito y abre la sidebar
 *  - Acciones secundarias: Configuración (settings), etc.
 *
 * Posición: Bottom-right en desktop, sobre el bottom tab bar en móvil.
 * Z-index: 90 para estar sobre el contenido pero bajo los modales (z-[200]).
 */
export function MasterFAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { getCartItemCount, setCartOpen, isCartOpen, origenVenta, descuentoGlobal } =
    usePosStore();

  const itemCount = getCartItemCount();

  const handleCartAction = useCallback(() => {
    setIsExpanded(false);
    setCartOpen(!isCartOpen);
  }, [isCartOpen, setCartOpen]);

  const handleSettingsAction = useCallback(() => {
    setIsExpanded(false);
    setIsSettingsOpen(true);
  }, []);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // Etiqueta del origen para el tooltip del FAB
  const origenLabel: Record<string, string> = {
    local: 'Local',
    delivery: 'Delivery',
    whatsapp: 'WhatsApp',
    telefono: 'Teléfono',
  };

  return (
    <>
      {/* ──────────────────────────────────────────────
          Backdrop difuminado (solo cuando está expandido)
          ────────────────────────────────────────────── */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[85] bg-black/10"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* ──────────────────────────────────────────────
          Contenedor FAB — fijo, esquina inferior derecha
          - En móvil: bottom-[5.5rem] para estar arriba del Bottom Tab Bar
          - En desktop (md+): bottom-6
          ────────────────────────────────────────────── */}
      <div
        className="fixed bottom-[5.5rem] right-4 md:bottom-6 md:right-6 z-[90] flex flex-col-reverse items-center gap-3"
        role="group"
        aria-label="Menú de acciones rápidas"
      >
        {/* ── Acciones secundarias (aparecen cuando se expande) ── */}

        {/* Botón de Configuración */}
        <div
          className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isExpanded
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-6 scale-75 pointer-events-none'
          }`}
          style={{ transitionDelay: isExpanded ? '0ms' : '0ms' }}
        >
          <div className="relative flex items-center justify-end gap-3">
            {/* Tooltip label */}
            <span className="bg-gray-900/90 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
              Configurar Venta
              {descuentoGlobal > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  -{descuentoGlobal}%
                </span>
              )}
            </span>
            <button
              id="fab-settings-btn"
              onClick={handleSettingsAction}
              className="w-12 h-12 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:shadow-orange-100 transition-all duration-200 active:scale-95"
              aria-label="Abrir configuración de venta"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Botón del Carrito */}
        <div
          className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isExpanded
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-75 pointer-events-none'
          }`}
          style={{ transitionDelay: isExpanded ? '60ms' : '0ms' }}
        >
          <div className="relative flex items-center justify-end gap-3">
            {/* Tooltip label */}
            <span className="bg-gray-900/90 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
              {itemCount > 0 ? `Ver Orden (${itemCount})` : 'Carrito vacío'}
            </span>
            <button
              id="fab-cart-btn"
              onClick={handleCartAction}
              className="w-12 h-12 rounded-full bg-slate-800 shadow-xl flex items-center justify-center text-white hover:bg-slate-900 hover:shadow-slate-300 transition-all duration-200 active:scale-95 relative"
              aria-label="Abrir carrito"
            >
              <ShoppingCart size={20} />
              {/* Badge con conteo */}
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Botón Principal (siempre visible) ── */}
        <button
          id="fab-main-btn"
          onClick={toggleExpand}
          className={`
            relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center
            transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/50
            ${isExpanded
              ? 'bg-gray-900 rotate-45 scale-95 shadow-gray-400/30'
              : 'bg-gradient-to-br from-orange-400 to-orange-600 hover:-translate-y-1 hover:shadow-orange-400/40'}
          `}
          aria-label={isExpanded ? 'Cerrar menú' : 'Abrir menú de acciones'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            /* X cuando está expandido */
            <span className="text-white font-black text-2xl leading-none select-none">×</span>
          ) : (
            /* Pizza icon con badge del carrito */
            <>
              <Pizza size={24} className="text-white drop-shadow-sm" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-600 text-[10px] font-black rounded-full flex items-center justify-center shadow border border-orange-100">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </>
          )}
        </button>

        {/* Indicador de origen activo (debajo del FAB, solo en desktop) */}
        {!isExpanded && (
          <div className="hidden md:block absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide">
              {origenLabel[origenVenta]}
            </span>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
