import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import MatriculaDocumentosModal from '@/components/academico/MatriculaDocumentosModal.vue'
import docDocumentoService from '@/services/docDocumentoService.js'
import { descargarBlob } from '@/utils/descargas.js'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/docDocumentoService.js', () => ({
  default: { generarMatricula: vi.fn(), pdf: vi.fn(), pdfMatricula: vi.fn(), getAll: vi.fn() },
}))
vi.mock('@/services/authService.js', () => ({
  authService: { getUserPermissions: vi.fn().mockResolvedValue(['aca_documentos', 'aca_documentoSubir']) },
}))
vi.mock('@/utils/descargas.js', () => ({ descargarBlob: vi.fn(), mensajeErrorBlob: vi.fn() }))

/** ModalBase real usa Teleport; este stub pinta el contenido y el footer en línea. */
const ModalBaseStub = { template: '<div><slot /><slot name="footer" /></div>' }
const EscaneadosStub = {
  name: 'MatriculaEscaneados',
  props: ['matriculaId', 'documentos', 'puedeVer', 'puedeSubir'],
  template: '<div />',
}

const data = { matriculaId: 345, estudianteId: 12, codigo: 'MAT-2026-345' }

const respuesta = {
  data: {
    documentos: [
      { emision_id: 1, tipo_documento_id: 1, codigo: 'CONTRATO', tipo_documento: 'Contrato', version: 2, fecha_referencia: '2026-10-01', contenido: '<p>Contrato</p>' },
      { emision_id: 2, tipo_documento_id: 2, codigo: 'PAGARE', tipo_documento: 'Pagaré', version: 1, fecha_referencia: '2026-10-01', contenido: '<p>Pagaré</p>' },
    ],
    sin_plantilla: [],
  },
}

/** Monta cerrado y lo abre, como lo hace MatriculaView. */
async function abrir(props = {}) {
  const wrapper = mount(MatriculaDocumentosModal, {
    props: { open: false, data, ...props },
    global: { stubs: { ModalBase: ModalBaseStub, MatriculaEscaneados: EscaneadosStub, DocHtmlPreview: { props: ['html'], template: '<div class="preview" v-html="html" />' } } },
  })
  await wrapper.setProps({ open: true })
  await flushPromises()
  return wrapper
}

describe('MatriculaDocumentosModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    docDocumentoService.generarMatricula.mockResolvedValue(respuesta)
  })

  it('al abrirse genera los documentos de la matrícula y muestra uno por pestaña', async () => {
    const wrapper = await abrir()

    expect(docDocumentoService.generarMatricula).toHaveBeenCalledWith(345, { _silent: true })
    expect(wrapper.findAll('[role="tab"]').map(t => t.text())).toEqual(['Contrato', 'Pagaré'])
    expect(wrapper.find('.preview').html()).toContain('Contrato')
  })

  it('tras el wizard ofrece la hoja de matrícula y el paso al recibo de pago', async () => {
    const wrapper = await abrir()

    expect(wrapper.text()).toContain('Hoja de matrícula')
    expect(wrapper.text()).toContain('Continuar al recibo de pago')
  })

  it('en reimpresión desde el listado oculta la hoja y el paso al recibo', async () => {
    const wrapper = await abrir({ reimpresion: true })

    expect(wrapper.text()).not.toContain('Hoja de matrícula')
    expect(wrapper.text()).not.toContain('Continuar al recibo de pago')
    expect(wrapper.text()).toContain('Descargar PDF')
  })

  it('no vuelve a generar al reabrirse para la misma matrícula', async () => {
    const wrapper = await abrir()
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(docDocumentoService.generarMatricula).toHaveBeenCalledTimes(1)
  })

  it('advierte los tipos sin versión vigente', async () => {
    docDocumentoService.generarMatricula.mockResolvedValue({
      data: { documentos: [], sin_plantilla: [{ tipo_documento_id: 3, codigo: 'PAGARE', nombre: 'Pagaré' }] },
    })
    const wrapper = await abrir({ reimpresion: true })

    expect(wrapper.text()).toContain('Sin versión vigente')
    expect(wrapper.text()).toContain('Pagaré')
  })

  it('pasa los documentos y los permisos a la sección de escaneados', async () => {
    const wrapper = await abrir()
    const escaneados = wrapper.findComponent(EscaneadosStub)

    expect(escaneados.props('matriculaId')).toBe(345)
    expect(escaneados.props('documentos')).toHaveLength(2)
    expect(escaneados.props('puedeVer')).toBe(true)
    expect(escaneados.props('puedeSubir')).toBe(true)
  })

  it('Descargar todos baja un solo PDF con la hoja y los documentos', async () => {
    docDocumentoService.pdfMatricula.mockResolvedValue({ data: new Blob(['%PDF']) })
    const wrapper = await abrir({ reimpresion: true })

    const boton = wrapper.findAll('button').find(b => b.text().includes('Descargar todos'))
    await boton.trigger('click')
    await flushPromises()

    expect(docDocumentoService.pdfMatricula).toHaveBeenCalledWith(345)
    expect(descargarBlob).toHaveBeenCalledWith(expect.any(Blob), 'DOCUMENTOS-MAT-2026-345.pdf', 'application/pdf')
  })
})
