import api from './api.js'

/**
 * Estudiantes para los flujos de operación (matrícula, ventas, recibos).
 * Usa /academico/estudiantes, accesible con permisos de matrícula, venta o cobro;
 * /configuracion/users es exclusivo del superusuario (B49).
 */
const BASE = '/academico/estudiantes'

const estudianteService = {
  /**
   * Busca por nombre, correo o documento. Por defecto excluye al personal que no estudia;
   * `solo_personal` busca solo personal e `incluir_personal` (solo con aca_matriculaCrear)
   * busca a cualquier persona, para matricular a alguien del personal.
   * @param {{ search?: string, per_page?: number, solo_personal?: 0|1, incluir_personal?: 0|1 }} params
   */
  async buscar(params = {}, config = {}) {
    const { data } = await api.get(BASE, { params, ...config })
    return data
  },

  async getById(id, config = {}) {
    const { data } = await api.get(`${BASE}/${id}`, config)
    return data
  },

  /** Registra un estudiante (queda con el rol alumno). */
  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /** Corrige los datos de identificación de un estudiante. */
  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },
}

export default estudianteService
