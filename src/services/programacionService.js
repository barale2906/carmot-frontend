import api from './api.js'

const BASE = '/academico/programaciones'

const programacionService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  }
}

export default programacionService
