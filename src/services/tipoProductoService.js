import api from './api.js'

const BASE = '/financiero/lp/tipos-producto'

const tipoProductoService = {

  /**
   * GET /financiero/lp/tipos-producto
   * Params: search, status, es_financiable, codigo, include_trashed,
   *         only_trashed, with, sort_by, sort_direction, per_page, page
   */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * GET /financiero/lp/tipos-producto/{id}
   * Params: with (ej: "productos")
   */
  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  /**
   * POST /financiero/lp/tipos-producto
   * Payload: { nombre, codigo, es_financiable?, descripcion?, status? }
   */
  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /**
   * PUT /financiero/lp/tipos-producto/{id}
   * Payload parcial: { nombre?, codigo?, es_financiable?, descripcion?, status? }
   */
  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },

  /**
   * DELETE /financiero/lp/tipos-producto/{id}
   * Soft delete. Falla con 500 si el tipo tiene productos activos vinculados.
   */
  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  }
}

export default tipoProductoService
