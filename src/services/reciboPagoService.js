import api from './api.js'

const BASE = '/financiero/recibos-pago'

/**
 * Servicio para gestionar recibos de pago.
 * Soporta tres modos de creación: Clásico, Modo A (distribución automática) y Modo B (explícita).
 */
const reciboPagoService = {
  /**
   * GET /financiero/recibos-pago
   * Params: search, sede_id, estudiante_id, cajero_id, matricula_id, origen, status,
   *         fecha_inicio, fecha_fin, cierre, vigentes, per_page, page, with
   */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * GET /financiero/recibos-pago/{id}
   * Params: with (ej: "sede,cajero,conceptosPago,mediosPago")
   */
  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  /**
   * POST /financiero/recibos-pago
   * Modo Clásico: incluye conceptos_pago y medios_pago
   * Modo A: incluye monto_a_distribuir
   * Modo B: incluye distribucion
   */
  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /**
   * PUT /financiero/recibos-pago/{id}
   */
  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/anular
   * Solo desde estado Creado (1). Sin body.
   */
  async anular(id) {
    const { data } = await api.post(`${BASE}/${id}/anular`)
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/cerrar
   * Payload opcional: { cierre: 42 }
   */
  async cerrar(id, payload = {}) {
    const { data } = await api.post(`${BASE}/${id}/cerrar`, payload)
    return data
  },

  /**
   * GET /financiero/recibos-pago/{id}/pdf
   * Retorna blob para descarga directa del PDF.
   */
  async getPdf(id) {
    return api.get(`${BASE}/${id}/pdf`, { responseType: 'blob' })
  },

  /**
   * POST /financiero/recibos-pago/{id}/enviar-email
   */
  async enviarEmail(id) {
    const { data } = await api.post(`${BASE}/${id}/enviar-email`)
    return data
  },

  /**
   * GET /financiero/recibos-pago/reportes
   */
  async getReportes(params = {}) {
    const { data } = await api.get(`${BASE}/reportes`, { params })
    return data
  },

  /**
   * POST /financiero/recibos-pago/precalcular-sobrecargos
   * Payload: { medios_pago: [{ medio_pago, tipo_tarjeta, valor }] }
   */
  async precalcularSobrecargos(payload) {
    const { data } = await api.post(`${BASE}/precalcular-sobrecargos`, payload)
    return data
  },

  /**
   * POST /financiero/recibos-pago/precalcular-descuento
   * Payload: { matricula_id, monto_a_pagar, fecha_transaccion? }
   * Retorna: { aplica, valor, motivo, descuento }
   */
  async precalcularDescuento(payload) {
    const { data } = await api.post(`${BASE}/precalcular-descuento`, payload)
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/agregar-medio-pago
   * Payload: { medio_pago, tipo_tarjeta, valor, referencia, banco }
   */
  async agregarMedioPago(id, payload) {
    const { data } = await api.post(`${BASE}/${id}/agregar-medio-pago`, payload)
    return data
  }
}

export default reciboPagoService
