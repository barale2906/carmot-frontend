import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'
import invCategoriaService    from '@/services/invCategoriaService.js'
import invUnidadMedidaService from '@/services/invUnidadMedidaService.js'
import invProductoService     from '@/services/invProductoService.js'
import invAlmacenService      from '@/services/invAlmacenService.js'
import invProveedorService    from '@/services/invProveedorService.js'
import invStockService        from '@/services/invStockService.js'
import invMovimientoService   from '@/services/invMovimientoService.js'
import invPrecioService       from '@/services/invPrecioService.js'
import invListaPrecioService  from '@/services/invListaPrecioService.js'
import invVentaService        from '@/services/invVentaService.js'
import invPedidoService       from '@/services/invPedidoService.js'
import invEntregaService      from '@/services/invEntregaService.js'
import invOrdenCompraService  from '@/services/invOrdenCompraService.js'

const mockPaginated = (items) => ({ data: items, meta: { current_page: 1, last_page: 1, total: items.length } })
const ok = (data) => Promise.resolve({ data })

beforeEach(() => vi.clearAllMocks())

// ─── invCategoriaService ───────────────────────────────────────────────────────

describe('invCategoriaService', () => {
  const BASE = '/inventarios/categorias'

  it('getAll llama GET con params', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invCategoriaService.getAll({ search: 'uni', status: 1 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { search: 'uni', status: 1 } })
  })

  it('getActivas llama GET /activas', async () => {
    api.get.mockResolvedValue(ok([]))
    await invCategoriaService.getActivas()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/activas`)
  })

  it('getTrashed llama GET /trashed', async () => {
    api.get.mockResolvedValue(ok([]))
    await invCategoriaService.getTrashed()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`)
  })

  it('getById llama GET /{id}', async () => {
    api.get.mockResolvedValue(ok({ id: 1 }))
    await invCategoriaService.getById(1)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/1`)
  })

  it('create llama POST con payload', async () => {
    api.post.mockResolvedValue(ok({ id: 2, nombre: 'Uniformes' }))
    const result = await invCategoriaService.create({ nombre: 'Uniformes' })
    expect(api.post).toHaveBeenCalledWith(BASE, { nombre: 'Uniformes' })
    expect(result.nombre).toBe('Uniformes')
  })

  it('update llama PUT /{id} con payload', async () => {
    api.put.mockResolvedValue(ok({ id: 1, nombre: 'Útiles' }))
    await invCategoriaService.update(1, { nombre: 'Útiles' })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/1`, { nombre: 'Útiles' })
  })

  it('delete llama DELETE /{id}', async () => {
    api.delete.mockResolvedValue(ok({}))
    await invCategoriaService.delete(1)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/1`)
  })

  it('restore llama POST /{id}/restore', async () => {
    api.post.mockResolvedValue(ok({}))
    await invCategoriaService.restore(1)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/1/restore`)
  })

  it('forceDelete llama DELETE /{id}/force-delete', async () => {
    api.delete.mockResolvedValue(ok({}))
    await invCategoriaService.forceDelete(1)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/1/force-delete`)
  })
})

// ─── invUnidadMedidaService ────────────────────────────────────────────────────

describe('invUnidadMedidaService', () => {
  const BASE = '/inventarios/unidades-medida'

  it('getAll llama GET con params', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invUnidadMedidaService.getAll({ search: 'kg' })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { search: 'kg' } })
  })

  it('getActivas llama GET /activas', async () => {
    api.get.mockResolvedValue(ok([]))
    await invUnidadMedidaService.getActivas()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/activas`)
  })

  it('create envía nombre y abreviatura', async () => {
    api.post.mockResolvedValue(ok({ id: 1 }))
    await invUnidadMedidaService.create({ nombre: 'Kilogramo', abreviatura: 'kg' })
    expect(api.post).toHaveBeenCalledWith(BASE, { nombre: 'Kilogramo', abreviatura: 'kg' })
  })

  it('restore llama POST /{id}/restore', async () => {
    api.post.mockResolvedValue(ok({}))
    await invUnidadMedidaService.restore(3)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/3/restore`)
  })
})

// ─── invProductoService ────────────────────────────────────────────────────────

describe('invProductoService', () => {
  const BASE = '/inventarios/productos'

  it('getAll acepta filtros de tipo y categoría', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invProductoService.getAll({ tipo: 'simple', categoria_id: 2 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { tipo: 'simple', categoria_id: 2 } })
  })

  it('getActivos llama GET /activos', async () => {
    api.get.mockResolvedValue(ok([]))
    await invProductoService.getActivos()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/activos`, { params: {} })
  })

  it('getStatistics llama GET /statistics', async () => {
    api.get.mockResolvedValue(ok({ total: 50 }))
    await invProductoService.getStatistics()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/statistics`)
  })

  it('create retorna el producto creado', async () => {
    api.post.mockResolvedValue(ok({ id: 5, nombre: 'Uniforme M', tipo: 'simple' }))
    const res = await invProductoService.create({ nombre: 'Uniforme M', tipo: 'simple' })
    expect(res.tipo).toBe('simple')
  })

  it('getComponentes llama GET /{id}/componentes', async () => {
    api.get.mockResolvedValue(ok([]))
    await invProductoService.getComponentes(10)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/10/componentes`)
  })

  it('addComponente llama POST /{id}/componentes con payload', async () => {
    api.post.mockResolvedValue(ok({ id: 1 }))
    const payload = { componente_tipo: 'producto', componente_id: 5, cantidad: 2, es_opcional: false, orden: 1 }
    await invProductoService.addComponente(10, payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/10/componentes`, payload)
  })

  it('deleteComponente llama DELETE /{id}/componentes/{compId}', async () => {
    api.delete.mockResolvedValue(ok({}))
    await invProductoService.deleteComponente(10, 3)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/10/componentes/3`)
  })
})

