import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormSelect from '@/components/forms/FormSelect.vue'
import TurnoCajaAviso from '@/components/financiero/libroDiario/TurnoCajaAviso.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { turnoCajaActivoId, turnoCajaActivoSedeId } from '@/composables/useTurnoCaja.js'

vi.mock('@/services/libroDiarioService.js', () => ({ default: { getTurnoActual: vi.fn() } }))

const turno = (id, nombre, sedeId = null) => ({ id, sede_id: sedeId, sede: { nombre }, abierto_at: '2026-11-03 08:00:00' })

function montar() {
  return mount(TurnoCajaAviso, { global: { stubs: { 'router-link': true } } })
}

describe('TurnoCajaAviso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('sin turno abierto invita a abrir la caja', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({ data: [], meta: {} })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('No tiene un turno de caja abierto')
    expect(turnoCajaActivoId()).toBeNull()
  })

  it('con una sola caja indica la sede y factura con ese turno', async () => {
    libroDiarioService.getTurnoActual.mockResolvedValue({ data: [turno(3, 'Sede Tunja')], meta: {} })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Turno de caja abierto en Sede Tunja')
    expect(wrapper.text()).not.toContain('Facturando desde')
    expect(turnoCajaActivoId()).toBe(3)
  })

  it('con cajas en varias sedes deja elegir desde cuál se factura', async () => {
    localStorage.setItem('carmot.turnoCajaActivo', '8')
    libroDiarioService.getTurnoActual.mockResolvedValue({ data: [turno(7, 'Sede Tunja', 2), turno(8, 'Sede Duitama', 1)], meta: {} })
    const wrapper = montar()
    await flushPromises()

    expect(wrapper.text()).toContain('Facturando desde')
    // Recuerda la caja elegida antes
    expect(wrapper.text()).toContain('Sede Duitama · turno N.° 8')
    expect(turnoCajaActivoId()).toBe(8)
    // La sede del turno elegido es donde se recibe el pago (cuentas bancarias de transferencia)
    expect(turnoCajaActivoSedeId()).toBe(1)

    await wrapper.findComponent(FormSelect).vm.$emit('change', '7')

    expect(turnoCajaActivoId()).toBe(7)
    expect(turnoCajaActivoSedeId()).toBe(2)
    expect(localStorage.getItem('carmot.turnoCajaActivo')).toBe('7')
  })
})
