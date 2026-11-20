import { describe, it, expect, beforeEach, vi } from 'vitest'
import programacionService from '@/services/programacionService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn() },
}))

import api from '@/services/api.js'

const BASE = '/academico/programaciones'

describe('programacionService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAll llama a GET con los filtros y retorna data', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 1, jornada: 2 }] } })

    const result = await programacionService.getAll({ sede_id: 1, curso_id: 2, status: 1 })

    expect(api.get).toHaveBeenCalledWith(BASE, { params: { sede_id: 1, curso_id: 2, status: 1 } })
    expect(result.data).toHaveLength(1)
  })

  it('getById llama a GET del recurso', async () => {
    api.get.mockResolvedValue({ data: { data: { id: 7 } } })

    const result = await programacionService.getById(7, { with: 'curso' })

    expect(api.get).toHaveBeenCalledWith(`${BASE}/7`, { params: { with: 'curso' } })
    expect(result.data.id).toBe(7)
  })
})
