import { describe, it, expect } from 'vitest'
import { etiquetaEstado, claseEstado, ESTADOS_PRORROGA } from '@/utils/prorrogaPago.js'
import { sumarDias, textoDiasRestantes, PLAZO_MAXIMO_PRORROGA } from '@/utils/asistencia.js'

describe('prorrogaPago', () => {
  it('traduce el estado a texto e insignia', () => {
    expect(etiquetaEstado('incumplido')).toBe('Incumplido')
    expect(claseEstado('vigente')).toContain('emerald')
    expect(claseEstado('otro')).toContain('slate')
    expect(ESTADOS_PRORROGA.map(e => e.value)).toEqual(['vigente', 'cumplido', 'incumplido'])
  })

  it('suma días cruzando el fin de mes y de año', () => {
    expect(sumarDias('2026-11-20', 1)).toBe('2026-11-21')
    expect(sumarDias('2026-11-20', PLAZO_MAXIMO_PRORROGA)).toBe('2026-12-05')
    expect(sumarDias('2026-12-25', 10)).toBe('2027-01-04')
  })

  it('describe los días restantes', () => {
    expect(textoDiasRestantes(0)).toBe('vence hoy')
    expect(textoDiasRestantes(1)).toBe('1 día restante')
    expect(textoDiasRestantes(7)).toBe('7 días restantes')
  })
})
