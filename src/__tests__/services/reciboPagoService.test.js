import { describe, it, expect, beforeEach, vi } from 'vitest'
import reciboPagoService from '@/services/reciboPagoService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/financiero/recibos-pago'

const RECIBO = {
  id: 1,
  numero_recibo: 'TUN_AC-0001',
  matricula_id: 10,
  monto_a_pagar: 500000,
  descuento_total: 50000,
  valor_total: 502000,
  fecha_recibo: '2026-07-25',
  status: 1,
}

// ─── Respuesta precalcular-descuento (nueva estructura julio 2026) ─────────────
const DESC_PRONTO_PAGO_APLICA = {
  aplica: true,
  valor: 18000,
  motivo: 'Pronto pago — Descuento mensualidades',
  descuento: { id: 2, nombre: 'Descuento mensualidades', tipo: 'porcentual', valor: 10 },
  descuento_matricula: {
    aplica: true,
    valor: 50000,
    motivo: 'Descuento matrícula (Promo julio)',
    descuento: { id: 7, nombre: 'Promo julio', tipo: 'valor_fijo', valor: 50000 },
  },
}

const DESC_NO_APLICA = {
  aplica: false,
  valor: 0,
  motivo: 'Ninguna cuota próxima cumple los 5 días de anticipación requeridos.',
  descuento: null,
  descuento_matricula: {
    aplica: false,
    valor: 0,
    motivo: 'No hay cuota de matrícula pendiente.',
    descuento: null,
  },
}

// ─── Payload correcto de recibo (julio 2026) — valor sin sobrecargo en medio ──
const PAYLOAD_RECIBO = {
  sede_id: 1,
  cajero_id: 5,
  matricula_id: 10,
  origen: 1,
  fecha_recibo: '2026-07-25',
  fecha_transaccion: '2026-07-25',
  monto_a_pagar: 1500000,
  aplicar_descuento: true,
  conceptos_adicionales: [],
  medios_pago: [
    { medio_pago: 'efectivo',       valor: 1400000 },
    { medio_pago: 'tarjeta_debito', valor: 100000  },
  ],
  sobrecargos: [{ descuento_id: 8, medio_pago_index: 1 }],
}

