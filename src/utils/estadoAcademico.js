/**
 * Estado académico de la matrícula (independiente del estado administrativo).
 * Replica Matricula::ESTADOS_ACADEMICOS y ESTADOS_ACADEMICOS_FINALES del backend.
 */

export const ESTADOS_ACADEMICOS = {
  ACTIVO:    1,
  APLAZADO:  2,
  DESERTADO: 3,
  RETIRADO:  4,
  GRADUADO:  5,
  REPROBADO: 6
}

export const OPCIONES_ESTADO_ACADEMICO = [
  { value: 1, label: 'Activo' },
  { value: 2, label: 'Aplazado' },
  { value: 3, label: 'Desertado' },
  { value: 4, label: 'Retirado' },
  { value: 5, label: 'Graduado' },
  { value: 6, label: 'Reprobado' }
]

const FINALES = [ESTADOS_ACADEMICOS.DESERTADO, ESTADOS_ACADEMICOS.RETIRADO, ESTADOS_ACADEMICOS.GRADUADO, ESTADOS_ACADEMICOS.REPROBADO]

/** Graduado y Reprobado cierran el ciclo cursado (Matricula::ESTADOS_ACADEMICOS_CIERRE). */
const CIERRE = [ESTADOS_ACADEMICOS.GRADUADO, ESTADOS_ACADEMICOS.REPROBADO]

const CLASES = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-red-100 text-red-700',
  4: 'bg-slate-200 text-slate-700',
  5: 'bg-blue-100 text-blue-800',
  6: 'bg-orange-100 text-orange-800'
}

/** Clases Tailwind de la etiqueta del estado académico. */
export function claseEstadoAcademico(estado) {
  return CLASES[estado] ?? CLASES[1]
}

/** Desertado, retirado, graduado y reprobado cierran la formación. */
export function esEstadoFinal(estado) {
  return FINALES.includes(Number(estado))
}

/** Graduado o Reprobado: exigen la evaluación de cierre de la matrícula. */
export function esEstadoDeCierre(estado) {
  return CIERRE.includes(Number(estado))
}

/**
 * Estados a los que se puede pasar desde el actual (misma regla del backend): de Graduado o
 * Reprobado solo se vuelve a Activo, y a ellos solo se llega desde Activo.
 * @param {number} actual Estado académico actual
 */
export function opcionesPermitidas(actual) {
  const estado = Number(actual)
  return OPCIONES_ESTADO_ACADEMICO.filter(o => {
    if (o.value === estado) return false
    if (esEstadoDeCierre(estado)) return o.value === ESTADOS_ACADEMICOS.ACTIVO
    return !esEstadoDeCierre(o.value) || estado === ESTADOS_ACADEMICOS.ACTIVO
  })
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
