import { ref, computed } from 'vue'
import docPlantillaService      from '@/services/docPlantillaService.js'
import docTipoDocumentoService  from '@/services/docTipoDocumentoService.js'
import {
  esPlantillaEditable,
  extraerMarcadores,
  variablesNoHabilitadas,
  construirPayloadBloques,
} from '@/utils/documentacion.js'

/** El backend serializa un arreglo PHP vacío como `[]`; los títulos se manejan como objeto. */
const normalizarBloque = (bloque) => ({
  ...bloque,
  titulos: Array.isArray(bloque.titulos) ? {} : { ...(bloque.titulos ?? {}) },
})

/**
 * Estado y operaciones del editor de una versión de plantilla: carga el detalle
 * (con `contenido_html`), el catálogo de variables del tipo y el de bloques de
 * la versión; valida los marcadores antes de guardar y sincroniza la
 * configuración de columnas de cada bloque.
 *
 * Deja al componente como capa de presentación (editor, paneles y modales).
 */
export function usePlantillaEditor() {
  const plantilla    = ref(null)
  const variables    = ref([])
  const bloques      = ref([])
  const nombre       = ref('')
  const contenido    = ref('')
  const cargando     = ref(false)
  const guardando    = ref(false)
  const error        = ref('')
  const erroresForm  = ref({})

  // Valores con los que se cargó la versión, para detectar cambios sin guardar.
  const original = ref({ nombre: '', contenido: '' })

  const tipoDocumento = computed(() => plantilla.value?.tipo_documento ?? null)
  const editable      = computed(() => esPlantillaEditable(plantilla.value))
  const hayCambios    = computed(() =>
    nombre.value !== original.value.nombre || contenido.value !== original.value.contenido,
  )

  const clavesHabilitadas = computed(() => variables.value.filter((v) => v.habilitada).map((v) => v.clave))

  /** Variables usadas en el contenido que el backend rechazará con 422. */
  const variablesInvalidas = computed(() => variablesNoHabilitadas(contenido.value, clavesHabilitadas.value))

  /** Bloques usados en el contenido que no existen para la entidad del tipo. */
  const bloquesInvalidos = computed(() => {
    const disponibles = new Set(bloques.value.map((b) => b.clave))
    return extraerMarcadores(contenido.value).bloques.filter((clave) => !disponibles.has(clave))
  })

  /** Bloques del catálogo que efectivamente aparecen en el contenido. */
  const bloquesUsados = computed(() => {
    const usados = new Set(extraerMarcadores(contenido.value).bloques)
    return bloques.value.filter((b) => usados.has(b.clave))
  })

  function aplicarPlantilla(data) {
    plantilla.value = data
    nombre.value    = data?.nombre ?? ''
    contenido.value = data?.contenido_html ?? ''
    original.value  = { nombre: nombre.value, contenido: contenido.value }
  }

  async function cargarBloques(id) {
    const res = await docPlantillaService.getBloques(id)
    bloques.value = (res.data ?? []).map(normalizarBloque)
  }

  async function cargar(id) {
    cargando.value = true
    error.value    = ''
    try {
      const [resPlantilla] = await Promise.all([
        docPlantillaService.getById(id),
        cargarBloques(id),
      ])
      aplicarPlantilla(resPlantilla.data)
      const resVariables = await docTipoDocumentoService.getVariables(resPlantilla.data.tipo_documento_id)
      variables.value = resVariables.data ?? []
    } catch (e) {
      error.value = e?.response?.data?.message ?? 'No se pudo cargar la plantilla.'
    } finally {
      cargando.value = false
    }
  }

  /**
   * Guarda nombre y contenido. Falla localmente si hay marcadores inválidos,
   * con el mismo criterio que la validación del backend.
   *
   * @returns {Promise<boolean>} true si se guardó
   */
  async function guardar() {
    erroresForm.value = {}
    error.value = ''

    if (!nombre.value.trim()) {
      erroresForm.value = { nombre: ['El nombre de la versión es obligatorio.'] }
      return false
    }
    if (!contenido.value.trim()) {
      error.value = 'El contenido de la plantilla es obligatorio.'
      return false
    }
    if (variablesInvalidas.value.length || bloquesInvalidos.value.length) {
      error.value = 'El contenido usa variables o bloques no disponibles para este tipo de documento. Quítalos antes de guardar.'
      return false
    }

    guardando.value = true
    try {
      const res = await docPlantillaService.update(plantilla.value.id, {
        nombre:         nombre.value.trim(),
        contenido_html: contenido.value,
      })
      // El update no devuelve relaciones completas: se conserva el tipo ya cargado.
      aplicarPlantilla({ ...plantilla.value, ...res.data, contenido_html: contenido.value })
      return true
    } catch (e) {
      erroresForm.value = e?.response?.data?.errors ?? {}
      error.value = erroresForm.value.contenido_html?.[0]
        ?? e?.response?.data?.message
        ?? 'No se pudo guardar la plantilla.'
      return false
    } finally {
      guardando.value = false
    }
  }

  /**
   * Guarda la configuración de un bloque. Como el endpoint reemplaza toda la
   * configuración, se envían también los demás bloques ya configurados.
   * `configuracion: null` restablece el bloque (vuelve a imprimir todas sus columnas).
   *
   * @param {string} clave
   * @param {{ columnas_activas: string[], titulos: Object, mostrar_resumen: boolean }|null} configuracion
   */
  async function guardarBloque(clave, configuracion) {
    const actualizados = bloques.value.map((b) => {
      if (b.clave !== clave) return b
      return configuracion
        ? { ...b, ...configuracion, configurado: true }
        : { ...b, configurado: false }
    })
    await docPlantillaService.syncBloques(plantilla.value.id, construirPayloadBloques(actualizados))
    await cargarBloques(plantilla.value.id)
  }

  /** HTML con variables y bloques resueltos contra un registro real, sin emitir documento. */
  async function previsualizar(entidadId) {
    const res = await docPlantillaService.previsualizar(plantilla.value.id, entidadId)
    return res.data?.contenido ?? ''
  }

  return {
    plantilla,
    tipoDocumento,
    variables,
    bloques,
    nombre,
    contenido,
    cargando,
    guardando,
    error,
    erroresForm,
    editable,
    hayCambios,
    variablesInvalidas,
    bloquesInvalidos,
    bloquesUsados,
    cargar,
    guardar,
    guardarBloque,
    previsualizar,
  }
}
