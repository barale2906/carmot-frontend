import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LdTercerosPanel from '@/components/financiero/libroDiario/LdTercerosPanel.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import FormSelect from '@/components/forms/FormSelect.vue'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { getCatalogo: vi.fn(), actualizarCatalogo: vi.fn() },
}))
const confirmar = vi.fn()
vi.mock('@/composables/useConfirm.js', () => ({ useConfirm: () => ({ confirm: confirmar }) }))

const TERCERO = {
  id: 4, tipo_identificacion: 'NIT', identificacion: '900123456', nombre: 'Inmobiliaria Central',
  telefono: null, email: null, direccion: null, status: 1, status_text: 'Activo', movimientos_count: 3,
}

async function montar(props = {}) {
  const wrapper = mount(LdTercerosPanel, {
    props: { tiposIdentificacion: { NIT: 'NIT', CC: 'Cédula de ciudadanía' }, puedeEditar: true, ...props },
    global: { stubs: { teleport: true } },
  })
  await flushPromises()
  return wrapper
}

const inputPorEtiqueta = (wrapper, texto) => {
  const label = wrapper.findAll('label').find((l) => l.text().includes(texto))
  return wrapper.find(`#${label.attributes('for')}`)
}

describe('LdTercerosPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    libroDiarioService.getCatalogo.mockResolvedValue({ data: [TERCERO], meta: { current_page: 1, last_page: 1 } })
    libroDiarioService.actualizarCatalogo.mockResolvedValue({ data: TERCERO })
  })

  it('lista los terceros con identificación y cantidad de movimientos', async () => {
    const wrapper = await montar()

    expect(libroDiarioService.getCatalogo).toHaveBeenCalledWith('terceros', { page: 1 })
    expect(wrapper.text()).toContain('NIT 900123456')
    expect(wrapper.text()).toContain('Inmobiliaria Central')
    expect(wrapper.text()).toContain('3')
  })

  it('filtra por estado (incluido inactivo = 0) y tipo de identificación', async () => {
    const wrapper = await montar()
    const select = (label) => wrapper.findAllComponents(FormSelect).find((c) => c.props('label') === label)

    await select('Estado:').vm.$emit('update:modelValue', 0)
    await flushPromises()
    expect(libroDiarioService.getCatalogo).toHaveBeenLastCalledWith('terceros', { status: 0, page: 1 })

    await select('Tipo de identificación:').vm.$emit('update:modelValue', 'CC')
    await flushPromises()
    expect(libroDiarioService.getCatalogo).toHaveBeenLastCalledWith('terceros', { tipo_identificacion: 'CC', status: 0, page: 1 })
  })

  it('corrige los datos del tercero', async () => {
    const wrapper = await montar()
    await wrapper.find('button[title="Editar"]').trigger('click')

    await inputPorEtiqueta(wrapper, 'Nombre o razón social').setValue('Inmobiliaria Central S.A.S.')
    await inputPorEtiqueta(wrapper, 'Teléfono').setValue('6011234')
    await wrapper.findAll('button').find((b) => b.text() === 'Guardar').trigger('click')
    await flushPromises()

    expect(libroDiarioService.actualizarCatalogo).toHaveBeenCalledWith('terceros', 4, expect.objectContaining({
      nombre: 'Inmobiliaria Central S.A.S.', telefono: '6011234', email: null, status: 1,
    }))
  })

  it('muestra los errores de validación al editar', async () => {
    libroDiarioService.actualizarCatalogo.mockRejectedValue({
      response: { data: { message: 'Error', errors: { identificacion: ['Ya existe un tercero con este tipo y número de identificación.'] } } },
    })
    const wrapper = await montar()
    await wrapper.find('button[title="Editar"]').trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Guardar').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Ya existe un tercero con este tipo y número de identificación.')
  })

  it('inactiva solo tras confirmar', async () => {
    const wrapper = await montar()

    confirmar.mockResolvedValue(false)
    await wrapper.find('button[title="Inactivar"]').trigger('click')
    await flushPromises()
    expect(libroDiarioService.actualizarCatalogo).not.toHaveBeenCalled()

    confirmar.mockResolvedValue(true)
    await wrapper.find('button[title="Inactivar"]').trigger('click')
    await flushPromises()
    expect(libroDiarioService.actualizarCatalogo).toHaveBeenCalledWith('terceros', 4, { status: 0 })
  })

  it('sin permiso no muestra acciones', async () => {
    const wrapper = await montar({ puedeEditar: false })

    expect(wrapper.find('button[title="Editar"]').exists()).toBe(false)
    expect(wrapper.find('button[title="Inactivar"]').exists()).toBe(false)
  })
})
