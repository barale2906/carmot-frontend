/**
 * Utilidades puras de la pantalla de calificaciones (planilla de notas y esquemas).
 */

/** Suma de pesos de los tipos de nota, redondeada a 2 decimales. */
export function sumaPesos(tipos) {
  const total = (tipos ?? []).reduce((acc, t) => acc + (Number(t.peso) || 0), 0)
  return Math.round(total * 100) / 100
}

/** El backend exige que los pesos sumen exactamente 100 %. */
export function pesosValidos(tipos) {
  return Math.abs(sumaPesos(tipos) - 100) <= 0.01
}

/** Tipo de nota en blanco para el formulario de esquema (escala 0–5 por defecto). */
export function tipoNotaVacio(orden) {
  return { nombre_tipo: '', peso: '', orden, nota_minima: 0, nota_maxima: 5, descripcion: '' }
}

/** Payload de esquema: renumera el orden según la posición en la lista. */
export function payloadEsquema(form) {
  return {
    modulo_id:      Number(form.modulo_id),
    grupo_id:       form.grupo_id ? Number(form.grupo_id) : null,
    nombre_esquema: form.nombre_esquema.trim(),
    descripcion:    form.descripcion?.trim() || null,
    tipos_nota:     form.tipos_nota.map((t, i) => ({
      ...(t.id ? { id: t.id } : {}),
      nombre_tipo: t.nombre_tipo.trim(),
      peso:        Number(t.peso),
      orden:       i + 1,
      nota_minima: Number(t.nota_minima ?? 0),
      nota_maxima: Number(t.nota_maxima ?? 5),
      descripcion: t.descripcion?.trim() || null
    }))
  }
}

/**
 * Planilla editable a partir de la sábana grupal: `valores[estudianteId][tipoId]`
 * con la nota como texto ('' si está pendiente) para enlazarla a inputs.
 */
export function planillaDesdeSabana(sabana) {
  const valores = {}
  for (const fila of sabana?.estudiantes ?? []) {
    valores[fila.estudiante.id] = Object.fromEntries(
      fila.tipos_nota.map(t => [t.id, t.nota === null || t.nota === undefined ? '' : String(t.nota)])
    )
  }
  return valores
}

/** ¿El valor escrito es una nota válida para el tipo? ('' = sin nota, válido). */
export function notaValida(valor, tipo) {
  if (valor === '' || valor === null || valor === undefined) return true
  const n = Number(String(valor).replace(',', '.'))
  const min = Number(tipo?.nota_minima ?? 0)
  const max = Number(tipo?.nota_maxima ?? 5)
  return Number.isFinite(n) && n >= min && n <= max
}

/**
 * Agrupa por tipo de nota las celdas que cambiaron respecto a la sábana original,
 * listas para enviar al registro masivo. Las celdas vaciadas no se envían (el backend
 * no borra notas por esta vía).
 *
 * @returns {Array<{ tipoId: number, notas: Array<{ estudiante_id: number, nota: number }> }>}
 */
export function cambiosPorTipo(original, actual) {
  const porTipo = new Map()
  for (const [estudianteId, notas] of Object.entries(actual ?? {})) {
    for (const [tipoId, valor] of Object.entries(notas)) {
      const antes = original?.[estudianteId]?.[tipoId] ?? ''
      if (valor === '' || String(valor) === String(antes)) continue
      if (!porTipo.has(tipoId)) porTipo.set(tipoId, [])
      porTipo.get(tipoId).push({ estudiante_id: Number(estudianteId), nota: Number(String(valor).replace(',', '.')) })
    }
  }
  return [...porTipo].map(([tipoId, notas]) => ({ tipoId: Number(tipoId), notas }))
}

/** Nota con un decimal, o '—' si no hay. */
export function formatoNota(nota) {
  return nota === null || nota === undefined || nota === '' ? '—' : Number(nota).toFixed(1)
}
