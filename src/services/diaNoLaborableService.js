import api from './api.js'

const BASE = '/configuracion/dias-no-laborables'

const diaNoLaborableService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getCalendario(params = {}) {
    const { data } = await api.get(`${BASE}/calendario`, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  async createRango(payload, config = {}) {
    const { data } = await api.post(`${BASE}/rango`, payload, config)
    return data
  },

  async generarFestivos(payload, config = {}) {
    const { data } = await api.post(`${BASE}/generar-festivos`, payload, config)
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

  async getTrashed(params = {}) {
    const { data } = await api.get(`${BASE}/trashed`, { params })
    return data
  },

  async restore(id, config = {}) {
    const { data } = await api.post(`${BASE}/restore/${id}`, null, config)
    return data
  },

  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/force/${id}`)
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters/options`)
    return data
  },

  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  }
}

export default diaNoLaborableService
