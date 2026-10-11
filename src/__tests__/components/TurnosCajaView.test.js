import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TurnosCajaView from '@/views/financiero/TurnosCajaView.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { authService } from '@/services/authService.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { getFilters: vi.fn(), getTurnos: vi.fn(), getTurno: vi.fn(), aprobarTurno: vi.fn(), rechazarTurno: vi.fn() },
}))
vi.mock('@/services/authService.js', () => ({
  authService: {
    getUser: vi.fn(),
    getUserPermissions: vi.fn(),
  },
}))
const confirmar = vi.fn()
vi.mock('@/composables/useConfirm.js', () => ({ useConfirm: () => ({ confirm: confirmar }) }))

const TURNO = {
  id: 9, cajero_id: 3, cajero: { id: 3, name: 'Cajera' }, cerrado_por: { id: 3, name: 'Cajera' },
  sede: { nombre: 'Tunja' }, fecha: '2026-10-10', status: 2, status_text: 'Por aprobar',
  efectivo_contado: 738900, efectivo_esperado: 739700, diferencia: -800, descuadre: true,
  resumen: { base_inicial: 0, por_medio_pago: {} }, eventos: [],
}

async function abrirDetalle(usuarioId) {
  authService.getUser.mockResolvedValue({ id: usuarioId })
  const wrapper = mount(TurnosCajaView, { global: { stubs: { teleport: true } } })
  await flushPromises()
  await wrapper.find('button[title="Ver detalle"]').trigger('click')
  await flushPromises()
  return wrapper
}

describe('TurnosCajaView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authService.getUserPermissions.mockResolvedValue(['fin_ldCierreAprobar'])
    libroDiarioService.getFilters.mockResolvedValue({ data: {} })
    libroDiarioService.getTurnos.mockResolvedValue({ data: [TURNO], meta: { current_page: 1, last_page: 1, total: 1 } })
    libroDiarioService.getTurno.mockResolvedValue({ data: TURNO })
    libroDiarioService.aprobarTurno.mockResolvedValue({ data: TURNO })
    libroDiarioService.rechazarTurno.mockResolvedValue({ data: TURNO })
  })

  it('marca el descuadre en el listado y enciende la alarma en el detalle', async () => {
    const wrapper = await abrirDetalle(1)

    expect(wrapper.text()).toContain('Descuadre')
    expect(wrapper.find('[role="alert"]').text()).toContain('faltante de $ 800')
  })

  it('pide confirmación para aprobar un cierre con descuadre', async () => {
    const wrapper = await abrirDetalle(1)
    confirmar.mockResolvedValue(false)

    await wrapper.findAll('button').find((b) => b.text().includes('Aprobar cierre')).trigger('click')
    await flushPromises()
    expect(confirmar).toHaveBeenCalled()
    expect(libroDiarioService.aprobarTurno).not.toHaveBeenCalled()

    confirmar.mockResolvedValue(true)
    await wrapper.findAll('button').find((b) => b.text().includes('Aprobar cierre')).trigger('click')
    await flushPromises()
    expect(libroDiarioService.aprobarTurno).toHaveBeenCalledWith(9, null)
  })

  it('explica por qué no rechaza con un motivo corto', async () => {
    const wrapper = await abrirDetalle(1)
    await wrapper.find('textarea').setValue('No')

    const boton = wrapper.findAll('button').find((b) => b.text().includes('Rechazar cierre'))
    expect(boton.attributes('disabled')).toBeUndefined()
    await boton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('al menos 5 caracteres')
    expect(libroDiarioService.rechazarTurno).not.toHaveBeenCalled()

    await wrapper.find('textarea').setValue('Vuelva a contar el efectivo')
    await boton.trigger('click')
    await flushPromises()
    expect(libroDiarioService.rechazarTurno).toHaveBeenCalledWith(9, 'Vuelva a contar el efectivo')
  })

  it('no ofrece aprobar el cierre propio', async () => {
    const wrapper = await abrirDetalle(3)

    expect(wrapper.text()).toContain('Este cierre es suyo')
    expect(wrapper.findAll('button').some((b) => b.text().includes('Aprobar cierre'))).toBe(false)
  })
})
