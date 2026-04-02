'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Utilizamos lucide-react para la iconografía minimalista y nativa
import { Store, Package, Bell, Pizza, Receipt, UtensilsCrossed } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Caja POS', href: '/pos', icon: Store },
  { label: 'Ventas', href: '/ventas', icon: Receipt },
  { label: 'Raciones', href: '/raciones', icon: UtensilsCrossed },
  { label: 'Bodega', href: '/inventario', icon: Package },
  { label: 'Alertas', href: '/alertas', icon: Bell },
];

export default function NavigationShell() {
  const pathname = usePathname();

  return (
    <>
      {/* ========================================================
          1. MOBILE LAYOUT: BOTTOM TAB BAR (Se oculta en md en adelante)
          ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50 flex items-center justify-around pb-safe">
        {NAV_ITEMS.map((item) => {
          // Checamos activamente contra la ruta de Next.js
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors ${
                isActive ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Animación fluida de "píldora" nativa tipo iOS al enfocar */}
              <div className={`px-4 py-1 rounded-full transition-all duration-300 ease-out flex items-center justify-center ${
                isActive ? 'bg-orange-100 text-orange-600 scale-110 shadow-sm' : 'bg-transparent text-gray-400 scale-100'
              }`}>
                <Icon strokeWidth={isActive ? 2.5 : 2} className="w-[1.35rem] h-[1.35rem]" />
              </div>
              <span className={`text-[10px] mt-1.5 font-bold tracking-wide transition-all ${
                isActive ? 'text-orange-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ========================================================
          2. DESKTOP LAYOUT: SIDEBAR (w-64 fijado a la izquierda)
          ======================================================== */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-[2px_0_15px_-3px_rgba(0,0,0,0.02)] z-50 transition-all">
        
        {/* Brand / Logo Area */}
        <div className="flex items-center gap-3 px-8 py-8 mb-4 border-b border-gray-50/50">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-orange-500/20 shadow-lg">
            <Pizza className="text-white w-6 h-6 animate-pulse" />
          </div>
          <span className="font-black text-xl tracking-tighter text-gray-900">
            Pipzhas<span className="text-orange-600">POS</span>
          </span>
        </div>

        {/* Links de Navegación Vertical */}
        <nav className="flex-1 px-5 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mb-4 mt-2">Menú Principal</p>
          
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-bold ${
                  isActive 
                    ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50 ring-1 ring-orange-400/20' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon strokeWidth={isActive ? 2.5 : 2} className="w-[1.15rem] h-[1.15rem] flex-shrink-0" />
                <span className="text-[0.9rem]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar (Mockup del usuario actúal - listo para Session Auth) */}
        <div className="p-5 border-t border-gray-50 mt-auto bg-gray-50/20">
          <div className="flex items-center gap-3 px-3 py-3 hover:bg-gray-100 rounded-2xl border border-transparent hover:border-gray-200 cursor-pointer transition-colors shadow-sm bg-white">
            <div className="w-9 h-9 rounded-full relative flex-shrink-0 overflow-hidden ring-2 ring-gray-100">
               <svg className="w-full h-full text-gray-400 bg-gray-200" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
               </svg>
               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-gray-900 leading-tight tracking-wide">Gerencia</span>
              <span className="text-[10px] text-gray-500 mt-0.5 font-medium">Turno Activo</span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}
