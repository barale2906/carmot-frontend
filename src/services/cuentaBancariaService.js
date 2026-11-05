import api from './api.js'

const BASE = '/configuracion/cuentas-bancarias'

/**
 * Servicio para gestionar las cuentas bancarias del instituto (por sede), donde se
 * recibe el dinero de los pagos por transferencia.
 * Soporta CRUD completo, soft delete/restore y consulta de activas por sede para selectores.
 */
const cuentaBancariaService = {
  /** GET /configuracion/cuentas-bancarias — Listado paginado con filtros */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * GET /configuracion/cuentas-bancarias/activas — Cuentas activas de una sede para <select>
   * @param {number} sedeId Sede donde se recibe el pago
   */
  async getActivas(sedeId) {
    const { data } = await api.get(`${BASE}/activas`, { params: { sede_id: sedeId } })
    return data
  },

  /** GET /configuracion/cuentas-bancarias/{id} */
  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /** POST /configuracion/cuentas-bancarias */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** PUT /configuracion/cuentas-bancarias/{id} */
  async update(id, payload) {
    const { data } = await api.put(`${BASE}/${id}`, payload)
    return data
  },

  /** DELETE /configuracion/cuentas-bancarias/{id} — Soft delete; falla si tiene pagos asociados */
  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  /** GET /configuracion/cuentas-bancarias/trashed */
  async getTrashed(params = {}) {
    const { data } = await api.get(`${BASE}/trashed`, { params })
    return data
  },

  /** POST /configuracion/cuentas-bancarias/restore/{id} */
  async restore(id) {
    const { data } = await api.post(`${BASE}/restore/${id}`)
    return data
  },

  /** DELETE /configuracion/cuentas-bancarias/force/{id} — Eliminación permanente */
  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/force/${id}`)
    return data
  },

  /** GET /configuracion/cuentas-bancarias/filters/options — estados, tipos, sedes y bancos */
  async getFilterOptions() {
    const { data } = await api.get(`${BASE}/filters/options`)
    return data
  },

  /** GET /configuracion/cuentas-bancarias/statistics */
  async getStatistics() {
    const { data } = await api.get(`${BASE}/statistics`)
    return data
  },
}

export default cuentaBancariaService