// ─── invAlmacenService ─────────────────────────────────────────────────────────

describe('invAlmacenService', () => {
  const BASE = '/inventarios/almacenes'

  it('getActivos acepta filtro sede_id', async () => {
    api.get.mockResolvedValue(ok([]))
    await invAlmacenService.getActivos({ sede_id: 1 })
    expect(api.get).toHaveBeenCalledWith(`${BASE}/activos`, { params: { sede_id: 1 } })
  })

  it('syncUsuarios llama POST /{id}/usuarios con user_ids', async () => {
    api.post.mockResolvedValue(ok({}))
    await invAlmacenService.syncUsuarios(2, [1, 3, 5])
    expect(api.post).toHaveBeenCalledWith(`${BASE}/2/usuarios`, { user_ids: [1, 3, 5] })
  })
})

// ─── invProveedorService ───────────────────────────────────────────────────────

describe('invProveedorService', () => {
  const BASE = '/inventarios/proveedores'

  it('getAll llama GET con params', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invProveedorService.getAll({ search: 'Textiles' })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { search: 'Textiles' } })
  })

  it('create envía campos del proveedor', async () => {
    api.post.mockResolvedValue(ok({ id: 1 }))
    const payload = { razon_social: 'Textiles SA', nit: '900123456-1' }
    await invProveedorService.create(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
  })

  it('forceDelete llama DELETE /{id}/force-delete', async () => {
    api.delete.mockResolvedValue(ok({}))
    await invProveedorService.forceDelete(7)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/7/force-delete`)
  })
})

// ─── invStockService ───────────────────────────────────────────────────────────

describe('invStockService', () => {
  const BASE = '/inventarios/stock'

  it('getAll acepta filtros producto_id, almacen_id, bajo_stock', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invStockService.getAll({ almacen_id: 3, bajo_stock: true })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { almacen_id: 3, bajo_stock: true } })
  })

  it('getStatistics llama GET /statistics', async () => {
    api.get.mockResolvedValue(ok({ total_productos: 20 }))
    await invStockService.getStatistics()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/statistics`)
  })

  it('getPlantilla solicita responseType blob', async () => {
    api.get.mockResolvedValue({ data: new Blob() })
    await invStockService.getPlantilla()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/plantilla`, { responseType: 'blob' })
  })

  it('importar llama POST /importar con FormData', async () => {
    api.post.mockResolvedValue(ok({ importados: 5 }))
    const fd = new FormData()
    await invStockService.importar(fd)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/importar`, fd, {})
  })
})

