import api from './api.js'

const BASE = '/crm/seguimientos'

/** Bitácora de seguimientos (llamadas, mensajes, visitas) de los leads del CRM. */
const seguimientoService = {
  /** Bitácora agrupada por lead: cada lead con todos sus seguimientos y el estado de cada uno. */
  async getPorLead(params = {}) {
    const { data } = await api.get(`${BASE}/por-lead`, { params })
    return data
  },

  /**
   * Excel de los seguimientos de un lapso (fecha_desde y fecha_hasta obligatorios), con los
   * mismos filtros de lead de la bitácora. Retorna el Blob del archivo.
   */
  async exportarExcel(params) {
    const response = await api.get(`${BASE}/excel`, { params, responseType: 'blob' })
    return response.data
  },

  async getByReferido(referidoId, params = {}) {
    const { data } = await api.get(`${BASE}/by-referido/${referidoId}`, { params })
    return data
  },

  /**
   * Registra un seguimiento. Acepta `estado_referido` (nuevo estado del lead) y
   * `proxima_accion` ({ tipo, fecha, hora, nota }) para dejarla programada en la agenda.
   */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  }
}

export default seguimientoService
