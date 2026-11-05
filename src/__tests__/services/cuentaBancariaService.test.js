import { describe, it, expect, beforeEach, vi } from 'vitest'
import cuentaBancariaService from '@/services/cuentaBancariaService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/configuracion/cuentas-bancarias'
const CUENTA = { id: 1, sede_id: 3, banco_id: 2, tipo_cuenta: 'ahorros', numero_cuenta: '123', etiqueta: 'Bancolombia · Ahorros · 123', status: 1 }

describe('cuentaBancariaService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll llama a GET con parámetros', async () => {
    api.get.mockResolvedValue({ data: { data: [CUENTA], meta: { total: 1 } } })
    const result = await cuentaBancariaService.getAll({ sede_id: 3 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { sede_id: 3 } })
    expect(result.data).toHaveLength(1)
  })

  it('getActivas filtra por la sede donde se recibe el pago', async () => {
    api.get.mockResolvedValue({ data: { data: [CUENTA] } })
    const result = await cuentaBancariaService.getActivas(3)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/activas`, { params: { sede_id: 3 } })
    expect(result.data[0].id).toBe(1)
  })

  it('create, update y delete usan los verbos correspondientes', async () => {
    api.post.mockResolvedValue({ data: { data: CUENTA } })
    api.put.mockResolvedValue({ data: { data: CUENTA } })
    api.delete.mockResolvedValue({ data: { message: 'ok' } })

    await cuentaBancariaService.create({ numero_cuenta: '123' })
    await cuentaBancariaService.update(1, { titular: 'X' })
    await cuentaBancariaService.delete(1)

    expect(api.post).toHaveBeenCalledWith(BASE, { numero_cuenta: '123' })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/1`, { titular: 'X' })
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/1`)
  })

  it('papelera: trashed, restore y forceDelete', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })

    await cuentaBancariaService.getTrashed()
    await cuentaBancariaService.restore(5)
    await cuentaBancariaService.forceDelete(5)

    expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`, { params: {} })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/restore/5`)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/force/5`)
  })

  it('getFilterOptions y getStatistics', async () => {
    api.get.mockResolvedValue({ data: { data: {} } })
    await cuentaBancariaService.getFilterOptions()
    await cuentaBancariaService.getStatistics()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/filters/options`)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/statistics`)
  })
})
