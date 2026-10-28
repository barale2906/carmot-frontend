import { describe, it, expect, beforeEach, vi } from 'vitest'
import referidoService    from '@/services/referidoService.js'
import seguimientoService from '@/services/seguimientoService.js'
import agendaService      from '@/services/agendaService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

describe('referidoService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista con parámetros y retorna data + meta', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 1 }], meta: { total: 1 } } })
    const res = await referidoService.getAll({ search: '300', status: 1 })
    expect(api.get).toHaveBeenCalledWith('/crm/referidos', { params: { search: '300', status: 1 } })
    expect(res.meta.total).toBe(1)
  })

  it('usa las rutas propias de papelera, restaurar, filtros y estadísticas', async () => {
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })

    await referidoService.getTrashed()
    await referidoService.getFilters()
    await referidoService.getStatistics()
    await referidoService.restore(7)
    await referidoService.forceDelete(7)

    expect(api.get).toHaveBeenCalledWith('/crm/referidos/trashed/list', { params: {} })
    expect(api.get).toHaveBeenCalledWith('/crm/referidos/filters/options')
    expect(api.get).toHaveBeenCalledWith('/crm/referidos/statistics')
    expect(api.post).toHaveBeenCalledWith('/crm/referidos/7/restore')
    expect(api.delete).toHaveBeenCalledWith('/crm/referidos/7/force-delete')
  })

  it('crea y actualiza con el payload recibido', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 3 } } })
    api.put.mockResolvedValue({ data: { data: { id: 3 } } })
    await referidoService.create({ celular: '300' })
    await referidoService.update(3, { status: 1 })
    expect(api.post).toHaveBeenCalledWith('/crm/referidos', { celular: '300' })
    expect(api.put).toHaveBeenCalledWith('/crm/referidos/3', { status: 1 })
  })
})

describe('seguimientoService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('consulta la bitácora de un lead', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await seguimientoService.getByReferido(5, { per_page: 50 })
    expect(api.get).toHaveBeenCalledWith('/crm/seguimientos/by-referido/5', { params: { per_page: 50 } })
  })

  it('consulta la bitácora agrupada por lead', async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: {} } })
    const res = await seguimientoService.getPorLead({ search: 'ana', page: 2 })
    expect(api.get).toHaveBeenCalledWith('/crm/seguimientos/por-lead', { params: { search: 'ana', page: 2 } })
    expect(res).toEqual({ data: [], meta: {} })
  })

  it('descarga el Excel del lapso como blob', async () => {
    const blob = new Blob(['x'])
    api.get.mockResolvedValue({ data: blob })
    const params = { fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31', search: 'ana' }
    const res = await seguimientoService.exportarExcel(params)
    expect(api.get).toHaveBeenCalledWith('/crm/seguimientos/excel', { params, responseType: 'blob' })
    expect(res).toBe(blob)
  })

  it('crea con el payload recibido', async () => {
    api.post.mockResolvedValue({ data: {} })
    const payload = { referido_id: 1, estado_referido: 2, proxima_accion: { tipo: 'llamada', fecha: '2026-11-02', hora: '09:00', nota: null } }
    await seguimientoService.create(payload)
    expect(api.post).toHaveBeenCalledWith('/crm/seguimientos', payload)
  })
})

describe('agendaService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista con rango de fechas y obtiene filtros', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await agendaService.getAll({ fecha_desde: '2026-10-13', fecha_hasta: '2026-10-20' })
    await agendaService.getFilters()
    expect(api.get).toHaveBeenCalledWith('/crm/agendas', { params: { fecha_desde: '2026-10-13', fecha_hasta: '2026-10-20' } })
    expect(api.get).toHaveBeenCalledWith('/crm/agendas/filters/options')
  })

  it('actualiza el estado de una cita', async () => {
    api.put.mockResolvedValue({ data: {} })
    await agendaService.update(9, { status: 1 })
    expect(api.put).toHaveBeenCalledWith('/crm/agendas/9', { status: 1 })
  })
})
