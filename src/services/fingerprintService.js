import api from './api'

/**
 * Servicio para manejo de huellas dactilares
 * 
 * Este servicio maneja la comunicación con el backend para:
 * - Captura de huellas desde el lector
 * - Registro de nuevas huellas
 * - Verificación de integridad
 * - Autenticación biométrica
 */
export const fingerprintService = {
  /**
   * Capturar huella desde el lector
   * 
   * NOTA: Esta función debe integrarse con el SDK específico del lector de huellas.
   * La implementación varía según el fabricante (ZKTeco, Suprema, Digital Persona, etc.)
   * 
   * @param {string} deviceId - ID del dispositivo lector (opcional)
   * @returns {Promise<Object>} Objeto con template, quality_score y device_id
   */
  async captureFingerprint(deviceId = null) {
    try {
      // ============================================
      // INTEGRACIÓN CON LECTOR DE HUELLAS
      // ============================================
      // 
      // Ejemplo 1: Si el lector tiene API web local
      // const response = await fetch(`http://localhost:8080/api/capture`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ device_id: deviceId })
      // })
      // const data = await response.json()
      //
      // Ejemplo 2: Si usas un SDK JavaScript del fabricante
      // const sdk = new FingerprintSDK()
      // const result = await sdk.capture({ deviceId })
      //
      // Ejemplo 3: Si el lector se comunica vía WebUSB/WebSerial
      // const port = await navigator.serial.requestPort()
      // await port.open({ baudRate: 9600 })
      // const template = await readFingerprintFromSerial(port)
      
      // Por ahora, simulamos la captura
      // EN PRODUCCIÓN: Reemplazar con la integración real del SDK
      console.warn('⚠️ Usando captura simulada. Integrar con SDK real del lector.')
      
      // Simulación (eliminar en producción)
      return new Promise((resolve) => {
        setTimeout(() => {
          // Generar un template simulado (en producción viene del lector)
          const simulatedTemplate = btoa(
            Array.from({ length: 400 }, () => 
              String.fromCharCode(Math.floor(Math.random() * 256))
            ).join('')
          )
          
          resolve({
            template: simulatedTemplate, // Template en base64
            quality_score: 85 + Math.floor(Math.random() * 15), // 85-100
            device_id: deviceId || 'SIMULATED_DEVICE_001'
          })
        }, 2000) // Simular delay de captura
      })
      
    } catch (error) {
      console.error('Error capturando huella:', error)
      throw new Error(`Error al capturar huella: ${error.message}`)
    }
  },

  /**
   * Registrar una nueva huella dactilar en el sistema
   * 
   * @param {Object} fingerprintData - Datos de la huella
   * @param {number} fingerprintData.userId - ID del usuario
   * @param {string} fingerprintData.template - Template en base64
   * @param {number} fingerprintData.fingerPosition - Posición del dedo (1-10)
   * @param {number} fingerprintData.quality - Calidad de la captura (0-100)
   * @param {string} fingerprintData.deviceId - ID del dispositivo
   * @returns {Promise<Object>} Respuesta con información de registro y verificación
   */
  async registerFingerprint(fingerprintData) {
    try {
      const response = await api.post('/fingerprints/register', {
        user_id: fingerprintData.userId,
        fingerprint_template: fingerprintData.template, // Base64
        finger_position: fingerprintData.fingerPosition || 1,
        quality_score: fingerprintData.quality,
        device_id: fingerprintData.deviceId
      })
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al registrar la huella')
      }
      
      return response.data
    } catch (error) {
      console.error('Error registrando huella:', error)
      
      // Manejar errores de validación
      if (error.response?.status === 422) {
        throw {
          message: 'Error de validación',
          errors: error.response.data.errors || {}
        }
      }
      
      throw {
        message: error.response?.data?.message || error.message || 'Error al registrar la huella',
        status: error.response?.status
      }
    }
  },

  /**
   * Verificar que una huella está correctamente almacenada
   * 
   * Esta función verifica:
   * - Que el registro existe
   * - Que el template no está vacío
   * - Que el hash de integridad coincide
   * - Que el tamaño es válido
   * 
   * @param {number} fingerprintId - ID de la huella a verificar
   * @returns {Promise<Object>} Información detallada de verificación
   */
  async verifyFingerprint(fingerprintId) {
    try {
      const response = await api.get(`/fingerprints/${fingerprintId}/verify`)
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al verificar la huella')
      }
      
      return response.data
    } catch (error) {
      console.error('Error verificando huella:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al verificar la huella',
        status: error.response?.status
      }
    }
  },

  /**
   * Autenticar usuario usando huella dactilar
   * 
   * @param {string} template - Template de la huella en base64
   * @param {number} userId - ID del usuario a autenticar
   * @returns {Promise<Object>} Resultado de autenticación
   */
  async authenticateWithFingerprint(template, userId) {
    try {
      const response = await api.post('/fingerprints/authenticate', {
        fingerprint_template: template,
        user_id: userId
      })
      
      return response.data
    } catch (error) {
      console.error('Error en autenticación:', error)
      
      if (error.response?.status === 401) {
        throw {
          message: 'Huella no coincide o usuario no encontrado',
          authenticated: false
        }
      }
      
      throw {
        message: error.response?.data?.message || error.message || 'Error en autenticación biométrica',
        authenticated: false,
        status: error.response?.status
      }
    }
  },

  /**
   * Obtener todas las huellas registradas de un usuario
   * 
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de huellas con información de verificación
   */
  async getUserFingerprints(userId) {
    try {
      const response = await api.get(`/users/${userId}/fingerprints`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo huellas:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al obtener las huellas',
        status: error.response?.status
      }
    }
  },

  /**
   * Eliminar una huella dactilar
   * 
   * @param {number} fingerprintId - ID de la huella a eliminar
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteFingerprint(fingerprintId) {
    try {
      const response = await api.delete(`/fingerprints/${fingerprintId}`)
      return response.data
    } catch (error) {
      console.error('Error eliminando huella:', error)
      throw {
        message: error.response?.data?.message || error.message || 'Error al eliminar la huella',
        status: error.response?.status
      }
    }
  },

  /**
   * Obtener estadísticas de huellas de un usuario
   * 
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas (total, activas, válidas, etc.)
   */
  async getFingerprintStats(userId) {
    try {
      const response = await api.get(`/users/${userId}/fingerprints/stats`)
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