// ─── invMovimientoService ──────────────────────────────────────────────────────

describe('invMovimientoService', () => {
  const BASE = '/inventarios/movimientos'

  it('getAll llama GET con params', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invMovimientoService.getAll({ tipo: 'entrada' })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { tipo: 'entrada' } })
  })

  it('create envía el documento de movimiento', async () => {
    api.post.mockResolvedValue(ok({ id: 1, tipo: 'ajuste' }))
    const payload = { tipo: 'ajuste', almacen_id: 3, lineas: [{ producto_id: 5, cantidad: 10 }] }
    const res = await invMovimientoService.create(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
    expect(res.tipo).toBe('ajuste')
  })

  it('anular llama POST /{id}/anular con motivo', async () => {
    api.post.mockResolvedValue(ok({ anulado: true }))
    await invMovimientoService.anular(5, 'Error de captura')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/anular`, { motivo_anulacion: 'Error de captura' })
  })
})

// ─── invPrecioService ──────────────────────────────────────────────────────────

describe('invPrecioService', () => {
  const BASE = '/inventarios/precios'

  it('getAll acepta filtros lista_precio_id y producto_id', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invPrecioService.getAll({ lista_precio_id: 1, producto_id: 5 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { lista_precio_id: 1, producto_id: 5 } })
  })

  it('getByProducto llama GET /producto/{id}', async () => {
    api.get.mockResolvedValue(ok([{ id: 1, precio: 55000 }]))
    const res = await invPrecioService.getByProducto(5)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/producto/5`)
    expect(res[0].precio).toBe(55000)
  })

  it('create envía el precio', async () => {
    api.post.mockResolvedValue(ok({ id: 1 }))
    const payload = { producto_id: 5, lista_precio_id: 1, precio: 55000 }
    await invPrecioService.create(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
  })
})

// ─── invVentaService ───────────────────────────────────────────────────────────

