'use client';

import { useEffect } from 'react';
import { usePosStore, BeforeInstallPromptEvent } from '@/store/usePosStore';

/**
 * PwaInstaller — Componente invisible que captura el evento beforeinstallprompt
 * del navegador y lo almacena en el Zustand store para que el SettingsModal
 * pueda consumirlo y mostrar el botón de instalación al usuario.
 *
 * IMPORTANTE: Este componente NO renderiza nada en el DOM.
 * Debe montarse en el root layout para estar disponible desde el primer render.
 */
export function PwaInstaller() {
  const { setPwaInstallPrompt } = usePosStore();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevenir el mini-banner automático del navegador (Chrome/Edge)
      e.preventDefault();
      // Guardar el evento para usarlo cuando el usuario pulse "Instalar"
      setPwaInstallPrompt(e as BeforeInstallPromptEvent);
      console.log('[PWA] beforeinstallprompt capturado y guardado en store.');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Limpiar si la app ya fue instalada en esta sesión
    window.addEventListener('appinstalled', () => {
      setPwaInstallPrompt(null);
      console.log('[PWA] App instalada correctamente.');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [setPwaInstallPrompt]);

  // Este componente no renderiza nada visible
  return null;
}
