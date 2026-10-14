import api from './api.js'

const ESQUEMAS = '/academico/esquemas-calificacion'
const NOTAS    = '/academico/notas-estudiantes'

/** Esquemas de calificación, registro masivo de notas y sábana grupal. */
const calificacionService = {
  async getEsquemas(params = {}) {
    const { data } = await api.get(ESQUEMAS, { params })
    return data
  },

  async createEsquema(payload) {
    const { data } = await api.post(ESQUEMAS, payload)
    return data
  },

  async updateEsquema(id, payload) {
    const { data } = await api.put(`${ESQUEMAS}/${id}`, payload)
    return data
  },

  async deleteEsquema(id) {
    const { data } = await api.delete(`${ESQUEMAS}/${id}`)
    return data
  },

  /** Notas de todos los estudiantes del grupo para un tipo de nota del esquema. */
  async registrarNotas(payload) {
    const { data } = await api.post(`${NOTAS}/masivo`, payload)
    return data
  },

  /** Sábana del grupo: columnas = tipos de nota del esquema activo, filas = estudiantes. */
  async sabanaGrupal(grupoId, moduloId) {
    const { data } = await api.get(`${NOTAS}/grupo/${grupoId}/modulo/${moduloId}/sabana`)
    return data
  }
}

export default calificacionService
