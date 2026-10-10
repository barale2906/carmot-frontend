import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MatriculaEscaneados from '@/components/academico/MatriculaEscaneados.vue'
import docDocumentoService from '@/services/docDocumentoService.js'
import { descargarBlob } from '@/utils/descargas.js'

vi.mock('@/services/docDocumentoService.js', () => ({
  default: { getAll: vi.fn(), subirEscaneado: vi.fn(), descargarArchivo: vi.fn() },
}))
vi.mock('@/utils/descargas.js', () => ({ descargarBlob: vi.fn(), mensajeErrorBlob: vi.fn() }))

const documentos = [{ tipo_documento_id: 1, tipo_documento: 'Contrato' }]

const contratoCargado = {
  id: 10, tipo_documento_id: 1, descripcion: null, nombre_original: 'contrato.pdf',
  mime_type: 'application/pdf', created_at: '2026-10-09T15:00:00Z',
}

function montar(props = {}) {
  return mount(MatriculaEscaneados, {
    props: { matriculaId: 345, documentos, puedeVer: true, puedeSubir: true, ...props },
  })
}

/** Simula elegir un archivo en un input type=file. */
async function elegirArchivo(input, archivo) {
  Object.defineProperty(input.element, 'files', { value: [archivo], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

const pdf = (nombre = 'firmado.pdf', bytes = 10) => new File(['x'.repeat(bytes)], nombre, { type: 'application/pdf' })

describe('MatriculaEscaneados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    docDocumentoService.getAll.mockResolvedValue({ data: [contratoCargado] })
    docDocumentoService.subirEscaneado.mockResolvedValue({ data: { id: 20 } })
  })

  it('consulta los escaneados de la matrícula y marca cargados y pendientes', async () => {
    const wrapper = montar()
    await flushPromises()

    expect(docDocumentoService.getAll).toHaveBeenCalledWith({
      entidad_type: 'App\\Models\\Academico\\Matricula', entidad_id: 345, origen: 1, per_page: 100,
    })
    const filas = wrapper.findAll('li')
    expect(filas[0].text()).toContain('Hoja de matrícula')
    expect(filas[0].text()).toContain('Pendiente')
    expect(filas[1].text()).toContain('Contrato')
    expect(filas[1].text()).toContain('Cargado')
    expect(filas[1].text()).toContain('contrato.pdf')
    expect(wrapper.text()).toContain('1 de 2 documentos cargados')
  })

  it('carga la hoja de matrícula por descripción y el contrato por tipo', async () => {
    const wrapper = montar()
    await flushPromises()
    const inputs = wrapper.findAll('li input[type="file"]')

    const hoja = pdf('hoja.pdf')
    await elegirArchivo(inputs[0], hoja)
    expect(docDocumentoService.subirEscaneado).toHaveBeenLastCalledWith(345, { archivo: hoja, tipo_documento_id: null, descripcion: 'Hoja de matrícula' })

    const contrato = pdf('contrato-v2.pdf')
    await elegirArchivo(inputs[1], contrato)
    expect(docDocumentoService.subirEscaneado).toHaveBeenLastCalledWith(345, { archivo: contrato, tipo_documento_id: 1, descripcion: null })

    // Recarga la lista tras cada carga.
    expect(docDocumentoService.getAll).toHaveBeenCalledTimes(3)
  })

  it('rechaza en el navegador archivos de otro formato o de más de 10 MB', async () => {
    const wrapper = montar()
    await flushPromises()
    const input = wrapper.findAll('li input[type="file"]')[0]

    await elegirArchivo(input, new File(['x'], 'notas.docx'))
    expect(wrapper.text()).toContain('El archivo debe ser PDF, JPG o PNG.')

    const grande = pdf('grande.pdf')
    Object.defineProperty(grande, 'size', { value: 11 * 1024 * 1024 })
    await elegirArchivo(input, grande)
    expect(wrapper.text()).toContain('El archivo no puede superar los 10 MB.')

    expect(docDocumentoService.subirEscaneado).not.toHaveBeenCalled()
  })

  it('muestra el error de validación del backend', async () => {
    docDocumentoService.subirEscaneado.mockRejectedValue({
      response: { status: 422, data: { message: 'Error', errors: { tipo_documento_id: ['El tipo de documento está inactivo.'] } } },
    })
    const wrapper = montar()
    await flushPromises()

    await elegirArchivo(wrapper.findAll('li input[type="file"]')[1], pdf())

    expect(wrapper.text()).toContain('El tipo de documento está inactivo.')
  })

  it('carga otro documento con la descripción escrita', async () => {
    const wrapper = montar()
    await flushPromises()

    await wrapper.find('#escaneado-otro').setValue('Autorización de datos')
    const archivo = pdf('autorizacion.pdf')
    await elegirArchivo(wrapper.find('form input[type="file"]'), archivo)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(docDocumentoService.subirEscaneado).toHaveBeenCalledWith(345, { archivo, descripcion: 'Autorización de datos' })
  })

  it('descarga el escaneado con su nombre original', async () => {
    docDocumentoService.descargarArchivo.mockResolvedValue({ data: new Blob(['x']) })
    const wrapper = montar()
    await flushPromises()

    await wrapper.find('button[title="Descargar escaneado"]').trigger('click')
    await flushPromises()

    expect(docDocumentoService.descargarArchivo).toHaveBeenCalledWith(10)
    expect(descargarBlob).toHaveBeenCalledWith(expect.any(Blob), 'contrato.pdf', 'application/pdf')
  })

  it('sin permiso de carga no ofrece cargar ni reemplazar', async () => {
    const wrapper = montar({ puedeSubir: false })
    await flushPromises()

    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('sin permiso de consulta no pide la lista', async () => {
    const wrapper = montar({ puedeVer: false })
    await flushPromises()

    expect(docDocumentoService.getAll).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('No tienes permiso para ver los documentos cargados.')
  })
})
