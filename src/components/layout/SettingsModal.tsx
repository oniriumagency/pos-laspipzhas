'use client';

import React, { useEffect, useRef } from 'react';
import { X, MapPin, Bike, MessageCircle, Phone, Tag, Check } from 'lucide-react';
import { usePosStore, OrigenVenta } from '@/store/usePosStore';

// -------------------------------------------------------
// Datos de configuración de los orígenes de venta
// -------------------------------------------------------
const ORIGENES: {
  value: OrigenVenta;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
}[] = [
  {
    value: 'local',
    label: 'Local / Mostrador',
    icon: MapPin,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    ring: 'ring-orange-400',
  },
  {
    value: 'delivery',
    label: 'Delivery',
    icon: Bike,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    ring: 'ring-blue-400',
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    ring: 'ring-green-400',
  },
  {
    value: 'telefono',
    label: 'Teléfono',
    icon: Phone,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    ring: 'ring-purple-400',
  },
];

// Descuentos rápidos disponibles como pastillas
const DESCUENTOS_RAPIDOS = [0, 5, 10, 15, 20];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { origenVenta, setOrigenVenta, descuentoGlobal, setDescuentoGlobal } =
    usePosStore();

  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cierre con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cierre al hacer clic fuera del panel
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label="Configuración de Venta"
    >
      {/* Panel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up sm:animate-none sm:scale-100">
        {/* Handle móvil */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Configurar Venta</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ajustes que aplican a toda la orden actual
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="Cerrar modalr"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

          {/* ── Origen de Venta ── */}
          <section>
            <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest mb-3">
              Origen de Venta
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ORIGENES.map((o) => {
                const Icon = o.icon;
                const isSelected = origenVenta === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setOrigenVenta(o.value)}
                    className={`
                      flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left
                      ${isSelected
                        ? `${o.bg} border-transparent ring-2 ${o.ring} ${o.color} shadow-sm`
                        : 'bg-gray-50 border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-100'}
                    `}
                    aria-pressed={isSelected}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="font-bold text-sm leading-tight">{o.label}</span>
                    {isSelected && <Check size={14} className="ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Descuento Global ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-widest">
                Descuento Global
              </p>
              {descuentoGlobal > 0 && (
                <button
                  onClick={() => setDescuentoGlobal(0)}
                  className="text-[0.65rem] font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <X size={10} /> Quitar
                </button>
              )}
            </div>

            {/* Pastillas rápidas */}
            <div className="flex gap-2 flex-wrap mb-4">
              {DESCUENTOS_RAPIDOS.map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDescuentoGlobal(pct)}
                  className={`
                    px-3.5 py-1.5 rounded-full text-sm font-bold transition-all duration-200
                    ${descuentoGlobal === pct
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  {pct === 0 ? 'Sin desc.' : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Input personalizado */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <Tag size={16} className="text-orange-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="number"
                min="0"
                max="100"
                step="1"
                value={descuentoGlobal === 0 ? '' : descuentoGlobal}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDescuentoGlobal(isNaN(val) ? 0 : val);
                }}
                placeholder="% personalizado (ej. 7)"
                className="flex-1 bg-transparent text-gray-800 font-bold placeholder:text-gray-400 placeholder:font-normal text-sm outline-none"
              />
              <span className="text-gray-400 font-bold text-sm">%</span>
            </div>
          </section>

        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-[1.25rem] shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            Aplicar y Continuar
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) both;
        }
      `}</style>
    </div>
  );
}
