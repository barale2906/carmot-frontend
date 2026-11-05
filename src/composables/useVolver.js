import { unref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, onBeforeRouteLeave }   from 'vue-router'
import { useConfirm }                      from '@/composables/useConfirm.js'

/** Ruta del login: las salidas forzadas (sesión vencida, logout) nunca se interrumpen. */
const RUTA_LOGIN = '/'

/**
 * True si la app tiene una pantalla propia a la cual retroceder.
 * Vue Router guarda en `history.state.back` la ruta anterior; es `null` cuando la
 * pantalla se abrió directo (URL pegada, pestaña nueva, recarga tras login).
 *
 * @param {object|null} state  `window.history.state`
 */
export function puedeRetroceder(state) {
  return Boolean(state?.back)
}

/**
 * Navegación de salida estándar para pantallas que son formularios (ruta propia).
 *
 * - `volver()`: botón "Volver"/"Cancelar". Regresa a la pantalla anterior; si no la
 *   hay, va a `respaldo` (nunca saca al usuario de la aplicación).
 * - Con `hayCambios`, cualquier salida (botón, menú, pestañas o el "atrás" del
 *   navegador) pide confirmación antes de descartar lo diligenciado.
 * - Recargar o cerrar la pestaña con cambios muestra el aviso nativo del navegador.
 * - `permitirSalida()`: desactiva la confirmación, p. ej. después de guardar y
 *   antes de redirigir al listado.
 *
 * @param {object}  opciones
 * @param {string|object|import('vue').Ref|Function} opciones.respaldo  Ruta a la que ir cuando no hay historial
 * @param {import('vue').Ref<boolean>|Function} [opciones.hayCambios]  Formulario con datos sin guardar
 * @param {string} [opciones.mensaje]  Texto de la confirmación
 */
export function useVolver({ respaldo, hayCambios = null, mensaje = 'Hay información sin guardar en el formulario. ¿Salir de todos modos?' }) {
  const router      = useRouter()
  const { confirm } = useConfirm()
  let   salidaLibre = false

  const leer = (valor) => (typeof valor === 'function' ? valor() : unref(valor))

  function volver() {
    if (puedeRetroceder(window.history.state)) router.back()
    else router.push(leer(respaldo))
  }

  function permitirSalida() {
    salidaLibre = true
  }

  if (hayCambios) {
    onBeforeRouteLeave((to) => {
      if (salidaLibre || to.path === RUTA_LOGIN || !leer(hayCambios)) return true
      return confirm(mensaje, { title: 'Cambios sin guardar', confirmLabel: 'Salir sin guardar' })
    })

    // Fuera del router (recarga, cierre de pestaña) solo existe el diálogo nativo
    const avisarAlDescargar = (event) => {
      if (salidaLibre || !leer(hayCambios)) return
      event.preventDefault()
      event.returnValue = ''
    }
    onMounted(() => window.addEventListener('beforeunload', avisarAlDescargar))
    onBeforeUnmount(() => window.removeEventListener('beforeunload', avisarAlDescargar))
  }

  return { volver, permitirSalida }
}
