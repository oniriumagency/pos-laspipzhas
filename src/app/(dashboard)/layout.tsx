import React from 'react';
import NavigationShell from '../../components/layout/NavigationShell';
import { MasterFAB } from '../../components/layout/MasterFAB';

/**
 * El Group Layout del Dashboard envuelve a todas las rutas protegidas (/pos, /inventario, /alertas).
 * Delega la provisión de la navegación al NavigationShell sin tener que inyectarla en cada página.
 * Monta el MasterFAB (Floating Action Button) global disponible en toda la app.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f7fa] font-sans antialiased text-gray-900 selection:bg-orange-200">
      
      {/* 
        El App Shell (Navegación Táctica Responsiva). 
        Se renderiza por todo lo alto en Desktop o como barra inferior en móviles.
      */}
      <NavigationShell />

      {/* 
        ========================================================================
        HACK RESPONSIVO CRÍTICO:
        ========================================================================
        El "main" envuelve a {children}.
        - En Móvil (default): Dejamos el espacio vertical (`pb-20`) en la parte inferior 
          para que las grillas/tablas de la caja nunca queden escondidas detrás del Bottom Tab Bar (fixed).
        - En Desktop (`md:`): La barra inferior desaparece, así que matamos el `pb-0`. Sin embargo, 
          insertamos un "Padding Izquierdo" (`md:pl-64` = 256px) para acorralar físicamente 
          las páginas a la derecha de forma que no se choquen ni queden debajo del Sidebar.
      */}
      <main className="pb-24 md:pb-0 md:pl-64 transition-all duration-300 ease-in-out relative overflow-hidden h-full">
        {children}
      </main>

      {/* 
        Master FAB — flotante sobre todo el dashboard.
        Es un Client Component montado en el Server Component del layout.
      */}
      <MasterFAB />
      
    </div>
  );
}
