import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { withSetup } from '../helpers.js'
import {
  useDisponibilidadVenta,
  estadoEntregaItem,
  estadoEntregaComponente,
  variantesSeleccionadas,
} from '@/composables/useDisponibilidadVenta.js'

vi.mock('@/services/invVentaService.js', () => ({
  default: { verificarDisponibilidad: vi.fn() },
}))

import invVentaService from '@/services/invVentaService.js'

const dispSimple = (extra = {}) => ({
  item_index: 0, producto_id: 15, tipo: 'simple',
  cantidad_solicitada: 3, cantidad_entregable: 3, faltante: 0,
  entregable_ahora: true, requiere_variante: false, componentes: [],
  ...extra,
})

const dispKit = (componentes, extra = {}) => ({
  item_index: 1, producto_id: 22, tipo: 'kit',
  cantidad_solicitada: 1, cantidad_entregable: 0, faltante: 1,
  entregable_ahora: false, requiere_variante: false, componentes,
  ...extra,
})

const item = (extra = {}) => ({ entregar: true, entrega_completa: false, ...extra })

// ─── Utilidades puras ────────────────────────────────────────────────────────

describe('variantesSeleccionadas', () => {
  it('convierte el mapa en arreglo numérico e ignora componentes sin elección', () => {
    expect(variantesSeleccionadas({ 14: '35', 15: null, 16: '' })).toEqual([
      { kit_componente_id: 14, producto_entregado_id: 35 },
    ])
  })

  it('sin variantes → arreglo vacío', () => {
    expect(variantesSeleccionadas()).toEqual([])
  })
})

describe('estadoEntregaItem', () => {
  it('"No entregar ahora" prevalece sobre el stock', () => {
    expect(estadoEntregaItem(item({ entregar: false }), dispSimple()).tono).toBe('diferido')
  })

  it('sin respuesta todavía → cargando', () => {
    expect(estadoEntregaItem(item(), null).tono).toBe('cargando')
  })

  it('entregable_ahora → ok', () => {
    expect(estadoEntregaItem(item(), dispSimple())).toEqual({ tono: 'ok', texto: 'Se entrega ahora' })
  })

  it('stock parcial → parcial con el faltante', () => {
    const disp = dispSimple({ entregable_ahora: false, cantidad_entregable: 2, faltante: 1 })
    expect(estadoEntregaItem(item(), disp)).toEqual({ tono: 'parcial', texto: 'Entrega parcial — faltan 1' })
  })

  it('sin stock → pendiente', () => {
    const disp = dispSimple({ entregable_ahora: false, cantidad_entregable: 0, faltante: 3 })
    expect(estadoEntregaItem(item(), disp).tono).toBe('pendiente')
  })

  it('con entrega_completa y stock insuficiente → pendiente (entrega completa)', () => {
    const disp = dispSimple({ entregable_ahora: false, cantidad_entregable: 0, faltante: 3 })
    expect(estadoEntregaItem(item({ entrega_completa: true }), disp).texto).toBe('Queda pendiente de entrega (entrega completa)')
  })

  it('kit con componente grupo sin variante → pide elegir variante', () => {
    const disp = dispKit([{ requiere_variante: true, producto_entregado_id: null, cantidad_entregable: 0 }])
    expect(estadoEntregaItem(item(), disp).tono).toBe('variante')
  })

  it('kit sin unidades completas pero con algún componente disponible → parcial', () => {
    const disp = dispKit([
      { requiere_variante: false, producto_entregado_id: 35, cantidad_entregable: 1 },
      { requiere_variante: false, producto_entregado_id: 31, cantidad_entregable: 0 },
    ])
    expect(estadoEntregaItem(item(), disp)).toEqual({ tono: 'parcial', texto: 'Entrega parcial — faltan componentes' })
  })

  it('kit sin ningún componente disponible → pendiente', () => {
    const disp = dispKit([{ requiere_variante: false, producto_entregado_id: 31, cantidad_entregable: 0 }])
    expect(estadoEntregaItem(item(), disp).tono).toBe('pendiente')
  })
})

describe('estadoEntregaComponente', () => {
  it('grupo sin variante → variante', () => {
    expect(estadoEntregaComponente({ requiere_variante: true, producto_entregado_id: null }).tono).toBe('variante')
  })

  it('disponible / parcial / sin stock', () => {
    expect(estadoEntregaComponente({ entregable_ahora: true }).tono).toBe('ok')
    expect(estadoEntregaComponente({ entregable_ahora: false, cantidad_entregable: 1, faltante: 1 })).toEqual({ tono: 'parcial', texto: 'Faltan 1' })
    expect(estadoEntregaComponente({ entregable_ahora: false, cantidad_entregable: 0 }).tono).toBe('pendiente')
  })
})

// ─── Composable ──────────────────────────────────────────────────────────────

