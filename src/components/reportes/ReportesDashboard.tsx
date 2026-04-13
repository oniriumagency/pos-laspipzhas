'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { Store, Bike, UtensilsCrossed, Calendar, TrendingUp, Receipt, Tag, Trophy, Filter } from 'lucide-react';

interface Venta {
  id: string;
  created_at: string;
  total_precio: number;
  origen_venta: string;
  cart_payload?: any[];
}

interface ReportesDashboardProps {
  ventas: Venta[];
}

const COLORS = {
  Propio: '#f97316', // orange-500
  Rappi: '#ec4899',  // pink-500
  DiDi: '#eab308',   // yellow-500
  Flavor: '#8b5cf6'  // violet-500
};

export default function ReportesDashboard({ ventas }: ReportesDashboardProps) {
  // Filtros
  const [rangoFecha, setRangoFecha] = useState<string>('este_mes'); // hoy, ayer, esta_semana, este_mes, custom, todo
  const [fechaInicioManual, setFechaInicioManual] = useState<string>('');
  const [fechaFinManual, setFechaFinManual] = useState<string>('');
  
  const [origenesFiltro, setOrigenesFiltro] = useState<string[]>(['Propio', 'Rappi', 'DiDi']);

  const alternarOrigen = (origen: string) => {
    setOrigenesFiltro(previo => 
      previo.includes(origen) ? previo.filter(o => o !== origen) : [...previo, origen]
    );
  };

  // Filtrado compuesto
  const ventasFiltradas = useMemo(() => {
    let filtroInicio = new Date(0);
    let filtroFin = new Date();
    
    const ahora = new Date();
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    
    if (rangoFecha === 'hoy') {
      filtroInicio = inicioDia;
    } else if (rangoFecha === 'ayer') {
      filtroInicio = new Date(inicioDia);
      filtroInicio.setDate(filtroInicio.getDate() - 1);
      filtroFin = new Date(inicioDia);
      filtroFin.setMilliseconds(-1);
    } else if (rangoFecha === 'esta_semana') {
      const diaSemana = ahora.getDay() === 0 ? 7 : ahora.getDay(); // lunes=1, domingo=7
      filtroInicio = new Date(inicioDia);
      filtroInicio.setDate(filtroInicio.getDate() - diaSemana + 1);
    } else if (rangoFecha === 'este_mes') {
      filtroInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    } else if (rangoFecha === 'todo') {
      filtroInicio = new Date(0);
    } else if (rangoFecha === 'custom') {
      if (fechaInicioManual) {
         // Asegurar que abarque desde las 00:00:00
         const [anio, mes, dia] = fechaInicioManual.split('-').map(Number);
         filtroInicio = new Date(anio, mes - 1, dia, 0, 0, 0);
      }
      if (fechaFinManual) {
         // Asegurar que abarque hasta las 23:59:59
         const [anio, mes, dia] = fechaFinManual.split('-').map(Number);
         filtroFin = new Date(anio, mes - 1, dia, 23, 59, 59);
      }
    }

    return ventas.filter(v => {
      const fechaVenta = new Date(v.created_at);
      const cumpleFecha = fechaVenta >= filtroInicio && fechaVenta <= filtroFin;
      const cumpleOrigen = origenesFiltro.includes(v.origen_venta);
      return cumpleFecha && cumpleOrigen;
    });
  }, [ventas, rangoFecha, fechaInicioManual, fechaFinManual, origenesFiltro]);

  // KPIs
  const totalIngresos = ventasFiltradas.reduce((acc, v) => acc + v.total_precio, 0);
  const totalTransacciones = ventasFiltradas.length;
  const ticketPromedio = totalTransacciones > 0 ? totalIngresos / totalTransacciones : 0;
  
  const totalDescuentos = useMemo(() => {
    let descuentometro = 0;
    ventasFiltradas.forEach(v => {
      if (v.cart_payload) {
        v.cart_payload.forEach((item: any) => {
          if (item.descuento_porcentaje) {
            const descuentoPorItem = (item.precio_unitario * (item.descuento_porcentaje / 100)) * (item.cantidad || 1);
            descuentometro += descuentoPorItem;
          }
        });
      }
    });
    return descuentometro;
  }, [ventasFiltradas]);

  // Gráfico 1: Share de Canales (Doughnut)
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

  // Gráfico 2: Top 5 Sabores Vendidos
  const dataSabores = useMemo(() => {
    const mapaSabores: Record<string, number> = {};
    ventasFiltradas.forEach(v => {
      if (v.cart_payload) {
        v.cart_payload.forEach((item: any) => {
          const s1 = item.sabor_1_nombre;
          const s2 = item.sabor_2_nombre;
          const cant = item.cantidad || 1;
          
          if (s1 && s2) {
             mapaSabores[s1] = (mapaSabores[s1] || 0) + (cant * 0.5);
             mapaSabores[s2] = (mapaSabores[s2] || 0) + (cant * 0.5);
          } else if (s1) {
             mapaSabores[s1] = (mapaSabores[s1] || 0) + cant;
          }
        });
      }
    });
    
    // Sort and grab top 5
    const saboresSorted = Object.entries(mapaSabores)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
    return saboresSorted;
  }, [ventasFiltradas]);

  // Gráfico 3: Evolución de Ingresos
  const dataEvolucion = useMemo(() => {
    const agrupado: Record<string, { date: string; Propio: number; Rappi: number; DiDi: number }> = {};
    const ventasOrdenadas = [...ventasFiltradas].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    ventasOrdenadas.forEach(v => {
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
    <div className="space-y-8">
      
      {/* ── SECCIÓN DE FILTROS ── */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Calendario */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold px-2 shrink-0">
             <Calendar size={18} className="text-orange-500" /> 
             <span>Fecha</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'hoy', label: 'Hoy' },
              { val: 'ayer', label: 'Ayer' },
              { val: 'esta_semana', label: 'Esta Semana' },
              { val: 'este_mes', label: 'Este Mes' },
              { val: 'todo', label: 'Histórico' },
              { val: 'custom', label: 'Personalizado' }
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setRangoFecha(f.val)}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 border shadow-sm ${
                  rangoFecha === f.val 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {rangoFecha === 'custom' && (
             <div className="flex items-center gap-2 mt-3 sm:mt-0 ml-0 sm:ml-4 bg-slate-50 p-1.5 rounded-xl border border-slate-200" style={{ animation: 'fadeIn 200ms ease-out' }}>
                <input 
                  type="date" 
                  value={fechaInicioManual}
                  onChange={(e) => setFechaInicioManual(e.target.value)}
                  className="bg-white border-0 text-sm font-semibold text-slate-700 py-1.5 px-3 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                />
                <span className="text-slate-400 font-bold">a</span>
                <input 
                  type="date" 
                  value={fechaFinManual}
                  onChange={(e) => setFechaFinManual(e.target.value)}
                  className="bg-white border-0 text-sm font-semibold text-slate-700 py-1.5 px-3 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                />
             </div>
          )}
        </div>

        {/* Origen */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t xl:border-t-0 xl:border-l border-gray-100 pt-5 xl:pt-0 xl:pl-6 pl-0">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold px-2 shrink-0">
             <Filter size={18} className="text-blue-500" /> 
             <span>Canal</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { val: 'Propio', tag: 'Propio', baseCol: 'orange' },
              { val: 'Rappi', tag: 'Rappi', baseCol: 'pink' },
              { val: 'DiDi', tag: 'DiDi', baseCol: 'yellow' }
            ].map(o => {
              const activo = origenesFiltro.includes(o.val);
              return (
                <button
                  key={o.val}
                  onClick={() => alternarOrigen(o.val)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-extrabold tracking-wide transition-all duration-200 border shadow-sm ${
                    activo
                      ? `bg-slate-800 text-white border-slate-800`
                      : 'bg-white text-gray-400 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  {o.val === 'Rappi' && '🍔 '}
                  {o.val === 'DiDi' && '🚗 '}
                  {o.val === 'Propio' && '🏠 '}
                  {o.tag}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── KPIs Tarjetas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm flex flex-col gap-1.5 relative overflow-hidden group">
           <div className="absolute right-[-10px] top-[-10px] bg-green-50 w-20 h-20 rounded-full transition-transform group-hover:scale-110 -z-0"></div>
           <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-1 z-10">
             <TrendingUp size={20} strokeWidth={2.5} />
           </div>
           <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest z-10 mt-1">Ingresos Brutos</p>
           <h3 className="text-3xl font-black text-gray-900 z-10">${totalIngresos.toLocaleString('es-ES')}</h3>
        </div>
        
        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm flex flex-col gap-1.5 relative overflow-hidden group">
           <div className="absolute right-[-10px] top-[-10px] bg-blue-50 w-20 h-20 rounded-full transition-transform group-hover:scale-110 -z-0"></div>
           <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-1 z-10">
             <Receipt size={20} strokeWidth={2.5} />
           </div>
           <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest z-10 mt-1">Órdenes Completadas</p>
           <h3 className="text-3xl font-black text-gray-900 z-10">{totalTransacciones}</h3>
        </div>

        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm flex flex-col gap-1.5 relative overflow-hidden group">
           <div className="absolute right-[-10px] top-[-10px] bg-purple-50 w-20 h-20 rounded-full transition-transform group-hover:scale-110 -z-0"></div>
           <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-1 z-10">
             <Store size={20} strokeWidth={2.5} />
           </div>
           <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest z-10 mt-1">Ticket Promedio</p>
           <h3 className="text-3xl font-black text-gray-900 z-10">${Math.round(ticketPromedio).toLocaleString('es-ES')}</h3>
        </div>

        <div className="bg-white rounded-[1.5rem] p-5 border border-gray-100 shadow-sm flex flex-col gap-1.5 relative overflow-hidden group">
           <div className="absolute right-[-10px] top-[-10px] bg-red-50 w-20 h-20 rounded-full transition-transform group-hover:scale-110 -z-0"></div>
           <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-1 z-10">
             <Tag size={20} className="-scale-x-100" strokeWidth={2.5} />
           </div>
           <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest z-10 mt-1">Total en Descuentos</p>
           <h3 className="text-3xl font-black text-gray-900 z-10">${totalDescuentos.toLocaleString('es-ES')}</h3>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolución temporal (Area Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm pb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-lg font-black text-gray-800">Evolución de Ingresos</h4>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">Comportamiento temporal de ventas ({rangoFecha.replace('_', ' ').toUpperCase()})</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            {dataEvolucion.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataEvolucion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPropio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.Propio} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.Propio} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRappi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.Rappi} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.Rappi} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDiDi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.DiDi} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.DiDi} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} dx={-10} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, 'Ingresos']}
                    labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '0.5rem', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  
                  {origenesFiltro.includes('DiDi') && <Area type="monotone" dataKey="DiDi" stackId="1" stroke={COLORS.DiDi} strokeWidth={3} fill="url(#colorDiDi)" activeDot={{ r: 6, strokeWidth: 0 }} />}
                  {origenesFiltro.includes('Rappi') && <Area type="monotone" dataKey="Rappi" stackId="1" stroke={COLORS.Rappi} strokeWidth={3} fill="url(#colorRappi)" activeDot={{ r: 6, strokeWidth: 0 }} />}
                  {origenesFiltro.includes('Propio') && <Area type="monotone" dataKey="Propio" stackId="1" stroke={COLORS.Propio} strokeWidth={3} fill="url(#colorPropio)" activeDot={{ r: 6, strokeWidth: 0 }} />}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                 <p className="font-semibold text-sm">No hay suficientes datos en este rango temporal.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          {/* Gráfico 2: Participación de Canales (Doughnut) */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col pt-5">
            <h4 className="text-sm font-black text-gray-800 mb-1">Share de Canales</h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-3">Distribución de Ingresos</p>
            <div className="flex-1 min-h-[160px] w-full relative">
              {dataRecuentoOrigen.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                       contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                       formatter={(value: number) => [`$${value.toLocaleString('es-ES')}`, 'Monto']}
                       itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Pie
                      data={dataRecuentoOrigen}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
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
                    <p className="font-semibold text-xs">Sin datos</p>
                 </div>
              )}
            </div>
            {/* Leyenda manual */}
            <div className="grid grid-cols-1 gap-1.5 mt-2">
               {dataRecuentoOrigen.map((d, i) => (
                 <div key={i} className="flex justify-between items-center bg-gray-50/80 px-3 py-2 rounded-xl border border-gray-100/50">
                   <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></span>
                      <span className="text-xs font-bold text-gray-700">{d.name}</span>
                   </div>
                   <span className="text-xs font-black text-gray-900">${d.value.toLocaleString('es-ES')}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* Gráfico 3: Ranking Top 5 Sabores */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col flex-1">
            <h4 className="text-sm font-black text-gray-800 mb-1 flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> Top Sabores Estrellas</h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black mb-4">Raciones más vendidas</p>
            <div className="flex-1 w-full relative min-h-[180px]">
               {dataSabores.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={dataSabores} margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis 
                         type="category" 
                         dataKey="name" 
                         axisLine={false} 
                         tickLine={false} 
                         width={90}
                         tick={{ fontSize: 11, fill: '#475569', fontWeight: 'bold' }} 
                       />
                       <Tooltip 
                         cursor={{ fill: '#f8fafc' }}
                         contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                         formatter={(value: number) => [`${value} raciones`, 'Ventas']}
                       />
                       <Bar dataKey="value" fill={COLORS.Flavor} radius={[0, 4, 4, 0]} barSize={16}>
                          {dataSabores.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={`hsl(256, 80%, ${60 + index * 5}%)`} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                     <p className="font-semibold text-xs">Sin sabores registrados.</p>
                  </div>
               )}
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
