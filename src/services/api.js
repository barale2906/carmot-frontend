import axios from 'axios'
import { notify } from '@/composables/useNotification'

// Configuración base de axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status
    const data    = error.response?.data
    // Permitir que cada vista suprima la notificación automática
    // pasando { _silent: true } en la config de la petición.
    const silent  = error.config?._silent === true

    if (status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token_type')
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
      // No notificar aquí; la redirección habla por sí sola
      return Promise.reject(error)
    }

    if (!silent) {
      if (status === 403) {
        notify.error(
          data?.message ?? 'No tienes permiso para realizar esta acción.',
          'Acceso denegado'
        )
      } else if (status === 404) {
        notify.warning(
          data?.message ?? 'El recurso solicitado no fue encontrado.',
          'No encontrado'
        )
      } else if (status === 422) {
        // Errores de validación: se dejan para que la vista los muestre
        // en los campos del formulario. Solo marcamos el error globalmente
        // si la vista no manejó sus propios fieldErrors.
        // Las vistas pueden pasar { _silent: true } para evitar este toast.
        notify.warning(
          data?.message ?? 'Revisa los datos ingresados.',
          'Datos inválidos'
        )
      } else if (status >= 500) {
        notify.error(
          data?.message ?? 'Ocurrió un error en el servidor. Intenta de nuevo.',
          'Error del servidor'
        )
      } else if (!status) {
        notify.error(
          'No se pudo conectar con el servidor. Verifica tu conexión.',
          'Sin conexión'
        )
      }
    }

    return Promise.reject(error)
  }
)

export default api

