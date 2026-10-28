<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros -->
    <section aria-labelledby="filtros-asistencia-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-asistencia-heading" class="sr-only">Filtros del listado</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormSelect v-model="filtros.sede_id" label="Sede:" placeholder="Todas" :options="opcionesSede" clearable @change="onSedeChange" />
        <FormSelect v-model="filtros.curso_id" label="Curso:" placeholder="Todos" :options="opcionesCurso" clearable @change="cargar(1)" />
        <FormSelect v-model="filtros.grupo_id" label="Grupo:" placeholder="Todos" :options="opcionesGrupo" clearable @change="cargar(1)" />
        <FormInputSearch
          v-model="filtros.estudiante"
          label="Estudiante:"
          placeholder="Nombre o documento..."
          @input="onBusquedaInput"
        />
        <FormInput
          v-model="filtros.fecha"
          type="date"
          label="Día de clase:"
          help="Con un día se ignora el rango de fechas."
          @change="cargar(1)"
        />
        <FormInput v-model="filtros.fecha_desde" type="date" label="Clases desde:" :disabled="!!filtros.fecha" @change="cargar(1)" />
        <FormInput v-model="filtros.fecha_hasta" type="date" label="Hasta:" :disabled="!!filtros.fecha" @change="cargar(1)" />
        <FormSelect v-model="filtros.estado" label="Estado:" placeholder="Todos" :options="opcionesEstado" clearable @change="cargar(1)" />
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          :disabled="descargando || !pagination.total"
          :title="pagination.total ? 'Descarga las asistencias con los filtros aplicados' : 'No hay asistencias para descargar'"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          @click="descargarExcel"
        >
          <NavIcon name="download" class="size-4" />
          {{ descargando ? 'Generando...' : 'Descargar Excel' }}
        </button>
        <button
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </button>
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-asistencia-heading">
      <h2 id="listado-asistencia-heading" class="sr-only">Asistencias</h2>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div v-else-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-500">
        Cargando asistencias...
      </div>
      <div v-else-if="!asistencias.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay asistencias con los filtros aplicados.
      </div>
      <DataTable v-else :columns="columnas" :data="asistencias" row-key="id" aria-label="Listado de asistencias">
        <template #cell="{ column, row }">
          <template v-if="column.key === 'fecha'">
            {{ formatFechaCorta(row.clase_programada?.fecha_clase) }}
            <span class="block text-xs text-slate-500">{{ horasClase(row.clase_programada) }}</span>
          </template>
          <template v-else-if="column.key === 'estudiante'">
            <span class="font-medium text-slate-900">{{ row.estudiante?.name }}</span>
            <span class="block text-xs text-slate-500">{{ row.estudiante?.documento ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'grupo'">
            {{ row.grupo?.nombre ?? '—' }}
            <span class="block text-xs text-slate-500">{{ [row.curso?.nombre, row.grupo?.sede?.nombre].filter(Boolean).join(' · ') }}</span>
          </template>
          <template v-else-if="column.key === 'estado'">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="claseEstado(row.estado)">{{ row.estado_text }}</span>
            <span
              v-if="row.justificada"
              class="ml-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800"
              :title="row.justificacion ?? undefined"
            >
              Justificada
            </span>
            <span v-if="row.justificada && row.justificacion" class="mt-0.5 block max-w-[240px] truncate text-xs text-slate-500">{{ row.justificacion }}</span>
          </template>
          <template v-else-if="column.key === 'mora'">
            <span v-if="row.en_mora" class="inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              En mora · $ {{ formatMoney(row.saldo_vencido) }}
            </span>
            <span v-else class="text-xs text-slate-500">Al día</span>
          </template>
          <template v-else-if="column.key === 'observaciones'">
            {{ row.observaciones || '—' }}
          </template>
        </template>
      </DataTable>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} asistencias
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="cargar(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="cargar(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import asistenciaService from '@/services/asistenciaService.js'
import FormSelect      from '@/components/forms/FormSelect.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import { useNotification } from '@/composables/useNotification'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import { formatMoney } from '@/utils/formatters.js'
import { formatFechaCorta } from '@/utils/calendario.js'
import { fechaISO } from '@/utils/crm.js'
import { ESTADOS_ASISTENCIA, paramsListado } from '@/utils/asistencia.js'

const { error: notifyError } = useNotification()

const FILTROS_VACIOS = { sede_id: '', curso_id: '', grupo_id: '', estudiante: '', fecha: '', fecha_desde: '', fecha_hasta: '', estado: '' }

const filtros    = reactive({ ...FILTROS_VACIOS })
const opciones   = reactive({ sedes: [], cursos: [], grupos: [] })
const asistencias = ref([])
const cargando   = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

const columnas = [
  { key: 'fecha',         label: 'Clase' },
  { key: 'estudiante',    label: 'Estudiante' },
  { key: 'grupo',         label: 'Grupo' },
  { key: 'estado',        label: 'Asistencia' },
  { key: 'mora',          label: 'Cartera' },
  { key: 'observaciones', label: 'Observaciones' }
]

const opcionesSede   = computed(() => opciones.sedes.map(s => ({ value: s.id, label: s.nombre })))
const opcionesCurso  = computed(() => opciones.cursos.map(c => ({ value: c.id, label: c.nombre })))
// Los grupos se acotan a la sede elegida
const opcionesGrupo  = computed(() => opciones.grupos
  .filter(g => !filtros.sede_id || String(g.sede_id) === String(filtros.sede_id))
  .map(g => ({ value: g.id, label: [g.nombre, g.modulo].filter(Boolean).join(' · ') })))
const opcionesEstado = ESTADOS_ASISTENCIA.map(e => ({ value: e.value, label: e.label }))

function claseEstado(estado) {
  return ESTADOS_ASISTENCIA.find(e => e.value === estado)?.claseBadge ?? 'bg-slate-100 text-slate-700'
}

function horasClase(clase) {
  return clase ? `${String(clase.hora_inicio).slice(0, 5)}–${String(clase.hora_fin).slice(0, 5)}` : ''
}

async function cargar(pagina = 1) {
  cargando.value = true
  error.value    = ''
  try {
    const res = await asistenciaService.listar({ ...paramsListado(filtros), page: pagina, per_page: 25 })
    asistencias.value = res.data ?? []
    pagination.currentPage = res.meta.current_page
    pagination.lastPage    = res.meta.last_page
    pagination.total       = res.meta.total
    pagination.from        = res.meta.from ?? 0
    pagination.to          = res.meta.to ?? 0
  } catch (e) {
    const errores = e?.response?.data?.errors
    error.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo cargar el listado de asistencias.')
  } finally {
    cargando.value = false
  }
}

function onSedeChange() {
  if (filtros.grupo_id && !opcionesGrupo.value.some(g => String(g.value) === String(filtros.grupo_id))) {
    filtros.grupo_id = ''
  }
  cargar(1)
}

let busquedaTimer = null
function onBusquedaInput() {
  clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(() => cargar(1), 400)
}

function limpiarFiltros() {
  Object.assign(filtros, FILTROS_VACIOS)
  cargar(1)
}

const descargando = ref(false)

async function descargarExcel() {
  descargando.value = true
  try {
    const blob = await asistenciaService.exportarExcel(paramsListado(filtros))
    descargarBlob(blob, `asistencias-${fechaISO()}.xlsx`)
  } catch (e) {
    notifyError(await mensajeErrorBlob(e, 'No se pudo descargar el Excel de asistencias.'))
  } finally {
    descargando.value = false
  }
}

onMounted(async () => {
  try {
    const res = await asistenciaService.getFiltros()
    Object.assign(opciones, { sedes: res.data?.sedes ?? [], cursos: res.data?.cursos ?? [], grupos: res.data?.grupos ?? [] })
  } catch {
    // Sin opciones se puede seguir filtrando por estudiante y fechas
  }
  cargar(1)
})
</script>
