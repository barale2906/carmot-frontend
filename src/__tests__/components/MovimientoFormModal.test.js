import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MovimientoFormModal from '@/components/financiero/libroDiario/MovimientoFormModal.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import FormSelect from '@/components/forms/FormSelect.vue'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { crearMovimiento: vi.fn(), actualizarMovimiento: vi.fn(), subirSoporte: vi.fn() },
}))

const IMPUESTOS = [
  { id: 1, nombre: 'IVA 19 %', porcentaje: 19, efecto: 1 },
  { id: 2, nombre: 'Retención 4 %', porcentaje: 4, efecto: 2 },
]

/** ModalBase real con Teleport desactivado para poder inspeccionar el contenido. */
async function montar(props = {}) {
  const wrapper = mount(MovimientoFormModal, {
    props: {
      modelValue: false,
      filtros: { medios_pago: { efectivo: 'Efectivo' }, tipos_identificacion: { NIT: 'NIT' }, tipos_documento: { factura: 'Factura' }, tipos_soporte: { factura: 'Factura' } },
      tiposMovimiento: [{ id: 7, nombre: 'Arriendo', clase_text: 'Egreso' }],
      impuestos: IMPUESTOS,
      ...props,
    },
    global: { stubs: { teleport: true } },
  })
  await wrapper.setProps({ modelValue: true })
  return wrapper
}

const inputPorEtiqueta = (wrapper, texto) => {
  const label = wrapper.findAll('label').find((l) => l.text().includes(texto))
  return wrapper.find(`#${label.attributes('for')}`)
}

async function agregarImpuesto(wrapper, id) {
  const select = wrapper.findAllComponents(FormSelect).find((c) => c.props('label') === 'Impuestos y retenciones')
  await select.vm.$emit('update:modelValue', id)
  await wrapper.findAll('button').find((b) => b.text() === 'Agregar').trigger('click')
}

describe('MovimientoFormModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calcula impuestos y total al salir del subtotal', async () => {
    const wrapper = await montar()
    await agregarImpuesto(wrapper, 1)
    await agregarImpuesto(wrapper, 2)

    const subtotal = inputPorEtiqueta(wrapper, 'Subtotal')
    await subtotal.setValue('100000')
    await subtotal.trigger('blur')

    expect(inputPorEtiqueta(wrapper, 'Valor total').element.value).toBe('115000')
    expect(wrapper.text()).toContain('19.000')
  })

  it('despeja el subtotal al salir del total', async () => {
    const wrapper = await montar()
    await agregarImpuesto(wrapper, 1)

    const total = inputPorEtiqueta(wrapper, 'Valor total')
    await total.setValue('119000')
    await total.trigger('blur')

    expect(inputPorEtiqueta(wrapper, 'Subtotal').element.value).toBe('100000')
  })

  it('envía los impuestos con su valor y emite guardado', async () => {
    libroDiarioService.crearMovimiento.mockResolvedValue({ data: { id: 11 } })
    const wrapper = await montar()
    await agregarImpuesto(wrapper, 1)
    const subtotal = inputPorEtiqueta(wrapper, 'Subtotal')
    await subtotal.setValue('200000')
    await subtotal.trigger('blur')

    await wrapper.findAll('button').find((b) => b.text() === 'Registrar').trigger('click')
    await flushPromises()

    const payload = libroDiarioService.crearMovimiento.mock.calls[0][0]
    expect(payload.impuestos).toEqual([{ impuesto_id: 1, porcentaje: 19, valor: 38000 }])
    expect(payload.valor_total).toBe(238000)
    expect(payload.banco_id).toBeNull()
    expect(wrapper.emitted('guardado')[0][0].movimiento.id).toBe(11)
  })

  it('sin permiso el medio de pago queda fijo en efectivo', async () => {
    const wrapper = await montar({ filtros: { medios_pago: { efectivo: 'Efectivo', transferencia: 'Transferencia' } } })
    const medio = wrapper.findAllComponents(FormSelect).find((c) => c.props('label') === 'Medio de pago')

    expect(medio.props('disabled')).toBe(true)
    expect(medio.props('options')).toEqual([{ value: 'efectivo', label: 'Efectivo' }])
  })

  it('con permiso ofrece todos los medios de pago', async () => {
    const wrapper = await montar({
      permitirOtrosMedios: true,
      filtros: { medios_pago: { efectivo: 'Efectivo', transferencia: 'Transferencia' } },
    })
    const medio = wrapper.findAllComponents(FormSelect).find((c) => c.props('label') === 'Medio de pago')

    expect(medio.props('disabled')).toBe(false)
    expect(medio.props('options')).toHaveLength(2)
  })

  it('muestra los errores de validación del backend', async () => {
    libroDiarioService.crearMovimiento.mockRejectedValue({
      response: { data: { message: 'Error', errors: { turno: ['Debe abrir un turno de caja antes de registrar movimientos.'] } } },
    })
    const wrapper = await montar()
    await wrapper.findAll('button').find((b) => b.text() === 'Registrar').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Debe abrir un turno de caja')
    expect(wrapper.emitted('guardado')).toBeUndefined()
  })
})
