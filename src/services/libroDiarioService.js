import api from './api.js'

const BASE = '/financiero/libro-diario'

/**
 * Servicio del módulo Libro Diario: turnos de caja, movimientos (egresos y otros
 * ingresos), consignaciones, soportes, catálogos y el libro unificado por sede.
 */
const libroDiarioService = {
  // ─── Libro unificado ────────────────────────────────────────────────────────

  /** GET /libro-diario — Registros (recibos, movimientos, consignaciones). Params: sede_id, fecha_desde, fecha_hasta, origen, naturaleza, search, page */
  async getLibro(params = {}) {
    const { data } = await api.get(BASE, { params })
    return data
  },

  /** GET /libro-diario/resumen — Totales por sede para el rango de fechas */
  async getResumen(params = {}) {
    const { data } = await api.get(`${BASE}/resumen`, { params })
    return data
  },

  /** GET /libro-diario/filters — Catálogos y opciones de enumerados del módulo */
  async getFilters() {
    const { data } = await api.get(`${BASE}/filters`)
    return data
  },

  // ─── Turnos de caja ─────────────────────────────────────────────────────────

  /** GET /libro-diario/turnos/actual — Turno abierto del usuario (o si puede abrir uno) */
  async getTurnoActual() {
    const { data } = await api.get(`${BASE}/turnos/actual`)
    return data
  },

  /** GET /libro-diario/turnos — Historial de turnos (propios o de sus sedes según permiso) */
  async getTurnos(params = {}) {
    const { data } = await api.get(`${BASE}/turnos`, { params })
    return data
  },

  /** GET /libro-diario/turnos/{id} — Turno con resumen y bitácora */
  async getTurno(id) {
    const { data } = await api.get(`${BASE}/turnos/${id}`)
    return data
  },

  /** POST /libro-diario/turnos — Abre el turno con la base inicial */
  async abrirTurno(payload) {
    const { data } = await api.post(`${BASE}/turnos`, payload)
    return data
  },

  /** POST /libro-diario/turnos/{id}/cerrar — Cierre ciego con el efectivo contado; queda Por aprobar */
  async cerrarTurno(id, payload) {
    const { data } = await api.post(`${BASE}/turnos/${id}/cerrar`, payload)
    return data
  },

  /** POST /libro-diario/turnos/{id}/aprobar — Aprueba un cierre Por aprobar */
  async aprobarTurno(id, observaciones = null) {
    const { data } = await api.post(`${BASE}/turnos/${id}/aprobar`, { observaciones })
    return data
  },

  /** POST /libro-diario/turnos/{id}/rechazar — Rechaza el cierre: el turno vuelve a Abierto */
  async rechazarTurno(id, motivo) {
    const { data } = await api.post(`${BASE}/turnos/${id}/rechazar`, { motivo })
    return data
  },

  /** POST /libro-diario/turnos/{id}/reversar — Reabre un turno cerrado */
  async reversarTurno(id, motivo) {
    const { data } = await api.post(`${BASE}/turnos/${id}/reversar`, { motivo })
    return data
  },

  /** GET /libro-diario/turnos/{id}/pdf — Respuesta completa con el blob del cierre */
  pdfTurno(id) {
    return api.get(`${BASE}/turnos/${id}/pdf`, { responseType: 'blob' })
  },

  // ─── Autorizaciones ─────────────────────────────────────────────────────────

  /** GET /libro-diario/autorizaciones */
  async getAutorizaciones(params = {}) {
    const { data } = await api.get(`${BASE}/autorizaciones`, { params })
    return data
  },

  /** POST /libro-diario/autorizaciones — Permite a un cajero abrir otro turno hoy */
  async autorizarTurno(payload) {
    const { data } = await api.post(`${BASE}/autorizaciones`, payload)
    return data
  },

  // ─── Movimientos ────────────────────────────────────────────────────────────

  /** GET /libro-diario/movimientos */
  async getMovimientos(params = {}) {
    const { data } = await api.get(`${BASE}/movimientos`, { params })
    return data
  },

  /** GET /libro-diario/movimientos/{id} */
  async getMovimiento(id) {
    const { data } = await api.get(`${BASE}/movimientos/${id}`)
    return data
  },

  /** POST /libro-diario/movimientos */
  async crearMovimiento(payload) {
    const { data } = await api.post(`${BASE}/movimientos`, payload)
    return data
  },

  /** PUT /libro-diario/movimientos/{id} */
  async actualizarMovimiento(id, payload) {
    const { data } = await api.put(`${BASE}/movimientos/${id}`, payload)
    return data
  },

  /** POST /libro-diario/movimientos/{id}/anular */
  async anularMovimiento(id, motivo) {
    const { data } = await api.post(`${BASE}/movimientos/${id}/anular`, { motivo })
    return data
  },

  // ─── Consignaciones ─────────────────────────────────────────────────────────

  /** GET /libro-diario/consignaciones */
  async getConsignaciones(params = {}) {
    const { data } = await api.get(`${BASE}/consignaciones`, { params })
    return data
  },

  /** GET /libro-diario/consignaciones/{id} */
  async getConsignacion(id) {
    const { data } = await api.get(`${BASE}/consignaciones/${id}`)
    return data
  },

  /** POST /libro-diario/consignaciones */
  async crearConsignacion(payload) {
    const { data } = await api.post(`${BASE}/consignaciones`, payload)
    return data
  },

  /** PUT /libro-diario/consignaciones/{id} */
  async actualizarConsignacion(id, payload) {
    const { data } = await api.put(`${BASE}/consignaciones/${id}`, payload)
    return data
  },

  /** POST /libro-diario/consignaciones/{id}/anular */
  async anularConsignacion(id, motivo) {
    const { data } = await api.post(`${BASE}/consignaciones/${id}/anular`, { motivo })
    return data
  },

  // ─── Soportes ───────────────────────────────────────────────────────────────

  /**
   * POST /libro-diario/soportes (multipart)
   * @param {'movimiento'|'consignacion'} soportableTipo
   * @param {number} soportableId
   * @param {string} tipo - factura, recibo, comprobante, otro
   * @param {File} archivo
   */
  async subirSoporte(soportableTipo, soportableId, tipo, archivo) {
    const fd = new FormData()
    fd.append('soportable_tipo', soportableTipo)
    fd.append('soportable_id', soportableId)
    fd.append('tipo', tipo)
    fd.append('archivo', archivo)
    const { data } = await api.post(`${BASE}/soportes`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  },

  /** GET /libro-diario/soportes/{id}/archivo — Respuesta completa con el blob */
  descargarSoporte(id) {
    return api.get(`${BASE}/soportes/${id}/archivo`, { responseType: 'blob' })
  },

  /** DELETE /libro-diario/soportes/{id} */
  async eliminarSoporte(id) {
    const { data } = await api.delete(`${BASE}/soportes/${id}`)
    return data
  },

  // ─── Catálogos ──────────────────────────────────────────────────────────────

  /** GET /libro-diario/{catalogo} — catalogo: 'tipos-movimiento' | 'impuestos' */
  async getCatalogo(catalogo, params = {}) {
    const { data } = await api.get(`${BASE}/${catalogo}`, { params })
    return data
  },

  /** GET /libro-diario/{catalogo}/activos — Lista plana para selectores */
  async getCatalogoActivos(catalogo, params = {}) {
    const { data } = await api.get(`${BASE}/${catalogo}/activos`, { params })
    return data
  },

  /** POST /libro-diario/{catalogo} */
  async crearCatalogo(catalogo, payload) {
    const { data } = await api.post(`${BASE}/${catalogo}`, payload)
    return data
  },

  /** PUT /libro-diario/{catalogo}/{id} */
  async actualizarCatalogo(catalogo, id, payload) {
    const { data } = await api.put(`${BASE}/${catalogo}/${id}`, payload)
    return data
  },

  /** DELETE /libro-diario/{catalogo}/{id} — Soft delete */
  async eliminarCatalogo(catalogo, id) {
    const { data } = await api.delete(`${BASE}/${catalogo}/${id}`)
    return data
  },

  /** GET /libro-diario/{catalogo}/trashed */
  async getCatalogoTrashed(catalogo) {
    const { data } = await api.get(`${BASE}/${catalogo}/trashed`)
    return data
  },

  /** POST /libro-diario/{catalogo}/{id}/restore */
  async restaurarCatalogo(catalogo, id) {
    const { data } = await api.post(`${BASE}/${catalogo}/${id}/restore`)
    return data
  },
}

export default libroDiarioService
