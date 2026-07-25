import { describe, it, expect, beforeEach, vi } from 'vitest'
import descuentoService from '@/services/descuentoService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/financiero/descuentos'

const DESCUENTO = {
  id: 1,
  nombre: 'Pronto Pago 10%',
  tipo_movimiento: 'descuento',
  tipo: 'porcentual',
  valor: 10,
  aplicacion: 'cuota',
  tipo_activacion: 'pago_anticipado',
  dias_anticipacion: 5,
  permite_acumulacion: false,
  status: 3,
  status_text: 'Activo',
  es_sobrecargo: false,
  esta_vigente: true,
  fecha_inicio: '2026-01-01',
  fecha_fin: '2026-12-31',
}

const SOBRECARGO_PORCENTUAL = {
  descuento_id: 5,
  nombre: 'Recargo tarjeta crédito',
  tipo: 'porcentual',
  valor: 3.5,
  medio_pago: 'tarjeta_credito',
  tipo_tarjeta: null,
  valor_base: 100000,
  valor_sobrecargo: 3500,
  valor_final: 103500,
}

const SOBRECARGO_VALOR_FIJO = {
  descuento_id: 6,
  nombre: 'Recargo fijo débito',
  tipo: 'valor_fijo',
  valor: 5000,
  medio_pago: 'tarjeta_debito',
  tipo_tarjeta: null,
  valor_base: 150000,
  valor_sobrecargo: 5000,
  valor_final: 155000,
}

