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
   * GET /financiero/lp/precios-producto/obtener-precio
   * @param {{ producto_id: number, poblacion_id: number, fecha?: string }} params
   */
  async obtenerPrecio(params = {}, config = {}) {
    const { data } = await api.get(`${BASE}/obtener-precio`, { ...config, params })
    return data
  },

  /**
   * Retorna los productos activos que aún no tienen precio definido en una lista específica.
   * GET /financiero/lp/precios-producto/sin-precio
   * @param {{ lista_precio_id: number, search?: string, per_page?: number, page?: number }} params
   * @returns {Promise<{ lista_precio_id: number, lista_nombre: string, data: object[], meta: object }>}
   */
  async sinPrecioEnLista(params = {}, config = {}) {
    const { data } = await api.get(`${BASE}/sin-precio`, { ...config, params })
    return data
  }
}

export default precioProductoService
