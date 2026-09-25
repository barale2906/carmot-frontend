import { ref } from 'vue'
import { authService } from '@/services/authService.js'

/**
 * Permisos del usuario autenticado para mostrar u ocultar acciones en la UI.
 * El backend sigue siendo quien autoriza; esto solo evita ofrecer lo que responderá 403.
 *
 * Uso: `const { can, loadPermisos } = usePermisos()` y `loadPermisos()` en `onMounted`.
 */
export function usePermisos() {
  const permisos = ref([])

  async function loadPermisos() {
    permisos.value = await authService.getUserPermissions()
  }

  /** @param {string} permiso */
  const can = (permiso) => permisos.value.includes(permiso)

  return { permisos, can, loadPermisos }
}
