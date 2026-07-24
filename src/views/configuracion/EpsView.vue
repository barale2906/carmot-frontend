<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-eps-heading">
      <h2 id="stats-eps-heading" class="sr-only">Resumen de EPS</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard
            title="Total EPS"
            :value="stats.totales?.total ?? '—'"
            description="Registradas en el sistema"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activas"
            :value="stats.totales?.activas ?? '—'"
            description="Disponibles para matrículas"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivas"
            :value="stats.totales?.inactivas ?? '—'"
            description="No disponibles"
            icon="pendientes"
            icon-variant="slate"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Con matrículas"
            :value="stats.con_matriculas?.con_matriculas ?? '—'"
            description="EPS usadas en matrículas"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-eps-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-eps-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre o dirección..."
            help="Filtra EPS por nombre o dirección."
            @input="onSearchInput"
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
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="canCreate"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nueva EPS
          </button>
          <button
            v-if="canImportar"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="showImport = true"
          >
            <NavIcon name="upload" class="size-4" />
            Importar CSV
          </button>
          <button
            v-if="canInactivar"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openTrashed"
          >
            <NavIcon name="trash" class="size-4" />
            Papelera
          </button>
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

    <!-- Tabla principal -->
    <section aria-labelledby="listado-eps-heading">
      <SectionHeader
        id="listado-eps-heading"
        title="Listado de EPS"
        description="Gestiona las Entidades Promotoras de Salud disponibles en el sistema."
        class="mb-4"
      />

      <div
        v-if="loading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando EPS...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadEps(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="eps"
        row-key="id"
        aria-label="Listado de EPS"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'nombre'">
            <span class="font-medium text-slate-900">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'direccion'">
            <span class="text-slate-600">{{ value ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'matriculas_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status === 1 ? 'Activo' : 'Inactivo')"
              :variant="row.status === 1 ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            v-if="canEditar"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar"
            @click="openEdit(row)"
          >
            <NavIcon name="edit" class="size-4" />
          </button>
          <button
            v-if="canInactivar"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Eliminar"
            :disabled="deleting[row.id]"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} EPS
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

      <!-- Error de operación -->
      <div
        v-if="actionError"
        class="mt-3 flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4"
      >
        <NavIcon name="pendientes" class="mt-0.5 size-4 shrink-0 text-red-500" />
        <p class="text-sm text-red-700">{{ actionError }}</p>
        <button
          type="button"
          class="ml-auto shrink-0 text-sm font-medium text-red-700 underline"
          @click="actionError = ''"
        >
          Cerrar
        </button>
      </div>
    </section>

    <!-- Modal: Crear / Editar EPS -->
    <ModalBase
      v-model="showForm"
      :title="editingEps ? 'Editar EPS' : 'Nueva EPS'"
      description="Entidad Promotora de Salud"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="security" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormInput
          v-model="form.nombre"
          label="Nombre"
          placeholder="Nombre de la EPS"
          required
          :error="formErrors.nombre?.[0]"
        />
        <FormInput
          v-model="form.direccion"
          label="Dirección"
          placeholder="Dirección de la EPS (opcional)"
          :error="formErrors.direccion?.[0]"
        />
        <FormSelect
          v-model="form.status"
          label="Estado"
          :options="statusFormOptions"
          :error="formErrors.status?.[0]"
        />

        <div
          v-if="formError"
          class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showForm = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleSubmit"
        >
          {{ saving ? 'Guardando...' : (editingEps ? 'Guardar cambios' : 'Crear EPS') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase
      v-model="showTrashed"
      title="Papelera de EPS"
      description="EPS eliminadas. Puedes restaurarlas o eliminarlas permanentemente."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-slate-500">
          <NavIcon name="trash" class="size-5" />
        </span>
      </template>

      <div v-if="trashedLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando papelera...</span>
      </div>

      <div v-else-if="!trashedEps.length" class="py-6 text-center text-sm text-slate-400">
        No hay EPS eliminadas.
      </div>

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="item in trashedEps"
          :key="item.id"
          class="flex items-center justify-between gap-3 py-3"
        >
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
            <p class="text-xs text-slate-400">{{ item.direccion ?? '—' }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              :disabled="restoringId === item.id"
              class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              @click="handleRestore(item)"
            >
              Restaurar
            </button>
            <button
              type="button"
              :disabled="forceDeleting === item.id"
              class="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="handleForceDelete(item)"
            >
              Eliminar definitivo
            </button>
          </div>
        </li>
      </ul>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showTrashed = false"
        >
          Cerrar
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Importar CSV -->
    <ModalBase
      v-model="showImport"
      title="Importar EPS desde CSV"
      description="Carga masiva de EPS a partir de un archivo CSV."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="upload" class="size-5" />
        </span>
      </template>

      <div class="flex flex-col gap-4 pb-2">
        <p class="text-sm text-slate-600">
          Descarga la plantilla, complétala y luego sube el archivo. Las EPS con nombre
          duplicado se omiten sin detener la importación.
        </p>

        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="handleDownloadPlantilla"
        >
          <NavIcon name="download" class="size-4" />
          Descargar plantilla
        </button>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Archivo CSV
          </label>
          <input
            type="file"
            accept=".csv"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="onFileChange"
          />
        </div>

        <!-- Resultado de la importación -->
        <div
          v-if="importResult"
          class="rounded-lg border bg-slate-50 p-3 text-sm"
          :class="importResult.errores?.length ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'"
        >
          <p class="font-medium" :class="importResult.errores?.length ? 'text-amber-800' : 'text-green-800'">
            {{ importMessage }}
          </p>
          <p class="mt-0.5 text-xs" :class="importResult.errores?.length ? 'text-amber-700' : 'text-green-700'">
            Insertadas: {{ importResult.insertadas }} · Omitidas: {{ importResult.omitidas }}
          </p>
          <ul v-if="importResult.errores?.length" class="mt-2 list-disc pl-4 text-xs text-amber-700">
            <li v-for="(err, i) in importResult.errores" :key="i">{{ err }}</li>
          </ul>
        </div>

        <div v-if="importError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ importError }}
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="closeImport"
        >
          Cerrar
        </button>
        <button
          type="button"
          :disabled="!importFile || importing"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleImport"
        >
          {{ importing ? 'Importando...' : 'Importar' }}
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import epsService from '@/services/epsService.js'
import { authService } from '@/services/authService.js'
import StatCard       from '@/components/dashboard/StatCard.vue'
import SectionHeader  from '@/components/activos/SectionHeader.vue'
import DataTable      from '@/components/activos/DataTable.vue'
import StatusBadge    from '@/components/activos/StatusBadge.vue'
import NavIcon        from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput      from '@/components/forms/FormInput.vue'
import FormSelect     from '@/components/forms/FormSelect.vue'
import ModalBase      from '@/components/ModalBase.vue'

// ─── Permisos ────────────────────────────────────────────────────────────────
const userPermissions = ref([])

function hasPermission(perm) {
  return userPermissions.value.includes(perm)
}

const canCreate   = computed(() => hasPermission('co_epsCrear'))
const canEditar   = computed(() => hasPermission('co_epsEditar'))
const canInactivar = computed(() => hasPermission('co_epsInactivar'))
const canImportar = computed(() => hasPermission('co_epsImportar'))

async function loadPermissions() {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos: se ocultan botones de acción */ }
}

// ─── Estado principal ─────────────────────────────────────────────────────────
const eps     = ref([])
const loading = ref(false)
const error   = ref('')
const actionError = ref('')
const deleting    = ref({})

const stats = reactive({
  totales:        { total: 0, activas: 0, inactivas: 0, eliminadas: 0 },
  con_matriculas: { con_matriculas: 0, sin_matriculas: 0 },
  top_eps:        []
})

// ─── Filtros ──────────────────────────────────────────────────────────────────
const filters = reactive({ search: '', status: '' })

const statusOptions = [
  { value: '1', label: 'Activas' },
  { value: '0', label: 'Inactivas' }
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]

// ─── Paginación ───────────────────────────────────────────────────────────────
const pagination = reactive({
  currentPage: 1,
  lastPage:    1,
  total:       0,
  from:        0,
  to:          0
})

// ─── Columnas ─────────────────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',           label: 'Nombre' },
  { key: 'direccion',        label: 'Dirección' },
  { key: 'status',           label: 'Estado' },
  { key: 'matriculas_count', label: 'Matrículas', thClass: 'text-center', tdClass: 'text-center' }
]

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadEps(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page:       15,
      sort_by:        'nombre',
      sort_direction: 'asc'
    }
    if (filters.search)   params.search = filters.search
    if (filters.status !== '') params.status = Number(filters.status)

    const res = await epsService.getAll(params)
    eps.value = res.data ?? []

    pagination.currentPage = res.meta?.current_page ?? 1
    pagination.lastPage    = res.meta?.last_page    ?? 1
    pagination.total       = res.meta?.total        ?? 0
    pagination.from        = res.meta?.from         ?? 0
    pagination.to          = res.meta?.to           ?? 0
  } catch (e) {
    error.value = e.response?.data?.message ?? 'Error al cargar las EPS.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await epsService.getStatistics()
    stats.totales        = res.data?.totales        ?? stats.totales
    stats.con_matriculas = res.data?.con_matriculas ?? stats.con_matriculas
    stats.top_eps        = res.data?.top_eps        ?? []
  } catch { /* estadísticas opcionales */ }
}

