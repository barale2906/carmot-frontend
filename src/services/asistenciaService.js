import api from './api.js'

const BASE = '/academico/asistencias'

/** Toma de asistencia por clase programada, listado filtrable (con Excel) y reportes de asistencia. */
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

  /**
   * Listado paginado con filtros: grupo_id, sede_id, curso_id, estudiante (nombre o documento),
   * fecha (un día de clase) o fecha_desde/fecha_hasta, estado, justificada. Cada registro trae `en_mora`.
   */
  async listar(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** Opciones de los filtros del listado: estados, sedes, cursos y grupos del usuario. */
  async getFiltros() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  /** Excel del listado con los mismos filtros. Retorna el Blob del archivo. */
  async exportarExcel(params = {}) {
    const response = await api.get(`${BASE}/excel`, { params, responseType: 'blob' })
    return response.data
  },

  async reporteGrupo(grupoId, params = {}) {
    const { data } = await api.get(`${BASE}/reporte/grupo/${grupoId}`, { params })
    return data
  }
}

export default asistenciaService
