import api from './api.js'

const BASE = '/inventarios/entregas'

/**
 * Servicio para gestionar la bandeja de entregas de inventario.
 * Cubre productos simples y kits, con entregas totales o parciales.
 *
 * Las respuestas de entrega devuelven 200 aunque no se haya descargado nada
 * (p. ej. ítem con `entrega_completa` sin stock suficiente): el resultado real
 * está en `data.status`.
 */
const invEntregaService = {
  /** Pedidos en estado 'pagado' o 'entregando' con su detalle de entrega y stock. */
  async getPendientes(params = {}) {
    const { data } = await api.get(`${BASE}/pendientes`, { params })
    return data
  },

  /** Necesidades de compra pendientes (stock insuficiente para lo que falta entregar). */
  async getNecesidades(params = {}) {
    const { data } = await api.get(`${BASE}/necesidades`, { params })
    return data
  },

  /**
   * Entrega un ítem simple, total o parcialmente.
   * @param {number} entregaId
   * @param {Object} [opciones] - { cantidad?, forzar_parcial? } — sin cantidad entrega todo lo que el stock permita
   */
  async completarSimple(entregaId, opciones = {}) {
    const { data } = await api.post(`${BASE}/simple/${entregaId}/completar`, opciones)
    return data
  },

  /**
   * Recorre todo el kit y entrega lo que el stock permita ("Entregar todo lo disponible").
   * @param {number} entregaKitId
   * @param {Array} componentes - [{ kit_componente_id, producto_entregado_id? }]
   */
  async completarKit(entregaKitId, componentes) {
    const { data } = await api.post(`${BASE}/kit/${entregaKitId}/completar`, { componentes })
    return data
  },

  /**
   * Entrega solo los componentes indicados de un kit; el resto queda pendiente.
   * @param {number} entregaKitId
   * @param {Array} componentes - [{ kit_componente_id, producto_entregado_id?, cantidad? }]
   * @param {Object} [opciones] - { forzar_parcial? }
   */
  async entregarComponentes(entregaKitId, componentes, opciones = {}) {
    const { data } = await api.post(`${BASE}/kit/${entregaKitId}/entregar-componentes`, { componentes, ...opciones })
    return data
  },
}

export default invEntregaService
