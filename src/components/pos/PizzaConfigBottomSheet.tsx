'use client';

import { useState, useEffect } from 'react';
import { usePosStore, Topping, Sabor } from '@/store/usePosStore';
import { X, CheckCircle2, Circle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  tamano: any;
  disponiblesToppings: Topping[];
  sabores: Sabor[];
}

export function PizzaConfigBottomSheet({ isOpen, onClose, tamano, disponiblesToppings, sabores }: SheetProps) {
  const addToCart = usePosStore((state) => state.addToCart);

  const [esMitades, setEsMitades] = useState(false);
  const [saborCompleta, setSaborCompleta] = useState<Sabor | null>(null);
  const [saborMitad1, setSaborMitad1] = useState<Sabor | null>(null);
  const [saborMitad2, setSaborMitad2] = useState<Sabor | null>(null);
  const [extras, setExtras] = useState<Topping[]>([]);
  const [activeTab, setActiveTab] = useState<'m1' | 'm2' | 'extras'>('m1');

  // Determinar precio base según tamaño
  const getBasePrice = (nombre: string) => {
    const nm = nombre.toLowerCase();
    if (nm.includes('personal')) return 20000;
    if (nm.includes('mediana')) return 35000;
    if (nm.includes('grande')) return 50000;
    return 35000; // default fallback
  };

  const basePrice = tamano ? getBasePrice(tamano.nombre) : 0;
  const extrasPrice = extras.length * 3000;
  const currentTotal = basePrice + extrasPrice;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setEsMitades(false);
      setSaborCompleta(null);
      setSaborMitad1(null);
      setSaborMitad2(null);
      setExtras([]);
      setActiveTab('m1');
    }
  }, [isOpen]);

  if (!isOpen || !tamano) return null;

  const toggleToppingExtra = (topping: Topping) => {
    const isSelected = extras.some(t => t.ingrediente_id === topping.ingrediente_id);
    if (isSelected) {
      setExtras(extras.filter(t => t.ingrediente_id !== topping.ingrediente_id));
    } else {
      setExtras([...extras, topping]);
    }
  };

  const handleAddToCart = () => {
    if (esMitades) {
      if (!saborMitad1 || !saborMitad2) {
        toast.error('Selecciona el sabor para ambas mitades.');
        return;
      }
    } else {
      if (!saborCompleta) {
        toast.error('Selecciona un sabor para la pizza.');
        return;
      }
    }

    addToCart({
      tamano_id: tamano.id,
      tamano_nombre: tamano.nombre,
      precio_unitario: currentTotal,
      es_mitades: esMitades,
      sabor_1: esMitades ? saborMitad1! : saborCompleta!,
      sabor_2: esMitades ? saborMitad2! : undefined,
      extras: extras,
      cantidad: 1,
    });
    
    toast.success(`Pizza ${tamano.nombre} agregada al carrito`);
    onClose();
  };

  const visibleSabores = sabores; // Se reciben ordenados de la DB

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet - Mobile First, side panel on lg */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:right-[350px] lg:top-0 h-[85vh] lg:h-full bg-white z-[70] rounded-t-[2rem] lg:rounded-none lg:w-[500px] shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col bg-slate-50/50 rounded-t-[2rem] lg:rounded-none">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Pizza {tamano.nombre}</h2>
              <p className="text-sm text-slate-500 font-medium">Bases desde ${basePrice.toLocaleString()}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Toggle Mitades */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl">
            <button 
              onClick={() => {
                 setEsMitades(false);
                 setActiveTab('m1'); 
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${!esMitades ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Completa (1 Sabor)
            </button>
            <button 
              onClick={() => {
                 setEsMitades(true);
                 if (activeTab === 'm1' && !esMitades) setActiveTab('m1');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${esMitades ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Por Mitades (2 Sabores)
            </button>
          </div>
        </div>

        {/* Tabs (Solo visibles si esMitades o si estamos en extras) */}
        <div className="flex p-4 gap-2 bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
           {esMitades ? (
             <>
               <button 
                onClick={() => setActiveTab('m1')}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'm1' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
               >
                 Mitad 1 {(saborMitad1 && activeTab !== 'm1') && <CheckCircle2 size={16} className="inline ml-1 opacity-80" />}
               </button>
               <button 
                onClick={() => setActiveTab('m2')}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'm2' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
               >
                 Mitad 2 {(saborMitad2 && activeTab !== 'm2') && <CheckCircle2 size={16} className="inline ml-1 opacity-80" />}
               </button>
             </>
           ) : (
             <button 
                onClick={() => setActiveTab('m1')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'm1' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               Elegir Sabor
             </button>
           )}
           
          <button 
            onClick={() => setActiveTab('extras')}
            className={`flex-none w-1/3 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'extras' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Extras
            {extras.length > 0 && <span className="ml-2 bg-slate-900/10 px-2 py-0.5 rounded-full text-xs">{extras.length}</span>}
          </button>
        </div>

        {/* Selector Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          
          {activeTab !== 'extras' && (
             <div className="flex flex-col gap-3">
               {visibleSabores.map((sabor) => {
                 let isSelected = false;
                 if (!esMitades) isSelected = saborCompleta?.id === sabor.id;
                 if (esMitades && activeTab === 'm1') isSelected = saborMitad1?.id === sabor.id;
                 if (esMitades && activeTab === 'm2') isSelected = saborMitad2?.id === sabor.id;

                 return (
                    <div 
                      key={sabor.id}
                      onClick={() => {
                        if (!esMitades) setSaborCompleta(sabor);
                        else if (activeTab === 'm1') { setSaborMitad1(sabor); setActiveTab('m2'); }
                        else if (activeTab === 'm2') { setSaborMitad2(sabor); }
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between group bg-white hover:border-orange-200 ${isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-transparent'}`}
                      style={{ boxShadow: isSelected ? '0 4px 14px 0 rgba(249,115,22,0.1)' : '0 2px 10px 0 rgba(0,0,0,0.02)' }}
                    >
                      <div>
                         <span className={`font-black text-[1.1rem] ${isSelected ? 'text-orange-700' : 'text-slate-800'}`}>{sabor.nombre}</span>
                         <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-[90%]">{sabor.descripcion}</p>
                      </div>
                      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${isSelected ? 'text-orange-500' : 'text-slate-200 group-hover:text-slate-300'}`}>
                        {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </div>
                    </div>
                 );
               })}
             </div>
          )}

          {activeTab === 'extras' && (
             <div>
                <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <Info size={16} /> Añadir un extra suma $3,000 al total.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {disponiblesToppings.map((t) => {
                    const isSelected = extras.some(item => item.ingrediente_id === t.ingrediente_id);
                    return (
                      <div 
                        key={t.ingrediente_id}
                        onClick={() => toggleToppingExtra(t)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-start gap-2 bg-white hover:border-slate-300 ${isSelected ? 'border-slate-800 bg-slate-50' : 'border-slate-100'}`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${isSelected ? 'text-slate-800' : 'text-slate-200'}`}>
                          {isSelected ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </div>
                        <span className={`font-semibold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{t.nombre}</span>
                      </div>
                    );
                  })}
                </div>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-white border-t border-slate-100 pb-8 lg:pb-5">
          <button 
            onClick={handleAddToCart}
            className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/10 hover:-translate-y-0.5 transition-all flex justify-between items-center px-6 focus:outline-none"
          >
            <span>Agregar a la Orden</span>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm tracking-wide">${currentTotal.toLocaleString()}</span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

