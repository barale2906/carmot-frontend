import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  PLANTILLA_STATUS,
  DOCUMENTO_ORIGEN,
  plantillaStatusText,
  plantillaStatusClass,
  documentoOrigenClass,
  esPlantillaEditable,
  etiquetaCampoFecha,
  entidadClaseCorta,
  extraerMarcadores,
  variablesNoHabilitadas,
  agruparVariablesHabilitadas,
  prepararContenidoEditor,
  limpiarContenidoEditor,
  moverElemento,
  construirPayloadBloques,
  nombreArchivoDocumento,
  fechaHoraLocal,
  checklistEscaneados,
  DESCRIPCION_HOJA_MATRICULA,
} from '@/utils/documentacion.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'

describe('estados', () => {
  it('textos de estado de plantilla', () => {
    expect(plantillaStatusText(PLANTILLA_STATUS.EN_PROCESO)).toBe('En Proceso')
    expect(plantillaStatusText(PLANTILLA_STATUS.ACTIVA)).toBe('Activa')
    expect(plantillaStatusText(99)).toBe('—')
  })

  it('clases de estado con fallback', () => {
    expect(plantillaStatusClass(PLANTILLA_STATUS.ACTIVA)).toContain('green')
    expect(plantillaStatusClass(99)).toContain('slate')
    expect(documentoOrigenClass(DOCUMENTO_ORIGEN.GENERADO)).toContain('blue')
    expect(documentoOrigenClass(DOCUMENTO_ORIGEN.SUBIDO)).toContain('purple')
    expect(documentoOrigenClass(99)).toContain('slate')
  })

  it('solo En Proceso es editable', () => {
    expect(esPlantillaEditable({ status: PLANTILLA_STATUS.EN_PROCESO })).toBe(true)
    expect(esPlantillaEditable({ status: PLANTILLA_STATUS.APROBADA })).toBe(false)
    expect(esPlantillaEditable({ status: PLANTILLA_STATUS.ACTIVA })).toBe(false)
    expect(esPlantillaEditable(null)).toBe(false)
  })
})

describe('etiquetaCampoFecha / entidadClaseCorta', () => {
  it('usa etiquetas conocidas y humaniza el resto', () => {
    expect(etiquetaCampoFecha('fecha_matricula')).toBe('Fecha de matrícula')
    expect(etiquetaCampoFecha('fecha_grado')).toBe('Fecha grado')
    expect(etiquetaCampoFecha(null)).toBe('')
  })

  it('extrae el nombre corto de la clase', () => {
    expect(entidadClaseCorta('App\\Models\\Academico\\Matricula')).toBe('Matricula')
    expect(entidadClaseCorta(null)).toBe('')
  })
})

describe('extraerMarcadores', () => {
  it('separa variables y bloques sin duplicados, con o sin espacios', () => {
    const html = '<p>{{ estudiante.name }} y {{estudiante.name}}</p>{{ bloque.estado_cartera }}<p>{{ documento.fecha_larga }}</p>'
    expect(extraerMarcadores(html)).toEqual({
      variables: ['estudiante.name', 'documento.fecha_larga'],
      bloques: ['estado_cartera'],
    })
  })

  it('contenido vacío o nulo', () => {
    expect(extraerMarcadores('')).toEqual({ variables: [], bloques: [] })
    expect(extraerMarcadores(null)).toEqual({ variables: [], bloques: [] })
  })
})

describe('variablesNoHabilitadas', () => {
  it('devuelve las variables usadas que no están habilitadas (ignora bloques)', () => {
    const html = '<p>{{ estudiante.name }} {{ monto_letras }}</p>{{ bloque.sabana_notas }}'
    expect(variablesNoHabilitadas(html, ['estudiante.name'])).toEqual(['monto_letras'])
    expect(variablesNoHabilitadas(html, ['estudiante.name', 'monto_letras'])).toEqual([])
  })
})

