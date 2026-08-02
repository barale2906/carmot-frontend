import api from './api.js'

const BASE = '/inventarios/movimientos'

/**
 * Servicio para gestionar los movimientos de inventario.
 * Tipos: entrada, ajuste, traslado, devolucion.
 */
const invMovimientoService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  /** Crea un documento de movimiento con sus líneas.
   * Payload: { tipo, almacen_id, almacen_destino_id?, referencia?, observaciones?, lineas: [...] }
   */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** Detalle del movimiento con todas sus líneas. */
  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /** Anula el movimiento revirtiendo el stock afectado. */
  async anular(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/anular`, { motivo_anulacion: motivo })
    return data
  },
}

export default invMovimientoService
