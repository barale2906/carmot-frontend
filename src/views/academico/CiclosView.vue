<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-ciclos-heading">
      <h2 id="stats-ciclos-heading" class="sr-only">Resumen de ciclos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total ciclos"
            :value="stats.total"
            description="Registrados en el sistema"
            icon="academico"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="En curso"
            icon="activos"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Eliminados"
            :value="stats.eliminados"
            description="En papelera (soft delete)"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- API no disponible -->
    <section
      v-if="apiError"
      class="rounded-[14px] border border-amber-200 bg-amber-50 p-6"
    >
      <p class="text-sm text-amber-800">
        {{ apiError }}
      </p>
      <p class="mt-2 text-xs text-amber-700">
        La gestión de ciclos estará disponible cuando el backend exponga el endpoint
        <code class="rounded bg-amber-200 px-1">/api/academico/ciclos</code>.
      </p>
    </section>

    <!-- Contenido principal (cuando la API está disponible) -->
    <template v-else>
      <!-- Barra de filtros y acciones -->
      <section
        aria-labelledby="filtros-ciclos-heading"
        class="rounded-[14px] border border-black/10 bg-white p-6"
      >
        <h2 id="filtros-ciclos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre del ciclo..."
              @input="onSearchInput"
            />
          </div>
          <div class="w-full sm:w-[180px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              :options="statusOptions"
            />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              v-if="viewTrashed"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="eye" class="size-4" />
              Ver activos
            </button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="track_changes" class="size-4" />
              Ver eliminados
            </button>
            <button
              v-if="!viewTrashed"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openCreate"
            >
              <NavIcon name="plus" class="size-4" />
              Nuevo ciclo
            </button>
          </div>
        </div>
      </section>

      <!-- Tabla de ciclos -->
      <section aria-labelledby="listado-ciclos-heading">
        <SectionHeader
          id="listado-ciclos-heading"
          :title="viewTrashed ? 'Ciclos eliminados' : 'Listado de ciclos'"
          :description="viewTrashed
            ? 'Ciclos en papelera. Puedes restaurarlos o eliminarlos permanentemente.'
            : 'Gestiona los ciclos académicos del sistema.'"
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando ciclos...</span>
        </div>

        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button
            type="button"
            class="mt-3 text-sm font-medium text-red-700 underline"
            @click="loadCiclos(1)"
          >
            Reintentar
          </button>
        </div>

        <DataTable
          v-else
          :columns="tableColumns"
          :data="ciclos"
          row-key="id"
          aria-label="Listado de ciclos"
        >
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'status'">
              <StatusBadge
                :label="row.status_text ?? (row.status ? 'Activo' : 'Inactivo')"
                :variant="row.status ? 'activo' : 'inactivo'"
              />
            </template>
            <template v-else-if="column.key === 'created_at'">
              {{ formatDate(value) }}
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
              v-if="!row.deleted_at"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Editar"
              @click="openEdit(row)"
            >
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button
              v-if="!row.deleted_at"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar"
              @click="openEliminar(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
            <button
              v-else
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Restaurar"
              @click="openRestaurar(row)"
            >
              <NavIcon name="track_changes" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div
          v-if="pagination.lastPage > 1"
          class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
        >
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} ciclos
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
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import cicloService from '@/services/cicloService.js'

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' }
]

const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Creado' }
]

const ciclos = ref([])
const loading = ref(false)
const error = ref('')
const apiError = ref('')
const viewTrashed = ref(false)

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const stats = reactive({ total: 0, activos: 0, eliminados: 0 })

const filters = reactive({ search: '', status: '' })

let searchTimer = null

watch(() => filters.status, () => loadCiclos(1))
watch(viewTrashed, () => loadCiclos(1))

async function loadCiclos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value = ''
  try {
    const fetcher = viewTrashed.value ? cicloService.getTrashed : cicloService.getAll
    const params = {
      page,
      per_page: pagination.perPage,
      sort_by: 'nombre',
      sort_direction: 'asc'
    }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status

    const res = await fetcher(params)
    ciclos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from ?? 0
      pagination.to = res.meta.to ?? 0
    }
  } catch (e) {
    const status = e?.response?.status
    if (status === 404 || status >= 500) {
      apiError.value = 'El servicio de ciclos no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los ciclos.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const res = await cicloService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo — no bloquea la vista
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadCiclos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadCiclos(page)
}

function toggleTrashed() {
  viewTrashed.value = !viewTrashed.value
}

function openCreate() {
  // Placeholder: implementar modal de creación cuando la API esté lista
}

function openEdit() {
  // Placeholder: implementar modal de edición cuando la API esté lista
}

function openDetail() {
  // Placeholder: implementar modal de detalle cuando la API esté lista
}

function openEliminar() {
  // Placeholder: implementar modal de eliminación cuando la API esté lista
}

function openRestaurar() {
  // Placeholder: implementar modal de restaurar cuando la API esté lista
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  await loadCiclos(1)
  if (!apiError.value) {
    await loadStatistics()
  }
})
</script>
