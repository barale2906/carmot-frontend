/**
 * Estado académico de la matrícula (independiente del estado administrativo).
 * Replica Matricula::ESTADOS_ACADEMICOS y ESTADOS_ACADEMICOS_FINALES del backend.
 */

export const ESTADOS_ACADEMICOS = {
  ACTIVO:    1,
  APLAZADO:  2,
  DESERTADO: 3,
  RETIRADO:  4,
  GRADUADO:  5
}

export const OPCIONES_ESTADO_ACADEMICO = [
  { value: 1, label: 'Activo' },
  { value: 2, label: 'Aplazado' },
  { value: 3, label: 'Desertado' },
  { value: 4, label: 'Retirado' },
  { value: 5, label: 'Graduado' }
]

const FINALES = [ESTADOS_ACADEMICOS.DESERTADO, ESTADOS_ACADEMICOS.RETIRADO, ESTADOS_ACADEMICOS.GRADUADO]

const CLASES = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-red-100 text-red-700',
  4: 'bg-slate-200 text-slate-700',
  5: 'bg-blue-100 text-blue-800'
}

/** Clases Tailwind de la etiqueta del estado académico. */
export function claseEstadoAcademico(estado) {
  return CLASES[estado] ?? CLASES[1]
}

/** Desertado, retirado y graduado cierran la formación. */
export function esEstadoFinal(estado) {
  return FINALES.includes(Number(estado))
}

/**
 * Explica al usuario qué pasará con la matrícula al aplicar el cambio.
 * @param {number} actual Estado académico actual
 * @param {number} nuevo  Estado elegido
 */
export function efectoDelCambio(actual, nuevo) {
  if (!nuevo || Number(nuevo) === Number(actual)) return ''
  if (esEstadoFinal(nuevo)) {
    return 'La matrícula quedará inactiva y liberará su cupo en el ciclo. La cartera pendiente se conserva.'
  }
  if (esEstadoFinal(actual)) {
    return 'La matrícula se reactivará y volverá a ocupar un cupo en el ciclo.'
  }
  if (Number(nuevo) === ESTADOS_ACADEMICOS.APLAZADO) {
    return 'El estudiante sigue matriculado, pero no aparecerá en las listas de asistencia mientras esté aplazado.'
  }
  return ''
}
