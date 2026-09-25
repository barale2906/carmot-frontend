import api from './api.js'

const BASE = '/academico/documentacion/plantillas'

/**
 * Servicio de plantillas (versiones) de documento.
 * Flujo de estados: En Proceso (1) → Aprobada (2) → Activa (3) / Inactiva (0).
 * Solo las versiones En Proceso son editables (contenido y bloques).
 * El listado omite `contenido_html`: el editor siempre se carga desde `getById`.
 * Permisos: aca_docPlantillas, aca_docPlantillaCrear, aca_docPlantillaEditar,
 * aca_docPlantillaAprobar, aca_docPlantillaClonar, aca_docPlantillaInactivar.
 */
const docPlantillaService = {
  /** @param {Object} params - Filtros: tipo_documento_id, status, search, page, per_page */
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /** @param {{ tipo_documento_id: number, nombre: string, contenido_html?: string }} payload */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** @param {{ nombre?: string, contenido_html?: string }} payload */
  async update(id, payload) {
    const { data } = await api.put(`${BASE}/${id}`, payload)
    return data
  },

  async delete(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  },

  /** En Proceso → Aprobada */
  async aprobar(id) {
    const { data } = await api.post(`${BASE}/${id}/aprobar`)
    return data
  },

  /**
   * Aprobada → Activa. La versión activa anterior se cierra automáticamente.
   *
   * @param {number} id
   * @param {string|null} fechaInicio - YYYY-MM-DD; si se omite el backend usa hoy
   */
  async activar(id, fechaInicio = null) {
    const { data } = await api.post(`${BASE}/${id}/activar`, fechaInicio ? { fecha_inicio: fechaInicio } : {})
    return data
  },

  async inactivar(id) {
    const { data } = await api.post(`${BASE}/${id}/inactivar`)
    return data
  },

  /**
   * Crea un borrador nuevo a partir de la versión (copia contenido y bloques).
   *
   * @param {number} id
   * @param {{ nombre: string, contenido_html?: string }} payload
   */
  async clonar(id, payload) {
    const { data } = await api.post(`${BASE}/${id}/clonar`, payload)
    return data
  },

  /** Catálogo de bloques de consulta con su configuración guardada para la versión. */
  async getBloques(id) {
    const { data } = await api.get(`${BASE}/${id}/bloques`)
    return data
  },

  /**
   * Reemplaza la configuración de bloques: un bloque que no se envía vuelve a imprimir todas sus columnas.
   *
   * @param {number} id
   * @param {Array<{ bloque: string, columnas: string[], titulos?: Object, mostrar_resumen?: boolean }>} bloques
   */
  async syncBloques(id, bloques) {
    const { data } = await api.put(`${BASE}/${id}/bloques`, { bloques })
    return data
  },

  /** HTML con variables y bloques resueltos contra un registro real, sin emitir documento. */
  async previsualizar(id, entidadId = null) {
    const { data } = await api.post(`${BASE}/${id}/previsualizar`, entidadId ? { entidad_id: entidadId } : {})
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

  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },
}

export default docPlantillaService
