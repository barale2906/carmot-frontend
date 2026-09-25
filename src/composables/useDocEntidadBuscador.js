import { ref, computed, watch } from 'vue'
import matriculaService         from '@/services/matriculaService.js'
import carteraService           from '@/services/carteraService.js'
import userService              from '@/services/userService.js'
import cursoService             from '@/services/cursoService.js'
import { nombreCompleto }       from '@/utils/formatters.js'
import { entidadClaseCorta }    from '@/utils/documentacion.js'

const MIN_CARACTERES = 2
const DEBOUNCE_MS    = 350
const POR_PAGINA     = 10

const formatoMoneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })

const opcionMatricula = (m) => ({
  id:      m.id,
  titulo:  m.estudiante?.name || nombreCompleto(m.estudiante) || `Matrícula #${m.id}`,
  detalle: [m.curso?.nombre, m.fecha_matricula && `Matriculado el ${m.fecha_matricula}`].filter(Boolean).join(' · '),
})

async function buscarMatriculas(termino) {
  const res = await matriculaService.getAll({ search: termino, per_page: POR_PAGINA })
  return (res.data ?? []).map(opcionMatricula)
}

/**
 * Adaptadores de búsqueda por entidad de origen, indexados por el nombre corto
 * de la clase que devuelve `GET /tipos-documento/filters`. Si el backend
 * registra una entidad nueva sin adaptador, el selector pide el ID manualmente.
 *
 * `hijos` convierte la búsqueda en dos pasos: primero se elige el padre
 * (p. ej. la matrícula) y luego el registro final (la cuota).
 */
export const ADAPTADORES_ENTIDAD = {
  Matricula: {
    placeholder: 'Nombre del estudiante o curso...',
    buscar: buscarMatriculas,
  },
  Cartera: {
    placeholder: 'Busca la matrícula por estudiante o curso...',
    buscar: buscarMatriculas,
    ayudaHijos: 'Cuotas pendientes de la matrícula seleccionada',
    async hijos(matricula) {
      const res = await carteraService.getDetalleMatricula({ matricula_id: matricula.id })
      const cuotas = [...(res.data?.vencidas ?? []), ...(res.data?.proximas ?? [])]
      return cuotas.map((c) => ({
        id:      c.id,
        titulo:  c.numero_cuota === 0 ? 'Cuota de matrícula' : `Cuota ${c.numero_cuota}`,
        detalle: [
          c.fecha_vencimiento && `Vence ${c.fecha_vencimiento}`,
          c.saldo != null && `Saldo ${formatoMoneda.format(c.saldo)}`,
          c.status_text,
        ].filter(Boolean).join(' · '),
      }))
    },
  },
  User: {
    placeholder: 'Nombre o documento del estudiante...',
    async buscar(termino) {
      const res = await userService.getAll({ search: termino, per_page: POR_PAGINA })
      return (res.data ?? []).map((u) => ({
        id:      u.id,
        titulo:  nombreCompleto(u) || `Usuario #${u.id}`,
        detalle: u.documento ?? u.email ?? '',
      }))
    },
  },
  Curso: {
    placeholder: 'Nombre del curso...',
    async buscar(termino) {
      const res = await cursoService.getAll({ search: termino, per_page: POR_PAGINA })
      return (res.data ?? []).map((c) => ({ id: c.id, titulo: c.nombre, detalle: c.status_text ?? '' }))
    },
  },
}

/**
 * Búsqueda del registro asociado a un documento (el `entidad_id` que exigen
 * imprimir y previsualizar), según la entidad del tipo de documento.
 *
 * @param {import('vue').Ref<string|null>} entidadType - Clase completa de la entidad del tipo
 */
export function useDocEntidadBuscador(entidadType) {
  const termino      = ref('')
  const resultados   = ref([])
  const buscando     = ref(false)
  const error        = ref('')
  const padre        = ref(null)
  const seleccionado = ref(null)

  const adaptador  = computed(() => ADAPTADORES_ENTIDAD[entidadClaseCorta(entidadType.value)] ?? null)
  const soportado  = computed(() => !!adaptador.value)
  const enDosPasos = computed(() => typeof adaptador.value?.hijos === 'function')

  let timer = null
  let consultaActual = 0

  /** Ejecuta una consulta descartando las respuestas que lleguen desfasadas. */
  async function consultar(fn) {
    const id = ++consultaActual
    buscando.value = true
    error.value    = ''
    try {
      const items = await fn()
      if (id === consultaActual) resultados.value = items
    } catch (e) {
      if (id === consultaActual) {
        resultados.value = []
        error.value = e?.response?.data?.message ?? 'No se pudo completar la búsqueda.'
      }
    } finally {
      if (id === consultaActual) buscando.value = false
    }
  }

  function buscar() {
    clearTimeout(timer)
    const texto = termino.value.trim()
    if (!adaptador.value || texto.length < MIN_CARACTERES) {
      consultaActual++
      resultados.value = []
      buscando.value = false
      return
    }
    buscando.value = true
    timer = setTimeout(() => consultar(() => adaptador.value.buscar(texto)), DEBOUNCE_MS)
  }

  /** Elige un resultado: en entidades de dos pasos, el primero fija el padre y carga sus hijos. */
  async function elegir(item) {
    if (enDosPasos.value && !padre.value) {
      padre.value = item
      await consultar(() => adaptador.value.hijos(item))
      return
    }
    seleccionado.value = item
    resultados.value = []
  }

  function reiniciar() {
    clearTimeout(timer)
    consultaActual++
    termino.value      = ''
    resultados.value   = []
    buscando.value     = false
    error.value        = ''
    padre.value        = null
    seleccionado.value = null
  }

  watch(termino, buscar)
  watch(entidadType, reiniciar)

  return {
    termino,
    resultados,
    buscando,
    error,
    padre,
    seleccionado,
    adaptador,
    soportado,
    enDosPasos,
    buscar,
    elegir,
    reiniciar,
    minCaracteres: MIN_CARACTERES,
  }
}
