import api from './api.js'

const BASE = '/inventarios/almacenes'

/**
 * Servicio para gestionar almacenes de inventario.
 * Incluye la gestión de cajeros asociados a cada almacén.
 */
const invAlmacenService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** Para selectores; filtrar por sede_id si se necesita. */
  async getActivos(params = {}) {
    const { data } = await api.get(`${BASE}/activos`, { params })
    return data
  },

  async getTrashed() {
    const { data } = await api.get(`${BASE}/trashed`)
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  /** Detalle con listado de cajeros asociados. */
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

  /** Sincroniza los cajeros del almacén. Payload: { user_ids: [1, 2, ...] } */
  async syncUsuarios(id, userIds) {
    const { data } = await api.post(`${BASE}/${id}/usuarios`, { user_ids: userIds })
    return data
  },
}

export default invAlmacenService