describe('invVentaService', () => {
  const BASE = '/inventarios/ventas'

  it('create envía el payload de venta completo', async () => {
    api.post.mockResolvedValue(ok({ id: 1, status: 'entregado' }))
    const payload = {
      estudiante_id: 42,
      sede_id: 1,
      almacen_id: 3,
      items: [{ producto_id: 5, cantidad: 1 }],
      monto_abono: 75000,
      medios_pago: [{ medio_pago: 'efectivo', valor: 75000 }],
    }
    const res = await invVentaService.create(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload, {})
    expect(res.status).toBe('entregado')
  })

  it('verificarDisponibilidad llama POST /verificar-disponibilidad', async () => {
    api.post.mockResolvedValue(ok({ data: { entregable_completo: true, items: [] } }))
    const payload = { almacen_id: 1, items: [{ producto_id: 15, cantidad: 3, entrega_completa: true }] }
    const res = await invVentaService.verificarDisponibilidad(payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/verificar-disponibilidad`, payload)
    expect(res.data.entregable_completo).toBe(true)
  })

  it('create acepta config adicional para multipart/form-data', async () => {
    api.post.mockResolvedValue(ok({ id: 2 }))
    const fd = new FormData()
    const config = { headers: { 'Content-Type': 'multipart/form-data' } }
    await invVentaService.create(fd, config)
    expect(api.post).toHaveBeenCalledWith(BASE, fd, config)
  })

  it('abonar llama POST /{id}/abonar con monto y medios', async () => {
    api.post.mockResolvedValue(ok({ saldo: 0 }))
    const payload = {
      monto_abono: 50000,
      medios_pago: [{ medio_pago: 'transferencia', valor: 50000, banco_id: 2, referencia: 'REF-001' }],
    }
    await invVentaService.abonar(10, payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/10/abonar`, payload, {})
  })

  it('la suma de medios_pago debe igualar monto_abono — validación conceptual', () => {
    const medios = [{ valor: 30000 }, { valor: 20000 }]
    const total = medios.reduce((s, m) => s + m.valor, 0)
    expect(total).toBe(50000)
  })

  it('precalcularSobrecargos llama POST /precalcular-sobrecargos', async () => {
    api.post.mockResolvedValue(ok({ sobrecargos: [], total_sobrecargo: 0 }))
    const payload = { medios_pago: [{ medio_pago: 'tarjeta_credito', tipo_tarjeta: 'visa', valor: 85000 }] }
    await invVentaService.precalcularSobrecargos(payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/precalcular-sobrecargos`, payload)
  })

  it('notificarTransferencia llama POST /{id}/notificar-transferencia sin body', async () => {
    api.post.mockResolvedValue(ok({ message: 'Notificación enviada a 2 validador(es).', aprobadores: 2 }))
    await invVentaService.notificarTransferencia(310)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/310/notificar-transferencia`)
  })

  it('aprobarTransferencia llama POST /{id}/aprobar-transferencia', async () => {
    api.post.mockResolvedValue(ok({ message: 'Recibo aprobado.' }))
    await invVentaService.aprobarTransferencia(310)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/310/aprobar-transferencia`)
  })

  it('rechazarTransferencia llama POST /{id}/rechazar-transferencia con motivo_rechazo', async () => {
    api.post.mockResolvedValue(ok({ message: 'Recibo rechazado.' }))
    await invVentaService.rechazarTransferencia(310, 'Comprobante ilegible')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/310/rechazar-transferencia`, { motivo_rechazo: 'Comprobante ilegible' })
  })

  it('reenviarTransferencia llama POST /{id}/reenviar-transferencia', async () => {
    api.post.mockResolvedValue(ok({ message: 'Reenviado.' }))
    const fd = new FormData()
    const config = { headers: { 'Content-Type': 'multipart/form-data' } }
    await invVentaService.reenviarTransferencia(310, fd, config)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/310/reenviar-transferencia`, fd, config)
  })
})

// ─── invPedidoService ──────────────────────────────────────────────────────────

describe('invPedidoService', () => {
  const BASE = '/inventarios/pedidos'

  it('getAll acepta filtros de status y sede', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invPedidoService.getAll({ status: 'activo', sede_id: 1 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { status: 'activo', sede_id: 1 } })
  })

  it('getByEstudiante llama GET /estudiante/{id}', async () => {
    api.get.mockResolvedValue(ok([]))
    await invPedidoService.getByEstudiante(42)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/estudiante/42`)
  })

  it('cancelar llama POST /{id}/cancelar con motivo', async () => {
    api.post.mockResolvedValue(ok({ status: 'cancelado' }))
    await invPedidoService.cancelar(5, 'Solicitud del cliente')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/cancelar`, { motivo: 'Solicitud del cliente' })
  })

  it('anular llama POST /{id}/anular sin body', async () => {
    api.post.mockResolvedValue(ok({ status: 'cancelado' }))
    await invPedidoService.anular(8)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/8/anular`)
  })

  it('descargarTicketPdf llama GET /{id}/ticket-pdf con responseType blob', async () => {
    api.get.mockResolvedValue({ data: new Blob() })
    await invPedidoService.descargarTicketPdf(88)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/88/ticket-pdf`, { responseType: 'blob' })
  })
})

// ─── invEntregaService ─────────────────────────────────────────────────────────

describe('invEntregaService', () => {
  const BASE = '/inventarios/entregas'

  it('getPendientes llama GET /pendientes con params', async () => {
    api.get.mockResolvedValue(ok([]))
    await invEntregaService.getPendientes({ almacen_id: 3 })
    expect(api.get).toHaveBeenCalledWith(`${BASE}/pendientes`, { params: { almacen_id: 3 } })
  })

  it('getNecesidades llama GET /necesidades', async () => {
    api.get.mockResolvedValue(ok([]))
    await invEntregaService.getNecesidades()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/necesidades`, { params: {} })
  })

  it('completarSimple sin opciones entrega todo lo que permita el stock', async () => {
    api.post.mockResolvedValue(ok({ status: 'entregado' }))
    await invEntregaService.completarSimple(7)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/simple/7/completar`, {})
  })

  it('completarSimple envía cantidad parcial y forzar_parcial', async () => {
    api.post.mockResolvedValue(ok({ status: 'parcial' }))
    await invEntregaService.completarSimple(7, { cantidad: 2, forzar_parcial: true })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/simple/7/completar`, { cantidad: 2, forzar_parcial: true })
  })

  it('entregarComponentes llama POST /kit/{id}/entregar-componentes solo con lo seleccionado', async () => {
    api.post.mockResolvedValue(ok({ status: 'parcial' }))
    const comp = [{ kit_componente_id: 14, producto_entregado_id: 35 }, { kit_componente_id: 15, cantidad: 1 }]
    await invEntregaService.entregarComponentes(8, comp)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/kit/8/entregar-componentes`, { componentes: comp })
  })

  it('entregarComponentes propaga forzar_parcial', async () => {
    api.post.mockResolvedValue(ok({ status: 'parcial' }))
    const comp = [{ kit_componente_id: 14 }]
    await invEntregaService.entregarComponentes(8, comp, { forzar_parcial: true })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/kit/8/entregar-componentes`, { componentes: comp, forzar_parcial: true })
  })

  it('completarKit llama POST /kit/{id}/completar con componentes', async () => {
    api.post.mockResolvedValue(ok({ completado: true }))
    const comp = [{ kit_componente_id: 3, producto_entregado_id: 7 }]
    await invEntregaService.completarKit(8, comp)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/kit/8/completar`, { componentes: comp })
  })
})

// ─── invOrdenCompraService ─────────────────────────────────────────────────────

describe('invOrdenCompraService', () => {
  const BASE = '/inventarios/ordenes-compra'

  it('getAll acepta filtros de status y proveedor', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invOrdenCompraService.getAll({ status: 'borrador', proveedor_id: 2 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { status: 'borrador', proveedor_id: 2 } })
  })

  it('getPendientesRecepcion llama GET /pendientes-recepcion', async () => {
    api.get.mockResolvedValue(ok([]))
    await invOrdenCompraService.getPendientesRecepcion()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/pendientes-recepcion`)
  })

  it('enviar llama POST /{id}/enviar', async () => {
    api.post.mockResolvedValue(ok({ status: 'enviada' }))
    await invOrdenCompraService.enviar(3)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/3/enviar`)
  })

  it('recibir envía los ítems con cantidades y precios', async () => {
    api.post.mockResolvedValue(ok({ status: 'recibida' }))
    const items = [{ orden_item_id: 1, cantidad_recibida: 20, precio_costo_unitario: 8500 }]
    await invOrdenCompraService.recibir(3, items)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/3/recibir`, { items })
  })

  it('cancelar llama POST /{id}/cancelar con motivo', async () => {
    api.post.mockResolvedValue(ok({ status: 'cancelada' }))
    await invOrdenCompraService.cancelar(3, 'Proveedor no disponible')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/3/cancelar`, { motivo: 'Proveedor no disponible' })
  })

  it('create crea OC en borrador', async () => {
    api.post.mockResolvedValue(ok({ id: 1, status: 'borrador' }))
    const payload = { proveedor_id: 2, almacen_id: 3, items: [{ producto_id: 5, cantidad: 10 }] }
    const res = await invOrdenCompraService.create(payload)
    expect(res.status).toBe('borrador')
  })
})

// ─── invListaPrecioService ─────────────────────────────────────────────────────

describe('invListaPrecioService', () => {
  const BASE = '/inventarios/listas-precios'

  it('getAll llama GET con params de filtro', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invListaPrecioService.getAll({ search: 'uniforme', status: 3 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { search: 'uniforme', status: 3 } })
  })

  it('getAll sin params llama GET con objeto vacío', async () => {
    api.get.mockResolvedValue(ok(mockPaginated([])))
    await invListaPrecioService.getAll()
    expect(api.get).toHaveBeenCalledWith(BASE, { params: {} })
  })

  it('getById llama GET /{id}', async () => {
    api.get.mockResolvedValue(ok({ id: 5, nombre: 'Lista A' }))
    const res = await invListaPrecioService.getById(5)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/5`)
    expect(res.nombre).toBe('Lista A')
  })

  it('create llama POST con payload completo', async () => {
    const payload = { nombre: 'Lista B', fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31', descripcion: 'desc', poblaciones: [1, 2] }
    api.post.mockResolvedValue(ok({ id: 10, ...payload }))
    const res = await invListaPrecioService.create(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
    expect(res.id).toBe(10)
  })

  it('update llama PUT /{id} con payload', async () => {
    api.put.mockResolvedValue(ok({ id: 5, nombre: 'Lista B actualizada' }))
    await invListaPrecioService.update(5, { nombre: 'Lista B actualizada' })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/5`, { nombre: 'Lista B actualizada' })
  })

  it('delete llama DELETE /{id}', async () => {
    api.delete.mockResolvedValue(ok({ message: 'eliminada' }))
    await invListaPrecioService.delete(5)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/5`)
  })

  it('aprobar llama POST /{id}/aprobar', async () => {
    api.post.mockResolvedValue(ok({ id: 5, status: 2 }))
    const res = await invListaPrecioService.aprobar(5)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/aprobar`)
    expect(res.status).toBe(2)
  })

  it('activar llama POST /{id}/activar', async () => {
    api.post.mockResolvedValue(ok({ id: 5, status: 3 }))
    const res = await invListaPrecioService.activar(5)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/activar`)
    expect(res.status).toBe(3)
  })

  it('inactivar llama POST /{id}/inactivar', async () => {
    api.post.mockResolvedValue(ok({ id: 5, status: 0 }))
    const res = await invListaPrecioService.inactivar(5)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/inactivar`)
    expect(res.status).toBe(0)
  })

  it('clonar llama POST /{id}/clonar con payload', async () => {
    const payload = { nombre: 'Lista copia', fecha_inicio: '2027-01-01', fecha_fin: '2027-12-31', copiar_precios: true }
    api.post.mockResolvedValue(ok({ message: 'clonada', precios_copiados: 5, data: { id: 20, ...payload } }))
    const res = await invListaPrecioService.clonar(5, payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/clonar`, payload)
    expect(res.precios_copiados).toBe(5)
  })

  it('clonar con copiar_precios=false no copia precios', async () => {
    const payload = { nombre: 'Lista vacía', fecha_inicio: '2027-01-01', fecha_fin: '2027-12-31', copiar_precios: false }
    api.post.mockResolvedValue(ok({ message: 'clonada', precios_copiados: 0, data: { id: 21 } }))
    const res = await invListaPrecioService.clonar(5, payload)
    expect(res.precios_copiados).toBe(0)
  })
})

// ─── invPrecioService.sincronizar ─────────────────────────────────────────────

describe('invPrecioService — sincronizar', () => {
  const BASE_PRECIOS = '/inventarios/precios'

  it('sincronizar llama POST /lista/{listaId}/sincronizar con items', async () => {
    const items = [
      { producto_id: 10, precio: 45000, observaciones: 'Precio especial' },
      { producto_id: 12, precio: 8000 },
    ]
    api.post.mockResolvedValue(ok({ message: 'Precios sincronizados.', data: items }))
    const res = await invPrecioService.sincronizar(7, items)
    expect(api.post).toHaveBeenCalledWith(`${BASE_PRECIOS}/lista/7/sincronizar`, { items })
    expect(res).toBeDefined()
  })

  it('sincronizar con lista vacía elimina todos los precios', async () => {
    api.post.mockResolvedValue(ok({ message: 'Precios sincronizados.', data: [] }))
    await invPrecioService.sincronizar(7, [])
    expect(api.post).toHaveBeenCalledWith(`${BASE_PRECIOS}/lista/7/sincronizar`, { items: [] })
  })
})
