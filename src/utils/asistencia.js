/**
 * Utilidades puras de la toma y el listado de asistencia.
 * Los estados replican el enum de la tabla `asistencias`. La justificación va aparte:
 * una ausencia (o tardanza) justificada sigue contando como falla.
 */

export const ESTADOS_ASISTENCIA = [
  { value: 'presente', label: 'Presente', corto: 'P', clase: 'bg-green-600 text-white', claseInactiva: 'text-green-700 hover:bg-green-50', claseBadge: 'bg-green-100 text-green-800' },
  { value: 'tardanza', label: 'Tardanza', corto: 'T', clase: 'bg-amber-500 text-white', claseInactiva: 'text-amber-700 hover:bg-amber-50', claseBadge: 'bg-amber-100 text-amber-800' },
  { value: 'ausente',  label: 'Ausente',  corto: 'A', clase: 'bg-red-600 text-white',   claseInactiva: 'text-red-700 hover:bg-red-50',     claseBadge: 'bg-red-100 text-red-700' }
]

/** Porcentaje mínimo por defecto (asistencia_configuraciones.porcentaje_minimo). */
export const PORCENTAJE_MINIMO_DEFECTO = 80

/** Solo se justifica una ausencia o una tardanza. */
export function admiteJustificacion(estado) {
  return estado === 'ausente' || estado === 'tardanza'
}

/**
 * Clase sugerida al abrir un grupo: la de hoy; si no hay, la última ya pasada;
 * si todas son futuras, la primera. Ignora las canceladas.
 *
 * @param {Array<{ id: number, fecha_clase: string, estado: string }>} clases ordenadas por fecha
 * @param {string} hoy "YYYY-MM-DD"
 */
export function claseSugerida(clases, hoy) {
  const validas = (clases ?? []).filter(c => c.estado !== 'cancelada')
  if (!validas.length) return null
  return validas.find(c => c.fecha_clase === hoy)
    ?? [...validas].reverse().find(c => c.fecha_clase < hoy)
    ?? validas[0]
}

/**
 * La asistencia se toma el día de la clase o después (el backend rechaza clases futuras).
 * @param {{ fecha_clase: string }|null} clase
 * @param {string} hoy "YYYY-MM-DD"
 */
export function esClaseFutura(clase, hoy) {
  return !!clase && clase.fecha_clase > hoy
}

/**
 * Arma la planilla: un registro por estudiante, con lo ya guardado o "presente" por defecto.
 *
 * @param {Array<{ id: number }>} estudiantes
 * @param {Array<{ estudiante_id: number, estado: string, justificada?: boolean, justificacion?: string|null, observaciones: string|null }>} registradas
 */
export function construirPlanilla(estudiantes, registradas) {
  const porEstudiante = new Map((registradas ?? []).map(a => [a.estudiante_id, a]))
  return (estudiantes ?? []).map(e => {
    const previa = porEstudiante.get(e.id)
    return {
      estudiante_id: e.id,
      estado:        previa?.estado ?? 'presente',
      justificada:   !!previa?.justificada,
      justificacion: previa?.justificacion ?? '',
      observaciones: previa?.observaciones ?? '',
      guardada:      !!previa
    }
  })
}

/** Cuenta registros por estado y las justificadas: `{ presente: n, ausente: n, tardanza: n, justificadas: n }`. */
export function resumenPlanilla(planilla) {
  const resumen = Object.fromEntries(ESTADOS_ASISTENCIA.map(e => [e.value, 0]))
  resumen.justificadas = 0
  for (const fila of planilla ?? []) {
    resumen[fila.estado] = (resumen[fila.estado] ?? 0) + 1
    if (fila.justificada && admiteJustificacion(fila.estado)) resumen.justificadas++
  }
  return resumen
}

/**
 * Payload del registro masivo (textos vacíos → null). Si el estado no admite justificación
 * (presente), la justificación se descarta.
 */
export function payloadPlanilla(planilla) {
  return (planilla ?? []).map(f => {
    const justificada = !!f.justificada && admiteJustificacion(f.estado)
    return {
      estudiante_id: f.estudiante_id,
      estado:        f.estado,
      justificada,
      justificacion: justificada ? (f.justificacion?.trim() || null) : null,
      observaciones: f.observaciones?.trim() || null
    }
  })
}

/** Filas justificadas sin motivo: el backend exige el motivo de cada justificación. */
export function justificacionesSinMotivo(planilla) {
  return (planilla ?? []).filter(f => f.justificada && admiteJustificacion(f.estado) && !f.justificacion?.trim())
}

/** Etiqueta legible de una clase: "13/10/2026 · 08:00–10:00 (Dictada)". */
export function etiquetaClase(clase) {
  if (!clase) return ''
  const [y, m, d] = String(clase.fecha_clase).split('-')
  const horas = `${String(clase.hora_inicio).slice(0, 5)}–${String(clase.hora_fin).slice(0, 5)}`
  return `${d}/${m}/${y} · ${horas} (${clase.estado_text ?? clase.estado})`
}

/**
 * Parámetros del listado y su Excel: descarta los filtros vacíos. Con un día de clase
 * (`fecha`) se ignora el rango, para no combinar dos criterios de fecha.
 *
 * @param {Record<string, string|number|boolean|null>} filtros
 */
export function paramsListado(filtros) {
  const params = Object.fromEntries(
    Object.entries(filtros ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
  if (params.fecha) {
    delete params.fecha_desde
    delete params.fecha_hasta
  }
  return params
}