describe('descuentoService', () => {
  beforeEach(() => vi.clearAllMocks())

  // ─── getAll ───────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('llama a GET con parámetros y retorna la lista paginada', async () => {
      api.get.mockResolvedValue({ data: { data: [DESCUENTO], meta: { total: 1 } } })

      const result = await descuentoService.getAll({ page: 1, per_page: 15 })

      expect(api.get).toHaveBeenCalledWith(BASE, { params: { page: 1, per_page: 15 } })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].nombre).toBe('Pronto Pago 10%')
    })

    it('llama sin parámetros cuando se omiten', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })
      await descuentoService.getAll()
      expect(api.get).toHaveBeenCalledWith(BASE, { params: {} })
    })

    it('filtra por tipo_movimiento sobrecargo', async () => {
      api.get.mockResolvedValue({ data: { data: [], meta: { total: 0 } } })
      await descuentoService.getAll({ tipo_movimiento: 'sobrecargo' })
      expect(api.get).toHaveBeenCalledWith(BASE, { params: { tipo_movimiento: 'sobrecargo' } })
    })

    it('filtra por status', async () => {
      api.get.mockResolvedValue({ data: { data: [], meta: { total: 0 } } })
      await descuentoService.getAll({ status: 3 })
      expect(api.get).toHaveBeenCalledWith(BASE, { params: { status: 3 } })
    })
  })

  // ─── getById ─────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('llama a GET /{id} y retorna el descuento', async () => {
      api.get.mockResolvedValue({ data: DESCUENTO })
      const result = await descuentoService.getById(1)
      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: {} })
      expect(result).toEqual(DESCUENTO)
    })

    it('pasa parámetros adicionales', async () => {
      api.get.mockResolvedValue({ data: DESCUENTO })
      await descuentoService.getById(1, { with: 'historial' })
      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: { with: 'historial' } })
    })
  })

  // ─── create ───────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('envía POST con payload de descuento porcentual', async () => {
      const payload = { tipo_movimiento: 'descuento', nombre: 'Pronto Pago', tipo: 'porcentual', valor: 10 }
      api.post.mockResolvedValue({ data: { message: 'Ajuste creado.', data: { ...DESCUENTO, id: 10 } } })

      const result = await descuentoService.create(payload)

      expect(api.post).toHaveBeenCalledWith(BASE, payload, {})
      expect(result.data.id).toBe(10)
    })

    it('envía POST con tipo valor_fijo para descuento', async () => {
      const payload = { tipo_movimiento: 'descuento', nombre: 'Beca', tipo: 'valor_fijo', valor: 50000 }
      api.post.mockResolvedValue({ data: { data: { id: 11, ...payload } } })

      await descuentoService.create(payload)
      expect(api.post).toHaveBeenCalledWith(BASE, expect.objectContaining({ tipo: 'valor_fijo' }), {})
    })

    it('envía POST con tipo porcentual para sobrecargo', async () => {
      const payload = {
        tipo_movimiento: 'sobrecargo',
        nombre: 'Recargo TC',
        tipo: 'porcentual',
        valor: 3.5,
        aplicacion: 'valor_recibo',
        tipo_activacion: 'medio_pago',
        medios_pago: ['tarjeta_credito'],
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-12-31',
      }
      api.post.mockResolvedValue({ data: { data: { id: 12, ...payload } } })

      await descuentoService.create(payload)
      expect(api.post).toHaveBeenCalledWith(BASE, expect.objectContaining({ tipo: 'porcentual' }), {})
    })

    it('envía POST con tipo valor_fijo para sobrecargo (nueva opción julio 2026)', async () => {
      const payload = {
        tipo_movimiento: 'sobrecargo',
        nombre: 'Recargo fijo débito',
        tipo: 'valor_fijo',
        valor: 5000,
        aplicacion: 'valor_recibo',
        tipo_activacion: 'medio_pago',
        medios_pago: ['tarjeta_debito'],
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-12-31',
      }
      api.post.mockResolvedValue({ data: { data: { id: 13, ...payload } } })

      await descuentoService.create(payload)
      expect(api.post).toHaveBeenCalledWith(BASE, expect.objectContaining({ tipo: 'valor_fijo', valor: 5000 }), {})
    })
  })

  // ─── update ───────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('envía PUT /{id} con el payload', async () => {
      api.put.mockResolvedValue({ data: { data: { ...DESCUENTO, valor: 15 } } })

      const result = await descuentoService.update(1, { valor: 15 })

      expect(api.put).toHaveBeenCalledWith(`${BASE}/1`, { valor: 15 }, {})
      expect(result.data.valor).toBe(15)
    })
  })

  // ─── delete ───────────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('envía DELETE /{id} para inactivar', async () => {
      api.delete.mockResolvedValue({ data: { message: 'Ajuste inactivado correctamente.' } })

      const result = await descuentoService.delete(1)

      expect(api.delete).toHaveBeenCalledWith(`${BASE}/1`)
      expect(result.message).toContain('inactivado')
    })
  })

  // ─── aprobar ─────────────────────────────────────────────────────────────────
  describe('aprobar', () => {
    it('envía POST /{id}/aprobar', async () => {
      api.post.mockResolvedValue({ data: { message: 'Ajuste aprobado.' } })

      const result = await descuentoService.aprobar(1)

      expect(api.post).toHaveBeenCalledWith(`${BASE}/1/aprobar`)
      expect(result.message).toContain('aprobado')
    })
  })

  // ─── activar ─────────────────────────────────────────────────────────────────
  describe('activar', () => {
    it('envía POST /{id}/activar', async () => {
      api.post.mockResolvedValue({ data: { message: 'Ajuste activado.' } })

      const result = await descuentoService.activar(1)

      expect(api.post).toHaveBeenCalledWith(`${BASE}/1/activar`)
      expect(result.message).toContain('activado')
    })
  })

  // ─── getSobrecargosPorMedioPago ───────────────────────────────────────────────
  describe('getSobrecargosPorMedioPago', () => {
    it('llama a GET /sobrecargos/por-medio-pago con los parámetros requeridos', async () => {
      api.get.mockResolvedValue({ data: { data: [SOBRECARGO_PORCENTUAL] } })

      await descuentoService.getSobrecargosPorMedioPago({
        medio_pago: 'tarjeta_credito',
        valor_base: 100000,
      })

      expect(api.get).toHaveBeenCalledWith(
        `${BASE}/sobrecargos/por-medio-pago`,
        { params: { medio_pago: 'tarjeta_credito', valor_base: 100000 } }
      )
    })

    it('respuesta porcentual tiene tipo y valor (campo porcentaje ya no existe)', async () => {
      api.get.mockResolvedValue({ data: { data: [SOBRECARGO_PORCENTUAL] } })

      const result = await descuentoService.getSobrecargosPorMedioPago({
        medio_pago: 'tarjeta_credito',
        valor_base: 100000,
      })

      const sc = result.data[0]
      expect(sc).toHaveProperty('tipo', 'porcentual')
      expect(sc).toHaveProperty('valor', 3.5)
      expect(sc).toHaveProperty('valor_sobrecargo', 3500)
      expect(sc).toHaveProperty('valor_final', 103500)
      expect(sc).not.toHaveProperty('porcentaje')
    })

    it('respuesta valor_fijo tiene tipo valor_fijo e importe fijo en pesos', async () => {
      api.get.mockResolvedValue({ data: { data: [SOBRECARGO_VALOR_FIJO] } })

      const result = await descuentoService.getSobrecargosPorMedioPago({
        medio_pago: 'tarjeta_debito',
        valor_base: 150000,
      })

      const sc = result.data[0]
      expect(sc).toHaveProperty('tipo', 'valor_fijo')
      expect(sc).toHaveProperty('valor', 5000)
      expect(sc).toHaveProperty('valor_sobrecargo', 5000)
      expect(sc).toHaveProperty('valor_final', 155000)
    })

    it('pasa tipo_tarjeta cuando se proporciona', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })

      await descuentoService.getSobrecargosPorMedioPago({
        medio_pago: 'tarjeta_credito',
        tipo_tarjeta: 'Visa',
        valor_base: 200000,
      })

      expect(api.get).toHaveBeenCalledWith(
        `${BASE}/sobrecargos/por-medio-pago`,
        { params: { medio_pago: 'tarjeta_credito', tipo_tarjeta: 'Visa', valor_base: 200000 } }
      )
    })

    it('retorna lista vacía si no hay sobrecargos para ese medio', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })

      const result = await descuentoService.getSobrecargosPorMedioPago({
        medio_pago: 'efectivo',
        valor_base: 50000,
      })

      expect(result.data).toHaveLength(0)
    })

    it('propaga el error cuando la API falla', async () => {
      api.get.mockRejectedValue({ response: { status: 500 } })

      await expect(
        descuentoService.getSobrecargosPorMedioPago({ medio_pago: 'efectivo', valor_base: 0 })
      ).rejects.toMatchObject({ response: { status: 500 } })
    })
  })
})
