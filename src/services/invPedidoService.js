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

  /** Cancela un pedido en status 'activo'. */
  async cancelar(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/cancelar`, { motivo })
    return data
  },
}

export default invPedidoService
