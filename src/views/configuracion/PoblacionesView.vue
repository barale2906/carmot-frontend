<template>
  <div class="flex flex-col gap-6">

    <!-- Aviso informativo -->
    <div class="flex items-start gap-3 rounded-[14px] border border-amber-200 bg-amber-50 p-4">
      <NavIcon name="pendientes" class="mt-0.5 size-4 shrink-0 text-amber-600" />
      <p class="text-sm text-amber-800">
        Este catálogo es de <strong>solo lectura</strong>. Los municipios son precargados desde un CSV oficial.
        Desde aquí puedes <strong>activar o desactivar</strong> poblaciones para controlar su disponibilidad
        en otros módulos del sistema. Solo los municipios <strong>activos</strong> aparecen en selectores
        y formularios.
      </p>
    </div>

    <!-- Estadísticas -->
    <section aria-labelledby="stats-poblaciones-heading">
      <h2 id="stats-poblaciones-heading" class="sr-only">Resumen de poblaciones</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total municipios"
            :value="stats.totales?.total ?? '—'"
            description="Registrados en el catálogo"
            icon="location"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.totales?.activas ?? '—'"
            description="Disponibles en selectores"
            icon="location"
            icon-variant="amber"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivos"
            :value="stats.totales?.inactivas ?? '—'"
            description="No disponibles en selectores"
            icon="location"
            icon-variant="slate"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros -->
    <section aria-labelledby="filtros-poblaciones-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-poblaciones-heading" class="sr-only">Filtros de búsqueda</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del municipio..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect
            v-model="filters.provincia"
            label="Departamento:"
            placeholder="Todos los departamentos"
            :options="provinciaOptions"
            @change="onFilterChange"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            placeholder="Todos"
            :options="statusOptions"
            @change="onFilterChange"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de poblaciones -->
    <section aria-labelledby="listado-poblaciones-heading">
      <SectionHeader
        id="listado-poblaciones-heading"
        title="Listado de municipios"
        description="Haz clic en el ícono de ojo para ver el detalle completo. Usa el botón de estado para activar o desactivar un municipio."
        class="mb-4"
      />

      <div
        v-if="loading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando municipios...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadPoblaciones(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="poblaciones"
        row-key="id"
        aria-label="Listado de municipios del catálogo"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'nombre'">
            <span class="font-medium text-slate-900">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'provincia'">
            {{ value ?? '—' }}
          </template>
          <template v-else-if="column.key === 'coordenadas'">
            <span class="font-mono text-xs text-slate-500">
              {{ formatCoord(row.latitud) }}, {{ formatCoord(row.longitud) }}
            </span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge
              :label="row.status === 1 ? 'Activo' : 'Inactivo'"
              :variant="row.status === 1 ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ver detalle"
            @click="openDetail(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            v-if="row.status !== 1"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Activar municipio"
            :disabled="toggling[row.id]"
            @click="handleToggle(row)"
          >
            <NavIcon name="track_changes" class="size-4" />
          </button>
          <button
            v-else
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Desactivar municipio"
            :disabled="toggling[row.id]"
            @click="handleToggle(row)"
          >
            <NavIcon name="close" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} municipios
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="goToPage(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="goToPage(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>

      <!-- Error de toggle -->
      <div
        v-if="toggleError"
        class="mt-3 flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4"
      >
        <NavIcon name="pendientes" class="mt-0.5 size-4 shrink-0 text-red-500" />
        <p class="text-sm text-red-700">{{ toggleError }}</p>
        <button
          type="button"
          class="ml-auto shrink-0 text-sm font-medium text-red-700 underline"
          @click="toggleError = ''"
        >
          Cerrar
        </button>
      </div>
    </section>

    <!-- Modal: Detalle de municipio -->
    <ModalBase
      v-model="showDetail"
      title="Detalle del municipio"
      description="Información completa, sedes y descuentos asociados."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="location" class="size-5" />
        </span>
      </template>

      <div v-if="detailLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando detalle...</span>
      </div>

      <div v-else-if="selectedPoblacion" class="flex flex-col gap-5 pb-4">
        <!-- Datos principales -->
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Municipio</p>
            <p class="mt-0.5 text-base font-semibold text-slate-900">{{ selectedPoblacion.nombre }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Departamento</p>
            <p class="mt-0.5 text-sm text-slate-900">{{ selectedPoblacion.provincia ?? '—' }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">País</p>
            <p class="mt-0.5 text-sm text-slate-900">{{ selectedPoblacion.pais }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Latitud</p>
            <p class="mt-0.5 font-mono text-sm text-slate-900">{{ selectedPoblacion.latitud }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Longitud</p>
            <p class="mt-0.5 font-mono text-sm text-slate-900">{{ selectedPoblacion.longitud }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Estado</p>
            <StatusBadge
              class="mt-1"
              :label="selectedPoblacion.status === 1 ? 'Activo' : 'Inactivo'"
              :variant="selectedPoblacion.status === 1 ? 'activo' : 'inactivo'"
            />
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">ID</p>
            <p class="mt-0.5 font-mono text-sm text-slate-500">{{ selectedPoblacion.id }}</p>
          </div>
        </div>

        <!-- Sedes asociadas -->
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Sedes asociadas
            <span class="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
              {{ selectedPoblacion.sedes?.length ?? 0 }}
            </span>
          </p>
          <ul v-if="selectedPoblacion.sedes?.length" class="divide-y divide-slate-100 rounded-lg border border-black/10">
            <li
              v-for="sede in selectedPoblacion.sedes"
              :key="sede.id"
              class="px-3 py-2"
            >
              <p class="text-sm text-slate-900">{{ sede.nombre }}</p>
              <p class="text-xs text-slate-400">ID: {{ sede.id }}</p>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-400">Sin sedes registradas en este municipio.</p>
        </div>

        <!-- Descuentos asociados -->
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Descuentos aplicables
            <span class="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
              {{ selectedPoblacion.descuentos?.length ?? 0 }}
            </span>
          </p>
          <ul v-if="selectedPoblacion.descuentos?.length" class="divide-y divide-slate-100 rounded-lg border border-black/10">
            <li
              v-for="descuento in selectedPoblacion.descuentos"
              :key="descuento.id"
              class="flex items-center justify-between px-3 py-2"
            >
              <p class="text-sm text-slate-900">{{ descuento.nombre }}</p>
              <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {{ descuento.porcentaje }}%
              </span>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-400">Sin descuentos aplicables a este municipio.</p>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showDetail = false"
        >
          Cerrar
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import poblacionService from '@/services/poblacionService.js'
import StatCard from '@/components/dashboard/StatCard.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import DataTable from '@/components/activos/DataTable.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import ModalBase from '@/components/ModalBase.vue'

// ─── Estado de datos ──────────────────────────────────────────────────────────
const poblaciones = ref([])
const loading     = ref(false)
const error       = ref('')

const stats = reactive({
  totales:       { total: 0, activas: 0, inactivas: 0 },
  por_pais:      [],
  por_provincia: []
})

// ─── Filtros ──────────────────────────────────────────────────────────────────
const filters = reactive({ search: '', provincia: '', status: '' })

const provinciaOptions = ref([])

const statusOptions = [
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' }
]

// ─── Paginación ───────────────────────────────────────────────────────────────
const pagination = reactive({
  currentPage: 1,
  lastPage:    1,
  total:       0,
  from:        0,
  to:          0
})

// ─── Toggle de estado ─────────────────────────────────────────────────────────
const toggling    = ref({})
const toggleError = ref('')

async function handleToggle(row) {
  toggling.value[row.id] = true
  toggleError.value = ''
  try {
    const res = await poblacionService.toggleStatus(row.id)
    const updatedStatus = res.data?.status

    const idx = poblaciones.value.findIndex((p) => p.id === row.id)
    if (idx !== -1 && updatedStatus !== undefined) {
      poblaciones.value[idx] = { ...poblaciones.value[idx], status: updatedStatus }
    }

    if (selectedPoblacion.value?.id === row.id && updatedStatus !== undefined) {
      selectedPoblacion.value = { ...selectedPoblacion.value, status: updatedStatus }
    }

    await loadStatistics()
  } catch (e) {
    const msg = e.response?.data?.message ?? 'Error al cambiar el estado.'
    toggleError.value = `${row.nombre}: ${msg}`
  } finally {
    toggling.value[row.id] = false
  }
}

// ─── Columnas de la tabla ────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',      label: 'Municipio' },
  { key: 'provincia',   label: 'Departamento' },
  { key: 'pais',        label: 'País' },
  { key: 'coordenadas', label: 'Coordenadas', thClass: 'text-right', tdClass: 'text-right' },
  { key: 'status',      label: 'Estado' }
]

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadPoblaciones(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page:       20,
      sort_by:        'nombre',
      sort_direction: 'asc',
      'with':         ''
    }
    if (filters.search)   params.search   = filters.search
    if (filters.provincia) params.provincia = filters.provincia
    if (filters.status !== '') params.status = Number(filters.status)

    const res = await poblacionService.getAll(params)
    poblaciones.value = res.data

    pagination.currentPage = res.meta.current_page
    pagination.lastPage    = res.meta.last_page
    pagination.total       = res.meta.total
    pagination.from        = res.meta.from
    pagination.to          = res.meta.to
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Error al cargar los municipios.'
  } finally {
    loading.value = false
  }
}

async function loadFilters() {
  try {
    const res = await poblacionService.getFilters()
    provinciaOptions.value = (res.data.provincias ?? []).map((p) => ({ value: p, label: p }))
  } catch {
    // Los filtros son opcionales; la tabla sigue funcionando
  }
}

async function loadStatistics() {
  try {
    const res = await poblacionService.getStatistics()
    stats.totales       = res.data.totales       ?? { total: 0, activas: 0, inactivas: 0 }
    stats.por_pais      = res.data.por_pais      ?? []
    stats.por_provincia = res.data.por_provincia ?? []
  } catch {
    // Las estadísticas son opcionales
  }
}

// ─── Búsqueda con debounce ────────────────────────────────────────────────────
let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadPoblaciones(1), 350)
}

function onFilterChange() {
  loadPoblaciones(1)
}

function clearFilters() {
  filters.search   = ''
  filters.provincia = ''
  filters.status   = ''
  loadPoblaciones(1)
}

function goToPage(page) {
  loadPoblaciones(page)
}

// ─── Modal detalle ────────────────────────────────────────────────────────────
const showDetail        = ref(false)
const selectedPoblacion = ref(null)
const detailLoading     = ref(false)

async function openDetail(row) {
  showDetail.value        = true
  detailLoading.value     = true
  selectedPoblacion.value = null
  try {
    const res = await poblacionService.getById(row.id, { 'with': 'sedes,descuentos' })
    selectedPoblacion.value = res.data
  } catch {
    showDetail.value = false
  } finally {
    detailLoading.value = false
  }
}

// ─── Formateo de coordenadas ──────────────────────────────────────────────────
function formatCoord(val) {
  if (val === null || val === undefined) return '—'
  return Number(val).toFixed(4)
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadFilters()
  loadStatistics()
  loadPoblaciones(1)
})
</script>
