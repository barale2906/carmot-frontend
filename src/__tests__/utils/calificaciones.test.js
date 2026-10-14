import { describe, it, expect } from 'vitest'
import {
  sumaPesos, pesosValidos, payloadEsquema, planillaDesdeSabana,
  notaValida, cambiosPorTipo, formatoNota
} from '@/utils/calificaciones.js'

describe('pesos del esquema', () => {
  it('suma y valida que lleguen a 100', () => {
    expect(sumaPesos([{ peso: '33.33' }, { peso: 33.33 }, { peso: '33.34' }])).toBe(100)
    expect(pesosValidos([{ peso: 40 }, { peso: 60 }])).toBe(true)
    expect(pesosValidos([{ peso: 40 }, { peso: '' }])).toBe(false)
  })

  it('arma el payload renumerando el orden y conservando ids', () => {
    const payload = payloadEsquema({
      modulo_id: '5', grupo_id: '', nombre_esquema: ' Estándar ', descripcion: '',
      tipos_nota: [
        { id: 9, nombre_tipo: 'Final', peso: '60', nota_minima: 0, nota_maxima: 5 },
        { nombre_tipo: 'Parcial', peso: '40', nota_minima: '1', nota_maxima: '5' }
      ]
    })
    expect(payload).toMatchObject({ modulo_id: 5, grupo_id: null, nombre_esquema: 'Estándar', descripcion: null })
    expect(payload.tipos_nota[0]).toMatchObject({ id: 9, orden: 1, peso: 60 })
    expect(payload.tipos_nota[1]).toMatchObject({ orden: 2, peso: 40, nota_minima: 1 })
    expect(payload.tipos_nota[1]).not.toHaveProperty('id')
  })
})

describe('planilla de notas', () => {
  const sabana = {
    estudiantes: [
      { estudiante: { id: 1 }, tipos_nota: [{ id: 10, nota: 4 }, { id: 11, nota: null }] },
      { estudiante: { id: 2 }, tipos_nota: [{ id: 10, nota: 3.5 }, { id: 11, nota: 2 }] }
    ]
  }

  it('convierte la sábana en valores editables', () => {
    expect(planillaDesdeSabana(sabana)).toEqual({ 1: { 10: '4', 11: '' }, 2: { 10: '3.5', 11: '2' } })
  })

  it('agrupa por tipo solo las celdas cambiadas y acepta coma decimal', () => {
    const original = planillaDesdeSabana(sabana)
    const actual   = planillaDesdeSabana(sabana)
    actual[1][11] = '4,5'
    actual[2][10] = '3.5'   // sin cambio
    actual[2][11] = ''      // vaciada: no se envía
    expect(cambiosPorTipo(original, actual)).toEqual([{ tipoId: 11, notas: [{ estudiante_id: 1, nota: 4.5 }] }])
  })

  it('valida el rango del tipo de nota', () => {
    const tipo = { nota_minima: 0, nota_maxima: 5 }
    expect(notaValida('', tipo)).toBe(true)
    expect(notaValida('4,8', tipo)).toBe(true)
    expect(notaValida('5.1', tipo)).toBe(false)
    expect(notaValida('abc', tipo)).toBe(false)
  })

  it('formatea la nota con un decimal', () => {
    expect(formatoNota(4.25)).toBe('4.3')
    expect(formatoNota(null)).toBe('—')
  })
})
