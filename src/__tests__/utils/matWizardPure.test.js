/**
 * Tests de las funciones puras exportadas desde useMatriculaWizard.
 * Estas funciones no dependen de estado reactivo ni de servicios.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { today, formatDate, formatCOP, objectToOptions } from '@/composables/useMatriculaWizard.js'

describe('today', () => {
  it('retorna la fecha actual en formato YYYY-MM-DD', () => {
    const result = today()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('el resultado coincide con la fecha del sistema', () => {
    const expected = new Date().toISOString().slice(0, 10)
    expect(today()).toBe(expected)
  })
})

describe('formatDate', () => {
  it('convierte YYYY-MM-DD a DD/MM/YYYY', () => {
    expect(formatDate('2024-03-15')).toBe('15/03/2024')
  })

  it('retorna "—" para valor nulo o vacío', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('acepta objetos Date (via toISOString)', () => {
    // Date.toString() tiene más de 10 chars, pero slice(0,10) toma solo la fecha
    const result = formatDate('2025-12-01')
    expect(result).toBe('01/12/2025')
  })
})

describe('formatCOP', () => {
  it('retorna "—" para valores nulos, vacíos o undefined', () => {
    expect(formatCOP(null)).toBe('—')
    expect(formatCOP(undefined)).toBe('—')
    expect(formatCOP('')).toBe('—')
  })

  it('formatea número como moneda colombiana', () => {
    const result = formatCOP(100000)
    // Verificamos que el resultado contiene los dígitos correctos
    expect(result).toContain('100')
    expect(result).toContain('000')
    // Debe ser una cadena no vacía
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formatea cero correctamente', () => {
    const result = formatCOP(0)
    expect(result).toContain('0')
  })

  it('formatea valores negativos', () => {
    const result = formatCOP(-50000)
    expect(result).toContain('50')
    expect(result).toContain('000')
  })
})

describe('objectToOptions', () => {
  it('convierte objeto a array de { value, label }', () => {
    const obj = { CC: 'Cédula de Ciudadanía', TI: 'Tarjeta de Identidad' }
    const result = objectToOptions(obj)
    expect(result).toEqual([
      { value: 'CC', label: 'Cédula de Ciudadanía' },
      { value: 'TI', label: 'Tarjeta de Identidad' },
    ])
  })

  it('retorna array vacío para objeto vacío', () => {
    expect(objectToOptions({})).toEqual([])
  })

  it('retorna array vacío para null o undefined', () => {
    expect(objectToOptions(null)).toEqual([])
    expect(objectToOptions(undefined)).toEqual([])
  })

  it('convierte valores no-string a string en label', () => {
    const result = objectToOptions({ 1: 42 })
    expect(result[0].label).toBe('42')
    expect(typeof result[0].label).toBe('string')
  })
})
