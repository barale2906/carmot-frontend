<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-conceptos-heading">
      <h2 id="stats-conceptos-heading" class="sr-only">Resumen de conceptos de pago</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard title="Total conceptos" :value="stats.total" description="Registrados en el sistema" icon="financiero" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activos" :value="stats.activos" description="Disponibles para cobro" icon="activos" icon-variant="blue" />
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
        La gestión de conceptos de pago estará disponible cuando el backend exponga el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/conceptos-pago</code>.
      </p>
    </section>

    <template v-else>

      <!-- Filtros y acciones -->
      <section aria-labelledby="filtros-conceptos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-conceptos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">

          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre del concepto..."
              @input="onSearchInput"
            />
          </div>

          <div class="w-full sm:w-[200px]">
            <FormSelect v-model="filters.tipo" label="Tipo:" :options="tiposFilterOptions" />
          </div>

          <div class="w-full sm:w-[140px]">
            <FormInput v-model="filters.valor_min" label="Valor mín:" type="number" placeholder="0" min="0" @change="loadConceptos(1)" />
          </div>

          <div class="w-full sm:w-[140px]">
            <FormInput v-model="filters.valor_max" label="Valor máx:" type="number" placeholder="..." min="0" @change="loadConceptos(1)" />
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
              <NavIcon name="plus" class="size-4" /> Nuevo concepto
            </button>
          </div>
        </div>
      </section>

      <!-- Tabla -->
      <section aria-labelledby="listado-conceptos-heading">
        <SectionHeader
          id="listado-conceptos-heading"
          :title="viewTrashed ? 'Conceptos eliminados' : 'Conceptos de pago'"
          :description="viewTrashed
            ? 'Conceptos en papelera. Solo visible para auditoría. No es posible restaurarlos desde aquí.'
            : 'Listado de categorías de cobro disponibles en el sistema financiero.'"
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando conceptos de pago...</span>
        </div>

        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadConceptos(1)">Reintentar</button>
        </div>

        <DataTable v-else :columns="tableColumns" :data="conceptos" row-key="id" aria-label="Listado de conceptos de pago">
          <template #cell="{ column, value, row }">

            <template v-if="column.key === 'nombre'">
              <span class="font-medium text-slate-900">{{ value }}</span>
              <span
                v-if="row.deleted_at"
                class="ml-2 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700"
              >Eliminado</span>
            </template>

            <template v-else-if="column.key === 'tipo_nombre'">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="{
                  'bg-amber-100 text-amber-800': row.tipo === 0,
                  'bg-blue-100 text-blue-800':   row.tipo === 1,
                  'bg-green-100 text-green-800':  row.tipo === 2,
                  'bg-slate-100 text-slate-700':  row.tipo >= 3
                }"
              >
                {{ value ?? '—' }}
              </span>
            </template>

            <template v-else-if="column.key === 'valor_formatted'">
              <span class="font-mono text-sm text-slate-900">$ {{ value ?? '—' }}</span>
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
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} conceptos
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              :disabled="pagination.currentPage === 1"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="goToPage(pagination.currentPage - 1)"
            >Anterior</button>
            <button
              type="button"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="goToPage(pagination.currentPage + 1)"
            >Siguiente</button>
          </div>
        </div>
      </section>
    </template>
  </div>

  <!-- ── Modal: Crear / Editar ─────────────────────────────────────────────── -->
  <ModalBase
    v-model="showFormModal"
    :title="editingConcepto ? 'Editar concepto de pago' : 'Nuevo concepto de pago'"
    :description="editingConcepto
      ? 'Modifica los datos del concepto de pago.'
      : 'Completa los campos para registrar un nuevo concepto de cobro.'"
    size="lg"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitForm">
      <FormInput
        v-model="form.nombre"
        label="Nombre *"
        placeholder="Ej: Matrícula Semestral"
        hint="Máximo 255 caracteres."
        :required="true"
        maxlength="255"
        :error="fieldErrors.nombre?.[0]"
      />

      <FormSelect
        v-model="form.tipo"
        label="Tipo *"
        :options="tiposOptions"
        :required="true"
        hint="Categoría contable del concepto de cobro."
        :error="fieldErrors.tipo?.[0]"
      />

      <FormInput
        v-model="form.valor"
        label="Valor base *"
        type="number"
        placeholder="Ej: 1500000"
        hint="Valor en pesos. Máximo 2 decimales. Se usa como sugerencia al crear recibos."
        step="0.01"
        min="0"
        :required="true"
        :error="fieldErrors.valor?.[0]"
      />

      <div v-if="formError && !Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {{ formError }}
      </div>
      <div v-if="Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <p class="font-medium">{{ formError }}</p>
        <ul class="mt-1 list-inside list-disc space-y-0.5">
          <li v-for="(msgs, field) in fieldErrors" :key="field">
            {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
          </li>
        </ul>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showFormModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="formLoading"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="submitForm"
      >
        <span v-if="formLoading">Guardando...</span>
        <span v-else>{{ editingConcepto ? 'Guardar cambios' : 'Crear concepto' }}</span>
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Eliminar ──────────────────────────────────────────────────── -->
  <ModalBase
    v-model="showEliminarModal"
    title="Eliminar concepto de pago"
    description="Esta acción moverá el concepto a la papelera."
  >
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Estás seguro de que deseas eliminar <strong>{{ targetConcepto?.nombre }}</strong>?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        Si este concepto está siendo utilizado en recibos de pago, la eliminación no será posible.
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
      >Cancelar</button>
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

  <!-- ── Modal: Detalle ───────────────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle del concepto de pago">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>
    <div v-if="detailConcepto" class="space-y-3 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 font-medium text-slate-900">{{ detailConcepto.nombre }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Tipo</dt>
          <dd class="mt-0.5">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-amber-100 text-amber-800': detailConcepto.tipo === 0,
                'bg-blue-100 text-blue-800':   detailConcepto.tipo === 1,
                'bg-green-100 text-green-800':  detailConcepto.tipo === 2,
                'bg-slate-100 text-slate-700':  detailConcepto.tipo >= 3
              }"
            >
              {{ detailConcepto.tipo_nombre ?? '—' }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Valor base</dt>
          <dd class="mt-0.5 font-mono text-slate-900">$ {{ detailConcepto.valor_formatted ?? detailConcepto.valor }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Creado</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailConcepto.created_at ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Última modificación</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailConcepto.updated_at ?? '—' }}</dd>
        </div>
        <div v-if="detailConcepto.deleted_at" class="col-span-2">
          <dt class="font-medium text-red-500">Eliminado el</dt>
          <dd class="mt-0.5 text-red-700">{{ detailConcepto.deleted_at }}</dd>
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
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import conceptoPagoService from '@/services/conceptoPagoService.js'
import { useConceptoPagoTipos } from '@/composables/useConceptoPago.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()
const { tiposOptions, tiposFilterOptions, loadTipos } = useConceptoPagoTipos()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate = ref(true)
const canEdit   = ref(true)
const canDelete = ref(true)

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',          label: 'Nombre' },
  { key: 'tipo_nombre',     label: 'Tipo' },
  { key: 'valor_formatted', label: 'Valor base' },
  { key: 'created_at',      label: 'Creado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const conceptos  = ref([])
const loading    = ref(false)
const error      = ref('')
const apiError   = ref('')
const viewTrashed = ref(false)

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, activos: 0, eliminados: 0 })
const filters    = reactive({ search: '', tipo: '', valor_min: '', valor_max: '' })

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadConceptos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page:       pagination.perPage,
      sort_by:        'nombre',
      sort_direction: 'asc'
    }
    if (viewTrashed.value)   params.only_trashed = true
    if (filters.search)      params.search       = filters.search
    if (filters.tipo !== '') params.tipo         = filters.tipo
    if (filters.valor_min)   params.valor_min    = filters.valor_min
    if (filters.valor_max)   params.valor_max    = filters.valor_max

    const res = await conceptoPagoService.getAll(params)
    conceptos.value = res.data ?? []
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
      apiError.value = 'El servicio de conceptos de pago no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los conceptos de pago.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [activos, eliminados] = await Promise.all([
      conceptoPagoService.getAll({ per_page: 1, page: 1 }),
      conceptoPagoService.getAll({ per_page: 1, page: 1, only_trashed: true })
    ])
    stats.activos    = activos.meta?.total    ?? 0
    stats.eliminados = eliminados.meta?.total ?? 0
    stats.total      = stats.activos + stats.eliminados
  } catch {
    // Informativo, no bloquea la vista
  }
}

