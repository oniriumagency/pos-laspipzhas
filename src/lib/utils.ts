/**
 * Utilidades compartidas de la aplicación Pipzhas POS
 */

/**
 * Formatea un número como moneda en Pesos Colombianos (COP)
 * @param amount Cantidad numérica a formatear
 * @returns Cadena de texto con formato (ej. $ 35.000)
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
