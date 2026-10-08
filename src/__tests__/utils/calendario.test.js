import { describe, it, expect } from 'vitest'
import { buildMonthGrid, toIsoDate, formatFechaCorta, formatFechaLarga, esDiaDeClase, sumarDias, diferenciaDias } from '@/utils/calendario.js'

describe('toIsoDate', () => {
  it('rellena mes y día con ceros (mes 0 = enero)', () => {
    expect(toIsoDate(2026, 0, 5)).toBe('2026-01-05')
    expect(toIsoDate(2026, 11, 31)).toBe('2026-12-31')
  })
})

describe('buildMonthGrid', () => {
  it('alinea el día 1 a su columna empezando en lunes', () => {
    // 1 de octubre de 2026 es jueves → 3 huecos (L, M, X)
    const celdas = buildMonthGrid(2026, 9)
    expect(celdas.slice(0, 3)).toEqual([null, null, null])
    expect(celdas[3]).toMatchObject({ dia: 1, fecha: '2026-10-01', domingo: false })
  })

  it('marca los domingos y respeta la cantidad de días del mes', () => {
    const celdas = buildMonthGrid(2026, 9).filter(Boolean)
    expect(celdas).toHaveLength(31)
    expect(celdas.filter((c) => c.domingo).map((c) => c.dia)).toEqual([4, 11, 18, 25])
  })

  it('sin huecos cuando el mes empieza en lunes y maneja años bisiestos', () => {
    // 1 de junio de 2026 es lunes
    expect(buildMonthGrid(2026, 5)[0]).toMatchObject({ dia: 1 })
    expect(buildMonthGrid(2028, 1).filter(Boolean)).toHaveLength(29)
  })
})

describe('formateo de fechas', () => {
  it('no desfasa el día por zona horaria', () => {
    expect(formatFechaCorta('2026-11-16')).toBe('16/11/2026')
    expect(formatFechaLarga('2026-11-16')).toBe('Lunes, 16 de noviembre de 2026')
  })

  it('retorna guion para valores vacíos', () => {
    expect(formatFechaCorta(null)).toBe('—')
    expect(formatFechaLarga('')).toBe('—')
  })
})

describe('esDiaDeClase', () => {
  it('reconoce el día con o sin tildes', () => {
    expect(esDiaDeClase('2027-04-05', ['lunes'])).toBe(true)          // lunes
    expect(esDiaDeClase('2027-04-07', ['miércoles'])).toBe(true)      // miércoles
    expect(esDiaDeClase('2027-04-10', ['sábado'])).toBe(true)
    expect(esDiaDeClase('2027-04-06', ['lunes', 'miércoles'])).toBe(false)
  })

  it('devuelve false con fecha inválida o sin días', () => {
    expect(esDiaDeClase('nope', ['lunes'])).toBe(false)
    expect(esDiaDeClase('2027-04-05')).toBe(false)
  })
})

describe('sumarDias / diferenciaDias', () => {
  it('suma días cruzando mes y año', () => {
    expect(sumarDias('2026-12-30', 3)).toBe('2027-01-02')
  })

  it('calcula la diferencia en días', () => {
    expect(diferenciaDias('2027-04-05', '2027-06-01')).toBe(57)
    expect(sumarDias('2027-04-05', 57)).toBe('2027-06-01')
  })
})
