import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pipzhas POS',
  description: 'Sistema P.O.S. y Orquestador de Inventarios',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {/* Proveedor global de Notificaciones Sonner */}
        <Toaster richColors position="top-right" closeButton theme="light" />
        
        {children}
      </body>
    </html>
  );
}
