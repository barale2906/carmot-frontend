import api from './api.js'

const BASE = '/academico/asistencias'

/** Toma de asistencia por clase programada y reportes de asistencia. */
const asistenciaService = {
  /** Estudiantes, ciclos vigentes y clases programadas del grupo. */
  async listaAsistencia(grupoId) {
    const { data } = await api.get(`${BASE}/lista-asistencia/${grupoId}`)
    return data
  },

  /** Asistencias ya registradas en una clase. */
  async getByClase(claseProgramadaId) {
    const { data } = await api.get(BASE, { params: { clase_programada_id: claseProgramadaId, per_page: 500 } })
    return data
  },

  /** Registra o corrige la lista completa de una clase. */
  async registrarClase(claseProgramadaId, asistencias) {
    const { data } = await api.post(`${BASE}/masivo`, { clase_programada_id: claseProgramadaId, asistencias })
    return data
  },

  async reporteGrupo(grupoId, params = {}) {
    const { data } = await api.get(`${BASE}/reporte/grupo/${grupoId}`, { params })
    return data
  }
}

export default asistenciaService
