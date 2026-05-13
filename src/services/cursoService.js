import api from './api.js'

const BASE = '/academico/cursos'

const cursoService = {
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

  async duplicate(id) {
    const res = await cursoService.getById(id, { with: 'modulos' })
    const original = res.data ?? res
    const moduloIds = (original.modulos ?? []).map((m) => m.id).filter(Boolean)
    const payload = {
      nombre: `Copia de ${original.nombre}`,
      tipo: original.tipo,
      status: original.status,
      ...(moduloIds.length > 0
        ? { modulo_ids: moduloIds }
        : { duracion: original.duracion ?? 0 })
    }
    return cursoService.create(payload, { _silent: true })
  }
}

export default cursoService
