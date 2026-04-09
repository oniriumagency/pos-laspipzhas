import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pipzhas POS — Sistema de Punto de Venta',
  description: 'Sistema P.O.S. y Orquestador de Inventarios para Las Pipzhas Pizzería',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pipzhas POS',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#ea580c',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* PWA — Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        {/* PWA — Splash screen color */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        {/* Proveedor global de Notificaciones Sonner */}
        <Toaster richColors position="top-right" closeButton theme="light" />
        
        {children}

        {/* Registro del Service Worker — Solo en producción/cliente */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[PWA] Service Worker registrado. Scope:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[PWA] Error al registrar Service Worker:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
