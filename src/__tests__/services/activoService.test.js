import { describe, it, expect, beforeEach, vi } from 'vitest'
import activoService from '@/services/activoService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/services/api.js'

describe('activoService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lista, consulta filtros y estadísticas', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    await activoService.getAll({ sede_id: 1 })
    await activoService.getFilters()
    await activoService.getStatistics({ sede_id: 1 })
    expect(api.get).toHaveBeenCalledWith('/activos/activos', { params: { sede_id: 1 } })
    expect(api.get).toHaveBeenCalledWith('/activos/activos/filters')
    expect(api.get).toHaveBeenCalledWith('/activos/activos/statistics', { params: { sede_id: 1 } })
  })

  it('traslada y cambia de estado por sus endpoints propios', async () => {
    api.post.mockResolvedValue({ data: {} })
    await activoService.trasladar(4, { sede_id: 2 })
    await activoService.cambiarEstado(4, { estado: 'baja' })
    expect(api.post).toHaveBeenCalledWith('/activos/activos/4/trasladar', { sede_id: 2 })
    expect(api.post).toHaveBeenCalledWith('/activos/activos/4/estado', { estado: 'baja' })
  })

  it('gestiona categorías', async () => {
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
    await activoService.createCategoria({ nombre: 'Herramientas' })
    await activoService.updateCategoria(3, { status: 0 })
    await activoService.deleteCategoria(3)
    await activoService.restoreCategoria(3)
    expect(api.post).toHaveBeenCalledWith('/activos/categorias', { nombre: 'Herramientas' })
    expect(api.put).toHaveBeenCalledWith('/activos/categorias/3', { status: 0 })
    expect(api.delete).toHaveBeenCalledWith('/activos/categorias/3')
    expect(api.post).toHaveBeenCalledWith('/activos/categorias/3/restore')
  })
})
