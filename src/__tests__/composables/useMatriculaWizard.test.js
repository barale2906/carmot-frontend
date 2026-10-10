import { describe, it, expect, vi } from 'vitest'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { toFormData } from '@/composables/useMatriculaWizard.js'

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

  it('adjunta la foto', () => {
    const fd = toFormData({}, foto)

    expect(fd.get('foto')).toBeInstanceOf(File)
    expect(fd.get('foto').name).toBe('foto.png')
  })
})
