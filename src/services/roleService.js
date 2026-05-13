import api from './api.js'

const BASE = '/configuracion/roles'
const PERMISOS_BASE = '/configuracion/permisos'

const roleService = {
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

  async toggleStatus(id) {
    const { data } = await api.patch(`${BASE}/${id}/toggle-status`)
    return data
  },

  async syncPermisos(id, permissions) {
    const { data } = await api.put(`${BASE}/${id}/permisos`, { permissions })
    return data
  },

  async addPermiso(roleId, permissionId) {
    const { data } = await api.post(`${BASE}/${roleId}/permisos/${permissionId}`)
    return data
  },

  async removePermiso(roleId, permissionId) {
    const { data } = await api.delete(`${BASE}/${roleId}/permisos/${permissionId}`)
    return data
  },

  async getAllPermisos(params = {}) {
    const { data } = await api.get(PERMISOS_BASE, { params })
    return data
  }
}

export default roleService
