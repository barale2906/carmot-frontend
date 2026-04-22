import { ref, computed } from 'vue'
import tipoProductoService from '@/services/tipoProductoService.js'

/**
 * Carga tipos de producto activos como opciones de selector.
 * Reutilizable en TipoProductoView, ProductoView y cualquier formulario
 * que necesite seleccionar un tipo de producto LP.
 */
export function useTipoProductoSelector() {
  const tipos = ref([])
  const tiposLoading = ref(false)

  const tiposOptions = computed(() =>
    tipos.value.map((t) => ({
      value: t.id,
      label: t.nombre,
      _tipo: t
    }))
  )

  const tiposFilterOptions = computed(() => [
    { value: '', label: 'Todos los tipos' },
    ...tiposOptions.value
  ])

  async function loadTipos(extraParams = {}) {
    tiposLoading.value = true
    try {
      const res = await tipoProductoService.getAll({
        status: 1,
        sort_by: 'nombre',
        sort_direction: 'asc',
        per_page: 100,
        ...extraParams
      })
      tipos.value = res.data ?? []
    } catch {
      tipos.value = []
    } finally {
      tiposLoading.value = false
    }
  }

  /**
   * Dado un tipo_producto_id, retorna si ese tipo es financiable.
   * Útil para mostrar/ocultar campos de precio en cuotas.
   */
  function isFinanciable(tipoId) {
    const t = tipos.value.find((x) => x.id === tipoId)
    return t?.es_financiable ?? false
  }

  return { tipos, tiposLoading, tiposOptions, tiposFilterOptions, loadTipos, isFinanciable }
}
