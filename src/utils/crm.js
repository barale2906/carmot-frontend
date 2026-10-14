/**
 * Utilidades puras del módulo CRM (leads, seguimientos y agenda de citas).
 * Los códigos de estado replican los del backend (Referido::getStatusOptions y Agenda::getStatusText).
 */

/** Estados del lead. */
export const ESTADOS_REFERIDO = {
  CREADO:      0,
  INTERESADO:  1,
  PENDIENTE:   2,
  MATRICULADO: 3,
  DECLINADO:   4
}

export const OPCIONES_ESTADO_REFERIDO = [
  { value: 0, label: 'Creado' },
  { value: 1, label: 'Interesado' },
  { value: 2, label: 'Pendiente por matricular' },
  { value: 3, label: 'Matriculado' },
  { value: 4, label: 'Declinado' }
]

/** Estados de una cita. */
export const ESTADOS_AGENDA = {
  AGENDADO:   0,
  ASISTIO:    1,
  NO_ASISTIO: 2,
  REPROGRAMO: 3,
  CANCELO:    4
}

export const OPCIONES_ESTADO_AGENDA = [
  { value: 0, label: 'Agendado' },
  { value: 1, label: 'Asistió' },
  { value: 2, label: 'No asistió' },
  { value: 3, label: 'Reprogramó' },
  { value: 4, label: 'Canceló' }
]

const CLASES_ESTADO_REFERIDO = {
  0: 'bg-slate-100 text-slate-700',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-red-100 text-red-700'
}

const CLASES_ESTADO_AGENDA = {
  0: 'bg-blue-100 text-blue-800',
  1: 'bg-green-100 text-green-800',
  2: 'bg-red-100 text-red-700',
  3: 'bg-amber-100 text-amber-800',
  4: 'bg-slate-100 text-slate-600'
}

/** Clases Tailwind de la etiqueta de estado de un lead. */
export function claseEstadoReferido(status) {
  return CLASES_ESTADO_REFERIDO[status] ?? CLASES_ESTADO_REFERIDO[0]
}

/** Clases Tailwind de la etiqueta de estado de una cita. */
export function claseEstadoAgenda(status) {
  return CLASES_ESTADO_AGENDA[status] ?? CLASES_ESTADO_AGENDA[0]
}

/**
 * Un lead se puede convertir en matrícula mientras no esté matriculado ni declinado.
 * @param {{ status: number }|null} referido
 */
export function puedeConvertirse(referido) {
  return !!referido && ![ESTADOS_REFERIDO.MATRICULADO, ESTADOS_REFERIDO.DECLINADO].includes(referido.status)
}

/**
 * Solo las citas en estado Agendado admiten cambiar el resultado o reprogramarse.
 * @param {{ status: number }|null} agenda
 */
export function citaAbierta(agenda) {
  return !!agenda && agenda.status === ESTADOS_AGENDA.AGENDADO
}

/**
 * Jornada que exige el backend ('am' | 'pm') a partir de una hora "HH:mm".
 * @param {string} hora
 */
export function jornadaDeHora(hora) {
  const h = Number(String(hora ?? '').split(':')[0])
  return Number.isFinite(h) && h >= 12 ? 'pm' : 'am'
}

/** Recorta la hora "HH:mm:ss" del backend a "HH:mm". */
export function horaCorta(hora) {
  return hora ? String(hora).slice(0, 5) : ''
}

/** Fecha local "YYYY-MM-DD" (sin el desfase UTC de toISOString). */
export function fechaISO(fecha = new Date()) {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Rango [hoy, hoy + dias] en formato "YYYY-MM-DD"; filtro por defecto de la agenda.
 * @param {number} dias
 * @param {Date} [desde]
 */
export function rangoProximosDias(dias, desde = new Date()) {
  const fin = new Date(desde)
  fin.setDate(fin.getDate() + dias)
  return { fecha_desde: fechaISO(desde), fecha_hasta: fechaISO(fin) }
}

/**
 * Fecha del backend (date o datetime) → "dd/mm/aaaa" sin pasar por UTC.
 * @param {string|null} valor
 */
export function fechaCorta(valor) {
  if (!valor) return '—'
  const [y, m, d] = String(valor).slice(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : '—'
}
