import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePlantillaEditor } from '@/composables/usePlantillaEditor.js'

vi.mock('@/services/docPlantillaService.js', () => ({
  default: {
    getById:       vi.fn(),
    getBloques:    vi.fn(),
    update:        vi.fn(),
    syncBloques:   vi.fn(),
    previsualizar: vi.fn(),
  },
}))
vi.mock('@/services/docTipoDocumentoService.js', () => ({
  default: { getVariables: vi.fn() },
}))

import docPlantillaService     from '@/services/docPlantillaService.js'
import docTipoDocumentoService from '@/services/docTipoDocumentoService.js'

const PLANTILLA = {
  id: 7,
  tipo_documento_id: 1,
  tipo_documento: { id: 1, nombre: 'Contrato', entidad_type: 'App\\Models\\Academico\\Matricula' },
  nombre: 'Contrato 2026',
  version: 2,
  status: 1,
  contenido_html: '<p>{{ estudiante.name }}</p>',
}

const VARIABLES = [
  { clave: 'estudiante.name', label: 'Nombre', grupo: 'entidad', habilitada: true },
  { clave: 'monto_letras', label: 'Monto en letras', grupo: 'entidad', habilitada: false },
]

const COLUMNAS_CARTERA = [
  { clave: 'numero_cuota', label: 'Cuota' },
  { clave: 'saldo', label: 'Saldo' },
]

const BLOQUES = [
  { clave: 'estado_cartera', label: 'Estado de cartera', columnas: COLUMNAS_CARTERA, configurado: false, columnas_activas: ['numero_cuota', 'saldo'], titulos: [], mostrar_resumen: true },
  { clave: 'sabana_notas', label: 'Sábana de notas', columnas: [{ clave: 'modulo', label: 'Módulo' }], configurado: true, columnas_activas: ['modulo'], titulos: { modulo: 'Asignatura' }, mostrar_resumen: false },
]

async function editorCargado(plantilla = PLANTILLA) {
  docPlantillaService.getById.mockResolvedValue({ data: plantilla })
  docPlantillaService.getBloques.mockResolvedValue({ data: BLOQUES })
  docTipoDocumentoService.getVariables.mockResolvedValue({ data: VARIABLES })
  const editor = usePlantillaEditor()
  await editor.cargar(plantilla.id)
  return editor
}

beforeEach(() => vi.clearAllMocks())

describe('usePlantillaEditor — carga', () => {
  it('carga detalle, bloques y variables del tipo', async () => {
    const editor = await editorCargado()

    expect(docPlantillaService.getById).toHaveBeenCalledWith(7)
    expect(docPlantillaService.getBloques).toHaveBeenCalledWith(7)
    expect(docTipoDocumentoService.getVariables).toHaveBeenCalledWith(1)
    expect(editor.nombre.value).toBe('Contrato 2026')
    expect(editor.contenido.value).toBe('<p>{{ estudiante.name }}</p>')
    expect(editor.tipoDocumento.value.nombre).toBe('Contrato')
    expect(editor.editable.value).toBe(true)
    expect(editor.hayCambios.value).toBe(false)
    expect(editor.cargando.value).toBe(false)
  })

  it('normaliza los títulos que llegan como arreglo vacío', async () => {
    const editor = await editorCargado()
    expect(editor.bloques.value[0].titulos).toEqual({})
    expect(editor.bloques.value[1].titulos).toEqual({ modulo: 'Asignatura' })
  })

  it('una versión Activa no es editable', async () => {
    const editor = await editorCargado({ ...PLANTILLA, status: 3 })
    expect(editor.editable.value).toBe(false)
  })

  it('expone el error si falla la carga', async () => {
    docPlantillaService.getById.mockRejectedValue({ response: { data: { message: 'No encontrada' } } })
    docPlantillaService.getBloques.mockResolvedValue({ data: [] })
    const editor = usePlantillaEditor()
    await editor.cargar(99)
    expect(editor.error.value).toBe('No encontrada')
    expect(editor.plantilla.value).toBeNull()
  })
})

