import { describe, it, expect, beforeEach, vi } from 'vitest'
import diaNoLaborableService from '@/services/diaNoLaborableService.js'
import cicloService          from '@/services/cicloService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/configuracion/dias-no-laborables'
const DIA  = { id: 12, fecha: '2026-11-16', nombre: 'Independencia de Cartagena', tipo: 'festivo', sede_id: null, status: 1 }
const META = { ciclos_recalculados: [{ id: 7, nombre: 'Ciclo Octubre 2026', fecha_fin_anterior: '2027-03-30', fecha_fin: '2027-04-06', clases_realineadas: 3 }] }

describe('diaNoLaborableService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll envía filtros como params', async () => {
    api.get.mockResolvedValue({ data: { data: [DIA], meta: { total: 1 } } })
    const res = await diaNoLaborableService.getAll({ anio: 2026, tipo: 'festivo' })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { anio: 2026, tipo: 'festivo' } })
    expect(res.data).toEqual([DIA])
  })

  it('getCalendario consulta la vista anual', async () => {
    api.get.mockResolvedValue({ data: { data: [DIA], meta: { anio: 2026, total: 1 } } })
    const res = await diaNoLaborableService.getCalendario({ anio: 2026, sede_id: 3 })
    expect(api.get).toHaveBeenCalledWith(`${BASE}/calendario`, { params: { anio: 2026, sede_id: 3 } })
    expect(res.meta.total).toBe(1)
  })

  it('create retorna los ciclos recalculados en meta', async () => {
    api.post.mockResolvedValue({ data: { data: DIA, meta: META } })
    const payload = { fecha: '2026-11-16', nombre: 'Festivo', tipo: 'festivo', sede_id: null }
    const res = await diaNoLaborableService.create(payload, { _silent: true })
    expect(api.post).toHaveBeenCalledWith(BASE, payload, { _silent: true })
    expect(res.meta.ciclos_recalculados).toHaveLength(1)
  })

  it('createRango usa el endpoint de rango', async () => {
    api.post.mockResolvedValue({ data: { data: { creados: [DIA], omitidos: [] }, meta: { ciclos_recalculados: [] } } })
    const payload = { fecha_inicio: '2027-12-20', fecha_fin: '2028-01-08', nombre: 'Vacaciones', tipo: 'vacaciones', sede_id: null }
    const res = await diaNoLaborableService.createRango(payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/rango`, payload, {})
    expect(res.data.creados).toHaveLength(1)
  })

  it('generarFestivos envía año y sede', async () => {
    api.post.mockResolvedValue({ data: { data: { creados: [], omitidos: [{ fecha: '2027-01-01', motivo: 'Ya existe' }] } } })
    const res = await diaNoLaborableService.generarFestivos({ anio: 2027, sede_id: null })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/generar-festivos`, { anio: 2027, sede_id: null }, {})
    expect(res.data.omitidos).toHaveLength(1)
  })

  it('update usa PUT con el id', async () => {
    api.put.mockResolvedValue({ data: { data: DIA, meta: META } })
    await diaNoLaborableService.update(12, { status: 0 })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/12`, { status: 0 }, {})
  })

  it('delete, restore y forceDelete usan sus rutas', async () => {
    api.delete.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
    await diaNoLaborableService.delete(12)
    await diaNoLaborableService.restore(12)
    await diaNoLaborableService.forceDelete(12)
    expect(api.delete).toHaveBeenNthCalledWith(1, `${BASE}/12`)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/restore/12`, null, {})
    expect(api.delete).toHaveBeenNthCalledWith(2, `${BASE}/force/12`)
  })

  it('getTrashed, getFilters y getStatistics', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await diaNoLaborableService.getTrashed({ per_page: 100 })
    await diaNoLaborableService.getFilters()
    await diaNoLaborableService.getStatistics()
    expect(api.get).toHaveBeenNthCalledWith(1, `${BASE}/trashed`, { params: { per_page: 100 } })
    expect(api.get).toHaveBeenNthCalledWith(2, `${BASE}/filters/options`)
    expect(api.get).toHaveBeenNthCalledWith(3, `${BASE}/statistics`)
  })
})

describe('cicloService — fecha fin fija', () => {
  beforeEach(() => vi.clearAllMocks())

  it('previsualizar envía fecha_fin y la config de la petición', async () => {
    api.get.mockResolvedValue({ data: { data: { factor_ajuste: 0.65 } } })
    const params = { curso_id: 1, fecha_inicio: '2026-10-01', fecha_fin: '2027-06-30' }
    const res = await cicloService.previsualizar(params, { _silent: true })
    expect(api.get).toHaveBeenCalledWith('/academico/ciclos/previsualizar', { params, _silent: true })
    expect(res.data.factor_ajuste).toBe(0.65)
  })

  it('planeacion consulta la planeación por tema', async () => {
    api.get.mockResolvedValue({ data: { data: { ciclo: { id: 7 }, grupos: [] } } })
    const res = await cicloService.planeacion(7)
    expect(api.get).toHaveBeenCalledWith('/academico/ciclos/7/planeacion')
    expect(res.data.ciclo.id).toBe(7)
  })
})
