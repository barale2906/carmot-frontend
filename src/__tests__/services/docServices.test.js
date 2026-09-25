import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/services/api.js', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '@/services/api.js'
import docTipoDocumentoService from '@/services/docTipoDocumentoService.js'
import docPlantillaService     from '@/services/docPlantillaService.js'
import docDocumentoService     from '@/services/docDocumentoService.js'

const ok = (data) => Promise.resolve({ data })
const paginado = (items) => ({ data: items, meta: { current_page: 1, last_page: 1, total: items.length } })

beforeEach(() => vi.clearAllMocks())

// ─── docTipoDocumentoService ──────────────────────────────────────────────────

describe('docTipoDocumentoService', () => {
  const BASE = '/academico/documentacion/tipos-documento'

  it('getAll llama GET con params y retorna el cuerpo', async () => {
    api.get.mockReturnValue(ok(paginado([{ id: 1 }])))
    const res = await docTipoDocumentoService.getAll({ search: 'contrato', status: 1 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { search: 'contrato', status: 1 } })
    expect(res.data).toHaveLength(1)
  })

  it('getAll sin params envía objeto vacío', async () => {
    api.get.mockReturnValue(ok(paginado([])))
    await docTipoDocumentoService.getAll()
    expect(api.get).toHaveBeenCalledWith(BASE, { params: {} })
  })

  it('getById llama GET /{id}', async () => {
    api.get.mockReturnValue(ok({ data: { id: 3 } }))
    const res = await docTipoDocumentoService.getById(3)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/3`)
    expect(res.data.id).toBe(3)
  })

  it('create envía el payload completo por POST', async () => {
    const payload = { codigo: 'CONTRATO', nombre: 'Contrato', prefijo_numero: 'CONT', se_ata_fecha: true }
    api.post.mockReturnValue(ok({ data: { id: 1, ...payload } }))
    await docTipoDocumentoService.create(payload)
    expect(api.post).toHaveBeenCalledWith(BASE, payload)
  })

  it('update llama PUT /{id}', async () => {
    api.put.mockReturnValue(ok({ data: {} }))
    await docTipoDocumentoService.update(2, { nombre: 'Nuevo' })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/2`, { nombre: 'Nuevo' })
  })

  it('delete llama DELETE /{id}', async () => {
    api.delete.mockReturnValue(ok({}))
    await docTipoDocumentoService.delete(2)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/2`)
  })

  it('getTrashed / restore / forceDelete usan las rutas de papelera', async () => {
    api.get.mockReturnValue(ok(paginado([])))
    api.post.mockReturnValue(ok({}))
    api.delete.mockReturnValue(ok({}))
    await docTipoDocumentoService.getTrashed({ per_page: 50 })
    await docTipoDocumentoService.restore(4)
    await docTipoDocumentoService.forceDelete(4)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`, { params: { per_page: 50 } })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/4/restore`)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/4/force-delete`)
  })

  it('getFilters retorna entidades con sus campos de fecha', async () => {
    const filtros = { status_options: { 0: 'Inactivo', 1: 'Activo' }, entidades: [{ entidad_type: 'App\\Models\\Academico\\Matricula', nombre: 'Matrícula', campos_fecha: ['fecha_matricula'] }] }
    api.get.mockReturnValue(ok({ data: filtros }))
    const res = await docTipoDocumentoService.getFilters()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/filters`)
    expect(res.data.entidades[0].campos_fecha).toEqual(['fecha_matricula'])
  })

  it('getVariables llama GET /{id}/variables', async () => {
    api.get.mockReturnValue(ok({ data: [{ clave: 'estudiante.name', habilitada: true }] }))
    const res = await docTipoDocumentoService.getVariables(1)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/1/variables`)
    expect(res.data[0].clave).toBe('estudiante.name')
  })

  it('syncVariables envía las claves envueltas en { variables }', async () => {
    api.put.mockReturnValue(ok({ data: {} }))
    await docTipoDocumentoService.syncVariables(1, ['estudiante.name', 'monto_letras'])
    expect(api.put).toHaveBeenCalledWith(`${BASE}/1/variables`, { variables: ['estudiante.name', 'monto_letras'] })
  })

  it('propaga el error del API', async () => {
    api.post.mockRejectedValue({ response: { status: 422, data: { errors: { prefijo_numero: ['ya existe'] } } } })
    await expect(docTipoDocumentoService.create({})).rejects.toMatchObject({ response: { status: 422 } })
  })
})

