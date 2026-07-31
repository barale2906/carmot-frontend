<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-bancos-heading">
      <h2 id="stats-bancos-heading" class="sr-only">Resumen de bancos</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard
            title="Total"
            :value="stats.totales?.total ?? '—'"
            description="Bancos registrados"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.totales?.activos ?? '—'"
            description="Disponibles para pagos"
            icon="activos"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivos"
            :value="stats.totales?.inactivos ?? '—'"
            description="No disponibles"
            icon="pendientes"
            icon-variant="slate"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Con transferencias"
            :value="stats.con_transferencias?.con_pagos ?? '—'"
            description="Bancos con pagos registrados"
            icon="receipt"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-bancos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-bancos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del banco..."
            help="Filtra por nombre del banco."
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
            Nuevo banco
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
    <section aria-labelledby="listado-bancos-heading">
      <SectionHeader
        id="listado-bancos-heading"
        title="Catálogo de bancos"
        description="Bancos disponibles para pagos por transferencia bancaria. Solo los bancos activos aparecen en el formulario de recibo."
        class="mb-4"
      />

      <div
        v-if="loading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando bancos...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadBancos(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="bancos"
        row-key="id"
        aria-label="Listado de bancos"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'nombre'">
            <span class="font-medium text-slate-900">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'codigo'">
            <code v-if="value" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value }}</code>
            <span v-else class="text-slate-400">—</span>
          </template>
          <template v-else-if="column.key === 'medios_pago_count'">
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
            :disabled="!!deleting[row.id]"
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} bancos
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

    <!-- Modal: Crear / Editar banco -->
    <ModalBase
      v-model="showForm"
      :title="editingBanco ? 'Editar banco' : 'Nuevo banco'"
      description="Entidad bancaria para pagos por transferencia"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormInput
          v-model="form.nombre"
          label="Nombre"
          placeholder="Ej: Bancolombia"
          required
          :error="formErrors.nombre?.[0]"
        />
        <FormInput
          v-model="form.codigo"
          label="Código bancario"
          placeholder="Ej: 007 (opcional)"
          :error="formErrors.codigo?.[0]"
        />
        <FormSelect
          v-model="form.status"
          label="Estado"
          :options="statusFormOptions"
          :error="formErrors.status?.[0]"
        />

        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
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
          {{ saving ? 'Guardando...' : (editingBanco ? 'Guardar cambios' : 'Crear banco') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase
      v-model="showTrashed"
      title="Papelera de bancos"
      description="Bancos eliminados. Puedes restaurarlos o eliminarlos permanentemente."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-slate-500">
          <NavIcon name="trash" class="size-5" />
        </span>
      </template>

      <div v-if="trashedLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando papelera...</span>
      </div>

      <div v-else-if="!trashedBancos.length" class="py-6 text-center text-sm text-slate-400">
        No hay bancos eliminados.
      </div>

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="item in trashedBancos"
          :key="item.id"
          class="flex items-center justify-between gap-3 py-3"
        >
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
            <p class="text-xs text-slate-400">{{ item.codigo ?? 'Sin código' }}</p>
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

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import bancoService    from '@/services/bancoService.js'
import { authService } from '@/services/authService.js'
import StatCard        from '@/components/dashboard/StatCard.vue'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import StatusBadge     from '@/components/activos/StatusBadge.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import ModalBase       from '@/components/ModalBase.vue'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const userPermissions = ref([])

function hasPermission(perm) {
  return userPermissions.value.includes(perm)
}

const canCreate   = computed(() => hasPermission('co_bancosCrear'))
const canEditar   = computed(() => hasPermission('co_bancosEditar'))
const canInactivar = computed(() => hasPermission('co_bancosInactivar'))

async function loadPermissions() {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const bancos      = ref([])
const loading     = ref(false)
const error       = ref('')
const actionError = ref('')
const deleting    = ref({})

const stats = reactive({
  totales: null,
  con_transferencias: null,
})

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', status: '' })

const tableColumns = [
  { key: 'nombre',           label: 'Nombre' },
  { key: 'codigo',           label: 'Código' },
  { key: 'medios_pago_count', label: 'Pagos' },
  { key: 'status',           label: 'Estado' },
]

const statusOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' },
]

async function loadBancos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)        params.search = filters.search
    if (filters.status !== '') params.status  = filters.status
    const res = await bancoService.getAll(params)
    bancos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los bancos.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await bancoService.getStatistics()
    const d   = res.data ?? {}
    stats.totales           = d.totales          ?? null
    stats.con_transferencias = d.con_transferencias ?? null
  } catch { /* no bloquea */ }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadBancos(1), 400)
}

