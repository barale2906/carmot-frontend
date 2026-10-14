import api from './api.js'

const BASE = '/crm/agendas'

/** Citas agendadas con los leads del CRM. */
const agendaService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
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

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters/options`)
    return data
  },

  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  }
}

export default agendaService
