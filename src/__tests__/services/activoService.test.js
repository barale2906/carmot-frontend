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

  it('sube la imagen como multipart y la elimina', async () => {
    api.post.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
    const archivo = new File(['x'], 'taladro.jpg', { type: 'image/jpeg' })
    await activoService.subirImagen(4, archivo)
    await activoService.eliminarImagen(4)
    const [url, cuerpo] = api.post.mock.calls[0]
    expect(url).toBe('/activos/activos/4/imagen')
    expect(cuerpo).toBeInstanceOf(FormData)
    expect(cuerpo.get('imagen')).toBe(archivo)
    expect(api.delete).toHaveBeenCalledWith('/activos/activos/4/imagen')
  })

  it('lista, recibe y cancela traslados', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({ data: {} })
    await activoService.getTraslados({ estado: 'pendiente' })
    await activoService.recibirTraslado(9, { fecha_recepcion: '2026-10-27' })
    await activoService.cancelarTraslado(9, { motivo: 'Ya no se necesita' })
    expect(api.get).toHaveBeenCalledWith('/activos/traslados', { params: { estado: 'pendiente' } })
    expect(api.post).toHaveBeenCalledWith('/activos/traslados/9/recibir', { fecha_recepcion: '2026-10-27' })
    expect(api.post).toHaveBeenCalledWith('/activos/traslados/9/cancelar', { motivo: 'Ya no se necesita' })
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