function onFilterChange() {
  loadBancos(1)
}

function clearFilters() {
  filters.search = ''
  filters.status = ''
  loadBancos(1)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadBancos(page)
}

// ─── Eliminar ──────────────────────────────────────────────────────────────────
async function handleDelete(row) {
  if (!confirm(`¿Eliminar el banco "${row.nombre}"?`)) return
  deleting.value = { ...deleting.value, [row.id]: true }
  actionError.value = ''
  try {
    await bancoService.delete(row.id)
    notifySuccess('Banco eliminado correctamente.')
    loadBancos(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar el banco.'
  } finally {
    const next = { ...deleting.value }
    delete next[row.id]
    deleting.value = next
  }
}

// ─── Papelera ──────────────────────────────────────────────────────────────────
const showTrashed   = ref(false)
const trashedBancos = ref([])
const trashedLoading = ref(false)
const restoringId   = ref(null)
const forceDeleting = ref(null)

async function openTrashed() {
  showTrashed.value    = true
  trashedLoading.value = true
  try {
    const res = await bancoService.getTrashed()
    trashedBancos.value = res.data ?? []
  } catch {
    trashedBancos.value = []
  } finally {
    trashedLoading.value = false
  }
}

async function handleRestore(item) {
  restoringId.value = item.id
  try {
    await bancoService.restore(item.id)
    notifySuccess(`Banco "${item.nombre}" restaurado.`)
    trashedBancos.value = trashedBancos.value.filter(b => b.id !== item.id)
    loadBancos(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo restaurar el banco.'
  } finally {
    restoringId.value = null
  }
}

async function handleForceDelete(item) {
  if (!confirm(`¿Eliminar permanentemente "${item.nombre}"? Esta acción no se puede deshacer.`)) return
  forceDeleting.value = item.id
  try {
    await bancoService.forceDelete(item.id)
    notifySuccess(`Banco "${item.nombre}" eliminado permanentemente.`)
    trashedBancos.value = trashedBancos.value.filter(b => b.id !== item.id)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar el banco permanentemente.'
  } finally {
    forceDeleting.value = null
  }
}

// ─── Formulario Crear / Editar ────────────────────────────────────────────────
const showForm     = ref(false)
const editingBanco = ref(null)
const saving       = ref(false)
const formError    = ref('')
const formErrors   = ref({})

const form = reactive({ nombre: '', codigo: '', status: 1 })

function openCreate() {
  editingBanco.value = null
  form.nombre        = ''
  form.codigo        = ''
  form.status        = 1
  formError.value    = ''
  formErrors.value   = {}
  showForm.value     = true
}

function openEdit(row) {
  editingBanco.value = row
  form.nombre        = row.nombre ?? ''
  form.codigo        = row.codigo ?? ''
  form.status        = row.status ?? 1
  formError.value    = ''
  formErrors.value   = {}
  showForm.value     = true
}

async function handleSubmit() {
  formError.value  = ''
  formErrors.value = {}
  saving.value     = true
  const payload = {
    nombre: form.nombre.trim(),
    codigo: form.codigo.trim() || null,
    status: form.status,
  }
  try {
    if (editingBanco.value) {
      await bancoService.update(editingBanco.value.id, payload)
      notifySuccess('Banco actualizado correctamente.')
    } else {
      await bancoService.create(payload)
      notifySuccess('Banco creado correctamente.')
    }
    showForm.value = false
    loadBancos(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    if (e?.response?.status === 422) {
      formErrors.value = e.response.data?.errors  ?? {}
      formError.value  = e.response.data?.message ?? 'Verifica los datos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error. Intenta de nuevo.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadPermissions()
  loadBancos(1)
  loadStatistics()
})
</script>
