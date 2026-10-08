import { describe, it, expect, beforeEach, vi } from 'vitest'
import cicloService from '@/services/cicloService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/services/api.js'

describe('cicloService — clonar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sugerenciaClonar consulta la sugerencia del ciclo', async () => {
    const sugerencia = { fecha_minima: '2027-03-31', fecha_inicio_sugerida: '2027-04-05', dias_clase: ['lunes'] }
    api.get.mockResolvedValue({ data: { data: sugerencia } })
    const res = await cicloService.sugerenciaClonar(5, { _silent: true })
    expect(api.get).toHaveBeenCalledWith('/academico/ciclos/5/clonar/sugerencia', { _silent: true })
    expect(res.data).toEqual(sugerencia)
  })

  it('clonar envía el payload y retorna el ciclo nuevo', async () => {
    api.post.mockResolvedValue({ data: { message: 'Ciclo clonado exitosamente.', data: { id: 58 } } })
    const payload = { fecha_inicio: '2027-04-05', nombre: 'Cohorte Abril' }
    const res = await cicloService.clonar(5, payload, { _silent: true })
    expect(api.post).toHaveBeenCalledWith('/academico/ciclos/5/clonar', payload, { _silent: true })
    expect(res.data.id).toBe(58)
  })
})
