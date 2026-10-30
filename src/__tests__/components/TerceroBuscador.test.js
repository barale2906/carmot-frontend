import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TerceroBuscador from '@/components/financiero/libroDiario/TerceroBuscador.vue'
import libroDiarioService from '@/services/libroDiarioService.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { buscarTerceros: vi.fn() },
}))

const TERCERO = { id: 4, tipo_identificacion: 'NIT', identificacion: '900123456', nombre: 'Inmobiliaria Central', telefono: '6011234' }

/** Monta el selector y conecta su v-model para poder seguir el flujo completo. */
function montar(props = {}) {
  const wrapper = mount(TerceroBuscador, {
    props: {
      modelValue: null,
      tiposIdentificacion: { NIT: 'NIT', CC: 'Cédula de ciudadanía' },
      ...props,
      'onUpdate:modelValue': (valor) => wrapper.setProps({ modelValue: valor }),
    },
  })
  return wrapper
}

async function escribir(wrapper, texto) {
  const input = wrapper.find('input')
  await input.setValue(texto)
  await vi.advanceTimersByTimeAsync(350)
  await flushPromises()
}

const boton = (wrapper, texto) => wrapper.findAll('button').find((b) => b.text().includes(texto))

describe('TerceroBuscador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('busca con pausa desde 2 caracteres y selecciona un resultado', async () => {
    libroDiarioService.buscarTerceros.mockResolvedValue({ data: [TERCERO] })
    const wrapper = montar()

    await escribir(wrapper, '9')
    expect(libroDiarioService.buscarTerceros).not.toHaveBeenCalled()

    await escribir(wrapper, '900')
    expect(libroDiarioService.buscarTerceros).toHaveBeenCalledWith({ search: '900', status: 1, per_page: 10 }, { _silent: true })

    await boton(wrapper, 'Inmobiliaria Central').trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toEqual(TERCERO)
    expect(wrapper.text()).toContain('Tercero seleccionado')
    expect(wrapper.text()).toContain('NIT 900123456')
  })

  it('sin resultados registra un tercero nuevo con la identificación buscada', async () => {
    libroDiarioService.buscarTerceros.mockResolvedValue({ data: [] })
    const wrapper = montar()

    await escribir(wrapper, '1.052.345.678')
    expect(wrapper.text()).toContain('No se encontró ningún tercero')
    await boton(wrapper, 'Registrar como nuevo tercero').trigger('click')

    const nuevo = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(nuevo).toMatchObject({ id: null, tipo_identificacion: 'NIT', identificacion: '1052345678', nombre: '' })
    expect(wrapper.text()).toContain('Nuevo tercero')
    expect(wrapper.text()).toContain('Se registrará junto con el movimiento')
  })

  it('si se buscó por nombre, el nombre pasa al tercero nuevo', async () => {
    libroDiarioService.buscarTerceros.mockResolvedValue({ data: [] })
    const wrapper = montar()

    await escribir(wrapper, 'Pedro Gómez')
    await boton(wrapper, 'Registrar como nuevo tercero').trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toMatchObject({ identificacion: '', nombre: 'Pedro Gómez' })
  })

  it('edita los datos del tercero nuevo y muestra sus errores', async () => {
    const wrapper = montar({
      modelValue: { id: null, tipo_identificacion: 'CC', identificacion: '1010', nombre: '', telefono: '', email: '', direccion: '' },
      errores: { tercero_nombre: ['El nombre del tercero es obligatorio.'] },
    })

    const nombre = wrapper.findAll('input').find((i) => i.element.value === '' && i.attributes('type') !== 'email')
    await nombre.setValue('Ana Ruiz')

    expect(wrapper.emitted('update:modelValue').at(-1)[0]).toMatchObject({ identificacion: '1010', nombre: 'Ana Ruiz' })
    expect(wrapper.text()).toContain('El nombre del tercero es obligatorio.')
  })

  it('Cambiar vuelve a la búsqueda', async () => {
    const wrapper = montar({ modelValue: TERCERO })

    await boton(wrapper, 'Cambiar').trigger('click')

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([null])
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('muestra el error de un tercero inactivo', () => {
    const wrapper = montar({ modelValue: TERCERO, errores: { tercero_id: ['El tercero no existe o está inactivo.'] } })

    expect(wrapper.text()).toContain('El tercero no existe o está inactivo.')
  })
})
