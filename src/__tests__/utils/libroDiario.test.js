import { describe, it, expect } from 'vitest'
import {
  EFECTO_SUMA,
  EFECTO_RESTA,
  calcularDesdeSubtotal,
  calcularDesdeTotal,
  totalesMovimiento,
  filasResumenTurno,
  formatCOP,
  validarArchivoSoporte,
  tipoVistaPrevia,
  MAX_SOPORTE_BYTES,
  filasMediosPago,
  validarMotivo,
} from '@/utils/libroDiario.js'

const IVA = { impuesto_id: 1, efecto: EFECTO_SUMA, porcentaje: 19 }
const RETE = { impuesto_id: 2, efecto: EFECTO_RESTA, porcentaje: 4 }

describe('calcularDesdeSubtotal', () => {
  it('sin impuestos el total es el subtotal', () => {
    expect(calcularDesdeSubtotal(100000, [])).toMatchObject({ subtotal: 100000, valor_total: 100000, total_impuestos: 0 })
  })

  it('suma el IVA y resta la retención sobre el subtotal', () => {
    const r = calcularDesdeSubtotal(100000, [IVA, RETE])
    expect(r.impuestos.map((i) => i.valor)).toEqual([19000, 4000])
    expect(r).toMatchObject({ total_impuestos: 19000, total_retenciones: 4000, valor_total: 115000 })
  })

  it('redondea los valores a pesos enteros', () => {
    const r = calcularDesdeSubtotal('33333', [IVA])
    expect(r.impuestos[0].valor).toBe(6333)
    expect(r.valor_total).toBe(39666)
  })

  it('trata entradas vacías como cero', () => {
    expect(calcularDesdeSubtotal('', [IVA]).valor_total).toBe(0)
  })
})

describe('calcularDesdeTotal', () => {
  it('despeja el subtotal con varios impuestos', () => {
    const r = calcularDesdeTotal(115000, [IVA, RETE])
    expect(r).toMatchObject({ subtotal: 100000, total_impuestos: 19000, total_retenciones: 4000, valor_total: 115000 })
  })

  it('el total queda exactamente igual al ingresado aunque haya redondeo', () => {
    const r = calcularDesdeTotal(119999, [IVA])
    expect(r.valor_total).toBe(119999)
    expect(totalesMovimiento(r.subtotal, r.impuestos).valor_total).toBe(119999)
  })

  it('sin impuestos el subtotal es el total', () => {
    expect(calcularDesdeTotal(50000, []).subtotal).toBe(50000)
  })
})

describe('totalesMovimiento', () => {
  it('respeta valores de impuestos ajustados a mano', () => {
    const r = totalesMovimiento(100000, [{ ...IVA, valor: 19001 }, { ...RETE, valor: '3999' }])
    expect(r).toEqual({ total_impuestos: 19001, total_retenciones: 3999, valor_total: 115002 })
  })
})

describe('filasResumenTurno', () => {
  it('devuelve las filas del arqueo con ceros por defecto', () => {
    const filas = filasResumenTurno({ base_inicial: 50000, ingresos: { academico: 80000 }, egresos: 10000 })
    expect(filas.find((f) => f.clave === 'base').valor).toBe(50000)
    expect(filas.find((f) => f.clave === 'academico').valor).toBe(80000)
    expect(filas.find((f) => f.clave === 'consignaciones').valor).toBe(0)
  })

  it('sin resumen no hay filas', () => {
    expect(filasResumenTurno(null)).toEqual([])
  })
})

describe('formatCOP', () => {
  it('formatea en pesos sin decimales', () => {
    expect(formatCOP(1500000)).toMatch(/^\$ 1\.500\.000$/)
    expect(formatCOP(null)).toBe('$ 0')
  })
})

describe('validarArchivoSoporte', () => {
  const archivo = (nombre, tamano) => ({ name: nombre, size: tamano })

  it('acepta PDF e imágenes hasta 10 MB', () => {
    expect(validarArchivoSoporte(archivo('factura.PDF', 1000))).toBeNull()
    expect(validarArchivoSoporte(archivo('foto.png', MAX_SOPORTE_BYTES))).toBeNull()
  })

  it('rechaza archivos de más de 10 MB indicando su peso', () => {
    expect(validarArchivoSoporte(archivo('captura.png', 11 * 1024 * 1024))).toContain('11.0 MB')
  })

  it('rechaza extensiones no permitidas', () => {
    expect(validarArchivoSoporte(archivo('datos.xlsx', 10))).toContain('no es PDF ni imagen')
  })
})

describe('tipoVistaPrevia', () => {
  it('distingue imágenes y PDF', () => {
    expect(tipoVistaPrevia('image/png')).toBe('imagen')
    expect(tipoVistaPrevia('application/pdf')).toBe('pdf')
    expect(tipoVistaPrevia('text/plain')).toBeNull()
    expect(tipoVistaPrevia(null)).toBeNull()
  })
})

describe('filasMediosPago', () => {
  const etiquetas = { efectivo: 'Efectivo', transferencia: 'Transferencia', cheque: 'Cheque' }

  it('incluye todos los medios aunque estén en cero, en el orden del catálogo', () => {
    const { filas } = filasMediosPago({ por_medio_pago: { efectivo: { academico: 1000, ingresos: 1000 } } }, etiquetas)
    expect(filas.map((f) => f.label)).toEqual(['Efectivo', 'Transferencia', 'Cheque'])
    expect(filas[1]).toMatchObject({ academico: 0, inventario: 0, otros: 0, ingresos: 0, egresos: 0 })
  })

  it('totaliza cada columna', () => {
    const { totales } = filasMediosPago({
      por_medio_pago: {
        efectivo: { academico: 1000, otros: 500, ingresos: 1500, egresos: 200 },
        transferencia: { inventario: 300, ingresos: 300 },
      },
    }, etiquetas)
    expect(totales).toEqual({ academico: 1000, inventario: 300, otros: 500, ingresos: 1800, egresos: 200 })
  })

  it('sin resumen no hay filas', () => {
    expect(filasMediosPago(null, etiquetas).filas).toEqual([])
  })
})

describe('filasMediosPago con resúmenes anteriores', () => {
  it('indica que no hay desglose por origen cuando el resumen congelado no lo trae', () => {
    expect(filasMediosPago({ por_medio_pago: { efectivo: { ingresos: 100, egresos: 0 } } }, {}).porOrigen).toBe(false)
    expect(filasMediosPago({ por_medio_pago: { efectivo: { academico: 100, ingresos: 100 } } }, {}).porOrigen).toBe(true)
  })
})

describe('validarMotivo', () => {
  it('exige al menos 5 caracteres', () => {
    expect(validarMotivo('')).toBe('Escriba el motivo.')
    expect(validarMotivo('No')).toContain('al menos 5 caracteres')
    expect(validarMotivo('  Vuelva a contar ')).toBeNull()
  })
})