describe('agruparVariablesHabilitadas', () => {
  it('filtra habilitadas y separa por grupo', () => {
    const catalogo = [
      { clave: 'a', label: 'A', grupo: 'entidad', habilitada: true },
      { clave: 'b', label: 'B', grupo: 'entidad', habilitada: false },
      { clave: 'c', label: 'C', grupo: 'global', habilitada: true },
    ]
    const { entidad, global } = agruparVariablesHabilitadas(catalogo)
    expect(entidad.map((v) => v.clave)).toEqual(['a'])
    expect(global.map((v) => v.clave)).toEqual(['c'])
  })
})

describe('prepararContenidoEditor / limpiarContenidoEditor', () => {
  it('convierte variables en spans y bloques solos en su párrafo en divs', () => {
    const html = '<p>Yo, {{ estudiante.name }}</p><p>{{ bloque.estado_cartera }}</p>'
    expect(prepararContenidoEditor(html)).toBe(
      '<p>Yo, <span data-variable="estudiante.name"></span></p><div data-bloque="estado_cartera"></div>',
    )
  })

  it('convierte bloques sueltos (fuera de párrafo) en divs', () => {
    expect(prepararContenidoEditor('<p>a</p>{{ bloque.recibos_pago }}')).toBe('<p>a</p><div data-bloque="recibos_pago"></div>')
  })

  it('limpia las envolturas del editor dejando marcadores planos', () => {
    const html = '<p>Yo, <span data-variable="estudiante.name">{{ estudiante.name }}</span></p><div data-bloque="estado_cartera">{{ bloque.estado_cartera }}</div>'
    expect(limpiarContenidoEditor(html)).toBe('<p>Yo, {{ estudiante.name }}</p>{{ bloque.estado_cartera }}')
  })

  it('el ida y vuelta conserva los marcadores', () => {
    const original = '<p>Yo, {{ estudiante.name }}, pago {{ monto_letras }}</p>{{ bloque.sabana_notas }}'
    expect(limpiarContenidoEditor(prepararContenidoEditor(original))).toBe(original)
  })

  it('no duplica envolturas si el HTML ya viene envuelto', () => {
    const envuelto = '<p><span data-variable="x">{{ x }}</span></p>'
    expect(prepararContenidoEditor(envuelto)).toBe('<p><span data-variable="x"></span></p>')
  })

  it('un editor vacío se guarda como cadena vacía', () => {
    expect(limpiarContenidoEditor('<p></p>')).toBe('')
    expect(limpiarContenidoEditor('')).toBe('')
    expect(prepararContenidoEditor(null)).toBe('')
  })
})

