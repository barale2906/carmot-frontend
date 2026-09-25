import api from './api.js'

const BASE = '/academico/documentacion/tipos-documento'

/**
 * Servicio de tipos de documento del módulo de Documentación.
 * Un tipo define la entidad de origen, si la versión aplicable se ata a una fecha
 * y qué variables del catálogo pueden insertarse en sus plantillas.
 * Permisos: aca_docTipos, aca_docTipoCrear, aca_docTipoEditar, aca_docTipoVariables, aca_docTipoInactivar.
 */
const docTipoDocumentoService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /**
   * @param {{ codigo: string, nombre: string, descripcion?: string, entidad_type?: string|null,
   *           se_ata_fecha?: boolean, campo_fecha_referencia?: string|null, prefijo_numero: string,
   *           variables?: string[] }} payload
   */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`${BASE}/${id}`, payload)
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

  /** Opciones de estado y entidades de origen (con sus campos de fecha). */
  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  /** Catálogo de variables aplicable al tipo, marcando las habilitadas. */
  async getVariables(id) {
    const { data } = await api.get(`${BASE}/${id}/variables`)
    return data
  },

  /**
   * Reemplaza la selección de variables habilitadas: lo que no se envía queda deshabilitado.
   *
   * @param {number} id
   * @param {string[]} claves
   */
  async syncVariables(id, claves) {
    const { data } = await api.put(`${BASE}/${id}/variables`, { variables: claves })
    return data
  },
}

export default docTipoDocumentoService
