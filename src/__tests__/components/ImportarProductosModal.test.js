import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ImportarProductosModal from '@/components/inventario/ImportarProductosModal.vue'
import invProductoService from '@/services/invProductoService.js'
import { descargarBlob } from '@/utils/descargas.js'

vi.mock('@/services/invProductoService.js', () => ({
  default: { getPlantilla: vi.fn(), importar: vi.fn() },
}))
vi.mock('@/utils/descargas.js', () => ({
  descargarBlob: vi.fn(),
  mensajeErrorBlob: vi.fn().mockResolvedValue('No se pudo descargar la plantilla.'),
}))

async function montar() {
  const wrapper = mount(ImportarProductosModal, {
    props: { modelValue: false },
    global: { stubs: { teleport: true } },
  })
  await wrapper.setProps({ modelValue: true })
  return wrapper
}

const boton = (wrapper, texto) => wrapper.findAll('button').find((b) => b.text().includes(texto))

async function elegirArchivo(wrapper) {
  const input = wrapper.find('input[type="file"]')
  const archivo = new File(['x'], 'productos.csv')
  Object.defineProperty(input.element, 'files', { value: [archivo] })
  await input.trigger('change')
  return archivo
}

describe('ImportarProductosModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('descarga la plantilla CSV', async () => {
    const blob = new Blob(['x'])
    invProductoService.getPlantilla.mockResolvedValue({ data: blob })
    const wrapper = await montar()

    await boton(wrapper, 'Descargar plantilla').trigger('click')
    await flushPromises()

    expect(descargarBlob).toHaveBeenCalledWith(blob, 'plantilla_catalogo_inventario.csv')
  })

  it('avisa si la plantilla no se pudo descargar', async () => {
    invProductoService.getPlantilla.mockRejectedValue(new Error('x'))
    const wrapper = await montar()

    await boton(wrapper, 'Descargar plantilla').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo descargar la plantilla.')
  })

  it('carga el archivo y muestra el resumen con las filas omitidas', async () => {
    invProductoService.importar.mockResolvedValue({
      message: 'Carga masiva completada. Insertadas: 1, Omitidas: 1.',
      data: { insertadas: 1, omitidas: 1, errores: ["Fila 3: el código 'CAM-001' ya existe."] },
    })
    const wrapper = await montar()
    expect(boton(wrapper, 'Cargar productos').attributes('disabled')).toBeDefined()

    const archivo = await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar productos').trigger('click')
    await flushPromises()

    const fd = invProductoService.importar.mock.calls[0][0]
    expect(fd.get('archivo')).toBe(archivo)
    expect(wrapper.emitted('importado')[0]).toEqual([1])
    expect(wrapper.text()).toContain('Insertadas: 1, Omitidas: 1')
    expect(wrapper.text()).toContain("Fila 3: el código 'CAM-001' ya existe.")
  })

  it('muestra el error del servidor', async () => {
    invProductoService.importar.mockRejectedValue({
      response: { data: { message: 'El archivo CSV no tiene el formato correcto. Columnas faltantes: tipo' } },
    })
    const wrapper = await montar()
    await elegirArchivo(wrapper)
    await boton(wrapper, 'Cargar productos').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Columnas faltantes: tipo')
    expect(wrapper.emitted('importado')).toBeUndefined()
  })
})
