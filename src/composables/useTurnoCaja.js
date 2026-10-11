import { ref, computed } from 'vue'
import libroDiarioService from '@/services/libroDiarioService.js'

/**
 * Estado del turno de caja del usuario autenticado.
 *
 * Los recibos y registros del libro diario solo se generan con un turno abierto;
 * este composable lo consulta para habilitar o advertir en las pantallas de pago.
 *
 * Uso: `const { turno, cargarTurno } = useTurnoCaja()` y `cargarTurno()` en `onMounted`.
 */
export function useTurnoCaja() {
  const turno = ref(null)
  const meta = ref({ puede_abrir: false, motivo_no_puede: null, sedes_disponibles: [] })
  const cargando = ref(false)
  const error = ref('')

  const tieneTurno = computed(() => !!turno.value)

  async function cargarTurno() {
    cargando.value = true
    error.value = ''
    try {
      const res = await libroDiarioService.getTurnoActual()
      turno.value = res.data ?? null
      meta.value = { ...meta.value, ...(res.meta ?? {}) }
    } catch (e) {
      // Sin permiso de caja (403) no se muestra error: simplemente no hay turno
      if (e?.response?.status !== 403) {
        error.value = e?.response?.data?.message ?? 'No se pudo consultar el turno de caja.'
      }
      turno.value = null
    } finally {
      cargando.value = false
    }
  }

  return { turno, meta, cargando, error, tieneTurno, cargarTurno }
}
