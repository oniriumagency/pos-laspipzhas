'use client';

import { usePosStore } from '@/store/usePosStore';
import { DashboardCuentas } from './DashboardCuentas';
import { MenuDisplay } from './MenuDisplay';
import { CartToggle } from './CartToggle';
import { ArrowLeft } from 'lucide-react';
import { Topping, Sabor } from '@/store/usePosStore';

interface PosViewManagerProps {
  tamanos: any[];
  toppings: Topping[];
  sabores: Sabor[];
  productos: any[];
}

export function PosViewManager({ tamanos, toppings, sabores, productos }: PosViewManagerProps) {
  const { cuentaActivaId, getCuentaActiva, setCuentaActiva } = usePosStore();
  const cuenta = getCuentaActiva();

  if (!cuentaActivaId || !cuenta) {
    return (
      <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
        <main className="flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300">
          <DashboardCuentas />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      <main className="flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300">
        <header className="px-6 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCuentaActiva(null)}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                {cuenta.nombre}
                <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-600 rounded-full uppercase tracking-wider">
                  {cuenta.origenVenta}
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Selecciona el tamaño y configura la pizza, o agrega bebidas.</p>
            </div>
          </div>
          <CartToggle />
        </header>

        <div className="p-6">
          <MenuDisplay
            tamanos={tamanos || []}
            toppings={toppings}
            sabores={sabores}
            productos={productos || []}
          />
        </div>
      </main>
    </div>
  );
}