describe('moverElemento', () => {
  it('mueve sin mutar el original', () => {
    const lista = ['a', 'b', 'c']
    expect(moverElemento(lista, 0, 2)).toEqual(['b', 'c', 'a'])
    expect(lista).toEqual(['a', 'b', 'c'])
  })

  it('ignora destinos fuera de rango', () => {
    expect(moverElemento(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
    expect(moverElemento(['a', 'b'], 1, 2)).toEqual(['a', 'b'])
  })
})

describe('construirPayloadBloques', () => {
  const columnas = [
    { clave: 'numero_cuota', label: 'Cuota' },
    { clave: 'valor', label: 'Valor' },
    { clave: 'saldo', label: 'Saldo' },
  ]

  it('envía solo bloques configurados, en el orden de columnas elegido', () => {
    const payload = construirPayloadBloques([
      { clave: 'estado_cartera', columnas, configurado: true, columnas_activas: ['saldo', 'numero_cuota'], titulos: {}, mostrar_resumen: false },
      { clave: 'recibos_pago', columnas: [], configurado: false, columnas_activas: [], titulos: {}, mostrar_resumen: true },
    ])
    expect(payload).toEqual([
      { bloque: 'estado_cartera', columnas: ['saldo', 'numero_cuota'], titulos: {}, mostrar_resumen: false },
    ])
  })

  it('descarta títulos vacíos, iguales al label o de columnas inactivas', () => {
    const [bloque] = construirPayloadBloques([{
      clave: 'estado_cartera',
      columnas,
      configurado: true,
      columnas_activas: ['numero_cuota', 'saldo'],
      titulos: { numero_cuota: 'Cuota', saldo: ' Pendiente ', valor: 'Valor total' },
      mostrar_resumen: true,
    }])
    expect(bloque.titulos).toEqual({ saldo: 'Pendiente' })
  })
})

describe('nombreArchivoDocumento / fechaHoraLocal', () => {
  it('arma CODIGO-{id del registro}.pdf como el backend', () => {
    expect(nombreArchivoDocumento('CONTRATO', 345)).toBe('CONTRATO-345.pdf')
    expect(nombreArchivoDocumento('CARTA')).toBe('CARTA.pdf')
    expect(nombreArchivoDocumento(undefined, 12)).toBe('documento-12.pdf')
  })

  it('convierte UTC a hora de Colombia (no adelanta el día)', () => {
    // 02:00 UTC del 25 = 21:00 del 24 en Bogotá
    expect(fechaHoraLocal('2026-09-25T02:00:00.000000Z')).toContain('24')
    expect(fechaHoraLocal(null)).toBe('—')
  })
})

describe('descargas', () => {
  afterEach(() => vi.restoreAllMocks())

  it('descargarBlob crea el enlace con el nombre indicado', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    descargarBlob(new Blob(['%PDF']), 'CONT-1.pdf')
    expect(click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })

  it('mensajeErrorBlob lee el JSON envuelto en un Blob', async () => {
    const error = { response: { data: new Blob([JSON.stringify({ message: 'Documento subido' })]) } }
    expect(await mensajeErrorBlob(error, 'fallback')).toBe('Documento subido')
  })

  it('mensajeErrorBlob usa el fallback si no hay mensaje legible', async () => {
    expect(await mensajeErrorBlob({ response: { data: new Blob(['no-json']) } }, 'fallback')).toBe('fallback')
    expect(await mensajeErrorBlob({}, 'fallback')).toBe('fallback')
  })
})

describe('checklistEscaneados', () => {
  const documentos = [
    { tipo_documento_id: 1, tipo_documento: 'Contrato' },
    { tipo_documento_id: 2, tipo_documento: 'Pagaré' },
  ]

  it('lista la hoja de matrícula y cada documento generado, todos pendientes', () => {
    const filas = checklistEscaneados(documentos, [])

    expect(filas.map(f => f.nombre)).toEqual(['Hoja de matrícula', 'Contrato', 'Pagaré'])
    expect(filas.every(f => f.escaneado === null && !f.otro)).toBe(true)
    expect(filas[0]).toMatchObject({ tipo_documento_id: null, descripcion: DESCRIPCION_HOJA_MATRICULA })
    expect(filas[1]).toMatchObject({ tipo_documento_id: 1, descripcion: null })
  })

  it('asocia cada escaneado a su documento por tipo o, la hoja, por descripción', () => {
    const contrato = { id: 10, tipo_documento_id: 1 }
    const hoja     = { id: 11, tipo_documento_id: null, descripcion: 'Hoja de matrícula' }

    const filas = checklistEscaneados(documentos, [contrato, hoja])

    expect(filas[0].escaneado).toBe(hoja)
    expect(filas[1].escaneado).toBe(contrato)
    expect(filas[2].escaneado).toBeNull()
  })

  it('agrega al final los escaneados sueltos y los de tipos que no se generaron', () => {
    const otro     = { id: 12, tipo_documento_id: null, descripcion: 'Autorización de datos', nombre_documento: 'Autorización de datos' }
    const huerfano = { id: 13, tipo_documento_id: 9, nombre_documento: 'Carta antigua' }

    const filas = checklistEscaneados(documentos, [otro, huerfano])

    expect(filas).toHaveLength(5)
    expect(filas.slice(3).map(f => [f.nombre, f.otro])).toEqual([['Autorización de datos', true], ['Carta antigua', true]])
    expect(filas[3]).toMatchObject({ tipo_documento_id: null, descripcion: 'Autorización de datos' })
    expect(filas[4]).toMatchObject({ tipo_documento_id: 9, descripcion: null })
  })
})
