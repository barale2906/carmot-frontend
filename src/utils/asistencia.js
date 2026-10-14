/**
 * Utilidades puras de la toma de asistencia.
 * Los estados replican el enum de la tabla `asistencias`.
 */

export const ESTADOS_ASISTENCIA = [
  { value: 'presente',    label: 'Presente',    corto: 'P', clase: 'bg-green-600 text-white',  claseInactiva: 'text-green-700 hover:bg-green-50' },
  { value: 'tardanza',    label: 'Tardanza',    corto: 'T', clase: 'bg-amber-500 text-white',  claseInactiva: 'text-amber-700 hover:bg-amber-50' },
  { value: 'ausente',     label: 'Ausente',     corto: 'A', clase: 'bg-red-600 text-white',    claseInactiva: 'text-red-700 hover:bg-red-50' },
  { value: 'justificado', label: 'Justificado', corto: 'J', clase: 'bg-blue-600 text-white',   claseInactiva: 'text-blue-700 hover:bg-blue-50' }
]

/** Porcentaje mínimo por defecto (asistencia_configuraciones.porcentaje_minimo). */
export const PORCENTAJE_MINIMO_DEFECTO = 80

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
 * @param {Array<{ estudiante_id: number, estado: string, observaciones: string|null }>} registradas
 */
export function construirPlanilla(estudiantes, registradas) {
  const porEstudiante = new Map((registradas ?? []).map(a => [a.estudiante_id, a]))
  return (estudiantes ?? []).map(e => {
    const previa = porEstudiante.get(e.id)
    return {
      estudiante_id: e.id,
      estado:        previa?.estado ?? 'presente',
      observaciones: previa?.observaciones ?? '',
      guardada:      !!previa
    }
  })
}

/** Cuenta registros por estado: `{ presente: n, ausente: n, ... }`. */
export function resumenPlanilla(planilla) {
  const resumen = Object.fromEntries(ESTADOS_ASISTENCIA.map(e => [e.value, 0]))
  for (const fila of planilla ?? []) resumen[fila.estado] = (resumen[fila.estado] ?? 0) + 1
  return resumen
}

/** Payload del registro masivo (observaciones vacías → null). */
export function payloadPlanilla(planilla) {
  return (planilla ?? []).map(f => ({
    estudiante_id: f.estudiante_id,
    estado:        f.estado,
    observaciones: f.observaciones?.trim() || null
  }))
}

/** Etiqueta legible de una clase: "13/10/2026 · 08:00–10:00 (Dictada)". */
export function etiquetaClase(clase) {
  if (!clase) return ''
  const [y, m, d] = String(clase.fecha_clase).split('-')
  const horas = `${String(clase.hora_inicio).slice(0, 5)}–${String(clase.hora_fin).slice(0, 5)}`
  return `${d}/${m}/${y} · ${horas} (${clase.estado_text ?? clase.estado})`
}
