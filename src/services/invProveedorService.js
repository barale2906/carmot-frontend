import api from './api.js'

const BASE = '/inventarios/proveedores'

/**
 * Servicio para gestionar el catálogo de proveedores de inventario.
 */
const invProveedorService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getActivos() {
    const { data } = await api.get(`${BASE}/activos`)
    return data
  },

  async getTrashed() {
    const { data } = await api.get(`${BASE}/trashed`)
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
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

  async restore(id) {
    const { data } = await api.post(`${BASE}/${id}/restore`)
    return data
  },

  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/${id}/force-delete`)
    return data
  },
}

export default invProveedorService
