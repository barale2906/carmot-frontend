import { describe, it, expect } from 'vitest'
import {
  ESTADOS_REFERIDO, ESTADOS_AGENDA, puedeConvertirse, citaAbierta,
  jornadaDeHora, horaCorta, fechaISO, rangoProximosDias, fechaCorta,
  claseEstadoReferido, claseEstadoAgenda
} from '@/utils/crm.js'

describe('utils/crm', () => {
  it('solo convierte leads que no estén matriculados ni declinados', () => {
    expect(puedeConvertirse({ status: ESTADOS_REFERIDO.INTERESADO })).toBe(true)
    expect(puedeConvertirse({ status: ESTADOS_REFERIDO.PENDIENTE })).toBe(true)
    expect(puedeConvertirse({ status: ESTADOS_REFERIDO.MATRICULADO })).toBe(false)
    expect(puedeConvertirse({ status: ESTADOS_REFERIDO.DECLINADO })).toBe(false)
    expect(puedeConvertirse(null)).toBe(false)
  })

  it('solo las citas agendadas admiten registrar resultado', () => {
    expect(citaAbierta({ status: ESTADOS_AGENDA.AGENDADO })).toBe(true)
    expect(citaAbierta({ status: ESTADOS_AGENDA.ASISTIO })).toBe(false)
  })

  it('deduce la jornada de la hora', () => {
    expect(jornadaDeHora('09:30')).toBe('am')
    expect(jornadaDeHora('11:59')).toBe('am')
    expect(jornadaDeHora('12:00')).toBe('pm')
    expect(jornadaDeHora('18:15')).toBe('pm')
    expect(jornadaDeHora('')).toBe('am')
  })

  it('formatea horas y fechas sin desfase de zona horaria', () => {
    expect(horaCorta('14:30:00')).toBe('14:30')
    expect(horaCorta(null)).toBe('')
    expect(fechaISO(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(fechaCorta('2026-10-13T00:00:00.000000Z')).toBe('13/10/2026')
    expect(fechaCorta(null)).toBe('—')
  })

  it('arma el rango de próximos días cruzando de mes', () => {
    expect(rangoProximosDias(7, new Date(2026, 9, 28))).toEqual({ fecha_desde: '2026-10-28', fecha_hasta: '2026-11-04' })
  })

  it('devuelve una clase por defecto para estados desconocidos', () => {
    expect(claseEstadoReferido(99)).toBe(claseEstadoReferido(0))
    expect(claseEstadoAgenda(99)).toBe(claseEstadoAgenda(0))
  })
})
