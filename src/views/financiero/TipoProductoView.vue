<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-tipos-heading">
      <h2 id="stats-tipos-heading" class="sr-only">Resumen de tipos de producto</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard title="Total tipos" :value="stats.total" description="Registrados en el sistema" icon="financiero" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activos" :value="stats.activos" description="Disponibles para asignar" icon="activos" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Eliminados" :value="stats.eliminados" description="En papelera (soft delete)" icon="pendientes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- API no disponible -->
    <section v-if="apiError" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
      <p class="text-sm text-amber-800">{{ apiError }}</p>
      <p class="mt-2 text-xs text-amber-700">
        Verifica que el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/lp/tipos-producto</code>
        esté disponible.
      </p>
    </section>

    <template v-else>

      <!-- Filtros y acciones -->
      <section aria-labelledby="filtros-tipos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-tipos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre, código o descripción..."
              help="Filtra tipos de producto por texto."
              @input="onSearchInput"
            />
          </div>
          <div class="w-full sm:w-[180px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              help="Activo o inactivo en el catálogo de tipos."
              :options="statusOptions"
            />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect
              v-model="filters.es_financiable"
              label="Financiabilidad:"
              help="Filtra si el tipo admite productos en cuotas."
              :options="financiableOptions"
            />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              v-if="viewTrashed"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="eye" class="size-4" /> Ver activos
            </button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="track_changes" class="size-4" /> Ver eliminados
            </button>
            <button
              v-if="!viewTrashed && canCreate"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openCreate"
            >
              <NavIcon name="plus" class="size-4" /> Nuevo tipo
            </button>
          </div>
        </div>
      </section>

      <!-- Tabla -->
      <section aria-labelledby="listado-tipos-heading">
        <SectionHeader
          id="listado-tipos-heading"
          :title="viewTrashed ? 'Tipos eliminados' : 'Tipos de producto'"
          :description="viewTrashed
            ? 'Tipos en papelera. Solo visible para auditoría.'
            : 'Categorías que clasifican los productos del catálogo LP y determinan su financiabilidad.'"
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando tipos de producto...</span>
        </div>
        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadTipos(1)">Reintentar</button>
        </div>

        <DataTable v-else :columns="tableColumns" :data="tipos" row-key="id" aria-label="Listado de tipos de producto">
          <template #cell="{ column, value, row }">

            <template v-if="column.key === 'nombre'">
              <span class="font-medium text-slate-900">{{ value }}</span>
              <span v-if="row.deleted_at" class="ml-2 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">Eliminado</span>
            </template>

            <template v-else-if="column.key === 'codigo'">
              <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value ?? '—' }}</code>
            </template>

            <template v-else-if="column.key === 'es_financiable'">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="value ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
              >
                {{ value ? 'Financiable' : 'No financiable' }}
              </span>
            </template>

            <template v-else-if="column.key === 'status_text'">
              <StatusBadge :label="value ?? (row.status === 1 ? 'Activo' : 'Inactivo')" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
            </template>

            <template v-else>{{ value ?? '—' }}</template>
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
              v-if="!row.deleted_at && canEdit"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Editar"
              @click="openEdit(row)"
            >
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button
              v-if="!row.deleted_at && canDelete"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar"
              @click="openEliminar(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} tipos</p>
          <div class="flex gap-2">
            <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
            <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
          </div>
        </div>
      </section>
    </template>
  </div>

  <!-- ── Modal: Crear / Editar ─────────────────────────────────────────────── -->
  <ModalBase
    v-model="showFormModal"
    :title="editingTipo ? 'Editar tipo de producto' : 'Nuevo tipo de producto'"
    :description="editingTipo
      ? 'Modifica los datos del tipo de producto.'
      : 'Define una nueva categoría para clasificar los productos del catálogo LP.'"
    size="lg"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitForm">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          v-model="form.nombre"
          label="Nombre *"
          placeholder="Ej: Matrícula de Curso"
          hint="Máximo 255 caracteres."
          help="Nombre del tipo en pantallas y al asignar productos LP."
          :required="true"
          maxlength="255"
          :error="fieldErrors.nombre?.[0]"
        />
        <FormInput
          v-model="form.codigo"
          label="Código *"
          placeholder="Ej: MAT-CURSO"
          hint="Único. Máximo 50 caracteres."
          help="Identificador único del tipo para datos e integraciones."
          :required="true"
          maxlength="50"
          :error="fieldErrors.codigo?.[0]"
        />
      </div>

      <!-- Financiable + Estado -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-1">
            <label class="text-sm font-medium text-slate-900">Financiable</label>
            <FormFieldHelp text="Si está marcado, los productos de este tipo pueden llevar precio en cuotas en listas LP." />
          </div>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-black/10 bg-slate-50 px-4 py-3 text-sm transition-colors hover:bg-slate-100">
            <input
              v-model="form.es_financiable"
              type="checkbox"
              class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-slate-700">Permite pago en cuotas</span>
          </label>
          <p class="text-xs text-slate-500">Determina si los productos de este tipo pueden financiarse en el módulo de listas de precios.</p>
          <p v-if="fieldErrors.es_financiable?.[0]" class="text-xs text-red-600">{{ fieldErrors.es_financiable[0] }}</p>
        </div>
        <FormSelect
          v-model="form.status"
          label="Estado"
          :options="[{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }]"
          hint="Los tipos inactivos no aparecen en selectores de productos."
          help="Controla si el tipo se ofrece al crear o editar productos."
        />
      </div>

      <FormTextarea
        v-model="form.descripcion"
        label="Descripción"
        placeholder="Descripción opcional del tipo de producto..."
        hint="Máximo 1000 caracteres."
        help="Texto opcional para aclarar el uso de este tipo en la institución."
        :rows="3"
        :error="fieldErrors.descripcion?.[0]"
      />

      <!-- Error general -->
      <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <p class="font-medium">{{ formError }}</p>
        <ul v-if="Object.keys(fieldErrors).length" class="mt-1 list-inside list-disc space-y-0.5">
          <li v-for="(msgs, field) in fieldErrors" :key="field">{{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}</li>
        </ul>
      </div>
    </form>

    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showFormModal = false">Cancelar</button>
      <button type="button" :disabled="formLoading" class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="submitForm">
        <span v-if="formLoading">Guardando...</span>
        <span v-else>{{ editingTipo ? 'Guardar cambios' : 'Crear tipo' }}</span>
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Eliminar ──────────────────────────────────────────────────── -->
  <ModalBase v-model="showEliminarModal" title="Eliminar tipo de producto" description="Esta acción moverá el tipo a la papelera.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">¿Estás seguro de que deseas eliminar <strong>{{ targetTipo?.nombre }}</strong>?</p>
      <p class="mt-2 text-xs text-slate-500">Si este tipo tiene productos activos vinculados, la eliminación no será posible.</p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showEliminarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500" @click="confirmEliminar">
        {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Detalle ───────────────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle del tipo de producto">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>
    <div v-if="detailTipo" class="space-y-3 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 font-medium text-slate-900">{{ detailTipo.nombre }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Código</dt>
          <dd class="mt-0.5"><code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ detailTipo.codigo ?? '—' }}</code></dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Financiable</dt>
          <dd class="mt-0.5">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" :class="detailTipo.es_financiable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'">
              {{ detailTipo.es_financiable ? 'Sí — permite cuotas' : 'No — solo contado' }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="detailTipo.status_text ?? (detailTipo.status === 1 ? 'Activo' : 'Inactivo')" :variant="detailTipo.status === 1 ? 'activo' : 'inactivo'" />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Productos vinculados</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailTipo.productos_count ?? '—' }}</dd>
        </div>
        <div v-if="detailTipo.descripcion" class="col-span-2">
          <dt class="font-medium text-slate-500">Descripción</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailTipo.descripcion }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Creado</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailTipo.created_at ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Última modificación</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailTipo.updated_at ?? '—' }}</dd>
        </div>
        <div v-if="detailTipo.deleted_at" class="col-span-2">
          <dt class="font-medium text-red-500">Eliminado el</dt>
          <dd class="mt-0.5 text-red-700">{{ detailTipo.deleted_at }}</dd>
        </div>
      </dl>
    </div>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import tipoProductoService from '@/services/tipoProductoService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate = ref(true)
