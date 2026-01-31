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
  }
}

