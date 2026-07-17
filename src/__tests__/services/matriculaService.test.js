/**
 * Tests de matriculaService.
 * El patrón CRUD aquí documentado aplica también a: cicloService, cursoService,
 * grupoService, sedeService, userService y demás servicios que siguen la misma
 * estructura (getAll/getById/create/update/delete/restore/forceDelete/getTrashed).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import matriculaService from '@/services/matriculaService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/academico/matriculas'

const MATRICULA = { id: 1, estudiante: 'Ana García', estado: 'activa' }

describe('matriculaService', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getAll', () => {
    it('llama a GET con los parámetros y retorna data', async () => {
      api.get.mockResolvedValue({ data: { data: [MATRICULA], total: 1 } })

      const result = await matriculaService.getAll({ page: 1, per_page: 15 })

      expect(api.get).toHaveBeenCalledWith(BASE, { params: { page: 1, per_page: 15 } })
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('llama sin parámetros cuando se omiten', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })

      await matriculaService.getAll()
      expect(api.get).toHaveBeenCalledWith(BASE, { params: {} })
    })
  })

  describe('getById', () => {
    it('llama a GET /{id} y retorna el registro', async () => {
      api.get.mockResolvedValue({ data: MATRICULA })

      const result = await matriculaService.getById(1)

      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: {} })
      expect(result).toEqual(MATRICULA)
    })

    it('pasa parámetros adicionales (ej: with=estudiante)', async () => {
      api.get.mockResolvedValue({ data: MATRICULA })

      await matriculaService.getById(1, { with: 'estudiante' })
      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: { with: 'estudiante' } })
    })
  })

  describe('create', () => {
    it('envía POST con el payload y retorna el registro creado', async () => {
      const payload = { estudiante_id: 5, sede_id: 1 }
      api.post.mockResolvedValue({ data: { ...MATRICULA, id: 99 } })

      const result = await matriculaService.create(payload)

      expect(api.post).toHaveBeenCalledWith(BASE, payload, {})
      expect(result.id).toBe(99)
    })
  })

  describe('update', () => {
    it('envía PUT /{id} con el payload', async () => {
      api.put.mockResolvedValue({ data: { ...MATRICULA, estado: 'inactiva' } })

      const result = await matriculaService.update(1, { estado: 'inactiva' })

      expect(api.put).toHaveBeenCalledWith(`${BASE}/1`, { estado: 'inactiva' }, {})
      expect(result.estado).toBe('inactiva')
    })
  })

  describe('delete', () => {
    it('envía DELETE /{id}', async () => {
      api.delete.mockResolvedValue({ data: { message: 'Eliminado' } })

      await matriculaService.delete(1)
      expect(api.delete).toHaveBeenCalledWith(`${BASE}/1`)
    })
  })

  describe('restore', () => {
    it('envía POST /{id}/restore', async () => {
      api.post.mockResolvedValue({ data: MATRICULA })

      await matriculaService.restore(1)
      expect(api.post).toHaveBeenCalledWith(`${BASE}/1/restore`)
    })
  })

  describe('forceDelete', () => {
    it('envía DELETE /{id}/force-delete', async () => {
      api.delete.mockResolvedValue({ data: { message: 'Eliminado permanentemente' } })

      await matriculaService.forceDelete(1)
      expect(api.delete).toHaveBeenCalledWith(`${BASE}/1/force-delete`)
    })
  })

  describe('getTrashed', () => {
    it('obtiene registros eliminados con parámetros', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })

      await matriculaService.getTrashed({ page: 2 })
      expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`, { params: { page: 2 } })
    })
  })

  describe('getFilters', () => {
    it('llama a GET /filters', async () => {
      api.get.mockResolvedValue({ data: { sedes: [], cursos: [] } })

      const result = await matriculaService.getFilters()
      expect(api.get).toHaveBeenCalledWith(`${BASE}/filters`)
      expect(result).toHaveProperty('sedes')
    })
  })

  describe('getStatistics', () => {
    it('llama a GET /statistics y retorna los datos', async () => {
      api.get.mockResolvedValue({ data: { total: 250, activas: 200 } })

      const result = await matriculaService.getStatistics()
      expect(api.get).toHaveBeenCalledWith(`${BASE}/statistics`)
      expect(result.total).toBe(250)
    })
  })

  describe('precargaEstudiante', () => {
    it('llama a GET /precarga-estudiante/{id}', async () => {
      const preData = { primer_nombre: 'Ana', sede_id: 2 }
      api.get.mockResolvedValue({ data: preData })

      const result = await matriculaService.precargaEstudiante(42)
      expect(api.get).toHaveBeenCalledWith(`${BASE}/precarga-estudiante/42`)
      expect(result).toEqual(preData)
    })
  })
})
