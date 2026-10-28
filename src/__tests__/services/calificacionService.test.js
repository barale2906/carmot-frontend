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

  it('consulta el consolidado y sus filtros', async () => {
    api.get.mockResolvedValue({ data: { data: [], meta: {} } })

    await calificacionService.getFiltros()
    await calificacionService.consolidado({ ciclo_id: 3, estado: 'reprobado' })

    expect(api.get).toHaveBeenCalledWith('/academico/notas-estudiantes/filters')
    expect(api.get).toHaveBeenCalledWith('/academico/notas-estudiantes/consolidado', { params: { ciclo_id: 3, estado: 'reprobado' } })
  })

  it('cierra y reabre las notas de un ciclo', async () => {
    api.get.mockResolvedValue({ data: { data: {} } })
    api.post.mockResolvedValue({ data: { data: {} } })

    await calificacionService.estadoCierre(3)
    await calificacionService.cerrarCiclo(3)
    await calificacionService.reabrirCiclo(3, 'Corrección')

    expect(api.get).toHaveBeenCalledWith('/academico/notas-estudiantes/ciclos/3/cierre')
    expect(api.post).toHaveBeenCalledWith('/academico/notas-estudiantes/ciclos/3/cerrar')
    expect(api.post).toHaveBeenCalledWith('/academico/notas-estudiantes/ciclos/3/reabrir', { motivo: 'Corrección' })
  })

  it('registra, edita y elimina recuperaciones', async () => {
    api.post.mockResolvedValue({ data: { data: {} } })
    api.put.mockResolvedValue({ data: { data: {} } })
    api.delete.mockResolvedValue({ data: {} })

    await calificacionService.registrarRecuperacion({ estudiante_id: 1, grupo_id: 2, nota: 3.5 })
    await calificacionService.actualizarRecuperacion(7, { nota: 4 })
    await calificacionService.eliminarRecuperacion(7)

    expect(api.post).toHaveBeenCalledWith('/academico/recuperaciones-notas', { estudiante_id: 1, grupo_id: 2, nota: 3.5 })
    expect(api.put).toHaveBeenCalledWith('/academico/recuperaciones-notas/7', { nota: 4 })
    expect(api.delete).toHaveBeenCalledWith('/academico/recuperaciones-notas/7')
  })

  it('grupoService.getVigentes consulta los grupos con ciclo vigente', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await grupoService.getVigentes({ mis_grupos: 1 })
    expect(api.get).toHaveBeenCalledWith('/academico/grupos/vigentes', { params: { mis_grupos: 1 } })
  })
})
