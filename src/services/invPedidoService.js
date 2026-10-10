import api from './api.js'

const BASE = '/inventarios/pedidos'

/**
 * Servicio para consultar y gestionar pedidos de inventario.
 * Ciclo de status: activo → pagado → entregando → entregado (o cancelado desde activo).
 */
const invPedidoService = {
  /** Params: status, sede_id, estudiante_id, almacen_id */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * Detalle completo con ítems, entregas y recibos.
   * @param {number} id
   * @param {Object} [config] - Config de axios (p. ej. `{ _silent: true }` para no mostrar el toast de error)
   */
  async getById(id, config = {}) {
    const { data } = await api.get(`${BASE}/${id}`, config)
    return data
  },

  /** Todos los pedidos de un estudiante. */
  async getByEstudiante(estudianteId) {
    const { data } = await api.get(`${BASE}/estudiante/${estudianteId}`)
    return data
  },

  /** Cancela un pedido 'activo' (sin entregas): anula sus recibos y guarda el motivo (obligatorio). */
  async cancelar(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/cancelar`, { motivo })
    return data
  },

  /**
   * Anula un pedido en cualquier estado excepto 'cancelado'.
   * Reintegra al almacén lo entregado (documento DEV-), anula todos sus recibos y
   * guarda el motivo. 422 si algún recibo ya está cerrado en caja.
   * @param {number} id
   * @param {string} motivo - Obligatorio (5 a 500 caracteres)
   */
  async anular(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/anular`, { motivo })
    return data
  },

  /**
   * Descarga el ticket PDF del pedido como blob.
   * Usar con responseType: 'blob' o con window.open.
   */
  async descargarTicketPdf(id) {
    return api.get(`${BASE}/${id}/ticket-pdf`, { responseType: 'blob' })
  },
}

export default invPedidoService