// ─── Filtros y búsqueda ───────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadConceptos(1), 400)
}

function toggleTrashed() {
  viewTrashed.value = !viewTrashed.value
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadConceptos(page)
}

watch(() => filters.tipo, () => loadConceptos(1))
watch(viewTrashed,        () => loadConceptos(1))

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal    = ref(false)
const editingConcepto  = ref(null)
const formLoading      = ref(false)
const formError        = ref('')
const fieldErrors      = ref({})

const form = reactive({ nombre: '', tipo: null, valor: '' })

function resetForm() {
  form.nombre      = ''
  form.tipo        = null
  form.valor       = ''
  formError.value  = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingConcepto.value = null
  resetForm()
  showFormModal.value = true
}

function openEdit(concepto) {
  editingConcepto.value = concepto
  resetForm()
  form.nombre = concepto.nombre ?? ''
  form.tipo   = concepto.tipo   ?? null
  form.valor  = concepto.valor  != null ? String(concepto.valor) : ''
  showFormModal.value = true
}

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    const payload = {}
    if (form.nombre.trim()) payload.nombre = form.nombre.trim()
    if (form.tipo !== null && form.tipo !== '') payload.tipo = Number(form.tipo)
    if (form.valor !== '')  payload.valor = parseFloat(form.valor)

    if (editingConcepto.value) {
      await conceptoPagoService.update(editingConcepto.value.id, payload, { _silent: true })
      notifySuccess(`El concepto "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await conceptoPagoService.create(payload, { _silent: true })
      notifySuccess(`El concepto "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadConceptos(pagination.currentPage), loadStatistics()])
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
const targetConcepto    = ref(null)
const actionLoading     = ref(false)
const actionError       = ref('')

function openEliminar(concepto) {
  targetConcepto.value    = concepto
  actionError.value       = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await conceptoPagoService.delete(targetConcepto.value.id)
    notifySuccess(`El concepto "${targetConcepto.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadConceptos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    const errorMsg = e?.response?.data?.error ?? ''
    const isFkError = e?.response?.status === 500 &&
      errorMsg.toLowerCase().includes('foreign key')
    actionError.value = isFkError
      ? 'No se puede eliminar este concepto porque está siendo utilizado en uno o más recibos de pago.'
      : (e?.response?.data?.message ?? 'Error al eliminar el concepto de pago.')
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailConcepto  = ref(null)

async function openDetail(concepto) {
  detailConcepto.value  = concepto
  showDetailModal.value = true
  try {
    const res = await conceptoPagoService.getById(concepto.id)
    detailConcepto.value = res.data
  } catch {
    // Mantiene los datos del listado
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadTipos(),
    loadConceptos(1),
  ])

  if (!apiError.value) {
    await loadStatistics()
  }
})
</script>
