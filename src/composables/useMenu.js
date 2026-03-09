import { ref, onErrorCaptured } from 'vue'

/**
 * Composable para manejar errores de menú
 * Proporciona utilidades para capturar y gestionar errores en el menú
 */
export function useMenuError() {
  const menuError = ref(null)
  const isMenuError = ref(false)

  const setError = (error) => {
    isMenuError.value = true
    if (typeof error === 'string') {
      menuError.value = error
    } else if (error?.message) {
      menuError.value = error.message
    } else {
      menuError.value = 'Error desconocido al cargar el menú'
    }
  }

  const clearError = () => {
    isMenuError.value = false
    menuError.value = null
  }

  onErrorCaptured((err) => {
    console.error('Error capturado en menú:', err)
    setError(err.message || 'Error en el menú de navegación')
    return false
  })

  return {
    menuError,
    isMenuError,
    setError,
    clearError
  }
}

/**
 * Composable para manejar navegación segura del menú
 * Verifica permisos antes de navegar
 */
export function useMenuNavigation() {
  const canNavigate = async (route, hasPermission) => {
    if (!route) {
      console.warn('No route provided for navigation')
      return false
    }

    if (hasPermission === false) {
      console.warn(`Access denied to route: ${route}`)
      return false
    }

    return true
  }

  return {
    canNavigate
  }
}

/**
 * Composable para sincronizar el estado del menú
 * Mantiene sincronizado el menú entre pestañas/ventanas
 */
export function useMenuSync() {
  const MENU_STORAGE_KEY = 'carmot_menu_cache'
  const MENU_TIMESTAMP_KEY = 'carmot_menu_timestamp'
  const CACHE_DURATION = 60 * 5 // 5 minutos

  const isMenuCacheValid = () => {
    try {
      const timestamp = localStorage.getItem(MENU_TIMESTAMP_KEY)
      if (!timestamp) return false

      const now = Date.now()
      const cached = parseInt(timestamp)
      return now - cached < CACHE_DURATION * 1000
    } catch {
      return false
    }
  }

  const saveMenuToStorage = (menuData) => {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuData))
      localStorage.setItem(MENU_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.warn('Error saving menu to storage:', error)
    }
  }

  const getMenuFromStorage = () => {
    try {
      if (!isMenuCacheValid()) {
        clearMenuCache()
        return null
      }

      const cached = localStorage.getItem(MENU_STORAGE_KEY)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.warn('Error retrieving menu from storage:', error)
      clearMenuCache()
      return null
    }
  }

  const clearMenuCache = () => {
    try {
      localStorage.removeItem(MENU_STORAGE_KEY)
      localStorage.removeItem(MENU_TIMESTAMP_KEY)
    } catch {
      // Ignorar errores al limpiar
    }
  }

  return {
    saveMenuToStorage,
    getMenuFromStorage,
    clearMenuCache,
    isMenuCacheValid
  }
}
