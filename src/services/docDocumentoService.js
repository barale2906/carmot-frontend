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

  /**
   * Genera de una vez los documentos vigentes que conforman una matrícula, con la
   * versión de plantilla vigente a su fecha. Se usa al terminar el wizard de
   * matrícula, antes de pasar al recibo de pago. Cada documento generado deja su
   * entrada en la bitácora; los tipos sin versión vigente llegan en `sin_plantilla`.
   *
   * @param {number} matriculaId
   * @param {Object} [config] - Config de axios (p. ej. `{ _silent: true }`).
   * @returns {Promise<{ data: {
   *   documentos: Array<{ emision_id: number, tipo_documento_id: number, codigo: string,
   *     tipo_documento: string, plantilla_id: number, version: number,
   *     fecha_referencia: string|null, contenido: string }>,
   *   sin_plantilla: Array<{ tipo_documento_id: number, codigo: string, nombre: string }>
   * }, message: string }>}
   */
  async generarMatricula(matriculaId, config = {}) {
    const { data } = await api.post(`${BASE}/matricula/${matriculaId}`, null, config)
    return data
  },

  /**
   * PDF único con la hoja de matrícula y todos los documentos vigentes que la
   * conforman, cada uno en página nueva. Registra cada documento en la bitácora.
   *
   * @param {number} matriculaId
   */
  async pdfMatricula(matriculaId) {
    return api.get(`${BASE}/matricula/${matriculaId}/pdf`, { responseType: 'blob' })
  },

  /**
   * Carga el escaneado firmado de un documento de la matrícula. Si ya había uno
   * del mismo documento, el anterior pasa a la papelera.
   * Permiso: aca_documentoSubir.
   *
   * @param {number} matriculaId
   * @param {{ archivo: File, tipo_documento_id?: number|null, descripcion?: string|null }} datos
   *   `tipo_documento_id` para un tipo; si no tiene tipo (hoja de matrícula u otro), `descripcion`.
   */
  async subirEscaneado(matriculaId, { archivo, tipo_documento_id = null, descripcion = null }) {
    const fd = new FormData()
    fd.append('archivo', archivo)
    if (tipo_documento_id) fd.append('tipo_documento_id', String(tipo_documento_id))
    else if (descripcion) fd.append('descripcion', descripcion)
    const { data } = await api.post(`${BASE}/matricula/${matriculaId}/escaneados`, fd, { _silent: true })
    return data
  },

  /**
   * Descarga el archivo de un escaneado. Retorna la respuesta completa con el blob.
   * Permiso: aca_documentos.
   *
   * @param {number} id - Id del registro en la bitácora
   */
  async descargarArchivo(id) {
    return api.get(`${BASE}/${id}/archivo`, { responseType: 'blob' })
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
