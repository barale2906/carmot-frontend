import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import LdCatalogosView from '@/views/financiero/LdCatalogosView.vue'
import LdTercerosPanel from '@/components/financiero/libroDiario/LdTercerosPanel.vue'
import FormTabs from '@/components/forms/FormTabs.vue'
import libroDiarioService from '@/services/libroDiarioService.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { getCatalogo: vi.fn(), getFilters: vi.fn() },
}))
vi.mock('@/services/authService.js', () => ({
  authService: { getUserPermissions: vi.fn().mockResolvedValue(['fin_ldCatalogos', 'fin_ldCatalogoEditar', 'fin_ldCatalogoCrear']) },
}))
vi.mock('@/composables/useConfirm.js', () => ({ useConfirm: () => ({ confirm: vi.fn() }) }))

describe('LdCatalogosView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    libroDiarioService.getCatalogo.mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } })
    libroDiarioService.getFilters.mockResolvedValue({ data: { tipos_identificacion: { NIT: 'NIT' } } })
  })

  it('la pestaña Terceros muestra su panel con los tipos de identificación y el permiso de edición', async () => {
    const wrapper = mount(LdCatalogosView, { global: { stubs: { teleport: true } } })
    await flushPromises()
    expect(wrapper.findComponent(LdTercerosPanel).exists()).toBe(false)
    expect(wrapper.text()).toContain('Nuevo tipo')

    await wrapper.findComponent(FormTabs).vm.$emit('update:modelValue', 'terceros')
    await flushPromises()

    const panel = wrapper.findComponent(LdTercerosPanel)
    expect(panel.props('tiposIdentificacion')).toEqual({ NIT: 'NIT' })
    expect(panel.props('puedeEditar')).toBe(true)
    expect(wrapper.text()).not.toContain('Nuevo tipo')
    expect(wrapper.text()).not.toContain('Papelera')
    expect(libroDiarioService.getCatalogo).toHaveBeenLastCalledWith('terceros', { page: 1 })
  })
})
