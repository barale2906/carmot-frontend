import api from './api.js'

const BASE = '/financiero/prorrogas-pago'

/**
 * Plazos nuevos de pago (prórrogas): acuerdo verbal de hasta 15 días con un estudiante en mora para
 * dejarlo entrar a clase. No modifica la cartera; aparece en la planilla de asistencia mientras esté vigente.
 */
const prorrogaPagoService = {
  /** Listado paginado. Params: estudiante_id, estado (vigente|cumplido|incumplido), fecha_desde/fecha_hasta (fecha compromiso), page, per_page. */
  async listar(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** Registra el plazo: `{ estudiante_id, fecha_compromiso (YYYY-MM-DD, máx. 15 días), observacion? }`. */
  async crear(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** Cancela el plazo: deja de aparecer en la asistencia y el sistema no lo vigila. */
  async cancelar(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  }
}

export default prorrogaPagoService
