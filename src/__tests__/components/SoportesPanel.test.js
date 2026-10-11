import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SoportesPanel from '@/components/financiero/libroDiario/SoportesPanel.vue'
import libroDiarioService from '@/services/libroDiarioService.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { descargarSoporte: vi.fn(), subirSoporte: vi.fn(), eliminarSoporte: vi.fn() },
}))

const IMAGEN = { id: 1, nombre_original: 'captura.png', mime_type: 'image/png', tipo_text: 'Factura', created_at: '2026-10-10' }
const PDF = { id: 2, nombre_original: 'factura.pdf', mime_type: 'application/pdf', tipo_text: 'Factura', created_at: '2026-10-10' }

function montar(props = {}) {
  return mount(SoportesPanel, {
    props: { soportableTipo: 'movimiento', soportableId: 5, tipos: { factura: 'Factura' }, ...props },
    global: { stubs: { teleport: true } },
  })
}

describe('SoportesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    let n = 0
    globalThis.URL.createObjectURL = vi.fn(() => `blob:prueba-${++n}`)
    globalThis.URL.revokeObjectURL = vi.fn()
    libroDiarioService.descargarSoporte.mockResolvedValue({ data: new Blob(['x']) })
  })

  it('muestra la imagen en miniatura y el PDF con su primera página', async () => {
    const wrapper = montar({ soportes: [IMAGEN, PDF] })
    await flushPromises()

    expect(libroDiarioService.descargarSoporte).toHaveBeenCalledTimes(2)
    expect(wrapper.find('img').attributes('src')).toBe('blob:prueba-1')
    expect(wrapper.find('iframe').attributes('src')).toContain('blob:prueba-2')
    expect(wrapper.text()).toContain('Documento PDF')
  })

  it('no intenta vista previa de otros tipos de archivo', async () => {
    montar({ soportes: [{ ...PDF, id: 3, mime_type: 'application/zip' }] })
    await flushPromises()

    expect(libroDiarioService.descargarSoporte).not.toHaveBeenCalled()
  })

  it('libera las URLs al desmontar', async () => {
    const wrapper = montar({ soportes: [IMAGEN] })
    await flushPromises()
    wrapper.unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prueba-1')
  })

  it('rechaza archivos de más de 10 MB antes de subirlos', async () => {
    const wrapper = montar({ puedeSubir: true })
    const grande = new File(['x'], 'captura.png', { type: 'image/png' })
    Object.defineProperty(grande, 'size', { value: 11 * 1024 * 1024 })

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [grande] })
    await input.trigger('change')

    expect(wrapper.text()).toContain('el máximo es 10 MB')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
