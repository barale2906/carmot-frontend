import { ref, computed } from 'vue'
import docTipoDocumentoService from '@/services/docTipoDocumentoService.js'

/**
 * Catálogo de tipos de documento para selectores y filtros de las vistas de
 * Documentación. Las opciones usan `value` string porque `FormSelect` emite strings.
 *
 * @param {{ soloActivos?: boolean }} [opciones]
 */
export function useDocTiposDocumento({ soloActivos = false } = {}) {
  const tipos        = ref([])
  const cargandoTipos = ref(false)

  const tiposOptions = computed(() =>
    tipos.value.map((t) => ({ value: String(t.id), label: `${t.nombre} (${t.codigo})` })),
  )

  /** @param {number|string} id */
  const tipoPorId = (id) => tipos.value.find((t) => t.id === Number(id)) ?? null

  async function loadTipos() {
    cargandoTipos.value = true
    try {
      const params = { per_page: 100, sort_by: 'nombre', sort_direction: 'asc' }
      if (soloActivos) params.status = 1
      const res = await docTipoDocumentoService.getAll(params)
      tipos.value = res.data ?? []
    } catch {
      tipos.value = []
    } finally {
      cargandoTipos.value = false
    }
  }

  return { tipos, tiposOptions, tipoPorId, cargandoTipos, loadTipos }
}
