import api from './api.js'

const BASE = '/financiero/lp/producto-referencias'

const productoReferenciaService = {
  /**
   * Listar referencias (con filtros opcionales).
   * GET /financiero/lp/producto-referencias
   * @param {{ lp_producto_id?: number, with_producto?: boolean, per_page?: number, page?: number }} params
   */
  async getAll(params = {}, config = {}) {
    const { data } = await api.get(BASE, { ...config, params })
    return data
  },

  /**
   * Vincular un único curso/módulo a un producto.
   * POST /financiero/lp/producto-referencias
   * @param {{ lp_producto_id: number, referencia_id: number, referencia_tipo: 'curso'|'modulo' }} payload
   */
  async vincular(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /**
   * Sincronizar (reemplazar completamente) las referencias de un producto.
   * Ideal para guardar una selección completa desde checkbox/selector.
   * Enviar referencias: [] desvincula todo.
   * PUT /financiero/lp/producto-referencias/sync
   * @param {{ lp_producto_id: number, referencias: Array<{ referencia_id: number, referencia_tipo: string }> }} payload
   */
  async sync(payload, config = {}) {
    const { data } = await api.put(`${BASE}/sync`, payload, config)
    return data
  },

  /**
   * Desvincular una referencia por el id del vínculo (no del curso/módulo).
   * DELETE /financiero/lp/producto-referencias/{id}
   * @param {number} id ID del registro en lp_producto_referencias
   */
  async desvincular(id, config = {}) {
    const { data } = await api.delete(`${BASE}/${id}`, config)
    return data
  }
}

export default productoReferenciaService
