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
    expect(api.post).toHaveBeenCalledWith(`${BASE}/5/anular`, { motivo: 'Error de captura' })
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
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
    expect(res.status).toBe('entregado')
  })

  it('abonar llama POST /{id}/abonar con monto y medios', async () => {
    api.post.mockResolvedValue(ok({ saldo: 0 }))
    const payload = {
      monto_abono: 50000,
      medios_pago: [{ medio_pago: 'transferencia', valor: 50000, banco_id: 2, referencia: 'REF-001' }],
    }
    await invVentaService.abonar(10, payload)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/10/abonar`, payload)
  })

  it('la suma de medios_pago debe igualar monto_abono — validación conceptual', () => {
    const medios = [{ valor: 30000 }, { valor: 20000 }]
    const total = medios.reduce((s, m) => s + m.valor, 0)
    expect(total).toBe(50000)
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

  it('completarSimple llama POST /simple/{id}/completar', async () => {
    api.post.mockResolvedValue(ok({ completado: true }))
    await invEntregaService.completarSimple(7)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/simple/7/completar`)
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
