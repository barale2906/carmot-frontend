import api from './api.js'

const BASE = '/inventarios/precios'

/**
 * Servicio para gestionar los precios de productos de inventario.
 * Requiere lista de precios de origen=0 (inventario), status=3 (activa), con fechas vigentes.
 */
const invPrecioService = {
  /** Params: lista_precio_id, producto_id, search */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
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

  /** Todos los precios activos de un producto en las listas vigentes. */
  async getByProducto(productoId) {
    const { data } = await api.get(`${BASE}/producto/${productoId}`)
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

  /**
   * Sincroniza (upsert masivo) los precios de una lista de inventario.
   * Solo funciona en listas con status En Proceso (1).
   * Los productos no incluidos en items son eliminados (soft-delete).
   *
   * @param {number} listaId
   * @param {Array<{ producto_id: number, precio: number, observaciones?: string }>} items
   */
  async sincronizar(listaId, items) {
    const { data } = await api.post(`${BASE}/lista/${listaId}/sincronizar`, { items })
    return data
  },
}

export default invPrecioService
