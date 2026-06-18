'use client';

import { useState } from 'react';
import { PizzaConfigBottomSheet } from './PizzaConfigBottomSheet';
import { ProductoCard } from './ProductoCard';
import { Topping, Sabor } from '@/store/usePosStore';
import { Pizza, ChevronRight, Beer, Grape, Droplets, Flame } from 'lucide-react';
import { CategoriaProducto } from '@/server/actions/productos';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TamanoData {
  id: string;
  nombre: string;
  [key: string]: unknown;
}

interface ProductoData {
  id: string;
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
}

interface MenuDisplayProps {
  tamanos: TamanoData[];
  toppings: Topping[];
  sabores: Sabor[];
  productos: ProductoData[];
}

// ─── Configuración de Tabs ────────────────────────────────────────────────────

type TabId = 'pizzas' | 'gaseosas' | 'cervezas' | 'bebidas' | 'cigarrillos';

const TABS: { id: TabId; etiqueta: string; icono: React.ElementType }[] = [
  { id: 'pizzas',      etiqueta: 'Pizzas',      icono: Pizza    },
  { id: 'gaseosas',    etiqueta: 'Gaseosas',    icono: Grape    },
  { id: 'cervezas',    etiqueta: 'Cervezas',    icono: Beer     },
  { id: 'bebidas',     etiqueta: 'Bebidas',     icono: Droplets },
  { id: 'cigarrillos', etiqueta: 'Cigarrillos', icono: Flame    },
];

// Mapa de tab a categoría de la tabla productos
const TAB_A_CATEGORIA: Partial<Record<TabId, CategoriaProducto>> = {
  pizzas:      'pizza',
  gaseosas:    'gaseosa',
  cervezas:    'cerveza',
  bebidas:     'bebida',
  cigarrillos: 'cigarrillo',
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export function MenuDisplay({ tamanos, toppings, sabores, productos }: MenuDisplayProps) {
  const [tabActivo, setTabActivo] = useState<TabId>('pizzas');
  const [tamanoSeleccionado, setTamanoSeleccionado] = useState<TamanoData | null>(null);

  // Filtrar productos según el tab activo
  const categoriaActiva = TAB_A_CATEGORIA[tabActivo];
  const productosFiltrados = categoriaActiva
    ? productos.filter((p) => p.categoria === categoriaActiva)
    : [];

  // Ocultar tabs sin contenido para mantener la UI limpia
  const tabsVisibles = TABS.filter((tab) => {
    const categoria = TAB_A_CATEGORIA[tab.id];
    const tieneProductos = productos.some((p) => p.categoria === categoria);
    if (tab.id === 'pizzas') return tamanos.length > 0 || tieneProductos;
    return tieneProductos;
  });

  return (
    <>
      {/* ── Barra de Tabs ── */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-fit flex-wrap">
        {tabsVisibles.map((tab) => {
          const Icono = tab.icono;
          const estaActivo = tabActivo === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setTabActivo(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                estaActivo
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icono size={15} className="flex-shrink-0" />
              {tab.etiqueta}
            </button>
          );
        })}
      </div>

      {/* ── Contenido: Pizzas ── */}
      {tabActivo === 'pizzas' && (
        <>
          {tamanos.length === 0 && productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Pizza size={64} className="mb-4 opacity-20" />
              <p>No hay tamaños de pizza ni porciones configuradas.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {/* Tamaños configurables */}
              {tamanos.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                    Arma tu Pizza <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Completa o Mitades</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {tamanos.map((tamano, indice) => (
                      <div
                        key={tamano.id}
                        id={`tamano-card-${tamano.id}`}
                        onClick={() => setTamanoSeleccionado(tamano)}
                        className="group cursor-pointer bg-white rounded-[2rem] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(249,115,22,0.08)] hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col relative overflow-hidden"
                        style={{ animationDelay: `${indice * 50}ms` }}
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
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{tamano.nombre}</h3>
                          <p className="text-slate-500 text-sm mt-1 font-medium">Pizza {tamano.nombre} configurable a mitades.</p>
                        </div>

                        <div className="mt-8 flex justify-between items-center relative z-10">
                          <span className="text-orange-500 font-bold text-sm">Configurar</span>
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                            <ChevronRight size={20} className="ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Porciones y extras (productos de categoría pizza) */}
              {productosFiltrados.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                    Porciones y Rápidos <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Listos para agregar</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {productosFiltrados.map((producto) => (
                      <ProductoCard key={producto.id} producto={producto} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <PizzaConfigBottomSheet
            isOpen={!!tamanoSeleccionado}
            onClose={() => setTamanoSeleccionado(null)}
            tamano={tamanoSeleccionado}
            disponiblesToppings={toppings}
            sabores={sabores}
          />
        </>
      )}

      {/* ── Contenido: Productos (Gaseosas / Cervezas / Bebidas) ── */}
      {tabActivo !== 'pizzas' && (
        <>
          {productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <p>No hay productos en esta categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {productosFiltrados.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
