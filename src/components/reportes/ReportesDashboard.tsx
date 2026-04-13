'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Store, Bike, UtensilsCrossed, Calendar, TrendingUp, Receipt } from 'lucide-react';

interface Venta {
  id: string;
  created_at: string;
  total_precio: number;
  origen_venta: string;
}

interface ReportesDashboardProps {
  ventas: Venta[];
}

const COLORS = {
  Propio: '#f97316', // orange-500
  Rappi: '#ec4899',  // pink-500
  DiDi: '#eab308'    // yellow-500
};

export default function ReportesDashboard({ ventas }: ReportesDashboardProps) {
  const [filtroDias, setFiltroDias] = useState<number>(30); // 7, 30, 90, 365, etc.

  // Filtro de ventas basado en los días seleccionados
  const ventasFiltradas = useMemo(() => {
    if (filtroDias === 0) return ventas; // Todos los tiempos
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - filtroDias);
    return ventas.filter(v => new Date(v.created_at) >= fechaLimite);
  }, [ventas, filtroDias]);

  // Kpis generales
  const totalIngresos = ventasFiltradas.reduce((acc, v) => acc + v.total_precio, 0);
  const totalTransacciones = ventasFiltradas.length;
  const ticketPromedio = totalTransacciones > 0 ? totalIngresos / totalTransacciones : 0;

  // Data para gráficos: Origen de Ventas
  const dataRecuentoOrigen = useMemo(() => {
    const mapa = { Propio: 0, Rappi: 0, DiDi: 0 };
    ventasFiltradas.forEach(v => {
      // @ts-ignore
      if (mapa[v.origen_venta] !== undefined) mapa[v.origen_venta] += v.total_precio;
    });
    return [
      { name: 'Local/Propio', value: mapa.Propio, color: COLORS.Propio },
      { name: 'Rappi', value: mapa.Rappi, color: COLORS.Rappi },
      { name: 'DiDi', value: mapa.DiDi, color: COLORS.DiDi },
    ].filter(d => d.value > 0);
  }, [ventasFiltradas]);

  // Data para gráficos: Ventas por día temporal
  const dataEvolucion = useMemo(() => {
    const agrupado: Record<string, { date: string; Propio: number; Rappi: number; DiDi: number }> = {};
    
    // Ordenar de más viejo a más nuevo
    const ventasOrdenadas = [...ventasFiltradas].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    ventasOrdenadas.forEach(v => {
      // Tomamos solo YYYY-MM-DD
      const dia = new Date(v.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      if (!agrupado[dia]) {
        agrupado[dia] = { date: dia, Propio: 0, Rappi: 0, DiDi: 0 };
      }
      // @ts-ignore
      if (agrupado[dia][v.origen_venta] !== undefined) {
         // @ts-ignore
        agrupado[dia][v.origen_venta] += v.total_precio;
      }
    });

    return Object.values(agrupado);
  }, [ventasFiltradas]);

  return (
    <div className="space-y-6">
      {/* ── Filtros Globales ── */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-3 flex items-center gap-1.5"><Calendar size={14} /> Tiempo:</span>
         {[
           { val: 7, label: '7 Días' },
           { val: 30, label: '30 Días' },
           { val: 90, label: '3 Meses' },
           { val: 0, label: 'Todo' }
         ].map(f => (
           <button
             key={f.val}
             onClick={() => setFiltroDias(f.val)}
             className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
               filtroDias === f.val 
                 ? 'bg-slate-800 text-white shadow-md' 
                 : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900'
             }`}
           >
             {f.label}
           </button>
         ))}
      </div>

      {/* ── KPIs Tarjetas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex flex-col gap-2">
           <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-2">
             <TrendingUp size={24} strokeWidth={2.5} />
           </div>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ingresos Totales</p>
           <h3 className="text-3xl font-black text-gray-900">${totalIngresos.toLocaleString('es-ES')}</h3>
        </div>
        
        <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex flex-col gap-2">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
             <Receipt size={24} strokeWidth={2.5} />
           </div>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tickets Generados</p>
           <h3 className="text-3xl font-black text-gray-900">{totalTransacciones} <span className="text-lg text-gray-400 font-semibold">órdenes</span></h3>
        </div>

        <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm flex flex-col gap-2">
           <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-2">
             <Store size={24} strokeWidth={2.5} />
           </div>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ticket Promedio</p>
           <h3 className="text-3xl font-black text-gray-900">${Math.round(ticketPromedio).toLocaleString('es-ES')}</h3>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolución temporal (Area más grande) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">Evolución de Ingresos <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filtroDias === 0 ? 'Totales' : `Últ. ${filtroDias} Días`}</span></h4>
          <div className="h-[300px] w-full">
            {dataEvolucion.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, 'Ingresos']}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="Propio" stackId="a" fill={COLORS.Propio} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Rappi" stackId="a" fill={COLORS.Rappi} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="DiDi" stackId="a" fill={COLORS.DiDi} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                 <p className="font-semibold text-sm">No hay suficientes datos en este rango temporal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Participación de Canales (Doughnut) */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col">
          <h4 className="text-lg font-black text-gray-800 mb-2">Canales de Venta</h4>
          <p className="text-xs text-gray-500 font-medium mb-6">Distribución de ingresos por plataforma</p>
          <div className="flex-1 min-h-[250px] w-full relative">
            {dataRecuentoOrigen.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                     contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                     formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, 'Monto']}
                  />
                  <Pie
                    data={dataRecuentoOrigen}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataRecuentoOrigen.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <p className="font-semibold text-sm">Sin datos</p>
               </div>
            )}
            
            {/* Llenando visualmente el espacio interior del donut */}
            {dataRecuentoOrigen.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Ganancias</span>
              </div>
            )}
          </div>
          
          {/* Leyenda manual */}
          <div className="grid grid-cols-1 gap-2 mt-4">
             {dataRecuentoOrigen.map((d, i) => (
               <div key={i} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="text-sm font-bold text-gray-700">{d.name}</span>
                 </div>
                 <span className="text-sm font-black text-gray-900">${d.value.toLocaleString('es-ES')}</span>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
