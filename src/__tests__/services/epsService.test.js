import { describe, it, expect, beforeEach, vi } from 'vitest'
import epsService from '@/services/epsService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/configuracion/eps'
const EPS = { id: 1, nombre: 'Sanitas', direccion: 'Calle 100 # 50-20', status: 1, status_text: 'Activo', matriculas_count: 5 }

describe('epsService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll', () => {
    it('llama a GET con parámetros y retorna data', async () => {
      api.get.mockResolvedValue({ data: { data: [EPS], meta: { total: 1 } } })

      const result = await epsService.getAll({ page: 1, per_page: 15 })

      expect(api.get).toHaveBeenCalledWith(BASE, { params: { page: 1, per_page: 15 } })
      expect(result.data).toHaveLength(1)
      expect(result.meta.total).toBe(1)
    })

    it('llama sin parámetros cuando se omiten', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })

      await epsService.getAll()
      expect(api.get).toHaveBeenCalledWith(BASE, { params: {} })
    })
  })

  describe('getActivas', () => {
    it('llama a GET /activas y retorna la lista de EPS activas', async () => {
      const activas = [{ id: 1, nombre: 'Compensar', status: 1 }]
      api.get.mockResolvedValue({ data: { data: activas, meta: { total: 1, scope: 'activas' } } })

      const result = await epsService.getActivas()

      expect(api.get).toHaveBeenCalledWith(`${BASE}/activas`)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].nombre).toBe('Compensar')
    })
  })

  describe('getById', () => {
    it('llama a GET /{id} y retorna el registro', async () => {
      api.get.mockResolvedValue({ data: EPS })

      const result = await epsService.getById(1)

      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: {} })
      expect(result).toEqual(EPS)
    })

    it('pasa parámetros adicionales', async () => {
      api.get.mockResolvedValue({ data: EPS })

      await epsService.getById(1, { with: 'matriculas' })
      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: { with: 'matriculas' } })
    })
  })

  describe('create', () => {
    it('envía POST con el payload y retorna el registro creado', async () => {
      const payload = { nombre: 'Nueva EPS', status: 1 }
      api.post.mockResolvedValue({ data: { message: 'EPS creada exitosamente.', data: { ...EPS, id: 10 } } })

      const result = await epsService.create(payload)

      expect(api.post).toHaveBeenCalledWith(BASE, payload)
      expect(result.data.id).toBe(10)
    })
  })

  describe('update', () => {
    it('envía PUT /{id} con el payload', async () => {
      api.put.mockResolvedValue({ data: { message: 'EPS actualizada exitosamente.', data: { ...EPS, nombre: 'Sanitas Colombia' } } })

      const result = await epsService.update(1, { nombre: 'Sanitas Colombia' })

      expect(api.put).toHaveBeenCalledWith(`${BASE}/1`, { nombre: 'Sanitas Colombia' })
      expect(result.data.nombre).toBe('Sanitas Colombia')
    })
  })

  describe('delete', () => {
    it('envía DELETE /{id}', async () => {
      api.delete.mockResolvedValue({ data: { message: 'EPS eliminada exitosamente.' } })

      const result = await epsService.delete(1)

      expect(api.delete).toHaveBeenCalledWith(`${BASE}/1`)
      expect(result.message).toContain('eliminada')
    })
  })

  describe('getTrashed', () => {
    it('llama a GET /trashed con parámetros', async () => {
      api.get.mockResolvedValue({ data: { data: [{ ...EPS, deleted_at: '2026-07-20' }] } })

      const result = await epsService.getTrashed({ page: 1 })

      expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`, { params: { page: 1 } })
      expect(result.data).toHaveLength(1)
    })
  })

  describe('restore', () => {
    it('envía POST /restore/{id}', async () => {
      api.post.mockResolvedValue({ data: { message: 'EPS restaurada exitosamente.', data: EPS } })

      const result = await epsService.restore(1)

      expect(api.post).toHaveBeenCalledWith(`${BASE}/restore/1`)
      expect(result.message).toContain('restaurada')
    })
  })

  describe('forceDelete', () => {
    it('envía DELETE /force/{id}', async () => {
      api.delete.mockResolvedValue({ data: { message: 'EPS eliminada permanentemente.' } })

      const result = await epsService.forceDelete(1)

      expect(api.delete).toHaveBeenCalledWith(`${BASE}/force/1`)
      expect(result.message).toContain('permanentemente')
    })
  })

  describe('getFilters', () => {
    it('llama a GET /filters/options', async () => {
      api.get.mockResolvedValue({ data: { data: { status: { 0: 'Inactivo', 1: 'Activo' } } } })

      const result = await epsService.getFilters()

      expect(api.get).toHaveBeenCalledWith(`${BASE}/filters/options`)
      expect(result.data.status).toHaveProperty('1', 'Activo')
    })
  })

  describe('getStatistics', () => {
    it('llama a GET /statistics y retorna los datos', async () => {
      const statsData = {
        data: {
          totales: { total: 50, activas: 45, inactivas: 3, eliminadas: 2 },
          con_matriculas: { con_matriculas: 30, sin_matriculas: 20 },
          top_eps: [{ id: 1, nombre: 'Sura', matriculas_count: 120 }]
        }
      }
      api.get.mockResolvedValue({ data: statsData })

      const result = await epsService.getStatistics()

      expect(api.get).toHaveBeenCalledWith(`${BASE}/statistics`)
      expect(result.data.totales.total).toBe(50)
      expect(result.data.top_eps).toHaveLength(1)
    })
  })

  describe('importar', () => {
    it('envía POST /importar con FormData', async () => {
      const archivo = new File(['nombre,status\nSanitas,1'], 'eps.csv', { type: 'text/csv' })
      api.post.mockResolvedValue({
        data: {
          message: 'Carga masiva completada. Insertadas: 1, Omitidas: 0.',
          data: { insertadas: 1, omitidas: 0, errores: [] }
        }
      })

      const result = await epsService.importar(archivo)

      expect(api.post).toHaveBeenCalledWith(
        `${BASE}/importar`,
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      expect(result.data.insertadas).toBe(1)
    })
  })

  describe('downloadPlantilla', () => {
    it('llama a GET /importar/plantilla con responseType blob', async () => {
      api.get.mockResolvedValue({ data: new Blob(['nombre,direccion,status']) })

      await epsService.downloadPlantilla()

      expect(api.get).toHaveBeenCalledWith(
        `${BASE}/importar/plantilla`,
        { responseType: 'blob' }
      )
    })
  })
})