const canEdit   = ref(true)
const canDelete = ref(true)

// ─── Opciones de filtro ───────────────────────────────────────────────────────
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 1,  label: 'Activos' },
  { value: 0,  label: 'Inactivos' }
]

const financiableOptions = [
  { value: '',    label: 'Todos' },
  { value: true,  label: 'Financiables' },
  { value: false, label: 'No financiables' }
]

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',        label: 'Nombre' },
  { key: 'codigo',        label: 'Código' },
  { key: 'es_financiable', label: 'Financiabilidad' },
  { key: 'status_text',   label: 'Estado' },
  { key: 'created_at',    label: 'Creado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const tipos      = ref([])
const loading    = ref(false)
const error      = ref('')
const apiError   = ref('')
const viewTrashed = ref(false)

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, activos: 0, eliminados: 0 })
const filters    = reactive({ search: '', status: '', es_financiable: '' })

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadTipos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: pagination.perPage, sort_by: 'nombre', sort_direction: 'asc' }
    if (viewTrashed.value)            params.only_trashed  = true
    if (filters.search)               params.search        = filters.search
    if (filters.status !== '')        params.status        = filters.status
    if (filters.es_financiable !== '') params.es_financiable = filters.es_financiable

    const res = await tipoProductoService.getAll(params)
    tipos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    const status = e?.response?.status
    if (status === 404 || status >= 500) {
      apiError.value = 'El servicio de tipos de producto no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los tipos de producto.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [activos, eliminados] = await Promise.all([
      tipoProductoService.getAll({ per_page: 1, page: 1, status: 1 }),
      tipoProductoService.getAll({ per_page: 1, page: 1, only_trashed: true })
    ])
    stats.activos    = activos.meta?.total    ?? 0
    stats.eliminados = eliminados.meta?.total ?? 0
    stats.total      = stats.activos + stats.eliminados
  } catch {
    // Informativo
  }
}

