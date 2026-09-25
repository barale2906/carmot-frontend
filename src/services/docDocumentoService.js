import api from './api.js'

const BASE = '/academico/documentacion/documentos'

/**
 * Servicio de impresión de documentos. Nada del documento se almacena: cada
 * `render`/`pdf` lo arma con los datos actuales del registro y el backend
 * decide qué versión de plantilla aplica. Cada impresión deja una entrada en la
 * bitácora (`getAll`), que no guarda contenido.
 * Origen de una entrada: 0 = Impresión generada, 1 = Archivo subido.
 * Permisos: aca_documentos, aca_documentoGenerar, aca_documentoAnular (papelera).
 */
const docDocumentoService = {
  /** @param {Object} params - Filtros: search (nombre de archivo), tipo_documento_id, origen, entidad_type, entidad_id, page, per_page */
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
   * Arma el documento y devuelve su HTML para mostrarlo en pantalla.
   * `entidad_id` es obligatorio si el tipo declara `entidad_type`.
   *
   * @param {{ tipo_documento_id: number, entidad_id?: number|null }} params
   * @returns {Promise<{ data: { emision_id: number, tipo_documento: string, plantilla_id: number,
   *           version: number, fecha_referencia: string|null, contenido: string } }>}
   */
  async render(params) {
    const { data } = await api.get(`${BASE}/render`, { params })
    return data
  },

  /**
   * Arma el documento y lo devuelve en PDF. Retorna la respuesta completa con el blob.
   *
   * @param {{ tipo_documento_id: number, entidad_id?: number|null }} params
   */
  async pdf(params) {
    return api.get(`${BASE}/pdf`, { params, responseType: 'blob' })
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
