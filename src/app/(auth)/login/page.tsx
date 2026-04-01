'use client';

import React, { useState, useTransition } from 'react';
import { loginUser } from '../../../server/actions/auth';
import { Pizza } from 'lucide-react';

export default function LoginPage() {
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorStatus(null);
    const formData = new FormData(e.currentTarget);
    
    // Almacenamos la llamada al Server Action en una Transición de UI
    startTransition(async () => {
      const res = await loginUser(formData);
      
      // Si el servidor interceptó el Submit y mandó error, pintarlo localmente
      if (res?.error) {
        // Adaptación coloquial del código arrojado por el Go-True de Supabase
        const mensajeFriendly = res.error.includes('credentials') || res.error.includes('Invalid login') 
            ? 'Credenciales incorrectas. Revisa el correo y contraseña.' 
            : res.error;
        setErrorStatus(mensajeFriendly);
      }
      // Nota: Si es exitoso el Server Action ejecuta "redirect()", abandonando la vista automáticamente
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 selection:bg-orange-200">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 sm:p-12 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100/50">
        
        {/* Cabecera / Identidad de la marca de Pizza */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-orange-500/30 shadow-xl mb-6">
            <Pizza className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
            Las Pipzhas<span className="text-orange-500">POS</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-3 leading-relaxed">
            Punto de Venta Interno y Gestión Inteligente de Inventarios.
          </p>
        </div>

        {/* Catcher de Errores Visuales */}
        {errorStatus && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-700 font-bold text-sm text-center border border-red-100 flex items-center justify-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorStatus}
          </div>
        )}

        {/* Control Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-[0.8rem] font-bold text-gray-700 uppercase tracking-widest pl-1" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="cajero@laspipzhas.com"
              disabled={isPending}
              required
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-gray-400 font-semibold"
            />
          </div>

          <div className="space-y-1">
             <label className="block text-[0.8rem] font-bold text-gray-700 uppercase tracking-widest pl-1" htmlFor="password">
              Contraseña Administrativa
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••••••"
              disabled={isPending}
              required
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-lg tracking-widest rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-normal font-black"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-8 bg-black hover:bg-gray-900 hover:shadow-2xl hover:shadow-black/20 text-white font-black text-lg py-5 px-6 rounded-[1.25rem] transition-all disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500 flex justify-center items-center gap-3 active:scale-[0.98]"
          >
            {isPending ? (
              <>
                 <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Verificando credenciales...
              </>
            ) : (
              'Ingresar al Turno'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
