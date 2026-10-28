import api from './api.js'

const ESQUEMAS       = '/academico/esquemas-calificacion'
const NOTAS          = '/academico/notas-estudiantes'
const RECUPERACIONES = '/academico/recuperaciones-notas'

/**
 * Esquemas de calificación, registro masivo de notas, sábana grupal, consulta
 * consolidada, recuperaciones y cierre de notas por ciclo.
 */
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
  },

  /** Opciones de la consulta: ciclos (con su estado de cierre), grupos, profesores y estados. */
  async getFiltros() {
    const { data } = await api.get(`${NOTAS}/filters`)
    return data
  },

  /**
   * Resultados por módulo (una fila por estudiante y grupo). Exige al menos ciclo, grupo,
   * profesor, estudiante o búsqueda; `meta.resumen` resume todo lo filtrado.
   * @param {{ ciclo_id?, grupo_id?, profesor_id?, estudiante_id?, buscar?, estado?, por_recuperar?, page?, per_page? }} params
   */
  async consolidado(params = {}) {
    const { data } = await api.get(`${NOTAS}/consolidado`, { params })
    return data
  },

  /** Estado del registro de notas del ciclo y su bitácora de cierres y reaperturas. */
  async estadoCierre(cicloId) {
    const { data } = await api.get(`${NOTAS}/ciclos/${cicloId}/cierre`)
    return data
  },

  async cerrarCiclo(cicloId) {
    const { data } = await api.post(`${NOTAS}/ciclos/${cicloId}/cerrar`)
    return data
  },

  /** Reabrir exige el permiso aca_notaReabrir y un motivo. */
  async reabrirCiclo(cicloId, motivo) {
    const { data } = await api.post(`${NOTAS}/ciclos/${cicloId}/reabrir`, { motivo })
    return data
  },

  /** Registra (o reemplaza) la recuperación de un módulo reprobado. */
  async registrarRecuperacion(payload) {
    const { data } = await api.post(RECUPERACIONES, payload)
    return data
  },

  async actualizarRecuperacion(id, payload) {
    const { data } = await api.put(`${RECUPERACIONES}/${id}`, payload)
    return data
  },

  async eliminarRecuperacion(id) {
    const { data } = await api.delete(`${RECUPERACIONES}/${id}`)
    return data
  }
}

export default calificacionService
