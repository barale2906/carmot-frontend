import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ImportarMovimientosModal from '@/components/financiero/libroDiario/ImportarMovimientosModal.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { descargarBlob } from '@/utils/descargas.js'

vi.mock('@/services/libroDiarioService.js', () => ({
  default: { descargarPlantillaMovimientos: vi.fn(), importarMovimientos: vi.fn() },
}))
vi.mock('@/utils/descargas.js', () => ({
  descargarBlob: vi.fn(),
  mensajeErrorBlob: vi.fn().mockResolvedValue('No se pudo descargar la plantilla.'),
}))

/** ModalBase real con Teleport desactivado para poder inspeccionar el contenido. */
async function montar() {
  const wrapper = mount(ImportarMovimientosModal, {
    props: { modelValue: false },
    global: { stubs: { teleport: true } },
  })
  await wrapper.setProps({ modelValue: true })
  return wrapper
}

const boton = (wrapper, texto) => wrapper.findAll('button').find((b) => b.text().includes(texto))

async function elegirArchivo(wrapper) {
  const input = wrapper.find('input[type="file"]')
  const archivo = new File(['x'], 'movimientos.xlsx')
  Object.defineProperty(input.element, 'files', { value: [archivo] })
  await input.trigger('change')
  return archivo
}

describe('ImportarMovimientosModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('descarga la plantilla en Excel', async () => {
    const blob = new Blob(['x'])
    libroDiarioService.descargarPlantillaMovimientos.mockResolvedValue({ data: blob })
    const wrapper = await montar()

    await boton(wrapper, 'Descargar plantilla').trigger('click')
    await flushPromises()

    expect(descargarBlob).toHaveBeenCalledWith(blob, 'plantilla-movimientos-libro-diario.xlsx')
  })

  it('carga el archivo y avisa cuántos movimientos se registraron', async () => {
    libroDiarioService.importarMovimientos.mockResolvedValue({ data: [{}, {}], meta: { total: 2 } })
    const wrapper = await montar()
    expect(boton(wrapper, 'Cargar movimientos').attributes('disabled')).toBeDefined()

    const archivo = await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar movimientos').trigger('click')
    await flushPromises()

    expect(libroDiarioService.importarMovimientos).toHaveBeenCalledWith(archivo)
    expect(wrapper.emitted('importado')[0]).toEqual([2])
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('muestra los errores por fila sin cerrar el modal', async () => {
    libroDiarioService.importarMovimientos.mockRejectedValue({
      response: {
        data: {
          message: 'El archivo tiene errores; no se registró ningún movimiento.',
          errores: [{ fila: 3, mensajes: ['El nombre del tercero es obligatorio.'] }],
        },
      },
    })
    const wrapper = await montar()
    await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar movimientos').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('no se registró ningún movimiento')
    expect(wrapper.text()).toContain('Fila 3:')
    expect(wrapper.text()).toContain('El nombre del tercero es obligatorio.')
    expect(wrapper.emitted('importado')).toBeUndefined()
  })

  it('muestra el error del archivo o del turno', async () => {
    libroDiarioService.importarMovimientos.mockRejectedValue({
      response: { data: { message: 'x', errors: { turno: ['Debe abrir un turno de caja antes de registrar movimientos.'] } } },
    })
    const wrapper = await montar()
    await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar movimientos').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Debe abrir un turno de caja')
  })
})
