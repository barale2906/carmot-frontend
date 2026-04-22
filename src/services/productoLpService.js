import api from './api.js'

const BASE = '/financiero/lp/productos'

/** Extrae filas del índice GET (array o envoltorio Laravel). */
function extractIndexRows(body) {
  if (body == null) return []
  if (Array.isArray(body)) return body
  const d = body.data
  if (Array.isArray(d)) return d
  if (d && typeof d === 'object') return Object.values(d)
  return []
}

function normalizeProductoRow(p) {
  if (!p || typeof p !== 'object') return p
  return {
    ...p,
    tipo_producto: p.tipo_producto ?? p.tipoProducto
  }
}

async function getAllRequest(params = {}, axiosConfig = {}) {
  const { data } = await api.get(BASE, { ...axiosConfig, params })
  return data
}

/**
 * Recorre todas las páginas del listado GET /financiero/lp/productos.
 * Parámetros alineados con docs/guia/producto.md (search, status, tipo_producto_id,
 * referencia_tipo, referencia_id, es_financiable, codigo, with, sort_by, sort_direction, per_page).
 *
 * @param {Record<string, unknown>} params Filtros comunes a cada página
 * @param {import('axios').AxiosRequestConfig} [axiosConfig] p. ej. { _silent: true }
 * @returns {Promise<object[]>}
 */
export async function fetchProductosAllPages(params = {}, axiosConfig = {}) {
  const perPage = Math.min(Math.max(Number(params.per_page) || 100, 1), 200)
  const { page: _omit, per_page: _omit2, ...rest } = params
  // No forzar status aquí: el listado en Productos LP no filtra por defecto; datos con
  // status distinto de 1 (o null) seguirían siendo tarificables y deben verse al armar listas.
  const base = {
    sort_by: 'nombre',
    sort_direction: 'asc',
    with: 'tipoProducto',
    per_page: perPage,
    ...rest
  }

  let page = 1
  let lastPage = 1
  const acc = []
  let guard = 0

  do {
    guard += 1
    if (guard > 500) break

    const body = await getAllRequest({ ...base, page }, axiosConfig)
    const rows = extractIndexRows(body)
    for (const p of rows) {
      acc.push(normalizeProductoRow(p))
    }

    const lp = body?.meta?.last_page
    lastPage = typeof lp === 'number' && lp >= 1 ? lp : 1
    page += 1
  } while (page <= lastPage)

  return acc
}

const productoLpService = {
  /**
   * GET /financiero/lp/productos
   * Params: search, status, tipo_producto_id, referencia_tipo, referencia_id, es_financiable,
   *         codigo, include_trashed, only_trashed, with, sort_by, sort_direction, per_page, page
   */
  async getAll(params = {}, config = {}) {
    return getAllRequest(params, config)
  },

  fetchProductosAllPages,

  /**
   * GET /financiero/lp/productos/{id}
   */
  async getById(id, params = {}, config = {}) {
    const { data } = await api.get(`${BASE}/${id}`, { ...config, params })
    return data
  },

  /**
   * POST /financiero/lp/productos
   */
  async create(payload, config = {}) {
    const { data } = await api.post(BASE, payload, config)
    return data
  },

  /**
   * PUT /financiero/lp/productos/{id}
   */
  async update(id, payload, config = {}) {
    const { data } = await api.put(`${BASE}/${id}`, payload, config)
    return data
  },

  /**
   * DELETE /financiero/lp/productos/{id}
   */
  async delete(id, config = {}) {
    const { data } = await api.delete(`${BASE}/${id}`, config)
    return data
  }
}

export default productoLpService
