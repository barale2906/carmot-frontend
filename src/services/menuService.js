import api from './api'

/**
 * Servicio para gestionar el menú dinámico de navegación
 * Consume el endpoint /api/menu que devuelve la estructura jerárquica
 * del menú según los permisos del usuario autenticado
 */
export const menuService = {
  /**
   * Caché del menú para evitar peticiones repetidas
   */
  _cachedMenu: null,

  /**
   * Obtener el menú de navegación del backend
   * El menú se filtra automáticamente según los permisos del usuario
   * @returns {Promise<Array>} Array de items del menú con estructura jerárquica
   * @throws {Object} Error con mensaje y status de HTTP
   */
  async getMenu() {
    try {
      // Retornar caché si existe
      if (this._cachedMenu) {
        return this._cachedMenu
      }

      const response = await api.get('/menu')

      // Validar estructura de respuesta
      if (response.data?.success && Array.isArray(response.data?.data)) {
        this._cachedMenu = response.data.data
        return this._cachedMenu
      }

      // Si el backend devuelve data directamente como array (sin wrapper success)
      if (Array.isArray(response.data)) {
        this._cachedMenu = response.data
        return this._cachedMenu
      }

      throw new Error('Estructura de respuesta inválida del servidor')
    } catch (error) {
      console.error('Error al obtener menú:', error)

      // Manejo específico de errores
      if (error.response?.status === 401) {
        // Token inválido o expirado
        throw {
          message: 'Sesión expirada. Por favor, inicia sesión nuevamente',
          status: 401,
          type: 'auth_error'
        }
      }

      if (error.response?.status === 403) {
        // No autorizado
        throw {
          message: 'No tienes permisos para acceder a este recurso',
          status: 403,
          type: 'permission_error'
        }
      }

      throw {
        message: error.response?.data?.message || 'Error al cargar el menú de navegación',
        status: error.response?.status || 500,
        type: 'api_error'
      }
    }
  },

  /**
   * Invalidar la caché del menú
   * Útil cuando los permisos del usuario cambian
   */
  invalidateCache() {
    this._cachedMenu = null
  },

  /**
   * Verificar si el menú está en caché
   * @returns {boolean}
   */
  isCached() {
    return this._cachedMenu !== null
  },

  /**
   * Filtrar items de menú basado en permisos específicos
   * @param {Array} menuItems - Array de items del menú
   * @param {Array} requiredPermissions - Permisos requeridos
   * @returns {Array} Items filtrados
   */
  filterByPermissions(menuItems, requiredPermissions = []) {
    if (!Array.isArray(menuItems)) {
      return []
    }

    return menuItems.filter((item) => {
      // Si no requiere permiso específico, incluir
      if (!item.permission) {
        // Procesar children recursivamente
        if (item.children && Array.isArray(item.children)) {
          item.children = this.filterByPermissions(item.children, requiredPermissions)
        }
        return true
      }

      // Si requiere permiso, verificar si está en la lista
      const hasPermission = requiredPermissions.includes(item.permission)

      if (hasPermission && item.children && Array.isArray(item.children)) {
        item.children = this.filterByPermissions(item.children, requiredPermissions)
      }

      return hasPermission
    })
  },

  /**
   * Obtener un item específico del menú por su ID
   * @param {string} itemId - ID del item a buscar
   * @param {Array} menuItems - Array donde buscar (si es null, usa caché)
   * @returns {Object|null} El item encontrado o null
   */
  getMenuItemById(itemId, menuItems = null) {
    const items = menuItems || this._cachedMenu
    if (!items) return null

    for (const item of items) {
      if (item.id === itemId) {
        return item
      }

      if (item.children && Array.isArray(item.children)) {
        const found = this.getMenuItemById(itemId, item.children)
        if (found) return found
      }
    }

    return null
  },

  /**
   * Verificar si una ruta está habilitada en el menú
   * @param {string} route - Ruta a verificar
   * @returns {boolean}
   */
  isRouteEnabled(route) {
    const item = this._cachedMenu
      ? this._getItemByRoute(route, this._cachedMenu)
      : null

    return item ? !item.disabled : true
  },

  /**
   * Obtener item por ruta (método privado)
   * @private
   */
  _getItemByRoute(route, menuItems) {
    for (const item of menuItems) {
      if (item.route === route) {
        return item
      }

      if (item.children && Array.isArray(item.children)) {
        const found = this._getItemByRoute(route, item.children)
        if (found) return found
      }
    }

    return null
  }
}
