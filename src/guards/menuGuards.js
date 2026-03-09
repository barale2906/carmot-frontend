import { authService } from '../services/authService'
import { menuService } from '../services/menuService'

/**
 * Guard de ruta para verificar autenticación
 * Redirige a login si el usuario no está autenticado
 */
export async function authGuard(to, from, next) {
  if (authService.isAuthenticated()) {
    next()
  } else {
    next('/')
  }
}

/**
 * Guard de ruta para verificar permisos específicos
 * Verifica si el usuario tiene el permiso requerido para acceder a la ruta
 */
export async function permissionGuard(to, from, next) {
  try {
    if (!authService.isAuthenticated()) {
      next('/')
      return
    }

    const requiredPermission = to.meta?.permission

    // Si no hay permiso requerido, permitir acceso
    if (!requiredPermission) {
      next()
      return
    }

    // Verificar si el usuario tiene el permiso
    const hasPermission = await authService.hasPermission(requiredPermission)

    if (hasPermission) {
      next()
    } else {
      console.warn(`Acceso denegado a ${to.path}: permiso requerido ${requiredPermission}`)
      next('/dashboard')
    }
  } catch (error) {
    console.error('Error en permission guard:', error)
    next('/dashboard')
  }
}

/**
 * Guard de ruta para verificar que la ruta está habilitada en el menú
 * Verifica el estado 'disabled' del item del menú
 */
export async function menuItemGuard(to, from, next) {
  try {
    if (!authService.isAuthenticated()) {
      next('/')
      return
    }

    // Cargar menú si no está en caché
    if (!menuService.isCached()) {
      await menuService.getMenu()
    }

    const isEnabled = menuService.isRouteEnabled(to.path)

    if (isEnabled) {
      next()
    } else {
      console.warn(`Ruta deshabilitada: ${to.path}`)
      next('/dashboard')
    }
  } catch (error) {
    console.error('Error en menu item guard:', error)
    // Permitir acceso en caso de error
    next()
  }
}

/**
 * Guard combinado: autenticación + permisos + estado del menú
 */
export async function protectedGuard(to, from, next) {
  try {
    // Verificar autenticación
    if (!authService.isAuthenticated()) {
      next('/')
      return
    }

    // Verificar permisos específicos de la ruta
    const requiredPermission = to.meta?.permission
    if (requiredPermission) {
      const hasPermission = await authService.hasPermission(requiredPermission)
      if (!hasPermission) {
        console.warn(`Acceso denegado a ${to.path}`)
        next('/dashboard')
        return
      }
    }

    // Verificar que la ruta está habilitada en el menú
    if (!menuService.isCached()) {
      await menuService.getMenu()
    }

    const isEnabled = menuService.isRouteEnabled(to.path)
    if (!isEnabled) {
      console.warn(`Ruta deshabilitada: ${to.path}`)
      next('/dashboard')
      return
    }

    next()
  } catch (error) {
    console.error('Error en protected guard:', error)
    next('/dashboard')
  }
}
