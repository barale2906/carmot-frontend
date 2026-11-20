import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { toFormData, documentoDesdeBusqueda, normalizarErroresEstudiante } from '@/composables/useMatriculaWizard.js'

// ─── toFormData (envío multipart cuando la matrícula lleva foto) ──────────────

describe('toFormData', () => {
  const foto = new File(['img'], 'foto.png', { type: 'image/png' })

  it('envía los null como cadena vacía y no como el texto "null"', () => {
    const fd = toFormData({ tipo_discapacidad: null, enfermedad_detalle: null }, foto)

    expect(fd.get('tipo_discapacidad')).toBe('')
    expect(fd.get('enfermedad_detalle')).toBe('')
  })

  it('convierte los booleanos a 1/0 y el resto a texto', () => {
    const fd = toFormData({ discapacidad: true, enfermedad_prioritaria: false, monto: 1250000, tipo_discapacidad: 'fisica' }, foto)

    expect(fd.get('discapacidad')).toBe('1')
    expect(fd.get('enfermedad_prioritaria')).toBe('0')
    expect(fd.get('monto')).toBe('1250000')
    expect(fd.get('tipo_discapacidad')).toBe('fisica')
  })

  it('aplana objetos y arrays anidados con notación de corchetes', () => {
    const fd = toFormData({ estudiante: { email: 'a@b.co', sedes: [3] } }, foto)

    expect(fd.get('estudiante[email]')).toBe('a@b.co')
    expect(fd.get('estudiante[sedes][0]')).toBe('3')
  })

  it('adjunta la foto', () => {
    const fd = toFormData({}, foto)

    expect(fd.get('foto')).toBeInstanceOf(File)
    expect(fd.get('foto').name).toBe('foto.png')
  })
})

// ─── normalizarErroresEstudiante (validación previa de estudiante nuevo) ──────

describe('normalizarErroresEstudiante', () => {
  it('quita el prefijo estudiante. y conserva el resto de campos', () => {
    const errores = normalizarErroresEstudiante({
      'estudiante.email': ['Ya existe un usuario con este correo.'],
      fecha_inicio: ['Fecha inválida.']
    })

    expect(errores).toEqual({
      email: ['Ya existe un usuario con este correo.'],
      fecha_inicio: ['Fecha inválida.']
    })
  })
})

// ─── documentoDesdeBusqueda (estudiante nuevo desde el buscador, F18) ─────────

describe('documentoDesdeBusqueda', () => {
  it('usa el texto como documento si es numérico, sin separadores', () => {
    expect(documentoDesdeBusqueda(' 1.077.665.544 ')).toBe('1077665544')
    expect(documentoDesdeBusqueda('80 123 456')).toBe('80123456')
  })

  it('no usa un nombre como documento', () => {
    expect(documentoDesdeBusqueda('Héctor Cuervo')).toBe('')
    expect(documentoDesdeBusqueda('CC 123')).toBe('')
    expect(documentoDesdeBusqueda('')).toBe('')
  })
})
