import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DescuentosMatriculaPanel from '@/components/academico/DescuentosMatriculaPanel.vue'

const PREVIEW = {
  total_curso: 1000000,
  valor_matricula: 200000,
  jornada: 2,
  descuentos: [
    { id: 1, nombre: 'Promo noche', descripcion: null, tipo: 'porcentual', valor: 25, aplicacion: 'matricula', permite_acumulacion: false, valor_descuento: 50000 },
  ],
  total_descuento: 50000,
  valor_matricula_con_descuento: 150000,
  total_curso_con_descuento: 950000,
  descuentos_pago_anticipado: [],
}

describe('DescuentosMatriculaPanel', () => {
  it('sin vista previa invita a elegir curso, ciclo y precio', () => {
    const wrapper = mount(DescuentosMatriculaPanel, { props: { preview: null } })
    expect(wrapper.text()).toContain('Elige el curso, el ciclo y el precio')
  })

  it('mientras consulta muestra el estado de carga', () => {
    const wrapper = mount(DescuentosMatriculaPanel, { props: { preview: null, loading: true } })
    expect(wrapper.text()).toContain('Consultando descuentos')
  })

  it('muestra el total del curso, el detalle del descuento y los totales con descuento', () => {
    const text = mount(DescuentosMatriculaPanel, { props: { preview: PREVIEW } }).text()

    expect(text).toContain('1.000.000')
    expect(text).toContain('Promo noche')
    expect(text).toContain('25 %')
    expect(text).toContain('no acumulable')
    expect(text).toContain('50.000')
    expect(text).toContain('950.000')
  })

  it('sin descuentos aplicables lo indica y no muestra totales con descuento', () => {
    const wrapper = mount(DescuentosMatriculaPanel, {
      props: { preview: { ...PREVIEW, descuentos: [], total_descuento: 0 } },
    })

    expect(wrapper.text()).toContain('No hay descuentos de matrícula')
    expect(wrapper.text()).not.toContain('Total del curso con descuento')
  })

  it('lista los descuentos de pronto pago con sus días de anticipación', () => {
    const wrapper = mount(DescuentosMatriculaPanel, {
      props: {
        preview: {
          ...PREVIEW,
          descuentos_pago_anticipado: [{ id: 9, nombre: 'Pronto pago', tipo: 'porcentual', valor: 10, dias_anticipacion: 5 }],
        },
      },
    })

    expect(wrapper.text()).toContain('Pronto pago')
    expect(wrapper.text()).toContain('5 días de anticipación')
  })
})
