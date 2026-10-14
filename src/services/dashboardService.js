import api from './api.js'

/** Resumen del dashboard de inicio (cada sección llega según los permisos del usuario). */
const dashboardService = {
  async getResumen() {
    const { data } = await api.get('/dashboard/resumen')
    return data
  }
}

export default dashboardService
