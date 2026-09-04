import api from './api.js'

const BASE = '/inventarios/ventas'

/**
 * Servicio para registrar ventas y abonos de inventario.
 * Una venta crea un pedido; si el abono es total, el pedido avanza a entregando/entregado.
 * Usa la misma infraestructura de recibos que el módulo académico (origen = 0 INVENTARIOS).
 */
const invVentaService = {
  /**
   * Calcula sobrecargos por medio de pago sin persistir nada.
   * @param {Object} payload - { medios_pago: [{ medio_pago, tipo_tarjeta?, valor }] }
   */
  async precalcularSobrecargos(payload) {
    const { data } = await api.post(`${BASE}/precalcular-sobrecargos`, payload)
    return data
  },

  /**
   * Crea una nueva venta (pedido) con abono inicial.
   * Usar multipart/form-data (FormData) si se adjunta comprobante de transferencia.
   * @param {Object|FormData} payload
   */
  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /**
   * Registra un abono adicional a un pedido activo.
   * Usar multipart/form-data (FormData) si se adjunta comprobante.
   * @param {number} pedidoId
   * @param {Object|FormData} payload - { monto_abono, medios_pago, sobrecargos?, variantes_kit? }
   */
  async abonar(pedidoId, payload, config = {}) {
    const { data } = await api.post(`${BASE}/${pedidoId}/abonar`, payload, config)
    return data
  },

  // ── Flujo de transferencias ──────────────────────────────────────────────────

  /**
   * Notifica a los validadores que el comprobante está listo para revisión.
   * El recibo debe estar en PENDIENTE_APROBACION (status 4).
   * @param {number} reciboPagoId
   */
  async notificarTransferencia(reciboPagoId) {
    const { data } = await api.post(`${BASE}/${reciboPagoId}/notificar-transferencia`)
    return data
  },

  /**
   * Aprueba una transferencia pendiente (validador). Asigna número de recibo de inventario.
   * @param {number} reciboPagoId
   */
  async aprobarTransferencia(reciboPagoId) {
    const { data } = await api.post(`${BASE}/${reciboPagoId}/aprobar-transferencia`)
    return data
  },

  /**
   * Rechaza una transferencia pendiente (validador).
   * @param {number} reciboPagoId
   * @param {string} motivo - Requerido, máx. 500 caracteres
   */
  async rechazarTransferencia(reciboPagoId, motivo) {
    const { data } = await api.post(`${BASE}/${reciboPagoId}/rechazar-transferencia`, { motivo_rechazo: motivo })
    return data
  },

  /**
   * Reenvía una transferencia rechazada corrigiendo datos o comprobante.
   * Usar FormData si se adjunta nuevo comprobante.
   * @param {number} reciboPagoId
   * @param {Object|FormData} payload - { banco_id?, numero_transaccion?, comprobante? }
   */
  async reenviarTransferencia(reciboPagoId, payload, config = {}) {
    const { data } = await api.post(`${BASE}/${reciboPagoId}/reenviar-transferencia`, payload, config)
    return data
  },
}

export default invVentaService
