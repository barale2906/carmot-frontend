import api from './api.js'

const BASE = '/configuracion/poblaciones'

const poblacionService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters/options`)
    return data
  },

  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  },

  async toggleStatus(id) {
    const { data } = await api.patch(`${BASE}/${id}/toggle-status`)
    return data
  }
}

export default poblacionService
