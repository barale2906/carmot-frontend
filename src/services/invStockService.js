import api from './api.js'

const BASE = '/inventarios/stock'

/**
 * Servicio para consultar y gestionar el stock de inventario.
 * El stock no se crea manualmente; se genera por movimientos y ventas.
 */
const invStockService = {
  /** Params: producto_id, almacen_id, bajo_stock */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  },

  async getPlantilla() {
    return api.get(`${BASE}/plantilla`, { responseType: 'blob' })
  },

  async importar(formData, config = {}) {
    const { data } = await api.post(`${BASE}/importar`, formData, config)
    return data
  },
}

export default invStockService
