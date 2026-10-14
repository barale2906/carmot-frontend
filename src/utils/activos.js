/**
 * Utilidades puras del módulo de activos fijos.
 * Los estados replican ActActivo::ESTADOS del backend.
 */

export const ESTADOS_ACTIVO = [
  { value: 'operativo',     label: 'Operativo' },
  { value: 'mantenimiento', label: 'En mantenimiento' },
  { value: 'disponible',    label: 'Disponible' },
  { value: 'baja',          label: 'De baja' }
]

/** Estados con los que puede registrarse un activo nuevo (la baja solo es un cambio de estado). */
export const ESTADOS_INICIALES = ESTADOS_ACTIVO.filter(e => e.value !== 'baja')

/** Variante de StatusBadge (sus variantes coinciden con los estados). */
export function varianteEstado(estado) {
  return ESTADOS_ACTIVO.some(e => e.value === estado) ? estado : 'operativo'
}

/** Un activo de baja ya no se edita, traslada ni cambia de estado. */
export function esDeBaja(activo) {
  return activo?.estado === 'baja'
}

/**
 * Áreas de una sede según el catálogo de filtros (`[{ id, nombre, areas: [...] }]`).
 * @param {Array} sedes
 * @param {number|string} sedeId
 */
export function areasDeSede(sedes, sedeId) {
  return (sedes ?? []).find(s => String(s.id) === String(sedeId))?.areas ?? []
}

/**
 * Distribución por área para las tarjetas: incluye las áreas de la sede sin activos (0)
 * y, al final, "Sin área" si hay activos sin ubicar.
 *
 * @param {Array<{ area_id: number|null, area: string, total: number }>} porArea estadística del backend
 * @param {Array<{ id: number, nombre: string }>} areas áreas de la sede filtrada ([] = todas las sedes)
 */
export function distribucionPorArea(porArea, areas) {
  const conteo = new Map((porArea ?? []).map(f => [f.area_id ?? null, f]))
  const filas  = (areas ?? []).map(a => ({ area: a.nombre, count: conteo.get(a.id)?.total ?? 0 }))
  const nombradas = new Set((areas ?? []).map(a => a.id))
  for (const fila of porArea ?? []) {
    if (fila.area_id !== null && !nombradas.has(fila.area_id)) filas.push({ area: fila.area, count: fila.total })
  }
  if (conteo.has(null)) filas.push({ area: 'Sin área', count: conteo.get(null).total })
  return filas
}

/** Payload del formulario de activo (vacíos → null, números como número). */
export function payloadActivo(form, { creando }) {
  const texto = (v) => (v === null || v === undefined || String(v).trim() === '') ? null : String(v).trim()
  const payload = {
    codigo:         texto(form.codigo),
    nombre:         texto(form.nombre),
    descripcion:    texto(form.descripcion),
    categoria_id:   form.categoria_id ? Number(form.categoria_id) : null,
    responsable_id: form.responsable_id ? Number(form.responsable_id) : null,
    marca:          texto(form.marca),
    modelo:         texto(form.modelo),
    serial:         texto(form.serial),
    fecha_ingreso:  form.fecha_ingreso,
    valor:          Number(form.valor || 0),
    observaciones:  texto(form.observaciones)
  }
  // Ubicación y estado solo se fijan al registrar; luego cambian por traslado o cambio de estado.
  if (creando) {
    payload.sede_id = form.sede_id ? Number(form.sede_id) : null
    payload.area_id = form.area_id ? Number(form.area_id) : null
    payload.estado  = form.estado || 'operativo'
  }
  return payload
}

/** Valor en pesos colombianos sin decimales. */
export function formatoCOP(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(valor || 0))
}
