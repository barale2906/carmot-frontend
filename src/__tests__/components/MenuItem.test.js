import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MenuItem from '@/components/MenuItem.vue'

vi.mock('vue-router', () => ({
  useRoute:  () => ({ path: '/financiero/cartera' }),
  useRouter: () => ({ push: vi.fn() }),
}))

const hoja = (id, route) => ({ id, title: id, icon: 'menu', route, disabled: false, children: [] })
const grupo = (id, route, children) => ({ id, title: id, icon: 'menu', route, disabled: false, children })

const FINANCIERO = grupo('financiero', '/financiero', [
  grupo('listas', '#financiero-listas', [hoja('productos', '/financiero/productos')]),
  grupo('recibos', '#financiero-recibos', [hoja('recibos-pago', '/financiero/recibos-pago')]),
  grupo('cartera', '#financiero-cartera', [hoja('cartera-v', '/financiero/cartera')]),
])

function montar(props = {}) {
  return mount(MenuItem, {
    props: { item: FINANCIERO, currentRoute: '/financiero/cartera', expanded: true, ...props },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' }, Transition: false } },
  })
}

const subBotones = (wrapper) => wrapper.findAll('button[aria-expanded]').slice(1)
const abiertos = (wrapper) => subBotones(wrapper).filter((b) => b.attributes('aria-expanded') === 'true').map((b) => b.text())

describe('MenuItem (acordeón)', () => {
  it('el clic en un dropdown emite toggle al padre en lugar de abrirse solo', async () => {
    const wrapper = montar({ expanded: false })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggle')).toHaveLength(1)
  })

  it('al montar solo abre el sub-dropdown de la pantalla visitada', () => {
    expect(abiertos(montar())).toEqual(['cartera'])
  })

  it('abrir un sub-dropdown cierra el hermano abierto', async () => {
    const wrapper = montar()
    await subBotones(wrapper)[0].trigger('click')
    expect(abiertos(wrapper)).toEqual(['listas'])
    await subBotones(wrapper)[1].trigger('click')
    expect(abiertos(wrapper)).toEqual(['recibos'])
  })

  it('marca la hoja activa para poder desplazar el menú hasta ella', () => {
    const activos = montar().findAll('[data-menu-activo]')
    expect(activos).toHaveLength(1)
    expect(activos[0].text()).toBe('cartera-v')
  })
})
