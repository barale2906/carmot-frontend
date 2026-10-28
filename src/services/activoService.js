import api from './api.js'

const ACTIVOS    = '/activos/activos'
const CATEGORIAS = '/activos/categorias'
const TRASLADOS  = '/activos/traslados'

/** Activos fijos (por sede y área) y su catálogo de categorías. */
const activoService = {
  async getAll(params = {}) {
    const { data } = await api.get(ACTIVOS, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${ACTIVOS}/${id}`)
    return data
  },

  async create(payload) {
    const { data } = await api.post(ACTIVOS, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${ACTIVOS}/${id}`, payload)
    return data
  },

  async delete(id) {
    const { data } = await api.delete(`${ACTIVOS}/${id}`)
    return data
  },

  /** Carga o reemplaza la imagen del activo (multipart). */
  async subirImagen(id, archivo) {
    const fd = new FormData()
    fd.append('imagen', archivo)
    const { data } = await api.post(`${ACTIVOS}/${id}/imagen`, fd)
    return data
  },

  async eliminarImagen(id) {
    const { data } = await api.delete(`${ACTIVOS}/${id}/imagen`)
    return data
  },

  /**
   * Envía el activo a otra sede/área: `{ sede_id, area_id, responsable_id?, fecha, motivo }`.
   * Queda pendiente hasta que el destino registre la recepción.
   */
  async trasladar(id, payload) {
    const { data } = await api.post(`${ACTIVOS}/${id}/trasladar`, payload)
    return data
  },

  /** Cambia el estado: `{ estado, fecha, motivo }`. La baja es definitiva. */
  async cambiarEstado(id, payload) {
    const { data } = await api.post(`${ACTIVOS}/${id}/estado`, payload)
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${ACTIVOS}/filters`)
    return data
  },

  async getStatistics(params = {}) {
    const { data } = await api.get(`${ACTIVOS}/statistics`, { params })
    return data
  },

  // ── Traslados ───────────────────────────────────────────────────────────
  /** Traslados de mis sedes. Filtros: `estado`, `direccion` (entrantes|salientes), `search`. */
  async getTraslados(params = {}) {
    const { data } = await api.get(TRASLADOS, { params })
    return data
  },

  /** Registra la recepción: `{ fecha_recepcion, observaciones_recepcion?, responsable_id? }`. */
  async recibirTraslado(id, payload) {
    const { data } = await api.post(`${TRASLADOS}/${id}/recibir`, payload)
    return data
  },

  /** Cancela un traslado pendiente: `{ motivo }`. */
  async cancelarTraslado(id, payload) {
    const { data } = await api.post(`${TRASLADOS}/${id}/cancelar`, payload)
    return data
  },

  // ── Categorías ──────────────────────────────────────────────────────────
  async getCategorias(params = {}) {
    const { data } = await api.get(CATEGORIAS, { params })
    return data
  },

  async createCategoria(payload) {
    const { data } = await api.post(CATEGORIAS, payload)
    return data
  },

  async updateCategoria(id, payload) {
    const { data } = await api.put(`${CATEGORIAS}/${id}`, payload)
    return data
  },

  async deleteCategoria(id) {
    const { data } = await api.delete(`${CATEGORIAS}/${id}`)
    return data
  },

  async getCategoriasTrashed(params = {}) {
    const { data } = await api.get(`${CATEGORIAS}/trashed`, { params })
    return data
  },

  async restoreCategoria(id) {
    const { data } = await api.post(`${CATEGORIAS}/${id}/restore`)
    return data
  }
}

export default activoService
