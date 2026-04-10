'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Download, CheckCircle, Smartphone } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { pwaInstallPrompt, setPwaInstallPrompt } = usePosStore();
  const [installSuccess, setInstallSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Cierra con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleInstall = async () => {
    if (!pwaInstallPrompt) return;
    try {
      await pwaInstallPrompt.prompt();
      const { outcome } = await pwaInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setPwaInstallPrompt(null);
        setTimeout(onClose, 1800);
      }
    } catch (err) {
      console.warn('[PWA] Error al mostrar prompt de instalación:', err);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label="Configuración"
    >
      {/* Panel */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">

        {/* Handle móvil */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Configuración</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pipzhas POS</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">

          {/* ── PWA Install Section ── */}
          <section>
            <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-3">
              Instalación
            </p>

            {installSuccess ? (
              /* Estado de éxito */
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                <CheckCircle className="text-green-600 flex-shrink-0" size={22} />
                <div>
                  <p className="font-bold text-green-800 text-sm">¡Instalación exitosa!</p>
                  <p className="text-xs text-green-600 mt-0.5">La app se añadirá a tu pantalla de inicio.</p>
                </div>
              </div>
            ) : pwaInstallPrompt ? (
              /* Botón de instalación disponible */
              <button
                onClick={handleInstall}
                id="pwa-install-btn"
                className="
                  w-full flex items-center justify-between gap-4
                  bg-gradient-to-r from-orange-500 to-orange-600
                  hover:from-orange-600 hover:to-orange-700
                  text-white font-bold py-4 px-5 rounded-2xl
                  shadow-lg shadow-orange-400/30
                  hover:shadow-orange-500/40
                  hover:-translate-y-0.5
                  transition-all duration-200
                  active:scale-[0.98]
                "
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Download size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-base leading-tight">Instalar POS Pipzhas</p>
                    <p className="text-orange-100 text-xs font-normal mt-0.5">
                      Acceso rápido desde tu pantalla de inicio
                    </p>
                  </div>
                </div>
                <Smartphone size={20} className="opacity-70 flex-shrink-0" />
              </button>
            ) : (
              /* App ya instalada o prompt no disponible */
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <CheckCircle className="text-gray-400 flex-shrink-0" size={20} />
                <p className="text-sm text-gray-500 font-medium">
                  La app ya está instalada o tu navegador no soporta la instalación directa.
                </p>
              </div>
            )}
          </section>

          {/* ── Información de versión ── */}
          <section className="pt-2 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Pipzhas POS</span>
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded-full">v1.1.0</span>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-[1.25rem] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
