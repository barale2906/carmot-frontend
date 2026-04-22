import api from './api.js'

const BASE = '/financiero/lp/listas-precios'

const listaPrecioService = {
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

  async aprobar(id) {
    const { data } = await api.post(`${BASE}/${id}/aprobar`)
    return data
  },

  async activar(id) {
    const { data } = await api.post(`${BASE}/${id}/activar`)
    return data
  },

  async inactivar(id) {
    const { data } = await api.post(`${BASE}/${id}/inactivar`)
    return data
  }
}

export default listaPrecioService
