import api from './api.js'

const BASE = '/financiero/conceptos-pago'

const conceptoPagoService = {

  /**
   * GET /financiero/conceptos-pago
   * Params: search, tipo, valor_min, valor_max, include_trashed,
   *         only_trashed, sort_by, sort_direction, per_page, page
   */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * GET /financiero/conceptos-pago/{id}
   */
  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /**
   * POST /financiero/conceptos-pago
   * Payload: { nombre, tipo, valor }
   * Config: pasar { _silent: true } para suprimir el toast global en errores 422
   */
  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /**
   * PUT /financiero/conceptos-pago/{id}
   * Payload parcial: { nombre?, tipo?, valor? }
   * Config: pasar { _silent: true } para suprimir el toast global en errores 422
   */
  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },

  /**
   * DELETE /financiero/conceptos-pago/{id}
   * Soft delete. Falla con 500 si el concepto está referenciado en recibos de pago.
   */
  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  /**
   * GET /financiero/conceptos-pago/tipos
   * Retorna: { data: { "0": "Cartera", "1": "Financiero", "2": "Inventario", "3": "Otro" } }
   * Solo requiere auth:sanctum, sin permiso adicional.
   */
  async getTipos() {
    const { data } = await api.get(`${BASE}/tipos`)
    return data
  },

  /**
   * POST /financiero/conceptos-pago/tipos/agregar
   * Payload: { tipo: string }
   * ⚠️ Los tipos agregados son temporales (memoria del proceso PHP).
   *    No usar en producción para tipos permanentes.
   */
  async agregarTipo(payload) {
    const { data } = await api.post(`${BASE}/tipos/agregar`, payload)
    return data
  }
}

export default conceptoPagoService