describe('reciboPagoService', () => {
  beforeEach(() => vi.clearAllMocks())

  // ─── getAll ─────────────────────────────────────────────────────────────────
  describe('getAll', () => {
    it('llama a GET con parámetros y retorna la lista paginada', async () => {
      api.get.mockResolvedValue({ data: { data: [RECIBO], meta: { total: 1 } } })

      const result = await reciboPagoService.getAll({ page: 1, per_page: 15 })

      expect(api.get).toHaveBeenCalledWith(BASE, { params: { page: 1, per_page: 15 } })
      expect(result.data).toHaveLength(1)
      expect(result.data[0].numero_recibo).toBe('TUN_AC-0001')
    })

    it('llama sin parámetros cuando se omiten', async () => {
      api.get.mockResolvedValue({ data: { data: [] } })
      await reciboPagoService.getAll()
      expect(api.get).toHaveBeenCalledWith(BASE, { params: {} })
    })
  })

  // ─── getById ────────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('llama a GET /{id} y retorna el recibo', async () => {
      api.get.mockResolvedValue({ data: RECIBO })

      const result = await reciboPagoService.getById(1)

      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, { params: {} })
      expect(result).toEqual(RECIBO)
    })

    it('pasa parámetro with para eager loading', async () => {
      api.get.mockResolvedValue({ data: RECIBO })

      await reciboPagoService.getById(1, { with: 'sede,cajero,mediosPago,sobrecargos' })

      expect(api.get).toHaveBeenCalledWith(`${BASE}/1`, {
        params: { with: 'sede,cajero,mediosPago,sobrecargos' },
      })
    })
  })

  // ─── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('envía POST con el payload y retorna el recibo creado', async () => {
      api.post.mockResolvedValue({
        data: { message: 'Recibo creado.', data: { ...RECIBO, id: 99, numero_recibo: 'TUN_AC-0099' } },
      })

      const result = await reciboPagoService.create(PAYLOAD_RECIBO)

      expect(api.post).toHaveBeenCalledWith(BASE, PAYLOAD_RECIBO, {})
      expect(result.data.numero_recibo).toBe('TUN_AC-0099')
    })

    it('el medio de pago con sobrecargo lleva valor base (sin el sobrecargo sumado)', async () => {
      api.post.mockResolvedValue({ data: { data: RECIBO } })

      await reciboPagoService.create(PAYLOAD_RECIBO)

      const [, payload] = api.post.mock.calls[0]
      const medioTarjeta = payload.medios_pago.find(m => m.medio_pago === 'tarjeta_debito')
      expect(medioTarjeta.valor).toBe(100000)
      // monto_a_pagar = suma de valores base, sin sobrecargo
      expect(payload.monto_a_pagar).toBe(1500000)
    })

    it('el sobrecargo se referencia solo por descuento_id e índice del medio', async () => {
      api.post.mockResolvedValue({ data: { data: RECIBO } })

      await reciboPagoService.create(PAYLOAD_RECIBO)

      const [, payload] = api.post.mock.calls[0]
      expect(payload.sobrecargos).toEqual([{ descuento_id: 8, medio_pago_index: 1 }])
    })

    it('propaga error 422 con el mensaje del backend', async () => {
      api.post.mockRejectedValue({
        response: {
          status: 422,
          data: { message: 'El monto (10000) supera el costo efectivo de las cuotas pendientes. El máximo a pagar es 5000.' },
        },
      })

      await expect(reciboPagoService.create(PAYLOAD_RECIBO)).rejects.toMatchObject({
        response: { status: 422 },
      })
    })
  })

  // ─── anular ─────────────────────────────────────────────────────────────────
  describe('anular', () => {
    it('envía POST /{id}/anular con motivo_anulacion', async () => {
      api.post.mockResolvedValue({ data: { message: 'Recibo anulado.' } })

      const result = await reciboPagoService.anular(1, 'Error en el valor registrado.')

      expect(api.post).toHaveBeenCalledWith(`${BASE}/1/anular`, {
        motivo_anulacion: 'Error en el valor registrado.',
      })
      expect(result.message).toContain('anulado')
    })
  })

  // ─── cerrar ─────────────────────────────────────────────────────────────────
  describe('cerrar', () => {
    it('envía POST /{id}/cerrar sin payload', async () => {
      api.post.mockResolvedValue({ data: { message: 'Recibo cerrado.' } })

      await reciboPagoService.cerrar(1)

      expect(api.post).toHaveBeenCalledWith(`${BASE}/1/cerrar`, {})
    })

    it('envía POST /{id}/cerrar con cierre', async () => {
      api.post.mockResolvedValue({ data: { message: 'Recibo cerrado.' } })

      await reciboPagoService.cerrar(1, { cierre: 42 })

      expect(api.post).toHaveBeenCalledWith(`${BASE}/1/cerrar`, { cierre: 42 })
    })
  })

  // ─── precalcularDescuento ────────────────────────────────────────────────────
  describe('precalcularDescuento', () => {
    it('envía POST /precalcular-descuento con el payload correcto', async () => {
      api.post.mockResolvedValue({ data: DESC_PRONTO_PAGO_APLICA })

      await reciboPagoService.precalcularDescuento({
        matricula_id: 10,
        monto_a_pagar: 350000,
        fecha_transaccion: '2026-07-25',
      })

      expect(api.post).toHaveBeenCalledWith(`${BASE}/precalcular-descuento`, {
        matricula_id: 10,
        monto_a_pagar: 350000,
        fecha_transaccion: '2026-07-25',
      })
    })

    it('respuesta incluye aplica, valor y motivo de pronto pago', async () => {
      api.post.mockResolvedValue({ data: DESC_PRONTO_PAGO_APLICA })

      const result = await reciboPagoService.precalcularDescuento({ matricula_id: 10, monto_a_pagar: 350000 })

      expect(result.aplica).toBe(true)
      expect(result.valor).toBe(18000)
      expect(result.motivo).toContain('Pronto pago')
    })

    it('respuesta incluye descuento_matricula cuando hay promo de matrícula activa', async () => {
      api.post.mockResolvedValue({ data: DESC_PRONTO_PAGO_APLICA })

      const result = await reciboPagoService.precalcularDescuento({ matricula_id: 10, monto_a_pagar: 350000 })

      expect(result.descuento_matricula).toBeDefined()
      expect(result.descuento_matricula.aplica).toBe(true)
      expect(result.descuento_matricula.valor).toBe(50000)
      expect(result.descuento_matricula.descuento.tipo).toBe('valor_fijo')
    })

    it('descuento_matricula.aplica es false cuando no hay cuota 0 pendiente', async () => {
      api.post.mockResolvedValue({ data: DESC_NO_APLICA })

      const result = await reciboPagoService.precalcularDescuento({ matricula_id: 10, monto_a_pagar: 100000 })

      expect(result.aplica).toBe(false)
      expect(result.motivo).toContain('días de anticipación')
      expect(result.descuento_matricula.aplica).toBe(false)
    })

    it('aplica false devuelve motivo legible para mostrar al usuario', async () => {
      api.post.mockResolvedValue({ data: DESC_NO_APLICA })

      const result = await reciboPagoService.precalcularDescuento({ matricula_id: 10, monto_a_pagar: 100000 })

      expect(typeof result.motivo).toBe('string')
      expect(result.motivo.length).toBeGreaterThan(0)
    })

    it('el descuento de matrícula es independiente del pronto pago', async () => {
      const soloMatricula = {
        aplica: false,
        valor: 0,
        motivo: 'No hay descuento por pronto pago activo.',
        descuento: null,
        descuento_matricula: {
          aplica: true,
          valor: 30000,
          motivo: 'Descuento matrícula especial',
          descuento: { id: 9, nombre: 'Promo especial', tipo: 'porcentual', valor: 20 },
        },
      }
      api.post.mockResolvedValue({ data: soloMatricula })

      const result = await reciboPagoService.precalcularDescuento({ matricula_id: 10, monto_a_pagar: 150000 })

      expect(result.aplica).toBe(false)
      expect(result.descuento_matricula.aplica).toBe(true)
      expect(result.descuento_matricula.valor).toBe(30000)
    })
  })

  // ─── precalcularSobrecargos ──────────────────────────────────────────────────
  describe('precalcularSobrecargos', () => {
    it('envía POST /precalcular-sobrecargos con los medios de pago', async () => {
      const respuesta = {
        data: {
          sobrecargos: [
            {
              descuento_id: 8,
              nombre: 'TC pago',
              tipo: 'porcentual',
              valor: 2,
              valor_base: 100000,
              valor_sobrecargo: 2000,
              valor_final: 102000,
            },
          ],
          total_sobrecargo: 2000,
        },
      }
      api.post.mockResolvedValue({ data: respuesta })

      const result = await reciboPagoService.precalcularSobrecargos({
        medios_pago: [{ medio_pago: 'tarjeta_debito', tipo_tarjeta: null, valor: 100000 }],
      })

      expect(api.post).toHaveBeenCalledWith(`${BASE}/precalcular-sobrecargos`, {
        medios_pago: [{ medio_pago: 'tarjeta_debito', tipo_tarjeta: null, valor: 100000 }],
      })
      expect(result).toEqual(respuesta)
    })

    it('sobrecargo con tipo valor_fijo tiene valor en pesos (no en %)', async () => {
      const respuesta = {
        data: {
          sobrecargos: [
            {
              descuento_id: 9,
              nombre: 'Recargo fijo',
              tipo: 'valor_fijo',
              valor: 5000,
              valor_base: 200000,
              valor_sobrecargo: 5000,
              valor_final: 205000,
            },
          ],
          total_sobrecargo: 5000,
        },
      }
      api.post.mockResolvedValue({ data: respuesta })

      const result = await reciboPagoService.precalcularSobrecargos({
        medios_pago: [{ medio_pago: 'tarjeta_credito', valor: 200000 }],
      })

      const sc = result.data.sobrecargos[0]
      expect(sc.tipo).toBe('valor_fijo')
      expect(sc.valor).toBe(5000)
      expect(sc.valor_sobrecargo).toBe(5000)
    })
  })

  // ─── getPdf ─────────────────────────────────────────────────────────────────
  describe('getPdf', () => {
    it('llama a GET /{id}/pdf con responseType blob', async () => {
      api.get.mockResolvedValue({ data: new Blob(['%PDF-1.4']) })

      await reciboPagoService.getPdf(1)

      expect(api.get).toHaveBeenCalledWith(`${BASE}/1/pdf`, { responseType: 'blob' })
    })
  })
})
