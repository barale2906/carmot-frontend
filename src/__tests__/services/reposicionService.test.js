import { describe, it, expect, beforeEach, vi } from 'vitest'
import reposicionService from '@/services/reposicionService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

import api from '@/services/api.js'

const BASE = '/academico/asistencia-reposiciones'

describe('reposicionService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista con filtros', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await reposicionService.listar({ grupo_id: 3, page: 2 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { grupo_id: 3, page: 2 } })
  })

  it('pide las opciones del estudiante, con o sin fecha', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await reposicionService.opciones(5, '2026-11-19')
    await reposicionService.opciones(5)
    expect(api.get).toHaveBeenNthCalledWith(1, `${BASE}/opciones`, { params: { estudiante_id: 5, fecha: '2026-11-19' } })
    expect(api.get).toHaveBeenNthCalledWith(2, `${BASE}/opciones`, { params: { estudiante_id: 5 } })
  })

  it('registra y cancela una reposición', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 1 } } })
    api.delete.mockResolvedValue({ data: { message: 'ok' } })
    const payload = { estudiante_id: 5, clase_origen_id: 1, clase_destino_id: 2 }
    expect(await reposicionService.crear(payload)).toEqual({ data: { id: 1 } })
    await reposicionService.cancelar(9)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/9`)
  })
})
