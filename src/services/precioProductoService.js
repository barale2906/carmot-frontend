import api from './api.js'

const BASE = '/financiero/lp/precios-producto'

const precioProductoService = {
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

  /**
   * Consulta el precio vigente para un producto y una población.
   * Endpoint clave para el proceso de matrícula.
   * @param {{ producto_id: number, poblacion_id: number, fecha?: string }} params
   */
  async obtenerPrecio(params = {}) {
    const { data } = await api.get(`${BASE}/obtener-precio`, { params })
    return data
  }
}

export default precioProductoService
