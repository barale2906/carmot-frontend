import api from './api.js'

const BASE = '/inventarios/productos'

/**
 * Servicio para gestionar el catálogo de productos de inventario.
 * Soporta productos simples, kits y grupos (variantes).
 */
const invProductoService = {
  async getAll(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** Búsqueda rápida por texto. Requiere q ≥ 3 chars. Permite filtrar por tipo. */
  async buscar(q, tipo = null) {
    const params = { q }
    if (tipo) params.tipo = tipo
    const { data } = await api.get(`${BASE}/buscar`, { params })
    return data
  },

  async getActivos(params = {}) {
    const { data } = await api.get(`${BASE}/activos`, { params })
    return data
  },

  async getTrashed() {
    const { data } = await api.get(`${BASE}/trashed`)
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

  async getPlantilla() {
    return api.get(`${BASE}/plantilla`, { responseType: 'blob' })
  },

  async importar(formData, config = {}) {
    const { data } = await api.post(`${BASE}/importar`, formData, config)
    return data
  },

  async getById(id) {
    const { data } = await api.get(`${BASE}/${id}`)
    return data
  },

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

  async restore(id) {
    const { data } = await api.post(`${BASE}/${id}/restore`)
    return data
  },

  async forceDelete(id) {
    const { data } = await api.delete(`${BASE}/${id}/force-delete`)
    return data
  },

  // ── Variantes de grupo ─────────────────────────────────────────────────────
  // Los simples se vinculan a su grupo actualizando producto_padre_id en el simple.

  async getVariantes(grupoId) {
    const { data } = await api.get(BASE, { params: { tipo: 'simple', producto_padre_id: grupoId, per_page: 200 } })
    return data
  },

  async addVariante(simpleId, grupoId) {
    // Carga el simple completo para reenviar los campos requeridos por el backend.
    const { data: existing } = await api.get(`${BASE}/${simpleId}`)
    const prod = existing.data ?? existing
    const { data } = await api.put(`${BASE}/${simpleId}`, {
      codigo:           prod.codigo,
      nombre:           prod.nombre,
      descripcion:      prod.descripcion ?? null,
      tipo:             'simple',
      categoria_id:     prod.categoria_id ?? null,
      unidad_medida_id: prod.unidad_medida_id ?? null,
      producto_padre_id: grupoId,
      status:           prod.status ?? 1,
    })
    return data
  },

  async removeVariante(simpleId) {
    const { data: existing } = await api.get(`${BASE}/${simpleId}`)
    const prod = existing.data ?? existing
    const { data } = await api.put(`${BASE}/${simpleId}`, {
      codigo:           prod.codigo,
      nombre:           prod.nombre,
      descripcion:      prod.descripcion ?? null,
      tipo:             'simple',
      categoria_id:     prod.categoria_id ?? null,
      unidad_medida_id: prod.unidad_medida_id ?? null,
      producto_padre_id: null,
      status:           prod.status ?? 1,
    })
    return data
  },

  // ── Componentes de kit ─────────────────────────────────────────────────────
  // Los kits referencian grupos via inv_kit_componentes (grupo_producto_id).

  async getComponentes(kitId) {
    const { data } = await api.get(`${BASE}/${kitId}/componentes`)
    return data
  },

  /** @param {{ grupo_producto_id: number, cantidad: number, orden?: number }} payload */
  async addComponente(kitId, payload) {
    const { data } = await api.post(`${BASE}/${kitId}/componentes`, payload)
    return data
  },

  async updateComponente(kitId, compId, payload) {
    const { data } = await api.put(`${BASE}/${kitId}/componentes/${compId}`, payload)
    return data
  },

  async deleteComponente(kitId, compId) {
    const { data } = await api.delete(`${BASE}/${kitId}/componentes/${compId}`)
    return data
  },
}

export default invProductoService
