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

/**
 * Estados que ofrece el formulario de seguimiento. Matriculado no se asigna a mano: elegirlo
 * abre el asistente de matrícula y el backend marca el lead al generarla.
 * @param {boolean} permitirMatricular Si el usuario puede crear matrículas y el lead aún se puede convertir
 */
export function opcionesEstadoSeguimiento(permitirMatricular) {
  return OPCIONES_ESTADO_REFERIDO
    .filter(o => permitirMatricular || o.value !== ESTADOS_REFERIDO.MATRICULADO)
    .map(o => o.value === ESTADOS_REFERIDO.MATRICULADO ? { ...o, label: 'Matriculado (generar matrícula)' } : o)
}

/**
 * Traduce el estado elegido en el formulario de seguimiento a lo que se envía al backend.
 * @param {number|string} estadoElegido Estado seleccionado en el formulario
 * @param {number|null} estadoActual Estado actual del lead (null si aún no existe)
 * @returns {{ estado: number|null, convertir: boolean }} `estado` solo si cambia y no es
 *   Matriculado; `convertir` indica que hay que abrir el asistente de matrícula.
 */
export function resolverEstadoSeguimiento(estadoElegido, estadoActual) {
  const estado = estadoElegido === '' || estadoElegido === null ? null : Number(estadoElegido)
  if (estado === ESTADOS_REFERIDO.MATRICULADO) return { estado: null, convertir: true }
  return { estado: estado === estadoActual ? null : estado, convertir: false }
}

/** Estados de una acción de la agenda. */
export const ESTADOS_AGENDA = {
  AGENDADO:     0,
  REALIZADA:    1,
  NO_REALIZADA: 2,
  REPROGRAMO:   3,
  CANCELO:      4
}

/**
 * Texto de los resultados según el tipo de acción (Agenda::RESULTADOS_POR_TIPO del backend):
 * una visita se asiste, una llamada se contesta, un mensaje se responde.
 */
const RESULTADOS_POR_TIPO = {
  visita:  { 1: 'Asistió',   2: 'No asistió' },
  llamada: { 1: 'Contestó',  2: 'No contestó' },
  mensaje: { 1: 'Respondió', 2: 'Sin respuesta' },
  otro:    { 1: 'Realizada', 2: 'No realizada' }
}

/**
 * Opciones de estado de la agenda; con tipo, los resultados usan el texto de ese tipo.
 * @param {string} [tipo] 'visita' | 'llamada' | 'mensaje' | 'otro'; vacío = texto genérico
 */
export function opcionesEstadoAgenda(tipo) {
  const resultados = RESULTADOS_POR_TIPO[tipo] ?? RESULTADOS_POR_TIPO.otro
  return [
    { value: ESTADOS_AGENDA.AGENDADO,     label: 'Agendado' },
    { value: ESTADOS_AGENDA.REALIZADA,    label: resultados[1] },
    { value: ESTADOS_AGENDA.NO_REALIZADA, label: resultados[2] },
    { value: ESTADOS_AGENDA.REPROGRAMO,   label: 'Reprogramó' },
    { value: ESTADOS_AGENDA.CANCELO,      label: 'Canceló' }
  ]
}

/**
 * Texto de un estado de la agenda según el tipo de acción.
 * @param {number} status
 * @param {string} [tipo]
 */
export function textoEstadoAgenda(status, tipo) {
  return opcionesEstadoAgenda(tipo).find(o => o.value === status)?.label ?? 'Desconocido'
}

/** Tipos de acción que se programan en la agenda (Agenda::TIPOS del backend). */
export const OPCIONES_TIPO_AGENDA = [
  { value: 'llamada', label: 'Llamada' },
  { value: 'visita',  label: 'Visita' },
  { value: 'mensaje', label: 'Mensaje / WhatsApp' },
  { value: 'otro',    label: 'Otro' }
]

/** Próxima acción en blanco del formulario de seguimiento (sin tipo = no se programa nada). */
export function proximaAccionVacia() {
  return { tipo: '', fecha: '', hora: '', nota: '' }
}

/**
 * `proxima_accion` que se envía al backend, o null si no se eligió tipo de acción.
 * @param {{ tipo: string, fecha: string, hora: string, nota: string }} accion
 */
export function proximaAccionPayload(accion) {
  if (!accion?.tipo) return null
  return { tipo: accion.tipo, fecha: accion.fecha, hora: accion.hora, nota: accion.nota?.trim() || null }
}

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
