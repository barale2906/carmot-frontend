import api from './api.js'

const BASE = '/configuracion/eps'

const epsService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getActivas() {
    const { data } = await api.get(`${BASE}/activas`)
    return data
  },

  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${BASE}/${id}`, payload)
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

  async restore(id) {
    const { data } = await api.post(`${BASE}/restore/${id}`)
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
  },

  async downloadPlantilla() {
    const response = await api.get(`${BASE}/importar/plantilla`, { responseType: 'blob' })
    return response
  },

  async importar(archivo) {
    const fd = new FormData()
    fd.append('archivo', archivo)
    const { data } = await api.post(`${BASE}/importar`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  }
}

export default epsService
