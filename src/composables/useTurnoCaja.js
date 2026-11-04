import { ref, computed } from 'vue'
import libroDiarioService from '@/services/libroDiarioService.js'

/** Clave de localStorage con el turno elegido para facturar (se recuerda entre pantallas). */
const CLAVE_TURNO_ACTIVO = 'carmot.turnoCajaActivo'

function leerSeleccion() {
  try {
    const valor = Number(localStorage.getItem(CLAVE_TURNO_ACTIVO))
    return Number.isInteger(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

function guardarSeleccion(id) {
  try {
    if (id) localStorage.setItem(CLAVE_TURNO_ACTIVO, String(id))
    else localStorage.removeItem(CLAVE_TURNO_ACTIVO)
  } catch {
    // Sin almacenamiento disponible la elección vale solo para esta sesión
  }
}

// Estado compartido por todas las pantallas: la caja elegida en "Mi caja" es la
// misma con la que se factura en recibos, ventas y abonos.
const turnos = ref([])
const meta = ref({
  puede_abrir: false,
  motivo_no_puede: null,
  sedes_disponibles: [],
  cierres_por_aprobar: [],
  cierres_rechazados: [],
})
const seleccionadoId = ref(leerSeleccion())

/**
 * Turno con el que se factura: el elegido si sigue abierto o, si no, el primero abierto.
 */
const turno = computed(() => turnos.value.find((t) => t.id === seleccionadoId.value) ?? turnos.value[0] ?? null)

/**
 * id del turno con el que se factura, para enviarlo como `turno_caja_id` en los pagos
 * y registros (obligatorio para la API cuando hay cajas abiertas en varias sedes).
 */
export function turnoCajaActivoId() {
  return turno.value?.id ?? null
}

/**
 * Turnos de caja abiertos del usuario autenticado (uno por sede).
 *
 * Los recibos y registros del libro diario solo se generan con un turno abierto. Quien
 * factura para varias sedes abre una caja en cada una y elige desde cuál factura
 * (`seleccionarTurno`); la elección se comparte entre pantallas y se recuerda.
 *
 * Uso: `const { turno, turnos, cargarTurno } = useTurnoCaja()` y `cargarTurno()` en `onMounted`.
 */
export function useTurnoCaja() {
  const cargando = ref(false)
  const error = ref('')

  const tieneTurno = computed(() => turnos.value.length > 0)
  const variasCajas = computed(() => turnos.value.length > 1)

  function seleccionarTurno(id) {
    seleccionadoId.value = id ? Number(id) : null
    guardarSeleccion(seleccionadoId.value)
  }

  async function cargarTurno() {
    cargando.value = true
    error.value = ''
    try {
      const res = await libroDiarioService.getTurnoActual()
      turnos.value = Array.isArray(res.data) ? res.data : []
      // La elección pudo cambiar en otra pestaña del navegador
      seleccionadoId.value = leerSeleccion() ?? seleccionadoId.value
      meta.value = { ...meta.value, ...(res.meta ?? {}) }
    } catch (e) {
      // Sin permiso de caja (403) no se muestra error: simplemente no hay turno
      if (e?.response?.status !== 403) {
        error.value = e?.response?.data?.message ?? 'No se pudo consultar el turno de caja.'
      }
      turnos.value = []
    } finally {
      cargando.value = false
    }
  }

  return { turno, turnos, meta, cargando, error, tieneTurno, variasCajas, seleccionarTurno, cargarTurno }
}
