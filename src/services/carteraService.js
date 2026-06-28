import api from './api.js'

const BASE = '/financiero/carteras'

/**
 * Servicio para consultar y gestionar la cartera (cuentas por cobrar).
 * El módulo es principalmente de lectura; los pagos se registran a través de recibos.
 */
const carteraService = {
  /**
   * GET /financiero/carteras
   * Params: matricula_id, estudiante_id, sede_id, status, fecha_desde, fecha_hasta,
   *         solo_pendientes, solo_vencidas, sort_by, per_page, page, with
   */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * GET /financiero/carteras/{id}
   * Params: with (ej: "matricula,sede,estudiante")
   */
  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  /**
   * GET /financiero/carteras/deudas-estudiante
   * Params: estudiante_id (requerido)
   */
  async getDeudasEstudiante(params = {}) {
    const { data } = await api.get(`${BASE}/deudas-estudiante`, { params })
    return data
  },

  /**
   * GET /financiero/carteras/detalle-matricula
   * Params: matricula_id (requerido)
   * Retorna el desglose de cuotas de una matrícula.
   */
  async getDetalleMatricula(params = {}) {
    const { data } = await api.get(`${BASE}/detalle-matricula`, { params })
    return data
  },

  /**
   * GET /financiero/carteras/reportes
   */
  async getReportes(params = {}) {
    const { data } = await api.get(`${BASE}/reportes`, { params })
    return data
  },

  /**
   * POST /financiero/carteras/{id}/anular
   */
  async anular(id) {
    const { data } = await api.post(`${BASE}/${id}/anular`)
    return data
  },

  /**
   * POST /financiero/carteras/acuerdo-pago
   */
  async acuerdoPago(payload) {
    const { data } = await api.post(`${BASE}/acuerdo-pago`, payload)
    return data
  }
}

export default carteraService
