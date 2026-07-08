import api from './api.js'

const CICLOS_BASE = '/academico/ciclos'
const BASE        = '/academico/aplazamientos'
const TIPOS_BASE  = '/academico/tipos-aplazamiento'

/**
 * Servicio para la gestión de aplazamientos de ciclos académicos.
 * Todas las mutaciones usan { _silent: true } para que el componente
 * muestre los errores de validación en el formulario, sin toast duplicado.
 */
const aplazamientoService = {
  /** Aplazar un ciclo: registra el aplazamiento y mueve fechas. */
  async aplazar(cicloId, payload) {
    const { data } = await api.post(`${CICLOS_BASE}/${cicloId}/aplazar`, payload, { _silent: true })
    return data
  },

  /** Historial de aplazamientos de un ciclo (más reciente primero). */
  async getHistorial(cicloId) {
    const { data } = await api.get(`${CICLOS_BASE}/${cicloId}/aplazamientos`)
    return data
  },

  /** Confirmar: el ciclo reinició en la fecha probable exacta. */
  async confirmar(id, payload = {}) {
    const { data } = await api.post(`${BASE}/${id}/confirmar`, payload, { _silent: true })
    return data
  },

  /** Ampliar: extender a una fecha posterior; crea aplazamiento hijo. */
  async ampliar(id, payload) {
    const { data } = await api.post(`${BASE}/${id}/ampliar`, payload, { _silent: true })
    return data
  },

  /** Interrumpir: el ciclo retomó antes de la fecha probable. */
  async interrumpir(id, payload) {
    const { data } = await api.post(`${BASE}/${id}/interrumpir`, payload, { _silent: true })
    return data
  },

  /** Revertir: deshacer el aplazamiento y restaurar fechas originales. */
  async revertir(id, payload = {}) {
    const { data } = await api.post(`${BASE}/${id}/revertir`, payload, { _silent: true })
    return data
  },

  /** Listar tipos de aplazamiento (catálogo). */
  async getTipos(params = {}) {
    const { data } = await api.get(TIPOS_BASE, { params })
    return data
  },
}

export default aplazamientoService
