import api from './api.js'

const BASE = '/inventarios/entregas'

/**
 * Servicio para gestionar la bandeja de entregas de inventario.
 * Cubre tanto productos simples como kits con variantes.
 */
const invEntregaService = {
  /** Pedidos en estado 'pagado' o 'entregando' pendientes de despacho. */
  async getPendientes(params = {}) {
    const { data } = await api.get(`${BASE}/pendientes`, { params })
    return data
  },

  /** Necesidades de compra pendientes (stock insuficiente al momento de la venta). */
  async getNecesidades(params = {}) {
    const { data } = await api.get(`${BASE}/necesidades`, { params })
    return data
  },

  /** Completa la entrega de un ítem simple cuando hay stock disponible. */
  async completarSimple(entregaId) {
    const { data } = await api.post(`${BASE}/simple/${entregaId}/completar`)
    return data
  },

  /**
   * Completa la entrega de un kit seleccionando la variante de cada componente tipo grupo.
   * @param {number} entregaId
   * @param {Array} componentes - [{ kit_componente_id, producto_entregado_id? }]
   */
  async completarKit(entregaId, componentes) {
    const { data } = await api.post(`${BASE}/kit/${entregaId}/completar`, { componentes })
    return data
  },
}

export default invEntregaService
