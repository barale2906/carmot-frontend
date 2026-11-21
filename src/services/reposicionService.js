import api from './api.js'

const BASE = '/academico/asistencia-reposiciones'

/**
 * Reposiciones de clase: un estudiante toma una clase de su grupo en otro grupo de su curso
 * (misma semana y mismo módulo). Solo se registra y se notifica al instituto; no requiere aprobación.
 */
const reposicionService = {
  /** Listado paginado. Params: estudiante_id, grupo_id (origen o destino), fecha_desde/fecha_hasta (clase de destino), page, per_page. */
  async listar(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /**
   * Clases del estudiante en la semana de `fecha` (por defecto hoy) y, de cada una, las clases de otros
   * grupos que puede tomar. Retorna `{ data: [{ origen, reposicion_id, destinos }] }`.
   */
  async opciones(estudianteId, fecha) {
    const { data } = await api.get(`${BASE}/opciones`, { params: { estudiante_id: estudianteId, ...(fecha ? { fecha } : {}) } })
    return data
  },

  /** Registra la reposición: `{ estudiante_id, clase_origen_id, clase_destino_id, motivo? }`. */
  async crear(payload) {
    const { data } = await api.post(BASE, payload)
    return data
  },

  /** Cancela la reposición: la clase de origen vuelve a contar como falla si no se asistió. */
  async cancelar(id) {
    const { data } = await api.delete(`${BASE}/${id}`)
    return data
  }
}

export default reposicionService
