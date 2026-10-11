import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CajaView from '@/views/financiero/CajaView.vue'
import libroDiarioService from '@/services/libroDiarioService.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: {
    getTurnoActual: vi.fn(),
    getFilters: vi.fn(),
    getCatalogoActivos: vi.fn(),
    getMovimientos: vi.fn(),
    getConsignaciones: vi.fn(),
  },
}))
vi.mock('@/services/bancoService.js', () => ({ default: { getActivos: vi.fn().mockResolvedValue({ data: [] }) } }))
vi.mock('@/services/authService.js', () => ({ authService: { getUserPermissions: vi.fn().mockResolvedValue([]) } }))

const TURNO = {
  id: 1, sede: { nombre: 'Sede Tunja' }, abierto_at: '2026-10-10 16:46:55', base_inicial: 50000,
  resumen: { base_inicial: 50000, ingresos: {}, por_medio_pago: {} },
}
const META = { puede_abrir: false, motivo_no_puede: null, sedes_disponibles: [], cierre_por_aprobar: null, cierre_rechazado: null }

function montar() {
  return mount(CajaView, { global: { stubs: { teleport: true, MovimientoFormModal: true, ConsignacionFormModal: true, RegistroDetalleModal: true } } })
}

describe('CajaView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    libroDiarioService.getFilters.mockResolvedValue({ data: {} })
    libroDiarioService.getCatalogoActivos.mockResolvedValue({ data: [] })
    libroDiarioService.getMovimientos.mockResolvedValue({ data: [] })
    libroDiarioService.getConsignaciones.mockResolvedValue({ data: [] })
  })

  it('con el cierre rechazado muestra el aviso y también el turno reabierto', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({
      data: TURNO,
      meta: { ...META, cierre_rechazado: { motivo: 'No es el valor' } },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Su cierre fue rechazado')
    expect(wrapper.text()).toContain('No es el valor')
    expect(wrapper.text()).toContain('Turno N.° 1 — Sede Tunja')
    expect(wrapper.text()).toContain('Cerrar caja')
  })

  it('con un cierre por aprobar muestra el aviso y el formulario de apertura', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({
      data: null,
      meta: { ...META, motivo_no_puede: 'Ya cerró caja hoy.', cierre_por_aprobar: { id: 4, fecha: '2026-10-10' } },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('pendiente de aprobación')
    expect(wrapper.text()).toContain('Abrir turno de caja')
    expect(wrapper.text()).toContain('Ya cerró caja hoy.')
  })
})
