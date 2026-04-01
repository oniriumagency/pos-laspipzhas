'use client';

import React, { useState } from 'react';
import { adjustStock } from '../../server/actions/adjustments';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Recibe la fila de la tabla
  ingredient: {
    id: string;
    nombre: string;
    stock_actual: number;
    unidad_medida: string;
  } | null;
}

export default function AdjustmentModal({ isOpen, onClose, ingredient }: AdjustmentModalProps) {
  // Estados para el formulario
  const [cantidadCambio, setCantidadCambio] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  
  // Estados de carga y error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!isOpen || !ingredient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidadCambio === '' || cantidadCambio === 0) {
      setErrorStatus('Por favor ingresa una cantidad válida diferente de 0.');
      return;
    }

    // Identificamos el tipo de movimiento según el prefijo/signo usado por el admin
    const cambioNum = Number(cantidadCambio);
    const tipoMovimiento = cambioNum > 0 ? 'compra' : 'merma';

    setIsSubmitting(true);
    setErrorStatus(null);

    // Disparamos la Server Action (Simulamos un userId 'system-user' por el momento)
    const res = await adjustStock(ingredient.id, cambioNum, tipoMovimiento, 'system-user', notas);
    
    setIsSubmitting(false);

    if (res.success) {
      // Limpiamos los campos en caso de éxito
      setCantidadCambio('');
      setNotas('');
      onClose();
    } else {
      setErrorStatus(res.error || 'Ocurrió un error inesperado al ajustar el inventario.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={!isSubmitting ? onClose : undefined} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col pt-6 pb-8 px-6 sm:px-8 max-h-[90vh] animate-in slide-in-from-bottom-[50%] sm:zoom-in-95 duration-200">
        
        {/* Barra arrastrable (mobile) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full sm:hidden"></div>

        {/* Cabecera */}
        <div className="mb-6 mt-2 sm:mt-0">
          <h2 className="text-xl font-bold text-gray-900">Ajustar Inventario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Modificando stock de <span className="font-semibold text-gray-800">{ingredient.nombre}</span>
          </p>
          <div className="mt-2 text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md inline-flex items-center">
            Stock actual: {ingredient.stock_actual.toLocaleString('es-ES')} {ingredient.unidad_medida}
          </div>
        </div>

        {errorStatus && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 font-medium text-sm">
            {errorStatus}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="cantidad" className="block text-sm font-bold text-gray-700 mb-1">
              Cantidad (+ / -)
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                id="cantidad"
                type="number"
                step="any"
                disabled={isSubmitting}
                className="block w-full rounded-xl border-gray-300 border py-3 px-4 focus:border-orange-500 focus:ring-orange-500 sm:text-sm font-medium disabled:opacity-50"
                placeholder="Ej. -5 o 100"
                value={cantidadCambio}
                onChange={(e) => setCantidadCambio(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-gray-500 sm:text-sm">{ingredient.unidad_medida}</span>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 font-medium">
              Usa <strong className="text-green-600">+</strong> para sumar compras y <strong className="text-red-600">-</strong> para restar mermas o daños.
            </p>
          </div>

          <div>
            <label htmlFor="notas" className="block text-sm font-bold text-gray-700 mb-1">
              Notas de Auditoría <span className="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="notas"
              rows={3}
              disabled={isSubmitting}
              className="block w-full resize-none rounded-xl border border-gray-300 py-3 px-4 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm disabled:opacity-50"
              placeholder="Ej. Factura #4562 o Bolsa rota"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          <div className="mt-8 flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-500 hover:shadow-lg focus:outline-none transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar Ajuste'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
