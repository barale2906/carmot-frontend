import api from './api.js'

const BASE       = '/academico/ciclos'
const BASE_CLASES = '/academico/asistencia-clases-programadas'

const cicloService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id, params = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { params })
    return data
  },

  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },

  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  async restore(id) {
    const { data } = await api.post(`${BASE}/${id}/restore`)
    return data
  },

  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/${id}/force-delete`)
    return data
  },

  async getTrashed(params = {}) {
    const { data } = await api.get(`${BASE}/trashed`, { params })
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

  async previsualizar(params = {}) {
    const { data } = await api.get(`${BASE}/previsualizar`, { params })
    return data
  },

  async asignarGrupos(id, payload, config = {}) {
    const { data } = await api.post(`${BASE}/${id}/asignar-grupos`, payload, config)
    return data
  },

  async desasignarGrupo(id, grupoId, config = {}) {
    const { data } = await api.post(`${BASE}/${id}/desasignar-grupo`, { grupo_id: grupoId }, config)
    return data
  },

  async actualizarOrdenGrupo(id, grupoId, nuevoOrden, config = {}) {
    const { data } = await api.post(`${BASE}/${id}/actualizar-orden-grupo`, { grupo_id: grupoId, nuevo_orden: nuevoOrden }, config)
    return data
  },

  async reordenarGrupos(id, nuevoOrden, config = {}) {
    const { data } = await api.post(`${BASE}/${id}/reordenar-grupos`, { nuevo_orden: nuevoOrden }, config)
    return data
  },

  async calcularFechaFin(id) {
    const { data } = await api.post(`${BASE}/${id}/calcular-fecha-fin`)
    return data
  },

  async siguienteOrden(id) {
    const { data } = await api.get(`${BASE}/${id}/siguiente-orden`)
    return data
  },

  async cronograma(id) {
    const { data } = await api.get(`${BASE}/${id}/cronograma`)
    return data
  },

  async informacionCalculo(id) {
    const { data } = await api.get(`${BASE}/${id}/informacion-calculo`)
    return data
  },

  async generarClasesProgramadas(grupoId, cicloId, config = {}) {
    const { data } = await api.post(
      `${BASE_CLASES}/generar-automaticas`,
      { grupo_id: grupoId, ciclo_id: cicloId },
      config
    )
    return data
  }
}

export default cicloService
