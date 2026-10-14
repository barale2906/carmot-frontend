import api from './api.js'

const BASE = '/crm/seguimientos'

/** Bitácora de seguimientos (llamadas, mensajes, visitas) de los leads del CRM. */
const seguimientoService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getByReferido(referidoId, params = {}) {
    const { data } = await api.get(`${BASE}/by-referido/${referidoId}`, { params })
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
  }
}

export default seguimientoService
