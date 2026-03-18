import api from './api.js'

const BASE = '/academico/grupos'

const grupoService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },

  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  async restore(id) {
    const { data } = await api.post(`${BASE}/${id}/restore`)
    return data
  },

  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/${id}/force-delete`)
    return data
  },

  async getTrashed(params = {}) {
    const { data } = await api.get(`${BASE}/trashed`, { params })
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  },

  // Sub-recurso: Horarios
  async getHorarios(grupoId, params = {}) {
    const { data } = await api.get(`${BASE}/${grupoId}/horarios`, { params })
    return data
  },

  async createHorarios(grupoId, payload, config = {}) {
    const { data } = await api.post(`${BASE}/${grupoId}/horarios`, payload, config)
    return data
  },

  async updateHorarios(grupoId, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${grupoId}/horarios`, payload, config)
    return data
  },

  async deleteHorarios(grupoId) {
    const { data } = await api.delete(`${BASE}/${grupoId}/horarios`)
    return data
  },

  async getHorariosEstadisticas(grupoId) {
    const { data } = await api.get(`${BASE}/${grupoId}/horarios/estadisticas`)
    return data
  }
}

export default grupoService
