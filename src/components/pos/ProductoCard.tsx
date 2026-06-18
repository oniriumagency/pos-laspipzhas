'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePosStore } from '@/store/usePosStore';
import { Minus, Plus, ShoppingCart, Beer, Droplets, Grape, Pizza, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { CategoriaProducto } from '@/server/actions/productos';

interface ProductoCardProps {
  producto: {
    id: string;
    nombre: string;
    precio: number;
    categoria: CategoriaProducto;
    imagen_url?: string | null;
  };
}

// Asignar ícono y color de acento según la categoría del producto
const ESTILOS_CATEGORIA: Record<CategoriaProducto, {
  icono: React.ElementType;
  colorIcono: string;
  colorFondo: string;
  colorBorde: string;
  colorBadge: string;
  etiqueta: string;
}> = {
  pizza: {
    icono: Pizza,
    colorIcono: 'text-orange-500',
    colorFondo: 'bg-orange-50',
    colorBorde: 'border-orange-100',
    colorBadge: 'bg-orange-100 text-orange-600',
    etiqueta: 'Pizza',
  },
  gaseosa: {
    icono: Grape,
    colorIcono: 'text-purple-500',
    colorFondo: 'bg-purple-50',
    colorBorde: 'border-purple-100',
    colorBadge: 'bg-purple-100 text-purple-600',
    etiqueta: 'Gaseosa',
  },
  cerveza: {
    icono: Beer,
    colorIcono: 'text-amber-500',
    colorFondo: 'bg-amber-50',
    colorBorde: 'border-amber-100',
    colorBadge: 'bg-amber-100 text-amber-700',
    etiqueta: 'Cerveza',
  },
  bebida: {
    icono: Droplets,
    colorIcono: 'text-cyan-500',
    colorFondo: 'bg-cyan-50',
    colorBorde: 'border-cyan-100',
    colorBadge: 'bg-cyan-100 text-cyan-700',
    etiqueta: 'Bebida',
  },
  cigarrillo: {
    icono: Flame,
    colorIcono: 'text-slate-600',
    colorFondo: 'bg-slate-100',
    colorBorde: 'border-slate-200',
    colorBadge: 'bg-slate-200 text-slate-800',
    etiqueta: 'Cigarrillo',
  },
};

// Píldoras de descuento rápido (mismo patrón que PizzaConfigBottomSheet)
const DESCUENTOS_RAPIDOS = [0, 25, 50, 100];

export function ProductoCard({ producto }: ProductoCardProps) {
  const addToCart = usePosStore((state) => state.addToCart);

  const [cantidad, setCantidad] = useState(1);
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [descuentoPersonalizado, setDescuentoPersonalizado] = useState('');
  const [mostrarInputPersonalizado, setMostrarInputPersonalizado] = useState(false);

  const estilos = ESTILOS_CATEGORIA[producto.categoria];
  const Icono = estilos.icono;

  const precioConDescuento = Math.round(producto.precio * (1 - descuentoPorcentaje / 100));
  const totalLinea = precioConDescuento * cantidad;

  const handleDescuentoPildora = (porcentaje: number) => {
    setDescuentoPorcentaje(porcentaje);
    setDescuentoPersonalizado('');
    setMostrarInputPersonalizado(false);
  };

  const handleDescuentoPersonalizado = (valor: string) => {
    setDescuentoPersonalizado(valor);
    const numero = parseFloat(valor);
    if (!isNaN(numero) && numero >= 0 && numero <= 100) {
      setDescuentoPorcentaje(numero);
    } else {
      setDescuentoPorcentaje(0);
    }
  };

  const handleAgregarAlCarrito = () => {
    addToCart({
      tipo: 'producto',
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      producto_imagen: producto.imagen_url,
      precio_unitario: producto.precio,
      descuento_porcentaje: descuentoPorcentaje,
      cantidad,
      // Campos de pizza en undefined (no aplica)
      tamano_id: undefined,
      tamano_nombre: undefined,
      es_mitades: undefined,
      sabor_1: undefined,
      sabor_2: undefined,
      extras: [],
    });
    toast.success(`${cantidad}x ${producto.nombre} agregado al carrito.`);
    // Resetear estado local sin cerrar la tarjeta
    setCantidad(1);
    setDescuentoPorcentaje(0);
    setDescuentoPersonalizado('');
    setMostrarInputPersonalizado(false);
  };

  return (
    <div className={`group bg-white rounded-[2rem] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 border ${estilos.colorBorde} flex flex-col gap-4 relative overflow-hidden`}>

      {/* Imagen del producto o Ícono de fondo */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-[2rem]">
        {producto.imagen_url ? (
          <div className="absolute -right-2 top-[20px] w-[55%] h-[140%] opacity-30 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110 group-hover:-translate-y-2 origin-top-right">
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              className="object-contain object-right-top drop-shadow-2xl"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            {/* Gradiente sutil para que el texto siga siendo legible */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent w-[150%] -left-1/2" />
          </div>
        ) : (
          <div className={`absolute -right-6 -top-6 ${estilos.colorIcono} opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500`}>
            <Icono size={120} />
          </div>
        )}
      </div>

      {/* Cabecera: ícono + badge de categoría */}
      <div className="flex items-start justify-between relative z-10">
        <div className={`${estilos.colorFondo} ${estilos.colorIcono} p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm bg-white/80 backdrop-blur-sm`}>
          <Icono size={26} className="stroke-[1.5]" />
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${estilos.colorBadge} bg-white/80 backdrop-blur-sm shadow-sm`}>
          {estilos.etiqueta}
        </span>
      </div>

      {/* Espaciador para cuando la imagen esté de fondo y la tarjeta necesite algo de altura extra */}
      <div className="h-12" />

      {/* Nombre y precio base */}
      <div className="relative z-10 mt-2">
        <h3 className="font-black text-slate-800 text-base leading-tight tracking-tight">
          {producto.nombre}
        </h3>
        <p className="text-slate-400 text-sm font-semibold mt-0.5">
          ${producto.precio.toLocaleString('es-CO')} c/u
        </p>
      </div>

      {/* Selector de descuento rápido */}
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descuento</p>
        <div className="flex gap-1.5 flex-wrap">
          {DESCUENTOS_RAPIDOS.map((pct) => (
            <button
              key={pct}
              onClick={() => handleDescuentoPildora(pct)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
                descuentoPorcentaje === pct && !mostrarInputPersonalizado
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {pct === 0 ? 'Sin dto.' : `-${pct}%`}
            </button>
          ))}
          <button
            onClick={() => setMostrarInputPersonalizado(true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all border ${
              mostrarInputPersonalizado
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Otro
          </button>
        </div>
        {mostrarInputPersonalizado && (
          <input
            type="number"
            min="0"
            max="100"
            value={descuentoPersonalizado}
            onChange={(e) => handleDescuentoPersonalizado(e.target.value)}
            placeholder="Ej: 15"
            className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
            autoFocus
          />
        )}
      </div>

      {/* Selector de cantidad y total */}
      <div className="flex items-center justify-between relative z-10 mt-auto">
        <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1 border border-slate-100 shadow-sm">
          <button
            onClick={() => setCantidad(Math.max(1, cantidad - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
          >
            <Minus size={12} />
          </button>
          <span className="font-black w-5 text-center text-slate-700 text-sm">{cantidad}</span>
          <button
            onClick={() => setCantidad(cantidad + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:text-orange-500 hover:bg-orange-50 shadow-sm transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        <div className="text-right">
          {descuentoPorcentaje > 0 && (
            <p className="text-[10px] text-slate-400 line-through font-semibold">
              ${(producto.precio * cantidad).toLocaleString('es-CO')}
            </p>
          )}
          <p className="font-black text-slate-800 text-base">
            ${totalLinea.toLocaleString('es-CO')}
          </p>
        </div>
      </div>

      {/* Botón agregar al carrito */}
      <button
        onClick={handleAgregarAlCarrito}
        className="relative z-10 w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        <ShoppingCart size={15} />
        Agregar al carrito
      </button>
    </div>
  );
}