// ─── Búsqueda con debounce ────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadEps(1), 350)
}

function onFilterChange() {
  loadEps(1)
}

function clearFilters() {
  filters.search = ''
  filters.status = ''
  loadEps(1)
}

function goToPage(page) {
  loadEps(page)
}

// ─── Modal crear / editar ─────────────────────────────────────────────────────
const showForm    = ref(false)
const editingEps  = ref(null)
const saving      = ref(false)
const formError   = ref('')
const formErrors  = ref({})

const form = reactive({ nombre: '', direccion: '', status: 1 })

function openCreate() {
  editingEps.value  = null
  form.nombre       = ''
  form.direccion    = ''
  form.status       = 1
  formError.value   = ''
  formErrors.value  = {}
  showForm.value    = true
}

function openEdit(row) {
  editingEps.value  = row
  form.nombre       = row.nombre      ?? ''
  form.direccion    = row.direccion   ?? ''
  form.status       = row.status      ?? 1
  formError.value   = ''
  formErrors.value  = {}
  showForm.value    = true
}

async function handleSubmit() {
  saving.value     = true
  formError.value  = ''
  formErrors.value = {}
  try {
    const payload = {
      nombre:    form.nombre.trim(),
      status:    Number(form.status),
      ...(form.direccion.trim() ? { direccion: form.direccion.trim() } : {})
    }
    if (editingEps.value) {
      await epsService.update(editingEps.value.id, payload)
    } else {
      await epsService.create(payload)
    }
    showForm.value = false
    await Promise.allSettled([loadEps(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e.response?.status === 422) {
      formErrors.value = e.response.data?.errors ?? {}
      formError.value  = e.response.data?.message ?? 'Revisa los datos ingresados.'
    } else {
      formError.value = e.response?.data?.message ?? 'Error al guardar la EPS.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────
async function handleDelete(row) {
  if (!confirm(`¿Eliminar la EPS "${row.nombre}"?`)) return
  deleting.value[row.id] = true
  actionError.value = ''
  try {
    await epsService.delete(row.id)
    await Promise.allSettled([loadEps(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e.response?.data?.message ?? 'Error al eliminar la EPS.'
  } finally {
    deleting.value[row.id] = false
  }
}

// ─── Papelera ─────────────────────────────────────────────────────────────────
const showTrashed    = ref(false)
const trashedEps     = ref([])
const trashedLoading = ref(false)
const restoringId    = ref(null)
const forceDeleting  = ref(null)

async function openTrashed() {
  showTrashed.value    = true
  trashedLoading.value = true
  trashedEps.value     = []
  try {
    const res = await epsService.getTrashed({ per_page: 50 })
    trashedEps.value = res.data ?? []
  } catch { /* silencioso */ } finally {
    trashedLoading.value = false
  }
}

async function handleRestore(item) {
  restoringId.value = item.id
  try {
    await epsService.restore(item.id)
    trashedEps.value = trashedEps.value.filter(e => e.id !== item.id)
    await Promise.allSettled([loadEps(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e.response?.data?.message ?? 'Error al restaurar la EPS.'
  } finally {
    restoringId.value = null
  }
}

async function handleForceDelete(item) {
  if (!confirm(`¿Eliminar permanentemente la EPS "${item.nombre}"? Esta acción no se puede deshacer.`)) return
  forceDeleting.value = item.id
  try {
    await epsService.forceDelete(item.id)
    trashedEps.value = trashedEps.value.filter(e => e.id !== item.id)
    await loadStatistics()
  } catch (e) {
    actionError.value = e.response?.data?.message ?? 'Error al eliminar permanentemente la EPS.'
  } finally {
    forceDeleting.value = null
  }
}

// ─── Importar CSV ─────────────────────────────────────────────────────────────
const showImport   = ref(false)
const importFile   = ref(null)
const importing    = ref(false)
const importResult = ref(null)
const importMessage = ref('')
const importError  = ref('')

function onFileChange(e) {
  importFile.value  = e.target.files?.[0] ?? null
  importResult.value = null
  importError.value  = ''
}

async function handleDownloadPlantilla() {
  importError.value = ''
  try {
    const response = await epsService.downloadPlantilla()
    // axios devuelve el Blob directamente en response.data cuando responseType='blob'
    const url = URL.createObjectURL(response.data)
    const a   = document.createElement('a')
    a.href     = url
    a.download = 'plantilla_eps.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    importError.value = 'No se pudo descargar la plantilla. Intenta de nuevo.'
  }
}

async function handleImport() {
  if (!importFile.value) return
  importing.value    = true
  importResult.value = null
  importError.value  = ''
  try {
    const res = await epsService.importar(importFile.value)
    importResult.value = res.data ?? {}
    importMessage.value = res.message ?? 'Importación completada.'
    await Promise.allSettled([loadEps(1), loadStatistics()])
  } catch (e) {
    importError.value = e.response?.data?.message ?? 'Error al importar el archivo.'
  } finally {
    importing.value = false
  }
}

function closeImport() {
  showImport.value   = false
  importFile.value   = null
  importResult.value = null
  importError.value  = ''
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadPermissions()
  loadStatistics()
  loadEps(1)
})
</script>
