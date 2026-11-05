import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CarteraEstado from '@/components/academico/CarteraEstado.vue'

const enMora = {
  en_mora: true,
  saldo_vencido: 1000000,
  dias_mora: 40,
  mora_detalle: [
    { cartera_id: 7, concepto: 'Matrícula', numero_cuota: 0, curso: 'Electricidad', fecha_vencimiento: '2026-09-25', dias_mora: 40, saldo: 600000 },
    { cartera_id: 8, concepto: 'Pago de mensualidad', numero_cuota: 1, curso: 'Electricidad', fecha_vencimiento: '2026-10-25', dias_mora: 10, saldo: 400000 },
  ],
  transferencias_pendientes: 0,
  valor_transferencias_pendientes: 0,
}

describe('CarteraEstado', () => {
  it('al día no muestra mora', () => {
    const wrapper = mount(CarteraEstado, { props: { estudiante: { en_mora: false, mora_detalle: [], transferencias_pendientes: 0 } } })
    expect(wrapper.text()).toContain('Al día')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('en mora resume las cuotas vencidas y despliega el detalle', async () => {
    const wrapper = mount(CarteraEstado, { props: { estudiante: enMora } })
    expect(wrapper.text()).toContain('En mora')
    expect(wrapper.text()).toContain('2 cuotas vencidas · 40 días de mora')
    expect(wrapper.findAll('[data-test="mora-cuota"]')).toHaveLength(0)

    await wrapper.get('button').trigger('click')

    const cuotas = wrapper.findAll('[data-test="mora-cuota"]')
    expect(cuotas).toHaveLength(2)
    expect(cuotas[0].text()).toContain('Matrícula')
    expect(cuotas[0].text()).not.toContain('cuota 0')
    expect(cuotas[0].text()).toContain('Electricidad')
    expect(cuotas[0].text()).toContain('40 días de mora')
    expect(cuotas[1].text()).toContain('Pago de mensualidad · cuota 1')
    expect(cuotas[1].text()).toContain('10 días de mora')
  })

  it('indica las transferencias por aprobar', () => {
    const wrapper = mount(CarteraEstado, { props: { estudiante: { ...enMora, transferencias_pendientes: 1, valor_transferencias_pendientes: 500000 } } })
    expect(wrapper.text()).toContain('Transferencia por aprobar')
  })
})
