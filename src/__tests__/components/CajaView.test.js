import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CajaView from '@/views/financiero/CajaView.vue'
import libroDiarioService from '@/services/libroDiarioService.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: {
    getTurnoActual: vi.fn(),
    abrirTurno: vi.fn(),
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
const TURNO_DUITAMA = { ...TURNO, id: 2, sede: { nombre: 'Sede Duitama' } }
const META = { puede_abrir: false, motivo_no_puede: null, sedes_disponibles: [], cierres_por_aprobar: [], cierres_rechazados: [] }
const sede = (id, nombre, extra = {}) => ({ id, nombre, turno_abierto_id: null, puede_abrir: true, motivo_no_puede: null, ...extra })

function montar() {
  return mount(CajaView, { global: { stubs: { teleport: true, MovimientoFormModal: true, ConsignacionFormModal: true, RegistroDetalleModal: true } } })
}

describe('CajaView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    libroDiarioService.getFilters.mockResolvedValue({ data: {} })
    libroDiarioService.getCatalogoActivos.mockResolvedValue({ data: [] })
    libroDiarioService.getMovimientos.mockResolvedValue({ data: [] })
    libroDiarioService.getConsignaciones.mockResolvedValue({ data: [] })
  })

  it('con el cierre rechazado muestra el aviso y también el turno reabierto', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({
      data: [TURNO],
      meta: { ...META, cierres_rechazados: [{ turno_id: 1, sede: 'Sede Tunja', motivo: 'No es el valor' }] },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Su cierre fue rechazado')
    expect(wrapper.text()).toContain('No es el valor')
    expect(wrapper.text()).toContain('Turno N.° 1 — Sede Tunja')
    expect(wrapper.text()).toContain('Cerrar caja')
  })

  it('con un cierre por aprobar muestra el aviso y por qué no puede abrir', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({
      data: [],
      meta: {
        ...META,
        motivo_no_puede: 'Ya cerró caja hoy en esta sede.',
        sedes_disponibles: [sede(5, 'Sede Tunja', { puede_abrir: false, motivo_no_puede: 'Ya cerró caja hoy en esta sede.' })],
        cierres_por_aprobar: [{ id: 4, fecha: '2026-10-10', sede: 'Sede Tunja' }],
      },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('N.° 4 de Sede Tunja')
    expect(wrapper.text()).toContain('pendiente de aprobación')
    expect(wrapper.text()).toContain('Abrir turno de caja')
    expect(wrapper.text()).toContain('Ya cerró caja hoy en esta sede.')
  })

  it('con una sola sede solo pide la base inicial', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({ data: [], meta: { ...META, puede_abrir: true, sedes_disponibles: [sede(5, 'Sede Tunja')] } })
    libroDiarioService.abrirTurno.mockResolvedValue({ data: { id: 9 } })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Sede Tunja')
    expect(wrapper.find('[role="combobox"]').exists()).toBe(false)

    await wrapper.find('input[type="number"]').setValue('30000')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(libroDiarioService.abrirTurno).toHaveBeenCalledWith({ sede_id: 5, base_inicial: '30000' })
  })

  it('con cajas en varias sedes muestra una pestaña por caja y cambia los registros al elegir', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({
      data: [TURNO, TURNO_DUITAMA],
      meta: { ...META, sedes_disponibles: [sede(5, 'Sede Tunja', { turno_abierto_id: 1, puede_abrir: false }), sede(6, 'Sede Duitama', { turno_abierto_id: 2, puede_abrir: false })] },
    })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Tiene caja abierta en 2 sedes')
    expect(wrapper.text()).toContain('Turno N.° 1 — Sede Tunja')
    expect(wrapper.text()).toContain('Cerrar caja de Sede Tunja')
    expect(libroDiarioService.getMovimientos).toHaveBeenLastCalledWith({ turno_caja_id: 1, per_page: 100 })

    const pestana = wrapper.findAll('[role="tab"]').find((t) => t.text() === 'Sede Duitama')
    await pestana.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Turno N.° 2 — Sede Duitama')
    expect(libroDiarioService.getMovimientos).toHaveBeenLastCalledWith({ turno_caja_id: 2, per_page: 100 })
    expect(localStorage.getItem('carmot.turnoCajaActivo')).toBe('2')
  })

  it('con caja abierta permite abrir otra en una sede disponible', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({
      data: [TURNO],
      meta: { ...META, puede_abrir: true, sedes_disponibles: [sede(5, 'Sede Tunja', { turno_abierto_id: 1, puede_abrir: false }), sede(6, 'Sede Duitama')] },
    })
    const wrapper = montar()
    await flushPromises()

    const boton = wrapper.findAll('button').find((b) => b.text().includes('Abrir caja en otra sede'))
    await boton.trigger('click')

    expect(wrapper.text()).toContain('Abrir caja en otra sede')
    expect(wrapper.text()).toContain('Sede Duitama')
    expect(wrapper.text()).toContain('Turno N.° 1 — Sede Tunja')
  })
})
