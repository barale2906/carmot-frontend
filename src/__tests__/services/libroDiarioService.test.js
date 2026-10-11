import { describe, it, expect, beforeEach, vi } from 'vitest'
import libroDiarioService from '@/services/libroDiarioService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'

const BASE = '/financiero/libro-diario'

describe('libroDiarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({ data: { data: [] } })
    api.post.mockResolvedValue({ data: { data: { id: 1 } } })
    api.put.mockResolvedValue({ data: { data: { id: 1 } } })
  })

  it('consulta el libro y el resumen con filtros', async () => {
    await libroDiarioService.getLibro({ sede_id: 2 })
    await libroDiarioService.getResumen({ fecha_desde: '2026-10-01' })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { sede_id: 2 } })
    expect(api.get).toHaveBeenCalledWith(`${BASE}/resumen`, { params: { fecha_desde: '2026-10-01' } })
  })

  it('abre, cierra y reversa turnos', async () => {
    await libroDiarioService.abrirTurno({ sede_id: 1, base_inicial: 100000 })
    await libroDiarioService.cerrarTurno(5, { efectivo_contado: 90000 })
    await libroDiarioService.reversarTurno(5, 'Corrección')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/turnos`, { sede_id: 1, base_inicial: 100000 })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/turnos/5/cerrar`, { efectivo_contado: 90000 })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/turnos/5/reversar`, { motivo: 'Corrección' })
  })

  it('aprueba y rechaza cierres de caja', async () => {
    await libroDiarioService.aprobarTurno(5, 'Cuadra')
    await libroDiarioService.rechazarTurno(5, 'Vuelva a contar')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/turnos/5/aprobar`, { observaciones: 'Cuadra' })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/turnos/5/rechazar`, { motivo: 'Vuelva a contar' })
  })

  it('pide el PDF del turno como blob', () => {
    libroDiarioService.pdfTurno(7)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/turnos/7/pdf`, { responseType: 'blob' })
  })

  it('crea, actualiza y anula movimientos y consignaciones', async () => {
    await libroDiarioService.crearMovimiento({ subtotal: 1 })
    await libroDiarioService.actualizarMovimiento(3, { subtotal: 2 })
    await libroDiarioService.anularMovimiento(3, 'Duplicado')
    await libroDiarioService.crearConsignacion({ valor: 1 })
    await libroDiarioService.anularConsignacion(4, 'Error')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/movimientos`, { subtotal: 1 })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/movimientos/3`, { subtotal: 2 })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/movimientos/3/anular`, { motivo: 'Duplicado' })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/consignaciones`, { valor: 1 })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/consignaciones/4/anular`, { motivo: 'Error' })
  })

  it('sube soportes como multipart con el registro asociado', async () => {
    const archivo = new File(['x'], 'factura.pdf', { type: 'application/pdf' })
    await libroDiarioService.subirSoporte('movimiento', 9, 'factura', archivo)

    const [url, fd, config] = api.post.mock.calls[0]
    expect(url).toBe(`${BASE}/soportes`)
    expect(fd.get('soportable_tipo')).toBe('movimiento')
    expect(fd.get('soportable_id')).toBe('9')
    expect(fd.get('tipo')).toBe('factura')
    expect(fd.get('archivo').name).toBe('factura.pdf')
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
  })

  it('usa la ruta del catálogo indicado', async () => {
    await libroDiarioService.getCatalogoActivos('impuestos')
    await libroDiarioService.restaurarCatalogo('tipos-movimiento', 2)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/impuestos/activos`, { params: {} })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/tipos-movimiento/2/restore`)
  })
})
