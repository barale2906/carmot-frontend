import api from './api.js'

const BASE = '/inventarios/listas-precios'

/**
 * Servicio para gestionar las listas de precios del módulo de inventarios (origen=0).
 * Flujo de estados: En Proceso (1) → Aprobada (2) → Activa (3) / Inactiva (0).
 * Permisos: inv_listas, inv_listasCrear, inv_listasEditar, inv_listasInactivar, inv_listasAprobar, inv_listasClonar.
 *
 * @param {Object} params - Filtros: search, status, poblacion_id, vigentes, per_page, sort_by, sort_direction
 */
const invListaPrecioService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

  /**
   * Crea una nueva lista de precios de inventario (status inicial: En Proceso).
   *
   * @param {{ nombre: string, fecha_inicio: string, fecha_fin: string, descripcion?: string, poblaciones?: number[] }} payload
   */
  async create(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /**
   * Actualiza nombre, fechas, descripción y poblaciones. Solo para listas En Proceso.
   *
   * @param {number} id
   * @param {{ nombre?: string, fecha_inicio?: string, fecha_fin?: string, descripcion?: string, poblaciones?: number[] }} payload
   */
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

  /** Aprobada → Activa */
  async activar(id) {
    const { data } = await api.post(`${BASE}/${id}/activar`)
    return data
  },

  /** Cualquier estado → Inactiva */
  async inactivar(id) {
    const { data } = await api.post(`${BASE}/${id}/inactivar`)
    return data
  },

  /**
   * Clona una lista de precios con sus precios de productos.
   *
   * @param {number} id
   * @param {{ nombre: string, fecha_inicio: string, fecha_fin: string, descripcion?: string, poblaciones?: number[], copiar_precios?: boolean }} payload
   */
  async clonar(id, payload) {
    const { data } = await api.post(`${BASE}/${id}/clonar`, payload)
    return data
  },
}

export default invListaPrecioService
