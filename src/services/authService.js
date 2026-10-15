import api from './api'

/**
 * Servicio de autenticación
 */
export const authService = {
  /**
   * Promesa del perfil (/user) compartida durante la sesión, para no repetir la
   * petición en cada navegación ni en cada componente. Se limpia al entrar o salir.
   * @private
   */
  _userPromise: null,

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
      
      this.clearUserCache()

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
    this.clearUserCache()
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
    if (!this._userPromise) {
      this._userPromise = api.get('/user')
        .then((response) => response.data)
        .catch((error) => {
          // No dejar en caché un fallo: el siguiente llamado reintenta
          this._userPromise = null
          throw {
            message: error.response?.data?.message || 'Error al obtener información del usuario',
            status: error.response?.status
          }
        })
    }
    return this._userPromise
  },

  /**
   * Descartar el perfil en caché (al iniciar o cerrar sesión, o si cambian los permisos)
   */
  clearUserCache() {
    this._userPromise = null
  },

  /**
   * Indica si el usuario solo dicta clases (rol profesor, sin roles del personal):
   * solo ve y registra en sus propios grupos.
   * @returns {Promise<boolean>}
   */
  async esSoloProfesor() {
    const userData = await this.getUser()
    const roles = (userData.roles || []).map((r) => (typeof r === 'string' ? r : r?.name))
    return roles.includes('profesor') && roles.every((rol) => ['profesor', 'alumno'].includes(rol))
  },

  /**
   * Indica si el usuario tiene el rol superusuario: algunas acciones, como devolver un
   * aplazamiento, son solo suyas sin importar los permisos de los demás roles (N25).
   * @returns {Promise<boolean>}
   */
  async esSuperusuario() {
    const userData = await this.getUser()
    return (userData.roles || []).some((r) => (typeof r === 'string' ? r : r?.name) === 'superusuario')
  },

  /**
   * Indica si el usuario solo tiene el rol de alumno: no accede a pantallas del personal
   * aunque tenga permisos de consulta (el backend le limita los datos a los suyos).
   * @returns {Promise<boolean>}
   */
  async esSoloEstudiante() {
    const userData = await this.getUser()
    const roles = (userData.roles || []).map((r) => (typeof r === 'string' ? r : r?.name))
    return roles.length > 0 && roles.every((rol) => rol === 'alumno')
  },

  /**
   * Obtener los permisos del usuario autenticado
   * @returns {Promise<Array>} Array de permisos disponibles
   */
  async getUserPermissions() {
    try {
      const userData = await this.getUser()

      // Normaliza cada permiso a string (maneja tanto strings como objetos {name})
      const toName = (p) => (typeof p === 'string' ? p : (p?.name ?? ''))

      if (Array.isArray(userData.permissions)) {
        return userData.permissions.map(toName).filter(Boolean)
      }

      if (userData.roles && Array.isArray(userData.roles)) {
        return userData.roles.flatMap((role) => (role.permissions || []).map(toName)).filter(Boolean)
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
