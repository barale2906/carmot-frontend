/**
 * Reglas puras del módulo de Documentación: estados, marcadores `{{ clave }}`
 * y la conversión del HTML entre el formato del backend y el del editor.
 */

export const PLANTILLA_STATUS = Object.freeze({
  INACTIVA:   0,
  EN_PROCESO: 1,
  APROBADA:   2,
  ACTIVA:     3,
})

export const DOCUMENTO_STATUS = Object.freeze({
  VIGENTE: 1,
  ANULADO: 2,
})

export const PREFIJO_BLOQUE = 'bloque.'

// Mismo patrón que usa el backend (DocVariableResolverService::PATRON_VARIABLE).
const PATRON_MARCADOR = /\{\{\s*([A-Za-z0-9_.]+)\s*\}\}/g

const PLANTILLA_STATUS_TEXT = {
  [PLANTILLA_STATUS.INACTIVA]:   'Inactiva',
  [PLANTILLA_STATUS.EN_PROCESO]: 'En Proceso',
  [PLANTILLA_STATUS.APROBADA]:   'Aprobada',
  [PLANTILLA_STATUS.ACTIVA]:     'Activa',
}

const PLANTILLA_STATUS_CLASS = {
  [PLANTILLA_STATUS.INACTIVA]:   'bg-slate-100 text-slate-600',
  [PLANTILLA_STATUS.EN_PROCESO]: 'bg-blue-50 text-blue-700',
  [PLANTILLA_STATUS.APROBADA]:   'bg-amber-50 text-amber-700',
  [PLANTILLA_STATUS.ACTIVA]:     'bg-green-50 text-green-700',
}

const DOCUMENTO_STATUS_CLASS = {
  [DOCUMENTO_STATUS.VIGENTE]: 'bg-green-50 text-green-700',
  [DOCUMENTO_STATUS.ANULADO]: 'bg-red-50 text-red-700',
}

const CAMPOS_FECHA_LABEL = {
  fecha_matricula:   'Fecha de matrícula',
  fecha_inicio:      'Fecha de inicio',
  fecha_vencimiento: 'Fecha de vencimiento',
  created_at:        'Fecha de creación del registro',
}

export function plantillaStatusText(status) {
  return PLANTILLA_STATUS_TEXT[status] ?? '—'
}

export function plantillaStatusClass(status) {
  return PLANTILLA_STATUS_CLASS[status] ?? PLANTILLA_STATUS_CLASS[PLANTILLA_STATUS.INACTIVA]
}

export function documentoStatusClass(status) {
  return DOCUMENTO_STATUS_CLASS[status] ?? 'bg-slate-100 text-slate-600'
}

/** Solo las versiones En Proceso admiten cambios de contenido o de bloques. */
export function esPlantillaEditable(plantilla) {
  return plantilla?.status === PLANTILLA_STATUS.EN_PROCESO
}

