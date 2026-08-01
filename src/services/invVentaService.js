import api from './api.js'

const BASE = '/inventarios/ventas'

/**
 * Servicio para registrar ventas y abonos de inventario.
 * Una venta crea un pedido; si el abono es total, el pedido avanza a entregando/entregado.
 */
const invVentaService = {
  /**
   * Crea una nueva venta (pedido) con abono inicial.
   * @param {Object} payload - { estudiante_id, sede_id, almacen_id, items, monto_abono, medios_pago, observaciones? }
   */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /**
   * Registra un abono adicional a un pedido activo.
   * @param {number} pedidoId
   * @param {Object} payload - { monto_abono, medios_pago }
   */
  async abonar(pedidoId, payload) {
    const { data } = await api.post(`${BASE}/${pedidoId}/abonar`, payload)
    return data
  },
}

export default invVentaService
