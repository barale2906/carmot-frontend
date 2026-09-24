import { describe, it, expect } from 'vitest'
import {
  pendienteSimple,
  itemEntregado,
  stockComponente,
  cantidadSugerida,
  payloadComponentes,
  interpretarResultadoEntrega,
} from '@/utils/invEntregas.js'

const compGrupo = (extra = {}) => ({
  id: 31,
  kit_componente_id: 14,
  componente_nombre: 'Camisa',
  componente_tipo: 'grupo',
  producto_entregado: null,
  cantidad_solicitada: 2,
  cantidad_entregada: 0,
  cantidad_pendiente: 2,
  status: 'pendiente',
  stock_disponible: null,
  variantes: [
    { id: 35, nombre: 'Camisa M', stock_disponible: 6 },
    { id: 36, nombre: 'Camisa L', stock_disponible: 0 },
  ],
  ...extra,
})

const compSimple = (extra = {}) => ({
  id: 32,
  kit_componente_id: 15,
  componente_nombre: 'Botas',
  componente_tipo: 'simple',
  producto_entregado: { id: 31, nombre: 'Botas' },
  cantidad_solicitada: 2,
  cantidad_entregada: 1,
  cantidad_pendiente: 1,
  status: 'parcial',
  stock_disponible: 5,
  variantes: [],
  ...extra,
})

describe('pendienteSimple', () => {
  it('usa cantidad_pendiente del backend cuando viene', () => {
    expect(pendienteSimple({ cantidad: 3, entrega_simple: { cantidad_entregada: 1, cantidad_pendiente: 2 } })).toBe(2)
  })

  it('calcula cantidad - entregada si el backend no envía el campo', () => {
    expect(pendienteSimple({ cantidad: 5, entrega_simple: { cantidad_entregada: 2 } })).toBe(3)
  })

  it('nunca devuelve negativo', () => {
    expect(pendienteSimple({ cantidad: 1, entrega_simple: { cantidad_entregada: 4 } })).toBe(0)
  })
})

describe('itemEntregado', () => {
  it('simple entregado → true; parcial/pendiente → false', () => {
    expect(itemEntregado({ entrega_simple: { status: 'entregado' } })).toBe(true)
    expect(itemEntregado({ entrega_simple: { status: 'parcial' } })).toBe(false)
    expect(itemEntregado({ entrega_simple: { status: 'pendiente' } })).toBe(false)
  })

  it('kit solo se considera entregado con status completo', () => {
    expect(itemEntregado({ entrega_kit: { status: 'completo' } })).toBe(true)
    expect(itemEntregado({ entrega_kit: { status: 'parcial' } })).toBe(false)
  })

  it('ítem sin registro de entrega no se considera entregado', () => {
    expect(itemEntregado({ entrega_simple: null, entrega_kit: null })).toBe(false)
  })
})

describe('stockComponente', () => {
  it('componente simple usa su stock_disponible', () => {
    expect(stockComponente(compSimple())).toBe(5)
  })

  it('grupo sin variante asignada ni elegida → 0 (null no es stock)', () => {
    expect(stockComponente(compGrupo())).toBe(0)
  })

  it('grupo sin variante asignada usa el stock de la variante elegida en pantalla', () => {
    expect(stockComponente(compGrupo(), '35')).toBe(6)
    expect(stockComponente(compGrupo(), 36)).toBe(0)
  })

  it('grupo con variante ya asignada usa stock_disponible del backend', () => {
    const comp = compGrupo({ producto_entregado: { id: 35, nombre: 'Camisa M' }, stock_disponible: 4 })
    expect(stockComponente(comp, 36)).toBe(4)
  })
})

describe('cantidadSugerida', () => {
  it('limita lo pendiente al stock disponible', () => {
    expect(cantidadSugerida(3, 2)).toBe(2)
    expect(cantidadSugerida(3, 10)).toBe(3)
  })

  it('sin stock → 0', () => {
    expect(cantidadSugerida(3, 0)).toBe(0)
    expect(cantidadSugerida(3, null)).toBe(0)
  })
})

describe('payloadComponentes', () => {
  it('incluye la variante elegida solo en grupos sin variante asignada', () => {
    const seleccion = { 31: { variante: '35', cantidad: 2 }, 32: { variante: '', cantidad: 1 } }
    expect(payloadComponentes([compGrupo(), compSimple()], seleccion)).toEqual([
      { kit_componente_id: 14, producto_entregado_id: 35 },
      { kit_componente_id: 15 },
    ])
  })

  it('envía cantidad solo cuando es menor a lo pendiente', () => {
    const seleccion = { 31: { variante: '35', cantidad: 1 } }
    expect(payloadComponentes([compGrupo()], seleccion)).toEqual([
      { kit_componente_id: 14, producto_entregado_id: 35, cantidad: 1 },
    ])
  })

  it('omite la cantidad cuando incluirCantidad es false (entrega completa / entregar todo)', () => {
    const seleccion = { 31: { variante: '35', cantidad: 1 } }
    expect(payloadComponentes([compGrupo()], seleccion, { incluirCantidad: false })).toEqual([
      { kit_componente_id: 14, producto_entregado_id: 35 },
    ])
  })

  it('no reenvía variante para grupos que ya la tienen asignada', () => {
    const comp = compGrupo({ producto_entregado: { id: 35 } })
    expect(payloadComponentes([comp], { 31: { variante: '36' } })).toEqual([{ kit_componente_id: 14 }])
  })
})

describe('interpretarResultadoEntrega', () => {
  it('entregado / completo → exito', () => {
    expect(interpretarResultadoEntrega({ data: { status: 'entregado' } }, {}).tipo).toBe('exito')
    expect(interpretarResultadoEntrega({ data: { status: 'completo' } }, {}).tipo).toBe('exito')
  })

  it('parcial → parcial y conserva el mensaje del backend', () => {
    const res = { message: 'Entrega parcial registrada — el faltante sigue pendiente.', data: { status: 'parcial' } }
    expect(interpretarResultadoEntrega(res, {})).toEqual({ tipo: 'parcial', mensaje: res.message })
  })

  it('200 con pendiente en ítem con entrega_completa → bloqueado (no es éxito)', () => {
    const res = { message: 'El ítem exige entrega completa y el stock no alcanza: no se descargó inventario.', data: { status: 'pendiente' } }
    expect(interpretarResultadoEntrega(res, { entrega_completa: true })).toEqual({ tipo: 'bloqueado', mensaje: res.message })
  })

  it('200 con pendiente sin marca → sin_stock', () => {
    const res = { message: 'Stock insuficiente — la necesidad de compra se mantiene activa.', data: { status: 'pendiente' } }
    expect(interpretarResultadoEntrega(res, { entrega_completa: false }).tipo).toBe('sin_stock')
  })
})
