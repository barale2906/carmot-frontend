import api from './api.js'

const BASE = '/inventarios/ordenes-compra'

/**
 * Servicio para gestionar las órdenes de compra de inventario.
 * Ciclo: borrador → enviada → recibida_parcial → recibida (o cancelada).
 */
const invOrdenCompraService = {
  /** Params: status, proveedor_id, almacen_id */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** OC enviadas o parcialmente recibidas listas para recepcionar. */
  async getPendientesRecepcion() {
    const { data } = await api.get(`${BASE}/pendientes-recepcion`)
    return data
  },

  /** Detalle de OC con todos sus ítems. */
  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /** Crea OC en estado borrador. */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** Actualiza OC; solo disponible en estado borrador. */
  async update(id, payload) {
    const { data } = await api.put(`${BASE}/${id}`, payload)
    return data
  },

  /** Envía la OC al proveedor (borrador → enviada). */
  async enviar(id) {
    const { data } = await api.post(`${BASE}/${id}/enviar`)
    return data
  },

  /**
   * Registra la recepción de mercancía (actualiza stock).
   * @param {number} id
   * @param {Array} items - [{ orden_item_id, cantidad_recibida, precio_costo_unitario }]
   */
  async recibir(id, items) {
    const { data } = await api.post(`${BASE}/${id}/recibir`, { items })
    return data
  },

  async cancelar(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/cancelar`, { motivo })
    return data
  },
}

export default invOrdenCompraService
