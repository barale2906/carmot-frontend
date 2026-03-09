import api from './api'

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise} Respuesta con access_token y token_type
   */
  async login(email, password) {
    try {
      const response = await api.post('/login', {
        email,
        password
      })
      
      // Guardar token en localStorage
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
        localStorage.setItem('token_type', response.data.token_type || 'Bearer')
      }
      
      return response.data
    } catch (error) {
      // Manejar errores de validación
      if (error.response?.status === 422) {
        const errors = error.response.data.errors || {}
        throw {
          message: 'Error de validación',
          errors: errors
        }
      }
      
      // Otros errores
      throw {
        message: error.response?.data?.message || 'Error al iniciar sesión',
        status: error.response?.status
      }
    }
  },

  /**
   * Cerrar sesión
   * @returns {Promise}
   */
  async logout() {
    try {
      await api.post('/logout')
      // Limpiar tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('token_type')
      return true
    } catch (error) {
      // Aunque falle, limpiar tokens localmente
      localStorage.removeItem('access_token')
      localStorage.removeItem('token_type')
      throw error
    }
  },

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  },

  /**
   * Obtener el token de acceso
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('access_token')
  },

  /**
   * Obtener información del usuario autenticado
   * @returns {Promise} Datos del usuario
   */
  async getUser() {
    try {
      const response = await api.get('/user')
      return response.data
    } catch (error) {
      throw {
        message: error.response?.data?.message || 'Error al obtener información del usuario',
        status: error.response?.status
      }
    }
  },

  /**
   * Obtener los permisos del usuario autenticado
   * @returns {Promise<Array>} Array de permisos disponibles
   */
  async getUserPermissions() {
    try {
      // Primero intentar obtener los permisos del endpoint específico
      // Si no existe, extraerlos de la respuesta del usuario
      const userData = await this.getUser()

      if (Array.isArray(userData.permissions)) {
        return userData.permissions
      }

      // Si es un objeto con un array de permisos dentro
      if (userData.roles && Array.isArray(userData.roles)) {
        // Extraer permisos de los roles si está disponible
        return userData.roles.flatMap((role) => role.permissions || [])
      }

      return []
    } catch (error) {
      console.error('Error al obtener permisos:', error)
      return []
    }
  },

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string|Array} permission - Permiso(s) a verificar
   * @returns {Promise<boolean>}
   */
  async hasPermission(permission) {
    try {
      const permissions = await this.getUserPermissions()

      if (Array.isArray(permission)) {
        // Si es un array, verificar si tiene al menos uno
        return permission.some((perm) => permissions.includes(perm))
      }

      return permissions.includes(permission)
    } catch (error) {
      console.error('Error al verificar permiso:', error)
      return false
    }
  },

  /**
   * Verificar si el usuario tiene todos los permisos especificados
   * @param {Array} permissions - Array de permisos a verificar
   * @returns {Promise<boolean>}
   */
  async hasAllPermissions(permissions) {
    try {
      const userPermissions = await this.getUserPermissions()

      return permissions.every((perm) => userPermissions.includes(perm))
    } catch (error) {
      console.error('Error al verificar permisos:', error)
      return false
    }
  },

  /**
   * Obtener el rol del usuario autenticado
   * @returns {Promise<string|null>}
   */
  async getUserRole() {
    try {
      const userData = await this.getUser()

      if (userData.role) {
        return userData.role
      }

      if (userData.roles && Array.isArray(userData.roles) && userData.roles.length > 0) {
        return userData.roles[0].name || userData.roles[0]
      }

      return null
    } catch (error) {
      console.error('Error al obtener rol del usuario:', error)
      return null
    }
  },

  /**
   * Verificar si el usuario es administrador
   * @returns {Promise<boolean>}
   */
  async isAdmin() {
    try {
      const role = await this.getUserRole()
      return role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'administrador'
    } catch (error) {
      console.error('Error al verificar si es admin:', error)
      return false
    }
  }
}

