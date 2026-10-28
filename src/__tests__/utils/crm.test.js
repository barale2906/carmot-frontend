import { describe, it, expect } from 'vitest'
import {
  ESTADOS_REFERIDO, ESTADOS_AGENDA, puedeConvertirse, citaAbierta,
  jornadaDeHora, horaCorta, fechaISO, rangoProximosDias, fechaCorta,
  claseEstadoReferido, claseEstadoAgenda,
  opcionesEstadoSeguimiento, resolverEstadoSeguimiento,
  proximaAccionVacia, proximaAccionPayload,
  opcionesEstadoAgenda, textoEstadoAgenda
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
    expect(citaAbierta({ status: ESTADOS_AGENDA.REALIZADA })).toBe(false)
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

  it('el formulario de seguimiento solo ofrece Matriculado si se puede generar la matrícula', () => {
    const conMatricula = opcionesEstadoSeguimiento(true)
    const sinMatricula = opcionesEstadoSeguimiento(false)
    expect(conMatricula.find(o => o.value === ESTADOS_REFERIDO.MATRICULADO)?.label).toBe('Matriculado (generar matrícula)')
    expect(sinMatricula.some(o => o.value === ESTADOS_REFERIDO.MATRICULADO)).toBe(false)
    expect(sinMatricula).toHaveLength(4)
  })

  it('resuelve el estado del seguimiento: solo envía cambios y Matriculado abre la conversión', () => {
    expect(resolverEstadoSeguimiento(ESTADOS_REFERIDO.PENDIENTE, ESTADOS_REFERIDO.INTERESADO)).toEqual({ estado: 2, convertir: false })
    expect(resolverEstadoSeguimiento('1', ESTADOS_REFERIDO.INTERESADO)).toEqual({ estado: null, convertir: false })
    expect(resolverEstadoSeguimiento(ESTADOS_REFERIDO.MATRICULADO, ESTADOS_REFERIDO.PENDIENTE)).toEqual({ estado: null, convertir: true })
    expect(resolverEstadoSeguimiento(ESTADOS_REFERIDO.CREADO, null)).toEqual({ estado: 0, convertir: false })
    expect(resolverEstadoSeguimiento('', 1)).toEqual({ estado: null, convertir: false })
  })

  it('solo envía la próxima acción cuando se eligió un tipo', () => {
    expect(proximaAccionPayload(proximaAccionVacia())).toBeNull()
    expect(proximaAccionPayload(null)).toBeNull()
    expect(proximaAccionPayload({ tipo: 'llamada', fecha: '2026-11-02', hora: '09:00', nota: '  ' }))
      .toEqual({ tipo: 'llamada', fecha: '2026-11-02', hora: '09:00', nota: null })
    expect(proximaAccionPayload({ tipo: 'visita', fecha: '2026-11-02', hora: '15:30', nota: ' Traer documentos ' }).nota)
      .toBe('Traer documentos')
  })

  it('el texto del resultado de la agenda depende del tipo de acción', () => {
    expect(textoEstadoAgenda(ESTADOS_AGENDA.REALIZADA, 'visita')).toBe('Asistió')
    expect(textoEstadoAgenda(ESTADOS_AGENDA.NO_REALIZADA, 'llamada')).toBe('No contestó')
    expect(textoEstadoAgenda(ESTADOS_AGENDA.REALIZADA, 'mensaje')).toBe('Respondió')
    expect(textoEstadoAgenda(ESTADOS_AGENDA.NO_REALIZADA, 'mensaje')).toBe('Sin respuesta')
    expect(textoEstadoAgenda(ESTADOS_AGENDA.REALIZADA, '')).toBe('Realizada')
    expect(textoEstadoAgenda(ESTADOS_AGENDA.CANCELO, 'llamada')).toBe('Canceló')
    expect(opcionesEstadoAgenda('llamada').map(o => o.value)).toEqual([0, 1, 2, 3, 4])
  })
})
