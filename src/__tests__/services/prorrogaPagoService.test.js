import { describe, it, expect, beforeEach, vi } from 'vitest'
import prorrogaPagoService from '@/services/prorrogaPagoService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

import api from '@/services/api.js'

const BASE = '/financiero/prorrogas-pago'

describe('prorrogaPagoService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista con filtros', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await prorrogaPagoService.listar({ estado: 'vigente', page: 2 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { estado: 'vigente', page: 2 } })
  })

  it('registra el plazo nuevo', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 1 } } })
    const payload = { estudiante_id: 4, fecha_compromiso: '2026-11-27', observacion: null }
    const res = await prorrogaPagoService.crear(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
    expect(res.data.id).toBe(1)
  })

  it('cancela el plazo', async () => {
    api.delete.mockResolvedValue({ data: { message: 'ok' } })
    await prorrogaPagoService.cancelar(9)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/9`)
  })
})
