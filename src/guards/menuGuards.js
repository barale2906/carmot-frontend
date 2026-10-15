import { authService } from '../services/authService'
import { menuService } from '../services/menuService'
import { notify } from '../composables/useNotification'

/**
 * Guard global de pantallas (router.beforeEach).
 * - `meta.permission`: permiso (o arreglo de permisos, basta uno) exigido por la ruta; se hereda a las rutas hijas.
 * - `meta.soloPersonal`: pantalla de trabajo del personal; se niega a quien solo tiene el rol alumno.
 * Las rutas sin estas marcas (login, dashboard, perfil, ayudas) pasan directo.
 *
 * @returns {Promise<true|string>} true para continuar o la ruta a la que se redirige
 */
export async function routeAccessGuard(to) {
  const { permission, soloPersonal } = to.meta ?? {}
  if (!permission && !soloPersonal) return true

  if (!authService.isAuthenticated()) return '/'

  try {
    // getUserPermissions traga los errores; se pide el perfil primero para distinguir un fallo de red de un 403
    await authService.getUser()

    const permitido = (!permission || await authService.hasPermission(permission))
      && !(soloPersonal && await authService.esSoloEstudiante())

    if (permitido) return true

    notify.error('No tienes permiso para abrir esta pantalla.', 'Acceso denegado')
  } catch (error) {
    console.error('Error verificando acceso a la ruta:', error)
    notify.error('No se pudo verificar el acceso a la pantalla. Intenta de nuevo en un momento.', 'Error de conexión')
  }

  return '/dashboard'
}

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

/**
 * Entrada de un módulo sin pantalla propia (/financiero, /inventario, /configuracion):
 * lleva a la primera opción del módulo en el menú del usuario (F01). Si no tiene
 * ninguna, vuelve al dashboard.
 *
 * @returns {Promise<string>}
 */
export async function entrarAlModulo(to) {
  const prefijo = to.path.replace(/\/+$/, '')
  try {
    await menuService.getMenu()
    return menuService.primeraRutaBajo(prefijo) ?? '/dashboard'
  } catch {
    return '/dashboard'
  }
}