describe('usePlantillaEditor — validación de marcadores', () => {
  it('detecta variables no habilitadas y bloques inexistentes', async () => {
    const editor = await editorCargado()
    editor.contenido.value = '<p>{{ estudiante.name }} {{ monto_letras }}</p>{{ bloque.estado_cartera }}{{ bloque.inexistente }}'

    expect(editor.variablesInvalidas.value).toEqual(['monto_letras'])
    expect(editor.bloquesInvalidos.value).toEqual(['inexistente'])
    expect(editor.bloquesUsados.value.map((b) => b.clave)).toEqual(['estado_cartera'])
    expect(editor.hayCambios.value).toBe(true)
  })
})

describe('usePlantillaEditor — guardar', () => {
  it('guarda nombre y contenido y reinicia el estado de cambios', async () => {
    const editor = await editorCargado()
    editor.nombre.value = '  Contrato 2026 rev  '
    editor.contenido.value = '<p>Hola {{ estudiante.name }}</p>'
    docPlantillaService.update.mockResolvedValue({ data: { ...PLANTILLA, nombre: 'Contrato 2026 rev' } })

    expect(await editor.guardar()).toBe(true)
    expect(docPlantillaService.update).toHaveBeenCalledWith(7, {
      nombre: 'Contrato 2026 rev',
      contenido_html: '<p>Hola {{ estudiante.name }}</p>',
    })
    expect(editor.hayCambios.value).toBe(false)
  })

  it('no llama al API si hay marcadores inválidos', async () => {
    const editor = await editorCargado()
    editor.contenido.value = '<p>{{ monto_letras }}</p>'

    expect(await editor.guardar()).toBe(false)
    expect(docPlantillaService.update).not.toHaveBeenCalled()
    expect(editor.error.value).toMatch(/no disponibles/)
  })

  it('exige contenido (el backend rechaza el contenido vacío)', async () => {
    const editor = await editorCargado()
    editor.contenido.value = ''
    expect(await editor.guardar()).toBe(false)
    expect(docPlantillaService.update).not.toHaveBeenCalled()
    expect(editor.error.value).toMatch(/obligatorio/)
  })

  it('exige el nombre de la versión', async () => {
    const editor = await editorCargado()
    editor.nombre.value = '   '
    expect(await editor.guardar()).toBe(false)
    expect(editor.erroresForm.value.nombre).toBeTruthy()
  })

  it('muestra el error de contenido_html que devuelve el backend (422)', async () => {
    const editor = await editorCargado()
    editor.contenido.value = '<p>otro</p>'
    docPlantillaService.update.mockRejectedValue({
      response: { status: 422, data: { message: 'Datos inválidos', errors: { contenido_html: ['Variable no habilitada: x'] } } },
    })

    expect(await editor.guardar()).toBe(false)
    expect(editor.error.value).toBe('Variable no habilitada: x')
    expect(editor.guardando.value).toBe(false)
  })
})

describe('usePlantillaEditor — bloques y previsualización', () => {
  it('guardarBloque envía la configuración nueva junto con los bloques ya configurados', async () => {
    const editor = await editorCargado()
    docPlantillaService.syncBloques.mockResolvedValue({ data: {} })

    await editor.guardarBloque('estado_cartera', {
      columnas_activas: ['saldo'],
      titulos: { saldo: 'Pendiente' },
      mostrar_resumen: false,
    })

    expect(docPlantillaService.syncBloques).toHaveBeenCalledWith(7, [
      { bloque: 'estado_cartera', columnas: ['saldo'], titulos: { saldo: 'Pendiente' }, mostrar_resumen: false },
      { bloque: 'sabana_notas', columnas: ['modulo'], titulos: { modulo: 'Asignatura' }, mostrar_resumen: false },
    ])
    expect(docPlantillaService.getBloques).toHaveBeenCalledTimes(2)
  })

  it('restablecer un bloque lo excluye del payload', async () => {
    const editor = await editorCargado()
    docPlantillaService.syncBloques.mockResolvedValue({ data: {} })

    await editor.guardarBloque('sabana_notas', null)

    expect(docPlantillaService.syncBloques).toHaveBeenCalledWith(7, [])
  })

  it('previsualizar retorna el HTML resuelto', async () => {
    const editor = await editorCargado()
    docPlantillaService.previsualizar.mockResolvedValue({ data: { contenido: '<p>Juan Pérez</p>' } })

    expect(await editor.previsualizar(345)).toBe('<p>Juan Pérez</p>')
    expect(docPlantillaService.previsualizar).toHaveBeenCalledWith(7, 345)
  })
})
