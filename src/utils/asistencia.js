/**
 * Utilidades puras de la toma y el listado de asistencia.
 * Los estados replican el enum de la tabla `asistencias`. La justificación va aparte:
 * una ausencia (o tardanza) justificada sigue contando como falla.
 */

import { normalizarTexto } from '@/utils/busqueda.js'

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

/** "08:00–10:00" a partir de las horas de una clase ("08:00:00"). */
export function rangoHoras(clase) {
  if (!clase) return ''
  return `${String(clase.hora_inicio).slice(0, 5)}–${String(clase.hora_fin).slice(0, 5)}`
}

/**
 * Busca estudiantes por nombre o documento (sin tildes ni mayúsculas, palabras en cualquier orden)
 * entre las clases del día y los agrupa: un estudiante con dos clases hoy aparece una vez con ambas.
 *
 * @param {Array<{ id: number, estudiantes: Array<{ id: number, name: string, documento?: string|null }> }>} clases
 * @param {string} consulta
 * @returns {Array<{ estudiante: object, clases: Array }>} ordenado por nombre
 */
export function buscarEstudiantesEnClases(clases, consulta) {
  const palabras = normalizarTexto(consulta).split(/\s+/).filter(Boolean)
  if (!palabras.length) return []
  const porEstudiante = new Map()
  for (const clase of clases ?? []) {
    for (const estudiante of clase.estudiantes ?? []) {
      const texto = `${normalizarTexto(estudiante.name)} ${normalizarTexto(estudiante.documento)}`
      if (!palabras.every(p => texto.includes(p))) continue
      if (!porEstudiante.has(estudiante.id)) porEstudiante.set(estudiante.id, { estudiante, clases: [] })
      porEstudiante.get(estudiante.id).clases.push(clase)
    }
  }
  return [...porEstudiante.values()].sort((a, b) => a.estudiante.name.localeCompare(b.estudiante.name, 'es'))
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

/**
 * Estudiantes invitados a una clase por una reposición, de las `reposiciones` de la clase programada
 * (`{ estudiante: { id, name, documento } }`) a `{ id, name, documento }`.
 */
export function invitadosDeReposiciones(reposiciones) {
  return (reposiciones ?? []).filter(r => r.estudiante).map(r => ({
    id: r.estudiante.id, name: r.estudiante.name, documento: r.estudiante.documento
  }))
}

/** Une los estudiantes del grupo con los invitados por reposición (sin repetir), marcando a estos con `invitado: true`. */
export function estudiantesConInvitados(estudiantes, invitados) {
  const propios = estudiantes ?? []
  const ids = new Set(propios.map(e => e.id))
  const extra = (invitados ?? []).filter(i => !ids.has(i.id)).map(i => ({ ...i, invitado: true }))
  return [...propios, ...extra]
}

/** Etiqueta de una clase para elegirla en una reposición: "mar 13/10 · 08:00–10:00 · Grupo A (Sede)". */
export function etiquetaClaseReposicion(clase) {
  if (!clase) return ''
  const [y, m, d] = String(clase.fecha_clase).split('-').map(Number)
  const dia = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')
  const sede = clase.grupo?.sede ? ` (${clase.grupo.sede})` : ''
  return `${dia} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} · ${rangoHoras(clase)} · ${clase.grupo?.nombre ?? ''}${sede}`
}

/** Clases del distintivo del estado del estudiante en el curso (`estado_estudiante`): Desertado en rojo, En mora en ámbar. */
export function claseEstadoEstudiante(estado) {
  if (estado === 'Desertado') return 'bg-red-100 text-red-800 ring-1 ring-red-300'
  if (estado === 'En mora') return 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
  return 'bg-slate-100 text-slate-600'
}

/** Solo se destaca al estudiante Desertado: es el aviso que el instituto debe ver al tomar la asistencia. */
export function esDesertado(estudiante) {
  return estudiante?.estado_estudiante === 'Desertado'
}
