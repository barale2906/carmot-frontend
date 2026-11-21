/**
 * Utilidades puras de los plazos nuevos de pago (prórrogas). Los estados replican
 * `ProrrogaPago::VIGENTE|CUMPLIDO|INCUMPLIDO` del backend.
 */

export const ESTADOS_PRORROGA = [
  { value: 'vigente',    label: 'Vigentes',    clase: 'bg-emerald-100 text-emerald-800' },
  { value: 'cumplido',   label: 'Cumplidos',   clase: 'bg-blue-100 text-blue-800' },
  { value: 'incumplido', label: 'Incumplidos', clase: 'bg-red-100 text-red-700' }
]

const SINGULAR = { vigente: 'Vigente', cumplido: 'Cumplido', incumplido: 'Incumplido' }

/** Texto singular del estado de un plazo. */
export function etiquetaEstado(estado) {
  return SINGULAR[estado] ?? estado
}

/** Clases de la insignia de un estado. */
export function claseEstado(estado) {
  return ESTADOS_PRORROGA.find(e => e.value === estado)?.clase ?? 'bg-slate-100 text-slate-700'
}
