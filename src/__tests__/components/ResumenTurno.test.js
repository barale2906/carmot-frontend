import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResumenTurno from '@/components/financiero/libroDiario/ResumenTurno.vue'

const RESUMEN = {
  base_inicial: 50000,
  ingresos: { academico: 100000, inventario: 0, otros: 0, total: 100000 },
  egresos: 0,
  consignaciones: 0,
  por_medio_pago: { efectivo: { ingresos: 100000, egresos: 0 } },
}

describe('ResumenTurno', () => {
  it('no muestra el efectivo esperado cuando el backend no lo envía (conteo ciego)', () => {
    const wrapper = mount(ResumenTurno, { props: { resumen: RESUMEN } })
    expect(wrapper.text()).not.toContain('Efectivo esperado')
    expect(wrapper.text()).toContain('Recibos académicos')
  })

  it('muestra el efectivo esperado a quien supervisa cajas', () => {
    const wrapper = mount(ResumenTurno, { props: { resumen: { ...RESUMEN, efectivo_esperado: 150000 } } })
    expect(wrapper.text()).toContain('Efectivo esperado en caja')
    expect(wrapper.text()).toContain('150.000')
  })
})