// ─── Filtros y búsqueda ───────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTipos(1), 400)
}

function toggleTrashed() { viewTrashed.value = !viewTrashed.value }
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadTipos(page) }

watch(() => filters.status,        () => loadTipos(1))
watch(() => filters.es_financiable, () => loadTipos(1))
watch(viewTrashed,                  () => loadTipos(1))

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal  = ref(false)
const editingTipo    = ref(null)
const formLoading    = ref(false)
const formError      = ref('')
const fieldErrors    = ref({})

const form = reactive({ nombre: '', codigo: '', es_financiable: false, descripcion: '', status: 1 })

function resetForm() {
  form.nombre        = ''
  form.codigo        = ''
  form.es_financiable = false
  form.descripcion   = ''
  form.status        = 1
  formError.value    = ''
  fieldErrors.value  = {}
}

function openCreate() {
  editingTipo.value = null
  resetForm()
  showFormModal.value = true
}

function openEdit(tipo) {
  editingTipo.value    = tipo
  resetForm()
  form.nombre          = tipo.nombre         ?? ''
  form.codigo          = tipo.codigo         ?? ''
  form.es_financiable  = tipo.es_financiable ?? false
  form.descripcion     = tipo.descripcion    ?? ''
  form.status          = tipo.status         ?? 1
  showFormModal.value  = true
}

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    const payload = {}
    if (form.nombre.trim())   payload.nombre        = form.nombre.trim()
    if (form.codigo.trim())   payload.codigo        = form.codigo.trim()
    payload.es_financiable    = Boolean(form.es_financiable)
    payload.status            = Number(form.status)
    if (form.descripcion?.trim()) payload.descripcion = form.descripcion.trim()

    if (editingTipo.value) {
      await tipoProductoService.update(editingTipo.value.id, payload, { _silent: true })
      notifySuccess(`El tipo "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await tipoProductoService.create(payload, { _silent: true })
      notifySuccess(`El tipo "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadTipos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors  ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetTipo        = ref(null)
const actionLoading     = ref(false)
const actionError       = ref('')

function openEliminar(tipo) {
  targetTipo.value        = tipo
  actionError.value       = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await tipoProductoService.delete(targetTipo.value.id)
    notifySuccess(`El tipo "${targetTipo.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadTipos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    const msg = e?.response?.data?.error ?? e?.response?.data?.message ?? ''
    const isFk = e?.response?.status === 500 && msg.toLowerCase().includes('foreign key')
    actionError.value = isFk
      ? 'No se puede eliminar este tipo porque tiene productos activos vinculados.'
      : (e?.response?.data?.message ?? 'Error al eliminar el tipo de producto.')
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailTipo      = ref(null)

async function openDetail(tipo) {
  detailTipo.value  = tipo
  showDetailModal.value = true
  try {
    const res = await tipoProductoService.getById(tipo.id, { with: 'productos' })
    detailTipo.value = { ...res.data, productos_count: res.data.productos?.length ?? res.data.productos_count }
  } catch {
    // Mantiene datos del listado
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadTipos(1),
    loadStatistics(),
  ])
})
</script>
