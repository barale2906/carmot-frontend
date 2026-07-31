import api from './api.js'

const BASE = '/configuracion/bancos'

/**
 * Servicio para gestionar el catálogo de bancos.
 * Soporta CRUD completo, soft delete/restore y consulta de activos para selectores.
 */
const bancoService = {
  /** GET /configuracion/bancos — Listado paginado con filtros */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** GET /configuracion/bancos/activos — Lista plana de bancos activos para <select> */
  async getActivos() {
    const { data } = await api.get(`${BASE}/activos`)
    return data
  },

  /** GET /configuracion/bancos/{id} */
  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /** POST /configuracion/bancos */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** PUT /configuracion/bancos/{id} */
  async update(id, payload) {
    const { data } = await api.put(`${BASE}/${id}`, payload)
    return data
  },

  /** DELETE /configuracion/bancos/{id} — Soft delete; falla si tiene pagos asociados */
  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  /** GET /configuracion/bancos/trashed */
  async getTrashed(params = {}) {
    const { data } = await api.get(`${BASE}/trashed`, { params })
    return data
  },

  /** POST /configuracion/bancos/restore/{id} */
  async restore(id) {
    const { data } = await api.post(`${BASE}/restore/${id}`)
    return data
  },

  /** DELETE /configuracion/bancos/force/{id} — Eliminación permanente */
  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/force/${id}`)
    return data
  },

  /** GET /configuracion/bancos/statistics */
  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  },
}

export default bancoService
