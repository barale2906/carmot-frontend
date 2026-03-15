<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-topicos-heading">
      <h2 id="stats-topicos-heading" class="sr-only">Resumen de tópicos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total tópicos"
            :value="stats.total"
            description="Registrados en el sistema"
            icon="people"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="Disponibles para asignar"
            icon="security"
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

    <!-- Barra de filtros y acciones -->
    <section aria-labelledby="filtros-topicos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-topicos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre o descripción..."
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
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo tópico
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de tópicos -->
    <section aria-labelledby="listado-topicos-heading">
      <SectionHeader
        id="listado-topicos-heading"
        title="Listado de tópicos"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada tópico."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando tópicos...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadTopicos(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="topicos"
        row-key="id"
        aria-label="Listado de tópicos"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status ? 'Activo' : 'Inactivo')"
              :variant="row.status ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'modulos_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'duracion'">
            {{ value != null ? `${value} h` : '—' }}
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} tópicos
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

    <!-- ── Modal: Crear / Editar ────────────────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      :title="editingTopico ? 'Editar tópico' : 'Nuevo tópico'"
      :description="editingTopico
        ? 'Modifica los datos del tópico.'
        : 'Completa los campos para crear un nuevo tópico en el sistema.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Ej: Fundamentos de Programación"
            :required="true"
            span="full"
          />
          <FormTextarea
            v-model="form.descripcion"
            label="Descripción"
            placeholder="Descripción del tópico..."
            :required="true"
            :rows="3"
          />
          <FormInput
            v-model="form.duracion"
            label="Duración (horas)"
            type="number"
            placeholder="Calculada automáticamente al asignar temas"
            :hint="form.temaIds.length ? 'La duración se calculará sumando la duración de los temas seleccionados.' : ''"
            :disabled="form.temaIds.length > 0"
            min="0"
            max="999"
            step="0.1"
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            :options="statusFormOptions"
          />
        </div>

        <!-- Selector de temas -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-900">Temas</label>

          <!-- Dropdown para agregar temas -->
          <div class="relative">
            <select
              class="w-full appearance-none rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 pr-9 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :value="''"
              :disabled="temasLoading"
              @change="addTema($event.target.value); $event.target.value = ''"
            >
              <option value="" disabled>
                {{ temasLoading ? 'Cargando temas...' : 'Seleccionar tema para agregar...' }}
              </option>
              <option
                v-for="tema in temasDisponibles"
                :key="tema.id"
                :value="tema.id"
              >
                {{ tema.duracion != null ? `${tema.duracion}h — ` : '' }}{{ tema.nombre }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          <!-- Badges de temas seleccionados -->
          <div v-if="form.temaIds.length" class="flex flex-wrap gap-1.5 rounded-lg border border-black/10 bg-slate-50 p-2">
            <span
              v-for="id in form.temaIds"
              :key="id"
              class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
            >
              {{ getTemaNombre(id) }}
              <button
                type="button"
                class="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-200 hover:text-blue-900 focus:outline-none"
                :aria-label="`Quitar ${getTemaNombre(id)}`"
                @click="removeTema(id)"
              >
                <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <p v-else class="text-xs text-slate-400">
            Sin temas asignados. La duración deberá ingresarse manualmente.
          </p>
        </div>

        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </div>
        <div v-if="fieldErrors && Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
          <span v-else>{{ editingTopico ? 'Guardar cambios' : 'Crear tópico' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showEliminarModal"
      title="Eliminar tópico"
      description="Esta acción moverá el tópico a la papelera. Podrás restaurarlo en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ targetTopico?.nombre }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showEliminarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmEliminar"
        >
          {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Restaurar ────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showRestaurarModal"
      title="Restaurar tópico"
      description="El tópico volverá a estar disponible en el sistema."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar <strong>{{ targetTopico?.nombre }}</strong>?
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

    <!-- ── Modal: Detalle ──────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showDetailModal"
      title="Detalle del tópico"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>
      <div v-if="detailTopico" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailTopico.nombre }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Descripción</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailTopico.descripcion ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Duración</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailTopico.duracion != null ? `${detailTopico.duracion} h` : '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailTopico.status_text ?? (detailTopico.status ? 'Activo' : 'Inactivo')"
                :variant="detailTopico.status ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Módulos vinculados</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailTopico.modulos_count ?? detailTopico.modulos?.length ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailTopico.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailTopico.updated_at) }}</dd>
          </div>
          <div v-if="detailTopico.modulos?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Módulos</dt>
            <dd class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="modulo in detailTopico.modulos"
                :key="modulo.id"
                class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ modulo.nombre }}
              </span>
            </dd>
          </div>
          <div v-if="detailTopico.temas?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Temas</dt>
            <dd class="mt-2 space-y-2">
              <div
                v-for="tema in detailTopico.temas"
                :key="tema.id"
                class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-900">{{ tema.nombre }}</span>
                <span class="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {{ tema.duracion != null ? `${tema.duracion} h` : '—' }}
                </span>
              </div>
            </dd>
          </div>
        </dl>
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
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import topicoService from '@/services/topicoService.js'
import temaService from '@/services/temaService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Estado principal ─────────────────────────────────────────────────────────
const topicos = ref([])
const loading = ref(false)
const error   = ref('')

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

// ─── Opciones de filtros / form ───────────────────────────────────────────────
const statusOptions = [
  { value: '',  label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' }
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',        label: 'Nombre' },
  { key: 'descripcion',   label: 'Descripción' },
  { key: 'duracion',      label: 'Duración' },
  { key: 'modulos_count', label: 'Módulos' },
  { key: 'status',        label: 'Estado' },
  { key: 'created_at',    label: 'Creado' }
]

// ─── Watchers de filtros ──────────────────────────────────────────────────────
watch(() => filters.status, () => loadTopicos(1))

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadTopicos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'modulos'
    }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status

    const res = await topicoService.getAll(params)
    topicos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from
      pagination.to          = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los tópicos.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await topicoService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total      = totales.total      ?? 0
    stats.activos    = totales.activos    ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo — no bloquea la vista
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTopicos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadTopicos(page)
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal  = ref(false)
const editingTopico  = ref(null)
const formLoading    = ref(false)
const formError      = ref('')
const fieldErrors    = ref({})

const form = reactive({
  nombre:      '',
  descripcion: '',
  duracion:    '',
  status:      1,
  temaIds:     []
})

// ─── Catálogo de temas ────────────────────────────────────────────────────────
const todosLosTemas = ref([])
const temasLoading  = ref(false)

async function loadTemasCatalogo() {
  temasLoading.value = true
  try {
    const res = await temaService.getAll({ per_page: 500, status: 1, sort_by: 'nombre', sort_direction: 'asc' })
    todosLosTemas.value = res.data ?? []
  } catch {
    // No bloquea el formulario
  } finally {
    temasLoading.value = false
  }
}

/** Temas aún no seleccionados (para el dropdown) */
const temasDisponibles = computed(() =>
  todosLosTemas.value.filter((t) => !form.temaIds.includes(t.id))
)

function getTemaNombre(id) {
  return todosLosTemas.value.find((t) => t.id === id)?.nombre ?? `#${id}`
}

function addTema(rawId) {
  const id = Number(rawId)
  if (id && !form.temaIds.includes(id)) {
    form.temaIds.push(id)
  }
}

function removeTema(id) {
  const idx = form.temaIds.indexOf(id)
  if (idx !== -1) form.temaIds.splice(idx, 1)
}

function resetForm() {
  form.nombre      = ''
  form.descripcion = ''
  form.duracion    = ''
  form.status      = 1
  form.temaIds.splice(0)
  formError.value   = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingTopico.value = null
  resetForm()
  loadTemasCatalogo()
  showFormModal.value = true
}

async function openEdit(topico) {
  editingTopico.value = topico
  form.nombre         = topico.nombre      ?? ''
  form.descripcion    = topico.descripcion ?? ''
  form.duracion       = topico.duracion    ?? ''
  form.status         = topico.status      ?? 1
  form.temaIds.splice(0)
  formError.value     = ''
  fieldErrors.value   = {}

  // Cargar catálogo y temas actuales ANTES de mostrar el modal
  await Promise.allSettled([
    loadTemasCatalogo(),
    topicoService.getById(topico.id, { with: 'temas' })
      .then((res) => {
        const ids = (res.data?.temas ?? []).map((t) => t.id)
        form.temaIds.splice(0, form.temaIds.length, ...ids)
      })
  ])

  showFormModal.value = true
}

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}

  // Copia plana del array reactivo para evitar problemas de serialización
  const temaIdsCopy = [...form.temaIds]

  const payload = {
    nombre:      form.nombre,
    descripcion: form.descripcion,
    status:      Number(form.status),
    tema_ids:    temaIdsCopy
  }
  // Solo enviar duración manual si no hay temas asignados
  if (temaIdsCopy.length === 0 && form.duracion !== '' && form.duracion !== null) {
    payload.duracion = parseFloat(form.duracion)
  }

  formLoading.value = true
  try {
    if (editingTopico.value) {
      await topicoService.update(editingTopico.value.id, payload, { _silent: true })
      notifySuccess(`El tópico "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await topicoService.create(payload, { _silent: true })
      notifySuccess(`El tópico "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadTopicos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else if (e?.response?.status === 403) {
      formError.value = 'No tienes permisos para realizar esta acción.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetTopico      = ref(null)
const actionLoading     = ref(false)
const actionError       = ref('')

function openEliminar(topico) {
  targetTopico.value      = topico
  actionError.value       = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await topicoService.delete(targetTopico.value.id)
    notifySuccess(`El tópico "${targetTopico.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadTopicos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el tópico.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(topico) {
  targetTopico.value       = topico
  actionError.value        = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await topicoService.restore(targetTopico.value.id)
    notifySuccess(`El tópico "${targetTopico.value.nombre}" fue restaurado.`)
    showRestaurarModal.value = false
    await Promise.all([loadTopicos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el tópico.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailTopico    = ref(null)

async function openDetail(topico) {
  detailTopico.value    = topico
  showDetailModal.value = true
  try {
    const res = await topicoService.getById(topico.id, { with: 'modulos,temas' })
    detailTopico.value  = res.data
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
  loadTopicos()
  loadStatistics()
})
</script>
