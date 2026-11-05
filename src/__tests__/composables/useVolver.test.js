import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, defineComponent, h }   from 'vue'
import { mount, flushPromises }      from '@vue/test-utils'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import { useVolver, puedeRetroceder } from '@/composables/useVolver.js'

const confirmMock = vi.fn()
vi.mock('@/composables/useConfirm.js', () => ({ useConfirm: () => ({ confirm: confirmMock }) }))

const Vacia = { render: () => null }
const montados = []

/** Monta una app con un formulario en /form que usa useVolver con las opciones dadas. */
async function montar(opciones, { inicio = '/listado' } = {}) {
  let api
  const Formulario = defineComponent({
    setup() {
      api = useVolver(opciones)
      return () => null
    },
  })
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/',          component: Vacia },
      { path: '/listado',   component: Vacia },
      { path: '/respaldo',  component: Vacia },
      { path: '/form',      component: Formulario },
    ],
  })
  // Sustituye la entrada actual: la primera ruta queda sin historial previo (state.back = null)
  await router.replace(inicio)
  await router.isReady()
  montados.push(mount({ render: () => h(RouterView) }, { global: { plugins: [router] } }))
  return { router, api: () => api }
}

/** El "atrás" de Vue Router es asíncrono (popstate): espera a que termine la navegación. */
async function esperarNavegacion(router) {
  await new Promise((resolve) => {
    const quitar = router.afterEach(() => { quitar(); resolve() })
    setTimeout(resolve, 200)
  })
  await flushPromises()
}

describe('puedeRetroceder', () => {
  it('solo es true cuando Vue Router registró una ruta anterior', () => {
    expect(puedeRetroceder({ back: '/listado' })).toBe(true)
    expect(puedeRetroceder({ back: null })).toBe(false)
    expect(puedeRetroceder(null)).toBe(false)
  })
})

describe('useVolver', () => {
  beforeEach(() => {
    confirmMock.mockReset()
  })

  afterEach(() => {
    montados.splice(0).forEach((wrapper) => wrapper.unmount())
  })

  it('con historial regresa a la pantalla anterior', async () => {
    const { router, api } = await montar({ respaldo: '/respaldo' })
    await router.push('/form')

    api().volver()
    await esperarNavegacion(router)

    expect(router.currentRoute.value.path).toBe('/listado')
  })

  it('sin historial (pantalla abierta directo) va a la ruta de respaldo', async () => {
    const { router, api } = await montar({ respaldo: () => '/respaldo' }, { inicio: '/form' })

    api().volver()
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/respaldo')
  })

  it('sin cambios sale sin pedir confirmación', async () => {
    const { router } = await montar({ respaldo: '/respaldo', hayCambios: ref(false) })
    await router.push('/form')

    await router.push('/listado')

    expect(confirmMock).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/listado')
  })

  it('con cambios pide confirmación y se queda si el usuario cancela', async () => {
    confirmMock.mockResolvedValue(false)
    const { router } = await montar({ respaldo: '/respaldo', hayCambios: () => true, mensaje: 'Descartar?' })
    await router.push('/form')

    await router.push('/listado')

    expect(confirmMock).toHaveBeenCalledWith('Descartar?', expect.objectContaining({ confirmLabel: 'Salir sin guardar' }))
    expect(router.currentRoute.value.path).toBe('/form')
  })

  it('con cambios sale cuando el usuario confirma', async () => {
    confirmMock.mockResolvedValue(true)
    const { router } = await montar({ respaldo: '/respaldo', hayCambios: ref(true) })
    await router.push('/form')

    await router.push('/listado')

    expect(router.currentRoute.value.path).toBe('/listado')
  })

  it('permitirSalida omite la confirmación (p. ej. tras guardar)', async () => {
    const { router, api } = await montar({ respaldo: '/respaldo', hayCambios: ref(true) })
    await router.push('/form')

    api().permitirSalida()
    await router.push('/listado')

    expect(confirmMock).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/listado')
  })

  it('con cambios bloquea la recarga/cierre de pestaña con el aviso nativo', async () => {
    const hayCambios = ref(true)
    const { router } = await montar({ respaldo: '/respaldo', hayCambios })
    await router.push('/form')

    const conCambios = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(conCambios)
    expect(conCambios.defaultPrevented).toBe(true)

    hayCambios.value = false
    const sinCambios = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(sinCambios)
    expect(sinCambios.defaultPrevented).toBe(false)
  })

  it('al salir del formulario deja de escuchar la descarga de la página', async () => {
    confirmMock.mockResolvedValue(true)
    const { router } = await montar({ respaldo: '/respaldo', hayCambios: ref(true) })
    await router.push('/form')
    await router.push('/listado')

    const evento = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(evento)
    expect(evento.defaultPrevented).toBe(false)
  })

  it('la salida al login (sesión vencida) nunca se interrumpe', async () => {
    const { router } = await montar({ respaldo: '/respaldo', hayCambios: ref(true) })
    await router.push('/form')

    await router.push('/')

    expect(confirmMock).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/')
  })
})
