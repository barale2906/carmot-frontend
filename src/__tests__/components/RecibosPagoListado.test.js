import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import RecibosPagoListado from '@/components/financiero/RecibosPagoListado.vue'
import reciboPagoService from '@/services/reciboPagoService.js'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/reciboPagoService.js', () => ({
  default: { getAll: vi.fn(), getById: vi.fn(), getPdf: vi.fn(), anular: vi.fn(), enviarEmail: vi.fn() },
}))
vi.mock('@/services/invVentaService.js', () => ({ default: {} }))
vi.mock('@/services/invPedidoService.js', () => ({ default: { getById: vi.fn() } }))
vi.mock('@/services/bancoService.js', () => ({ default: { getActivos: vi.fn() } }))

const respuesta = (data = []) => ({ data, meta: { current_page: 1, last_page: 1, total: data.length, from: 1, to: data.length } })

/** Parámetros de la llamada del listado (la que pide relaciones), no las de estadísticas. */
const paramsListado = () => reciboPagoService.getAll.mock.calls.map(([p]) => p).filter(p => p.with).at(-1)

function montar(props = {}) {
  return mount(RecibosPagoListado, {
    props,
    global: { stubs: { ModalBase: true, ReciboPrintModal: true, InvReciboPrintModal: true, StatCard: true } },
  })
}

describe('RecibosPagoListado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api')
    reciboPagoService.getAll.mockResolvedValue(respuesta())
  })

  it('en Financiero carga los recibos académicos (origen=1) por defecto', async () => {
    montar({ origenInicial: 'academico', permitirCrear: true })
    await flushPromises()
    expect(paramsListado()).toMatchObject({ origen: '1' })
  })

  it('en Inventario carga los recibos de inventario (origen=0) por defecto', async () => {
    const wrapper = montar({ origenInicial: 'inventario' })
    await flushPromises()
    expect(paramsListado()).toMatchObject({ origen: '0' })
    expect(wrapper.text()).not.toContain('Nuevo recibo')
  })

  it('"Todos" quita el filtro de origen y muestra la columna Origen', async () => {
    reciboPagoService.getAll.mockResolvedValue(respuesta([
      { id: 1, numero_recibo: 'ACA-1', origen: 1, status: 1, estudiante: { name: 'Ana' } },
      { id: 2, numero_recibo: 'INV-1', origen: 0, status: 1, estudiante: { name: 'Luis' } },
    ]))
    const wrapper = montar({ origenInicial: 'inventario' })
    await flushPromises()

    await wrapper.findAll('[role="radio"]').find(b => b.text() === 'Todos').trigger('click')
    await flushPromises()

    expect(paramsListado()).not.toHaveProperty('origen')
    expect(wrapper.text()).toContain('Académico')
    expect(wrapper.text()).toContain('Inventario')
  })

  it('las estadísticas respetan el origen seleccionado', async () => {
    montar({ origenInicial: 'inventario' })
    await flushPromises()
    const estadisticas = reciboPagoService.getAll.mock.calls.map(([p]) => p).filter(p => p.per_page === 1)
    expect(estadisticas).toHaveLength(3)
    estadisticas.forEach(p => expect(p.origen).toBe('0'))
  })
})
