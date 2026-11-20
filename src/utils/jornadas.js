/** Jornadas de una programación (mismos códigos que `programacions.jornada` en el backend). */
export const JORNADAS = [
  { value: 0, label: 'Mañana' },
  { value: 1, label: 'Tarde' },
  { value: 2, label: 'Noche' },
  { value: 3, label: 'Fin de semana mañana' },
  { value: 4, label: 'Fin de semana tarde' }
]

/**
 * Nombre legible de una jornada.
 * @param {number|string|null|undefined} valor  código de jornada (0-4)
 * @returns {string} etiqueta, o cadena vacía si no hay jornada
 */
export function jornadaLabel(valor) {
  if (valor === null || valor === undefined || valor === '') return ''
  return JORNADAS.find((j) => j.value === Number(valor))?.label ?? ''
}
