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
   * Solo desde estado Creado (1). Requiere motivo_anulacion.
   */
  async anular(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/anular`, { motivo_anulacion: motivo })
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
  },

  /**
   * DELETE /financiero/recibos-pago/{id}
   * Solo funciona si el recibo está en status 4 (pendiente) o 5 (rechazado).
   */
  async eliminar(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  // ── Flujo de transferencias ──────────────────────────────────────────────────

  /**
   * GET /financiero/recibos-pago/pendientes-transferencia
   * Requiere permiso fin_reciboPagoAprobar. Devuelve recibos en status 4 (FIFO).
   * Params opcionales: sede_id, per_page
   */
  async getPendientesTransferencia(params = {}) {
    const { data } = await api.get(`${BASE}/pendientes-transferencia`, { params })
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/notificar-transferencia
   * Notifica a los validadores que el comprobante está listo para revisión.
   */
  async notificarTransferencia(id) {
    const { data } = await api.post(`${BASE}/${id}/notificar-transferencia`)
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/aprobar-transferencia
   * Distribuye el pago, asigna número de recibo y cierra el recibo (status → 2).
   */
  async aprobarTransferencia(id) {
    const { data } = await api.post(`${BASE}/${id}/aprobar-transferencia`)
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/rechazar-transferencia
   * Payload: { motivo_rechazo } (requerido, máx. 500 chars)
   */
  async rechazarTransferencia(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/rechazar-transferencia`, { motivo_rechazo: motivo })
    return data
  },

  /**
   * POST /financiero/recibos-pago/{id}/reenviar-transferencia
   * Corrige un recibo rechazado (status 5) y lo reenvía a aprobación.
   * Payload (multipart/form-data): banco_id?, numero_transaccion?, comprobante?
   */
  async reenviarTransferencia(id, payload, config = {}) {
    const { data } = await api.post(`${BASE}/${id}/reenviar-transferencia`, payload, config)
    return data
  },
}

export default reciboPagoService
