import { describe, it, expect } from 'vitest'
import { ESTADOS_ACADEMICOS, esEstadoFinal, efectoDelCambio, claseEstadoAcademico, esEstadoDeCierre, opcionesPermitidas } from '@/utils/estadoAcademico.js'

const { ACTIVO, APLAZADO, DESERTADO, RETIRADO, GRADUADO, REPROBADO } = ESTADOS_ACADEMICOS

describe('utils/estadoAcademico', () => {
  it('reconoce los estados que cierran la formación', () => {
    expect([DESERTADO, RETIRADO, GRADUADO, REPROBADO].every(esEstadoFinal)).toBe(true)
    expect(esEstadoFinal(ACTIVO)).toBe(false)
    expect(esEstadoFinal('2')).toBe(false)
  })

  it('explica el efecto de cada cambio', () => {
    expect(efectoDelCambio(ACTIVO, GRADUADO)).toMatch(/inactiva/)
    expect(efectoDelCambio(DESERTADO, ACTIVO)).toMatch(/reactivará/)
    expect(efectoDelCambio(ACTIVO, APLAZADO)).toMatch(/asistencia/)
    expect(efectoDelCambio(APLAZADO, ACTIVO)).toBe('')
    expect(efectoDelCambio(ACTIVO, ACTIVO)).toBe('')
    expect(efectoDelCambio(ACTIVO, '')).toBe('')
  })

  it('usa la clase de Activo para estados desconocidos', () => {
    expect(claseEstadoAcademico(99)).toBe(claseEstadoAcademico(ACTIVO))
  })

  it('Graduado y Reprobado son estados de cierre', () => {
    expect(esEstadoDeCierre(GRADUADO)).toBe(true)
    expect(esEstadoDeCierre(String(REPROBADO))).toBe(true)
    expect(esEstadoDeCierre(RETIRADO)).toBe(false)
  })

  it('desde Graduado o Reprobado solo se vuelve a Activo', () => {
    expect(opcionesPermitidas(GRADUADO).map(o => o.value)).toEqual([ACTIVO])
    expect(opcionesPermitidas(REPROBADO).map(o => o.value)).toEqual([ACTIVO])
  })

  it('solo se gradúa o reprueba desde Activo', () => {
    expect(opcionesPermitidas(ACTIVO).map(o => o.value)).toEqual([APLAZADO, DESERTADO, RETIRADO, GRADUADO, REPROBADO])
    expect(opcionesPermitidas(RETIRADO).map(o => o.value)).toEqual([ACTIVO, APLAZADO, DESERTADO])
  })
})