// ─── docPlantillaService ──────────────────────────────────────────────────────

describe('docPlantillaService', () => {
  const BASE = '/academico/documentacion/plantillas'

  it('getAll filtra por tipo de documento', async () => {
    api.get.mockReturnValue(ok(paginado([])))
    await docPlantillaService.getAll({ tipo_documento_id: 1 })
    expect(api.get).toHaveBeenCalledWith(BASE, { params: { tipo_documento_id: 1 } })
  })

  it('getById llama GET /{id} (única fuente de contenido_html)', async () => {
    api.get.mockReturnValue(ok({ data: { id: 7, contenido_html: '<p>x</p>' } }))
    const res = await docPlantillaService.getById(7)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/7`)
    expect(res.data.contenido_html).toBe('<p>x</p>')
  })

  it('create y update envían nombre y contenido', async () => {
    api.post.mockReturnValue(ok({ data: { id: 8 } }))
    api.put.mockReturnValue(ok({ data: { id: 8 } }))
    await docPlantillaService.create({ tipo_documento_id: 1, nombre: 'Contrato 2026' })
    await docPlantillaService.update(8, { contenido_html: '<p>{{ estudiante.name }}</p>' })
    expect(api.post).toHaveBeenCalledWith(BASE, { tipo_documento_id: 1, nombre: 'Contrato 2026' })
    expect(api.put).toHaveBeenCalledWith(`${BASE}/8`, { contenido_html: '<p>{{ estudiante.name }}</p>' })
  })

  it('aprobar e inactivar llaman POST sin cuerpo', async () => {
    api.post.mockReturnValue(ok({ data: {} }))
    await docPlantillaService.aprobar(7)
    await docPlantillaService.inactivar(7)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/7/aprobar`)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/7/inactivar`)
  })

  it('activar envía fecha_inicio cuando se indica', async () => {
    api.post.mockReturnValue(ok({ data: {} }))
    await docPlantillaService.activar(7, '2026-01-01')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/7/activar`, { fecha_inicio: '2026-01-01' })
  })

  it('activar sin fecha envía cuerpo vacío (el backend usa hoy)', async () => {
    api.post.mockReturnValue(ok({ data: {} }))
    await docPlantillaService.activar(7)
    expect(api.post).toHaveBeenCalledWith(`${BASE}/7/activar`, {})
  })

  it('clonar envía el nombre del nuevo borrador', async () => {
    api.post.mockReturnValue(ok({ data: { id: 9 } }))
    const res = await docPlantillaService.clonar(7, { nombre: 'Contrato 2027' })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/7/clonar`, { nombre: 'Contrato 2027' })
    expect(res.data.id).toBe(9)
  })

  it('getBloques y syncBloques usan /{id}/bloques', async () => {
    api.get.mockReturnValue(ok({ data: [] }))
    api.put.mockReturnValue(ok({ data: {} }))
    const bloques = [{ bloque: 'estado_cartera', columnas: ['numero_cuota', 'saldo'], titulos: {}, mostrar_resumen: true }]
    await docPlantillaService.getBloques(7)
    await docPlantillaService.syncBloques(7, bloques)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/7/bloques`)
    expect(api.put).toHaveBeenCalledWith(`${BASE}/7/bloques`, { bloques })
  })

  it('previsualizar envía entidad_id solo cuando existe', async () => {
    api.post.mockReturnValue(ok({ data: { contenido: '<p>Juan</p>' } }))
    await docPlantillaService.previsualizar(7, 345)
    await docPlantillaService.previsualizar(7)
    expect(api.post).toHaveBeenNthCalledWith(1, `${BASE}/7/previsualizar`, { entidad_id: 345 })
    expect(api.post).toHaveBeenNthCalledWith(2, `${BASE}/7/previsualizar`, {})
  })

  it('papelera, delete y filters', async () => {
    api.get.mockReturnValue(ok({ data: [] }))
    api.post.mockReturnValue(ok({}))
    api.delete.mockReturnValue(ok({}))
    await docPlantillaService.delete(7)
    await docPlantillaService.getTrashed()
    await docPlantillaService.restore(7)
    await docPlantillaService.forceDelete(7)
    await docPlantillaService.getFilters()
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/7`)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`, { params: {} })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/7/restore`)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/7/force-delete`)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/filters`)
  })
})

// ─── docDocumentoService ──────────────────────────────────────────────────────

describe('docDocumentoService', () => {
  const BASE = '/academico/documentacion/documentos'

  it('getAll filtra por entidad para listar los documentos de un registro', async () => {
    api.get.mockReturnValue(ok(paginado([])))
    const params = { entidad_type: 'App\\Models\\Academico\\Matricula', entidad_id: 345 }
    await docDocumentoService.getAll(params)
    expect(api.get).toHaveBeenCalledWith(BASE, { params })
  })

  it('getById y getFilters', async () => {
    api.get.mockReturnValue(ok({ data: {} }))
    await docDocumentoService.getById(12)
    await docDocumentoService.getFilters()
    expect(api.get).toHaveBeenCalledWith(`${BASE}/12`)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/filters`)
  })

  it('generar envía tipo y entidad y retorna el documento emitido', async () => {
    api.post.mockReturnValue(ok({ data: { id: 12, numero_documento: 'CONT-2026-000001' } }))
    const res = await docDocumentoService.generar({ tipo_documento_id: 1, entidad_id: 345 })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/generar`, { tipo_documento_id: 1, entidad_id: 345 })
    expect(res.data.numero_documento).toBe('CONT-2026-000001')
  })

  it('descargarPdf pide blob y retorna la respuesta completa', async () => {
    const respuesta = { data: new Blob(['%PDF']), headers: {} }
    api.get.mockReturnValue(Promise.resolve(respuesta))
    const res = await docDocumentoService.descargarPdf(12)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/12/pdf`, { responseType: 'blob' })
    expect(res).toBe(respuesta)
  })

  it('anular envía el motivo', async () => {
    api.post.mockReturnValue(ok({ data: { status: 2 } }))
    await docDocumentoService.anular(12, 'Error en el valor')
    expect(api.post).toHaveBeenCalledWith(`${BASE}/12/anular`, { motivo: 'Error en el valor' })
  })

  it('papelera y delete', async () => {
    api.get.mockReturnValue(ok({ data: [] }))
    api.post.mockReturnValue(ok({}))
    api.delete.mockReturnValue(ok({}))
    await docDocumentoService.delete(12)
    await docDocumentoService.getTrashed({ per_page: 50 })
    await docDocumentoService.restore(12)
    await docDocumentoService.forceDelete(12)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/12`)
    expect(api.get).toHaveBeenCalledWith(`${BASE}/trashed`, { params: { per_page: 50 } })
    expect(api.post).toHaveBeenCalledWith(`${BASE}/12/restore`)
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/12/force-delete`)
  })

  it('propaga el 422 cuando no hay versión vigente', async () => {
    api.post.mockRejectedValue({ response: { status: 422, data: { message: 'No hay versión vigente' } } })
    await expect(docDocumentoService.generar({ tipo_documento_id: 1 })).rejects.toMatchObject({ response: { status: 422 } })
  })
})
