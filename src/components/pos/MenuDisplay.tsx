'use client';

import { useState } from 'react';
import { PizzaConfigBottomSheet } from './PizzaConfigBottomSheet';
import { Topping, Sabor } from '@/store/usePosStore';
import { Pizza, ChevronRight } from 'lucide-react';

interface MenuDisplayProps {
  tamanos: any[];
  toppings: Topping[];
  sabores: Sabor[];
}

export function MenuDisplay({ tamanos, toppings, sabores }: MenuDisplayProps) {
  const [selectedTamano, setSelectedTamano] = useState<any | null>(null);

  if (tamanos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Pizza size={64} className="mb-4 opacity-20" />
        <p>No hay tamaños de pizza configurados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {tamanos.map((t, index) => (
          <div 
            key={t.id} 
            onClick={() => setSelectedTamano(t)}
            className="group cursor-pointer bg-white rounded-[2rem] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.08)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col relative overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Decal Background */}
            <div className="absolute -right-8 -top-8 text-orange-50 opacity-[0.3] group-hover:opacity-[0.8] transition-opacity duration-500">
              <Pizza size={160} />
            </div>
            
            <div className="flex items-start justify-between relative z-10 w-full mb-6">
               <div className="bg-orange-50 text-orange-500 p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                 <Pizza size={32} className="stroke-[1.5]" />
               </div>
            </div>
            
            <div className="relative z-10">
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t.nombre}</h3>
               <p className="text-slate-500 text-sm mt-1 font-medium">Pizza {t.nombre} configurable a mitades.</p>
            </div>
            
            <div className="mt-8 flex justify-between items-center relative z-10">
                <span className="text-orange-500 font-bold text-sm">
                   Configurar
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                  <ChevronRight size={20} className="ml-0.5" />
                </div>
            </div>
          </div>
        ))}
      </div>

      <PizzaConfigBottomSheet 
        isOpen={!!selectedTamano}
        onClose={() => setSelectedTamano(null)}
        tamano={selectedTamano}
        disponiblesToppings={toppings}
        sabores={sabores}
      />
    </>
  );
}
