import { describe, it, expect } from 'vitest'
import { ESTADOS_ACADEMICOS, esEstadoFinal, efectoDelCambio, claseEstadoAcademico } from '@/utils/estadoAcademico.js'

const { ACTIVO, APLAZADO, DESERTADO, RETIRADO, GRADUADO } = ESTADOS_ACADEMICOS

describe('utils/estadoAcademico', () => {
  it('reconoce los estados que cierran la formación', () => {
    expect([DESERTADO, RETIRADO, GRADUADO].every(esEstadoFinal)).toBe(true)
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
})
