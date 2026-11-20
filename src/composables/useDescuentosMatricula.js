/**
 * useDescuentosMatricula
 *
 * Estado de las dos consultas que alimentan la sección de descuentos al matricular:
 *  - las programaciones (jornadas) activas de un curso en una sede, de las que sale la jornada
 *    que define los descuentos aplicables;
 *  - la vista previa de los descuentos que se activan según sede, curso, programación y precio.
 *
 * Ambas son informativas: si fallan (p. ej. sin permiso de programaciones) la matrícula
 * puede continuar sin programación ni vista previa.
 */
import { ref, computed } from 'vue'

import matriculaService     from '@/services/matriculaService.js'
import programacionService  from '@/services/programacionService.js'
import { jornadaLabel }     from '@/utils/jornadas.js'

export function useDescuentosMatricula() {
  const programaciones        = ref([])
  const programacionesLoading = ref(false)

  const preview        = ref(null)
  const previewLoading = ref(false)

  /** Opciones del selector: "Nombre — Jornada (inicio)". */
  const programacionesOpciones = computed(() =>
    programaciones.value.map((p) => ({
      value: String(p.id),
      label: [p.nombre, jornadaLabel(p.jornada)].filter(Boolean).join(' — ')
    }))
  )

  /** Programaciones activas del curso en la sede; reemplaza la lista anterior. */
  async function cargarProgramaciones(sedeId, cursoId) {
    programaciones.value = []
    if (!sedeId || !cursoId) return
    programacionesLoading.value = true
    try {
      const res = await programacionService.getAll({
        sede_id:  sedeId,
        curso_id: cursoId,
        status:   1,
        per_page: 100
      })
      programaciones.value = res.data ?? []
    } catch {
      programaciones.value = []
    } finally {
      programacionesLoading.value = false
    }
  }

  /**
   * Consulta qué descuentos se activan para el contexto dado. Sin sede, curso y ciclo
   * no consulta y limpia la vista previa.
   *
   * @param {{ sedeId, cursoId, cicloId, programacionId?, precioId?, fecha? }} contexto
   */
  async function consultarDescuentos({ sedeId, cursoId, cicloId, programacionId, precioId, fecha }) {
    if (!sedeId || !cursoId || !cicloId) { preview.value = null; return }
    previewLoading.value = true
    try {
      const res = await matriculaService.precalcularDescuentos({
        sede_id:               Number(sedeId),
        curso_id:              Number(cursoId),
        ciclo_id:              Number(cicloId),
        programacion_id:       programacionId ? Number(programacionId) : null,
        lp_precio_producto_id: precioId ? Number(precioId) : null,
        ...(fecha ? { fecha_matricula: fecha } : {})
      }, { _silent: true })
      preview.value = res?.data ?? null
    } catch {
      preview.value = null
    } finally {
      previewLoading.value = false
    }
  }

  function limpiarDescuentos() {
    preview.value = null
  }

  function limpiarProgramaciones() {
    programaciones.value = []
  }

  return {
    programaciones, programacionesLoading, programacionesOpciones, cargarProgramaciones, limpiarProgramaciones,
    preview, previewLoading, consultarDescuentos, limpiarDescuentos
  }
}