/** Etiqueta legible de un campo de fecha de referencia (`fecha_matricula` → "Fecha de matrícula"). */
export function etiquetaCampoFecha(campo) {
  if (!campo) return ''
  if (CAMPOS_FECHA_LABEL[campo]) return CAMPOS_FECHA_LABEL[campo]
  const texto = campo.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Nombre corto de la clase de la entidad (`App\\Models\\Academico\\Matricula` → `Matricula`). */
export function entidadClaseCorta(entidadType) {
  if (!entidadType) return ''
  return entidadType.split('\\').pop()
}

/**
 * Claves únicas usadas en el contenido, separadas en variables y bloques
 * (los bloques se devuelven sin el prefijo `bloque.`).
 *
 * @param {string} html
 * @returns {{ variables: string[], bloques: string[] }}
 */
export function extraerMarcadores(html = '') {
  const variables = new Set()
  const bloques = new Set()
  for (const [, clave] of (html ?? '').matchAll(PATRON_MARCADOR)) {
    if (clave.startsWith(PREFIJO_BLOQUE)) bloques.add(clave.slice(PREFIJO_BLOQUE.length))
    else variables.add(clave)
  }
  return { variables: [...variables], bloques: [...bloques] }
}

/**
 * Variables del contenido que no están habilitadas para el tipo. El backend
 * responde 422 al guardar/aprobar si hay alguna; se valida antes para avisar.
 *
 * @param {string} html
 * @param {string[]} clavesHabilitadas
 */
export function variablesNoHabilitadas(html, clavesHabilitadas = []) {
  const habilitadas = new Set(clavesHabilitadas)
  return extraerMarcadores(html).variables.filter((clave) => !habilitadas.has(clave))
}

/**
 * Agrupa las variables habilitadas del catálogo para el selector del editor.
 *
 * @param {Array<{ clave: string, label: string, grupo: string, habilitada: boolean }>} catalogo
 */
export function agruparVariablesHabilitadas(catalogo = []) {
  const habilitadas = catalogo.filter((v) => v.habilitada)
  return {
    entidad: habilitadas.filter((v) => v.grupo !== 'global'),
    global:  habilitadas.filter((v) => v.grupo === 'global'),
  }
}

/**
 * Convierte el HTML guardado (marcadores en texto plano) al formato que
 * entiende el editor: `<span data-variable>` para variables en línea y
 * `<div data-bloque>` para las tablas de consulta.
 *
 * @param {string} html
 * @returns {string}
 */
export function prepararContenidoEditor(html = '') {
  if (!html) return ''
  return limpiarContenidoEditor(html)
    // Un bloque solo en su párrafo se convierte en el nodo de bloque, sin el <p> envolvente.
    .replace(/<p[^>]*>\s*\{\{\s*bloque\.([A-Za-z0-9_]+)\s*\}\}\s*<\/p>/g, (_, clave) => `<div data-bloque="${clave}"></div>`)
    .replace(PATRON_MARCADOR, (_, clave) => (
      clave.startsWith(PREFIJO_BLOQUE)
        ? `<div data-bloque="${clave.slice(PREFIJO_BLOQUE.length)}"></div>`
        : `<span data-variable="${clave}"></span>`
    ))
}

/**
 * Convierte el HTML del editor al formato que guarda el backend: quita las
 * envolturas de los nodos y deja los marcadores `{{ clave }}` como texto plano.
 * Un editor vacío (`<p></p>`) se normaliza a cadena vacía.
 *
 * @param {string} html
 * @returns {string}
 */
export function limpiarContenidoEditor(html = '') {
  if (!html) return ''
  const limpio = html
    .replace(/<div[^>]*data-bloque="([^"]+)"[^>]*>[\s\S]*?<\/div>/g, (_, clave) => `{{ ${PREFIJO_BLOQUE}${clave} }}`)
    .replace(/<span[^>]*data-variable="([^"]+)"[^>]*>[\s\S]*?<\/span>/g, (_, clave) => `{{ ${clave} }}`)
  return /^(<p>\s*<\/p>)*$/.test(limpio.trim()) ? '' : limpio
}

/** Mueve un elemento de un arreglo sin mutarlo (reordenar columnas de un bloque). */
export function moverElemento(lista, desde, hacia) {
  if (hacia < 0 || hacia >= lista.length || desde === hacia) return [...lista]
  const copia = [...lista]
  const [item] = copia.splice(desde, 1)
  copia.splice(hacia, 0, item)
  return copia
}

/**
 * Payload de `PUT /plantillas/{id}/bloques` a partir de la configuración editada.
 * Solo se envían los bloques configurados (los demás imprimen todas sus columnas)
 * y los títulos que realmente cambian respecto al label por defecto.
 *
 * @param {Array<{ clave: string, columnas: Array<{ clave: string, label: string }>, configurado: boolean,
 *                 columnas_activas: string[], titulos: Object, mostrar_resumen: boolean }>} bloques
 */
export function construirPayloadBloques(bloques = []) {
  return bloques
    .filter((b) => b.configurado)
    .map((b) => {
      const labels = Object.fromEntries((b.columnas ?? []).map((c) => [c.clave, c.label]))
      const titulos = Object.fromEntries(
        Object.entries(b.titulos ?? {})
          .map(([clave, titulo]) => [clave, (titulo ?? '').trim()])
          .filter(([clave, titulo]) => titulo && titulo !== labels[clave] && b.columnas_activas.includes(clave)),
      )
      return {
        bloque:          b.clave,
        columnas:        [...b.columnas_activas],
        titulos,
        mostrar_resumen: !!b.mostrar_resumen,
      }
    })
}

/** Nombre del archivo PDF de un documento emitido. */
export function nombreArchivoDocumento(documento) {
  return `${documento?.numero_documento ?? `documento-${documento?.id ?? ''}`}.pdf`
}

/**
 * Fecha y hora en hora de Colombia. `created_at` llega en UTC desde Laravel,
 * por eso no se corta el ISO (daría el día siguiente después de las 7 p. m.).
 *
 * @param {string|null} iso
 */
export function fechaHoraLocal(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
