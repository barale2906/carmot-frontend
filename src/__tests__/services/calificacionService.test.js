import { describe, it, expect, beforeEach, vi } from 'vitest'
import calificacionService from '@/services/calificacionService.js'
import grupoService        from '@/services/grupoService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/services/api.js'

describe('calificacionService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('gestiona esquemas de calificación', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })

    await calificacionService.getEsquemas({ modulo_id: 5 })
    await calificacionService.createEsquema({ nombre_esquema: 'E' })
    await calificacionService.updateEsquema(2, { nombre_esquema: 'F' })
    await calificacionService.deleteEsquema(2)

    expect(api.get).toHaveBeenCalledWith('/academico/esquemas-calificacion', { params: { modulo_id: 5 } })
    expect(api.post).toHaveBeenCalledWith('/academico/esquemas-calificacion', { nombre_esquema: 'E' })
    expect(api.put).toHaveBeenCalledWith('/academico/esquemas-calificacion/2', { nombre_esquema: 'F' })
    expect(api.delete).toHaveBeenCalledWith('/academico/esquemas-calificacion/2')
  })

  it('registra notas y consulta la sábana grupal', async () => {
    api.post.mockResolvedValue({ data: { data: { creadas: 1 } } })
    api.get.mockResolvedValue({ data: { data: {} } })

    await calificacionService.registrarNotas({ grupo_id: 1 })
    await calificacionService.sabanaGrupal(1, 5)

    expect(api.post).toHaveBeenCalledWith('/academico/notas-estudiantes/masivo', { grupo_id: 1 })
    expect(api.get).toHaveBeenCalledWith('/academico/notas-estudiantes/grupo/1/modulo/5/sabana')
  })

  it('grupoService.getVigentes consulta los grupos con ciclo vigente', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await grupoService.getVigentes({ mis_grupos: 1 })
    expect(api.get).toHaveBeenCalledWith('/academico/grupos/vigentes', { params: { mis_grupos: 1 } })
  })
})