describe('useDisponibilidadVenta', () => {
  let unmount

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    unmount?.()
    vi.useRealTimers()
  })

  function montar(itemsIniciales = [], almacen = '1') {
    const items     = ref(itemsIniciales)
    const almacenId = ref(almacen)
    const [result, u] = withSetup(() => useDisponibilidadVenta({ items, almacenId }))
    unmount = u
    return { items, almacenId, ...result }
  }

  async function esperarConsulta() {
    await nextTick()
    await vi.advanceTimersByTimeAsync(400)
  }

  it('consulta con debounce al cambiar el carrito y arma el payload del backend', async () => {
    invVentaService.verificarDisponibilidad.mockResolvedValue({ data: { entregable_completo: true, items: [dispSimple()] } })
    const { items, disponibilidad } = montar()

    items.value = [{ producto_id: 15, cantidad: 3, entrega_completa: false, entregar: true, variantes: {} }]
    await nextTick()
    expect(invVentaService.verificarDisponibilidad).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(400)
    expect(invVentaService.verificarDisponibilidad).toHaveBeenCalledWith({
      almacen_id: 1,
      items: [{ producto_id: 15, cantidad: 3, entrega_completa: false }],
    })
    expect(disponibilidad.value.entregable_completo).toBe(true)
  })

  it('envía entrega_completa y variantes de kit elegidas', async () => {
    invVentaService.verificarDisponibilidad.mockResolvedValue({ data: { items: [] } })
    const { items } = montar()

    items.value = [{ producto_id: 22, cantidad: 1, entrega_completa: true, entregar: true, variantes: { 14: 35 } }]
    await esperarConsulta()

    expect(invVentaService.verificarDisponibilidad).toHaveBeenCalledWith({
      almacen_id: 1,
      items: [{
        producto_id: 22, cantidad: 1, entrega_completa: true,
        variantes: [{ kit_componente_id: 14, producto_entregado_id: 35 }],
      }],
    })
  })

  it('cambiar solo "No entregar ahora" no vuelve a consultar (no afecta el stock)', async () => {
    invVentaService.verificarDisponibilidad.mockResolvedValue({ data: { items: [] } })
    const { items } = montar()
    items.value = [{ producto_id: 15, cantidad: 1, entrega_completa: false, entregar: true, variantes: {} }]
    await esperarConsulta()
    expect(invVentaService.verificarDisponibilidad).toHaveBeenCalledTimes(1)

    items.value[0].entregar = false
    await esperarConsulta()
    expect(invVentaService.verificarDisponibilidad).toHaveBeenCalledTimes(1)
  })

  it('no consulta sin almacén o con cantidades inválidas', async () => {
    const { items, almacenId } = montar([], '')
    items.value = [{ producto_id: 15, cantidad: 1, variantes: {} }]
    await esperarConsulta()

    almacenId.value = '1'
    items.value[0].cantidad = 0
    await esperarConsulta()

    expect(invVentaService.verificarDisponibilidad).not.toHaveBeenCalled()
  })

  it('descarta respuestas desfasadas (gana la última consulta)', async () => {
    let resolverPrimera
    invVentaService.verificarDisponibilidad
      .mockImplementationOnce(() => new Promise(r => { resolverPrimera = r }))
      .mockResolvedValueOnce({ data: { items: [dispSimple({ cantidad_solicitada: 5 })] } })

    const { items, disponibilidad } = montar()
    items.value = [{ producto_id: 15, cantidad: 3, variantes: {} }]
    await esperarConsulta()

    items.value[0].cantidad = 5
    await esperarConsulta()

    resolverPrimera({ data: { items: [dispSimple({ cantidad_solicitada: 3 })] } })
    await vi.runAllTimersAsync()

    expect(disponibilidad.value.items[0].cantidad_solicitada).toBe(5)
  })

  it('un error de la consulta no bloquea: deja aviso y disponibilidad en null', async () => {
    invVentaService.verificarDisponibilidad.mockRejectedValue({ response: { data: {} } })
    const { items, disponibilidad, errorDisponibilidad } = montar()
    items.value = [{ producto_id: 15, cantidad: 1, variantes: {} }]
    await esperarConsulta()

    expect(disponibilidad.value).toBeNull()
    expect(errorDisponibilidad.value).toContain('La venta se puede registrar igual')
  })

  it('disponibilidadDe ignora datos de otra línea tras quitar un producto', async () => {
    invVentaService.verificarDisponibilidad.mockResolvedValue({
      data: { items: [dispSimple({ item_index: 0, producto_id: 15 }), dispSimple({ item_index: 1, producto_id: 18 })] },
    })
    const { items, disponibilidadDe } = montar()
    items.value = [{ producto_id: 15, cantidad: 1, variantes: {} }, { producto_id: 18, cantidad: 1, variantes: {} }]
    await esperarConsulta()
    expect(disponibilidadDe(1).producto_id).toBe(18)

    // Se quita el primero: el índice 0 ahora es el producto 18 hasta que llegue la nueva consulta
    items.value = [items.value[1]]
    expect(disponibilidadDe(0)).toBeNull()
  })
})
