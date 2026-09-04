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

  /** Detalle completo con ítems y entregas. */
  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /** Todos los pedidos de un estudiante. */
  async getByEstudiante(estudianteId) {
    const { data } = await api.get(`${BASE}/estudiante/${estudianteId}`)
    return data
  },

  /** Cancela un pedido en status 'activo' (sin reintegro de stock). */
  async cancelar(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/cancelar`, { motivo })
    return data
  },

  /**
   * Anula un pedido en cualquier estado excepto 'cancelado'.
   * Reintegra el stock de los ítems ya entregados y genera documento DEV-.
   */
  async anular(id) {
    const { data } = await api.post(`${BASE}/${id}/anular`)
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
