<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-areas-heading">
      <h2 id="stats-areas-heading" class="sr-only">Resumen de áreas</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total áreas"
            :value="stats.total"
            description="Registradas en el sistema"
            icon="schema"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activas"
            :value="stats.activos"
            description="Habilitadas para uso"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivas"
            :value="stats.eliminados"
            description="Eliminadas del sistema"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-areas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-areas-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del área..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.sede_id"
            label="Sede:"
            placeholder="Todas las sedes"
            :options="sedeOptions"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nueva área
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de áreas -->
    <section aria-labelledby="listado-areas-heading">
      <SectionHeader
        id="listado-areas-heading"
        title="Listado de áreas"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada área."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando áreas...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="() => loadAreas(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="areas"
        row-key="id"
        aria-label="Listado de áreas"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'estado'">
            <StatusBadge
              :label="row.deleted_at ? 'Eliminada' : (row.status === 1 ? 'Activa' : 'Inactiva')"
              :variant="row.deleted_at ? 'inactivo' : (row.status === 1 ? 'activo' : 'inactivo')"
            />
          </template>
          <template v-else-if="column.key === 'sedes_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ row.sedes?.length ?? row.sedes_count ?? 0 }}
            </span>
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
            title="Inactivar"
            @click="openInactivar(row)"
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} áreas
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

    <!-- ── Modal Crear / Editar área ──────────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      :title="editingArea ? 'Editar área' : 'Nueva área'"
      :description="editingArea ? 'Modifica los datos del área.' : 'Completa los campos para registrar una nueva área.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="schema" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre del área"
            placeholder="Ej: Idiomas, Sistemas..."
            :required="true"
            span="full"
          />

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-slate-900">Estado</label>
            <div class="flex gap-3">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input v-model="form.status" type="radio" :value="1" class="accent-[#213360]" />
                Activa
              </label>
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input v-model="form.status" type="radio" :value="0" class="accent-[#213360]" />
                Inactiva
              </label>
            </div>
          </div>
        </div>

        <!-- Sedes asociadas -->
        <div>
          <p class="mb-2 text-sm font-medium text-slate-900">Sedes asociadas <span class="text-xs font-normal text-slate-400">(opcional)</span></p>
          <div v-if="availableSedes.length === 0" class="text-xs text-slate-400">
            No hay sedes disponibles.
          </div>
          <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              v-for="sede in availableSedes"
              :key="sede.id"
              class="flex cursor-pointer items-center gap-2 rounded-lg bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 hover:bg-slate-200"
            >
              <input
                type="checkbox"
                :value="sede.id"
                v-model="form.sedes"
                class="accent-[#213360]"
              />
              {{ sede.nombre }}
            </label>
          </div>
        </div>

        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </div>
        <div v-if="fieldErrors && Object.keys(fieldErrors).length > 0" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <ul class="list-inside list-disc space-y-1">
            <li v-for="(msgs, field) in fieldErrors" :key="field">
              <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
            </li>
          </ul>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showFormModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="formLoading"
          class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="submitForm"
        >
          <span v-if="formLoading">Guardando...</span>
          <span v-else>{{ editingArea ? 'Guardar cambios' : 'Crear área' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Inactivar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showInactivarModal"
      title="Inactivar área"
      description="El área quedará inactiva. Podrás restaurarla en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas inactivar el área
          <strong>{{ targetArea?.nombre }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showInactivarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmInactivar"
        >
          {{ actionLoading ? 'Inactivando...' : 'Inactivar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Restaurar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showRestaurarModal"
      title="Restaurar área"
      description="El área volverá a estar disponible en el sistema."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar el área <strong>{{ targetArea?.nombre }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showRestaurarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
          @click="confirmRestaurar"
        >
          {{ actionLoading ? 'Restaurando...' : 'Restaurar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Detalle ───────────────────────────────────────────────────── -->
    <ModalBase v-model="showDetailModal" title="Detalle del área">
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="schema" class="size-5" />
        </span>
      </template>
      <div v-if="detailArea" class="space-y-4 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailArea.nombre }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailArea.deleted_at ? 'Eliminada' : (detailArea.status === 1 ? 'Activa' : 'Inactiva')"
                :variant="detailArea.deleted_at ? 'inactivo' : (detailArea.status === 1 ? 'activo' : 'inactivo')"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creada</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailArea.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizada</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailArea.updated_at) }}</dd>
          </div>
        </dl>

        <div v-if="detailArea.sedes?.length">
          <p class="mb-2 text-sm font-medium text-slate-500">Sedes asociadas ({{ detailArea.sedes.length }})</p>
          <div class="flex flex-col gap-1.5">
            <div
              v-for="sede in detailArea.sedes"
              :key="sede.id"
              class="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              <NavIcon name="location_city" class="size-4 shrink-0 text-slate-400" />
              <span>{{ sede.nombre }}</span>
              <span class="ml-auto text-xs text-slate-400">{{ sede.poblacion?.nombre }}</span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-slate-400">Sin sedes asociadas.</p>
      </div>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import areaService from '@/services/areaService.js'
import sedeService from '@/services/sedeService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Estado principal ──────────────────────────────────────────────────────────
const areas = ref([])
const loading = ref(false)
const error = ref('')
const availableSedes = ref([])
const stats = reactive({ total: 0, activos: 0, eliminados: 0 })

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const filters = reactive({ search: '', sede_id: '' })

let searchTimer = null

const sedeOptions = computed(() =>
  availableSedes.value.map((s) => ({ value: s.id, label: s.nombre }))
)

const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'sedes_count', label: 'Sedes' },
  { key: 'estado', label: 'Estado' },
  { key: 'created_at', label: 'Creada' }
]

watch(() => filters.sede_id, () => loadAreas(1))

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadAreas(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'sedes'
    }
    if (filters.search) params.search = filters.search
    if (filters.sede_id) params.sede_id = filters.sede_id
    const res = await areaService.getAll(params)
    areas.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from
      pagination.to = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar las áreas.'
  } finally {
    loading.value = false
  }
}

async function loadSedes() {
  try {
    const res = await sedeService.getAll({ per_page: 100, sort_by: 'nombre' })
    availableSedes.value = res.data ?? []
  } catch {
    // Fallar silenciosamente
  }
}

async function loadStatistics() {
  try {
    const res = await areaService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Las estadísticas son informativas
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadAreas(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadAreas(page)
}

// ─── Formulario ───────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingArea = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({ nombre: '', status: 1, sedes: [] })

function resetForm() {
  form.nombre = ''
  form.status = 1
  form.sedes = []
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingArea.value = null
  resetForm()
  showFormModal.value = true
}

function openEdit(area) {
  editingArea.value = area
  form.nombre = area.nombre ?? ''
  form.status = area.status ?? 1
  form.sedes = (area.sedes ?? []).map((s) => s.id)
  formError.value = ''
  fieldErrors.value = {}
  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    const payload = {
      nombre: form.nombre,
      status: form.status,
      sedes: form.sedes
    }
    if (editingArea.value) {
      await areaService.update(editingArea.value.id, payload, { _silent: true })
      notifySuccess(`El área "${form.nombre}" fue actualizada correctamente.`)
    } else {
      await areaService.create(payload, { _silent: true })
      notifySuccess(`El área "${form.nombre}" fue creada correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadAreas(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else if (e?.response?.status === 403) {
      formError.value = 'No tienes permisos para realizar esta acción.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Inactivar ──────────────────────────────────────────────────────────
const showInactivarModal = ref(false)
const targetArea = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openInactivar(area) {
  targetArea.value = area
  actionError.value = ''
  showInactivarModal.value = true
}

async function confirmInactivar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await areaService.inactivate(targetArea.value.id)
    notifySuccess(`El área "${targetArea.value.nombre}" fue inactivada.`)
    showInactivarModal.value = false
    await Promise.all([loadAreas(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al inactivar el área.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(area) {
  targetArea.value = area
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await areaService.restore(targetArea.value.id)
    notifySuccess(`El área "${targetArea.value.nombre}" fue restaurada.`)
    showRestaurarModal.value = false
    await Promise.all([loadAreas(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el área.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailArea = ref(null)

async function openDetail(area) {
  detailArea.value = area
  showDetailModal.value = true
  try {
    const res = await areaService.getById(area.id, { with: 'sedes,sedes.poblacion' })
    detailArea.value = res.data
  } catch {
    // Mantener datos del listado si falla el detalle
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  Promise.all([loadSedes(), loadAreas(), loadStatistics()])
})
</script>
