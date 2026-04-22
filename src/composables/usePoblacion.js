import { ref, computed } from 'vue'
import poblacionService from '@/services/poblacionService.js'

/**
 * Composable que expone la lista de poblaciones activas como opciones
 * para selectores y grupos de checkboxes.
 *
 * Las poblaciones se cargan una sola vez (lazy) y se cachean en la instancia.
 */
export function usePoblacionSelector() {
  const poblaciones        = ref([])
  const poblacionesLoading = ref(false)

  const poblacionesOptions = computed(() =>
    poblaciones.value.map((p) => ({
      value:       p.id,
      label:       p.nombre,
      description: [p.provincia, p.pais].filter(Boolean).join(', ')
    }))
  )

  /** Carga todas las poblaciones activas (recorre páginas hasta last_page). */
  async function loadPoblaciones(force = false) {
    if (!force && poblaciones.value.length) return
    poblacionesLoading.value = true
    try {
      const perPage = 200
      let page = 1
      let lastPage = 1
      const acc = []
      do {
        const res = await poblacionService.getAll({
          status: 1,
          sort_by: 'nombre',
          sort_direction: 'asc',
          per_page: perPage,
          page
        })
        acc.push(...(res.data ?? []))
        lastPage = res.meta?.last_page ?? 1
        page += 1
      } while (page <= lastPage)
      poblaciones.value = acc
    } catch {
      poblaciones.value = []
    } finally {
      poblacionesLoading.value = false
    }
  }

  return { poblaciones, poblacionesLoading, poblacionesOptions, loadPoblaciones }
}
