import api from './api.js'

const BASE = '/academico/documentacion/documentos'

/**
 * Servicio de documentos emitidos. El contenido de un documento es inmutable:
 * se guarda ya renderizado y el backend decide qué versión de plantilla aplica.
 * Estados: 1 = Vigente, 2 = Anulado. El listado omite `contenido_renderizado`.
 * Permisos: aca_documentos, aca_documentoGenerar, aca_documentoAnular.
 */
const docDocumentoService = {
  /** @param {Object} params - Filtros: search, status, tipo_documento_id, origen, entidad_type, entidad_id, page, per_page */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  /**
   * Emite un documento. `entidad_id` es obligatorio si el tipo declara `entidad_type`.
   *
   * @param {{ tipo_documento_id: number, entidad_id?: number|null }} payload
   */
  async generar(payload) {
    const { data } = await api.post(`${BASE}/generar`, payload)
    return data
  },

  /** Descarga el PDF (contenido congelado). Retorna la respuesta completa con el blob. */
  async descargarPdf(id) {
    return api.get(`${BASE}/${id}/pdf`, { responseType: 'blob' })
  },

  async anular(id, motivo) {
    const { data } = await api.post(`${BASE}/${id}/anular`, { motivo })
    return data
  },

  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  async getTrashed(params = {}) {
    const { data } = await api.get(`${BASE}/trashed`, { params })
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
}

export default docDocumentoService
