import api from './api'

/**
 * Servicio para manejo de firmas manuscritas
 * 
 * Este servicio maneja la comunicación con el backend para:
 * - Captura de firmas desde canvas
 * - Registro de nuevas firmas
 * - Verificación de integridad
 * - Obtención de firmas almacenadas
 */
export const signatureService = {
  /**
   * Registrar una nueva firma manuscrita
   * 
   * @param {Object} signatureData - Datos de la firma
   * @param {number} signatureData.userId - ID del usuario
   * @param {string} signatureData.imageBase64 - Imagen de la firma en base64 (sin data URI)
   * @param {Object} signatureData.vectorData - Datos vectoriales en formato JSON (opcional)
   * @param {number} signatureData.width - Ancho del área de firma
   * @param {number} signatureData.height - Alto del área de firma
   * @param {number} signatureData.documentId - ID del documento (opcional)
   * @param {string} signatureData.deviceType - Tipo de dispositivo (touchscreen, mouse, stylus)
   * @returns {Promise<Object>} Respuesta con información de registro y verificación
   */
  async registerSignature(signatureData) {
    try {
      // Preparar datos para envío
      const payload = {
        user_id: signatureData.userId,
        signature_image: signatureData.imageBase64, // Base64 sin data URI
        width: signatureData.width,
        height: signatureData.height,
        device_type: signatureData.deviceType || 'touchscreen'
      }

      // Agregar datos vectoriales si existen
      if (signatureData.vectorData) {
        payload.signature_data = JSON.stringify(signatureData.vectorData)
      }

      // Agregar document_id si existe
      if (signatureData.documentId) {
        payload.document_id = signatureData.documentId
      }

      const response = await api.post('/signatures/register', payload)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al registrar la firma')
      }
      
      return response.data
    } catch (error) {
      console.error('Error registrando firma:', error)
      
      // Manejar errores de validación
      if (error.response?.status === 422) {
        throw {
          message: 'Error de validación',
          errors: error.response.data.errors || {}
        }
      }
      
      throw {
        message: error.response?.data?.message || error.message || 'Error al registrar la firma',
        status: error.response?.status
      }
    }
  },

  /**
   * Verificar que una firma está correctamente almacenada
   * 
   * @param {number} signatureId - ID de la firma a verificar
   * @returns {Promise<Object>} Información detallada de verificación
   */
  async verifySignature(signatureId) {
    try {
      const response = await api.get(`/signatures/${signatureId}/verify`)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al verificar la firma')
      }
      
      return response.data
    } catch (error) {
      console.error('Error verificando firma:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al verificar la firma',
        status: error.response?.status
      }
    }
  },

  /**
   * Obtener una firma almacenada
   * 
   * @param {number} signatureId - ID de la firma
   * @returns {Promise<Object>} Datos de la firma incluyendo imagen en data URI
   */
  async getSignature(signatureId) {
    try {
      const response = await api.get(`/signatures/${signatureId}`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo firma:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al obtener la firma',
        status: error.response?.status
      }
    }
  },

  /**
   * Obtener todas las firmas de un usuario
   * 
   * @param {number} userId - ID del usuario
   * @param {number} documentId - ID del documento (opcional, para filtrar)
   * @returns {Promise<Array>} Lista de firmas
   */
  async getUserSignatures(userId, documentId = null) {
    try {
      const params = documentId ? { document_id: documentId } : {}
      const response = await api.get(`/users/${userId}/signatures`, { params })
      return response.data
    } catch (error) {
      console.error('Error obteniendo firmas:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al obtener las firmas',
        status: error.response?.status
      }
    }
  },

  /**
   * Eliminar una firma
   * 
   * @param {number} signatureId - ID de la firma a eliminar
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteSignature(signatureId) {
    try {
      const response = await api.delete(`/signatures/${signatureId}`)
      return response.data
    } catch (error) {
      console.error('Error eliminando firma:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al eliminar la firma',
        status: error.response?.status
      }
    }
  },

  /**
   * Comparar dos firmas (para autenticación)
   * 
   * @param {number} signatureId1 - ID de la primera firma
   * @param {number} signatureId2 - ID de la segunda firma
   * @returns {Promise<Object>} Resultado de la comparación con score de similitud
   */
  async compareSignatures(signatureId1, signatureId2) {
    try {
      const response = await api.post('/signatures/compare', {
        signature_id_1: signatureId1,
        signature_id_2: signatureId2
      })
      return response.data
    } catch (error) {
      console.error('Error comparando firmas:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al comparar las firmas',
        status: error.response?.status
      }
    }
  },

  /**
   * Obtener estadísticas de firmas de un usuario
   * 
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas (total, tamaño, calidad promedio, etc.)
   */
  async getSignatureStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/signatures/stats`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al obtener estadísticas',
        status: error.response?.status
      }
    }
  }
}

