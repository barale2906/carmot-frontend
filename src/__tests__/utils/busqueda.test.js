import { describe, it, expect } from 'vitest'
import { normalizarTexto, filtrarOpciones, mismoValor } from '@/utils/busqueda.js'

describe('normalizarTexto', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizarTexto('Málaga ÑANDÚ')).toBe('malaga nandu')
  })

  it('tolera null, undefined y números', () => {
    expect(normalizarTexto(null)).toBe('')
    expect(normalizarTexto(undefined)).toBe('')
    expect(normalizarTexto(42)).toBe('42')
  })
})

describe('filtrarOpciones', () => {
  const opciones = [
    { value: 1, label: 'Sede Norte - Bogotá' },
    { value: 2, label: 'Sede Sur - Medellín', description: 'Antioquia' },
    { value: 3, label: 'Sede Centro - Cali' }
  ]

  it('sin consulta devuelve todas las opciones', () => {
    expect(filtrarOpciones(opciones, '')).toBe(opciones)
    expect(filtrarOpciones(opciones, '   ')).toBe(opciones)
  })

  it('busca sin distinguir tildes ni mayúsculas', () => {
    expect(filtrarOpciones(opciones, 'BOGOTA').map((o) => o.value)).toEqual([1])
  })

  it('exige todas las palabras, en cualquier orden', () => {
    expect(filtrarOpciones(opciones, 'bogota norte').map((o) => o.value)).toEqual([1])
    expect(filtrarOpciones(opciones, 'norte cali')).toEqual([])
  })

  it('también busca en la descripción', () => {
    expect(filtrarOpciones(opciones, 'antioquia').map((o) => o.value)).toEqual([2])
  })

  it('acepta etiquetas numéricas', () => {
    expect(filtrarOpciones([{ value: 2024, label: 2024 }], '202')).toHaveLength(1)
  })
})

describe('mismoValor', () => {
  it('iguala primitivos por su texto, como el select nativo', () => {
    expect(mismoValor(5, '5')).toBe(true)
    expect(mismoValor(true, 'true')).toBe(true)
    expect(mismoValor(5, 6)).toBe(false)
  })

  it('distingue null de cadena vacía', () => {
    expect(mismoValor(null, null)).toBe(true)
    expect(mismoValor(null, '')).toBe(false)
  })

  it('compara objetos por identidad', () => {
    const concepto = { id: 1 }
    expect(mismoValor(concepto, concepto)).toBe(true)
    expect(mismoValor(concepto, { id: 1 })).toBe(false)
  })
})
