import { ref, computed } from 'vue'
import conceptoPagoService from '@/services/conceptoPagoService.js'

/**
 * Carga y mapea los tipos de concepto de pago para selectores.
 * Uso: formulario de creación/edición de conceptos y filtros de listado.
 */
export function useConceptoPagoTipos() {
  const tiposRaw = ref({})
  const tiposLoading = ref(false)
  const tiposError = ref('')

  const tiposOptions = computed(() =>
    Object.entries(tiposRaw.value).map(([indice, nombre]) => ({
      value: parseInt(indice),
      label: nombre
    }))
  )

  const tiposFilterOptions = computed(() => [
    { value: '', label: 'Todos los tipos' },
    ...tiposOptions.value
  ])

  async function loadTipos() {
    tiposLoading.value = true
    tiposError.value = ''
    try {
      const res = await conceptoPagoService.getTipos()
      tiposRaw.value = res.data ?? {}
    } catch {
      tiposError.value = 'No se pudieron cargar los tipos de concepto.'
    } finally {
      tiposLoading.value = false
    }
  }

  function getTipoNombre(indice) {
    return tiposRaw.value[String(indice)] ?? '—'
  }

  return { tiposRaw, tiposLoading, tiposError, tiposOptions, tiposFilterOptions, loadTipos, getTipoNombre }
}

/**
 * Carga conceptos activos como opciones de selector.
 * Uso: al agregar una línea de detalle en ReciboPagoView u otros formularios.
 */
export function useConceptoPagoSelector() {
  const conceptos = ref([])
  const conceptosLoading = ref(false)

  const conceptosOptions = computed(() =>
    conceptos.value.map((c) => ({
      value: c.id,
      label: c.nombre,
      _concepto: c
    }))
  )

  async function loadConceptos() {
    conceptosLoading.value = true
    try {
      const res = await conceptoPagoService.getAll({
        sort_by: 'nombre',
        sort_direction: 'asc',
        per_page: 100
      })
      conceptos.value = res.data ?? []
    } catch {
      conceptos.value = []
    } finally {
      conceptosLoading.value = false
    }
  }

  return { conceptos, conceptosLoading, conceptosOptions, loadConceptos }
}
