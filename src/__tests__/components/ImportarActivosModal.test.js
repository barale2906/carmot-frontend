import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ImportarActivosModal from '@/components/activos/ImportarActivosModal.vue'
import activoService from '@/services/activoService.js'
import { descargarBlob } from '@/utils/descargas.js'

vi.mock('@/services/activoService.js', () => ({
  default: { descargarPlantilla: vi.fn(), importar: vi.fn() },
}))
vi.mock('@/utils/descargas.js', () => ({
  descargarBlob: vi.fn(),
  mensajeErrorBlob: vi.fn().mockResolvedValue('No se pudo descargar la plantilla.'),
}))

/** ModalBase real con Teleport desactivado para poder inspeccionar el contenido. */
async function montar() {
  const wrapper = mount(ImportarActivosModal, {
    props: { modelValue: false },
    global: { stubs: { teleport: true } },
  })
  await wrapper.setProps({ modelValue: true })
  return wrapper
}

const boton = (wrapper, texto) => wrapper.findAll('button').find((b) => b.text().includes(texto))

async function elegirArchivo(wrapper) {
  const input = wrapper.find('input[type="file"]')
  const archivo = new File(['x'], 'activos.xlsx')
  Object.defineProperty(input.element, 'files', { value: [archivo] })
  await input.trigger('change')
  return archivo
}

describe('ImportarActivosModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('descarga la plantilla en Excel', async () => {
    const blob = new Blob(['x'])
    activoService.descargarPlantilla.mockResolvedValue({ data: blob })
    const wrapper = await montar()

    await boton(wrapper, 'Descargar plantilla').trigger('click')
    await flushPromises()

    expect(descargarBlob).toHaveBeenCalledWith(blob, 'plantilla-activos.xlsx')
  })

  it('carga el archivo y avisa cuántos activos se registraron', async () => {
    activoService.importar.mockResolvedValue({ data: [{}, {}], meta: { total: 2 } })
    const wrapper = await montar()
    expect(boton(wrapper, 'Cargar activos').attributes('disabled')).toBeDefined()

    const archivo = await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar activos').trigger('click')
    await flushPromises()

    expect(activoService.importar).toHaveBeenCalledWith(archivo)
    expect(wrapper.emitted('importado')[0]).toEqual([2])
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false])
  })

  it('muestra los errores por fila sin cerrar el modal', async () => {
    activoService.importar.mockRejectedValue({
      response: {
        data: {
          message: 'El archivo tiene errores; no se registró ningún activo.',
          errores: [{ fila: 3, mensajes: ['La categoría "X" no existe o está inactiva.'] }],
        },
      },
    })
    const wrapper = await montar()
    await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar activos').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('no se registró ningún activo')
    expect(wrapper.text()).toContain('Fila 3:')
    expect(wrapper.text()).toContain('no existe o está inactiva')
    expect(wrapper.emitted('importado')).toBeUndefined()
  })

  it('muestra el error del archivo', async () => {
    activoService.importar.mockRejectedValue({
      response: { data: { message: 'x', errors: { archivo: ['El archivo no tiene activos para cargar.'] } } },
    })
    const wrapper = await montar()
    await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar activos').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('El archivo no tiene activos para cargar.')
  })
})
