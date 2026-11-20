import { describe, it, expect } from 'vitest'
import { JORNADAS, jornadaLabel } from '@/utils/jornadas.js'

describe('jornadas', () => {
  it('define las cinco jornadas con los códigos del backend', () => {
    expect(JORNADAS.map((j) => j.value)).toEqual([0, 1, 2, 3, 4])
  })

  it('jornadaLabel devuelve el nombre por código, numérico o texto', () => {
    expect(jornadaLabel(2)).toBe('Noche')
    expect(jornadaLabel('3')).toBe('Fin de semana mañana')
  })

  it('jornadaLabel devuelve cadena vacía sin jornada o con un código desconocido', () => {
    expect(jornadaLabel(null)).toBe('')
    expect(jornadaLabel(undefined)).toBe('')
    expect(jornadaLabel('')).toBe('')
    expect(jornadaLabel(9)).toBe('')
  })
})
