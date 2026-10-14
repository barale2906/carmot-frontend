import { describe, it, expect, beforeEach, vi } from 'vitest'
import asistenciaService from '@/services/asistenciaService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}))

import api from '@/services/api.js'

describe('asistenciaService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('consulta la lista del grupo y el reporte', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await asistenciaService.listaAsistencia(4)
    await asistenciaService.reporteGrupo(4)
    expect(api.get).toHaveBeenCalledWith('/academico/asistencias/lista-asistencia/4')
    expect(api.get).toHaveBeenCalledWith('/academico/asistencias/reporte/grupo/4', { params: {} })
  })

  it('trae las asistencias de una clase sin paginar', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await asistenciaService.getByClase(9)
    expect(api.get).toHaveBeenCalledWith('/academico/asistencias', { params: { clase_programada_id: 9, per_page: 500 } })
  })

  it('registra la lista de una clase', async () => {
    api.post.mockResolvedValue({ data: { meta: { creadas: 2 } } })
    const res = await asistenciaService.registrarClase(9, [{ estudiante_id: 1, estado: 'presente' }])
    expect(api.post).toHaveBeenCalledWith('/academico/asistencias/masivo', {
      clase_programada_id: 9,
      asistencias: [{ estudiante_id: 1, estado: 'presente' }]
    })
    expect(res.meta.creadas).toBe(2)
  })
})
