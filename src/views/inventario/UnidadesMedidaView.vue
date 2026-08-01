<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-unidades-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-unidades-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre o abreviatura..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="statusOptions" @change="onFilterChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="canCreate"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" /> Nueva unidad
          </button>
          <button
            v-if="canInactivar"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openTrashed"
          >
            <NavIcon name="trash" class="size-4" /> Papelera
          </button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla -->
    <section aria-labelledby="listado-unidades-heading">
      <SectionHeader id="listado-unidades-heading" title="Unidades de medida" description="Unidades utilizadas para cuantificar los productos del inventario." class="mb-4" />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando unidades...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadUnidades(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="unidades" row-key="id" aria-label="Listado de unidades de medida" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'nombre'">
            <span class="font-medium text-slate-900">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'abreviatura'">
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value }}</code>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge :label="row.status === 1 ? 'Activa' : 'Inactiva'" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button v-if="canEditar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Editar" @click="openEdit(row)">
            <NavIcon name="edit" class="size-4" />
          </button>
          <button v-if="canInactivar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40" title="Eliminar" :disabled="!!deleting[row.id]" @click="handleDelete(row)">
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}</p>
        <div class="flex gap-2">
          <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
        </div>
      </div>
      <div v-if="actionError" class="mt-3 flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4">
        <p class="text-sm text-red-700">{{ actionError }}</p>
        <button type="button" class="ml-auto text-sm font-medium text-red-700 underline" @click="actionError = ''">Cerrar</button>
      </div>
    </section>

    <!-- Modal: Crear / Editar -->
    <ModalBase v-model="showForm" :title="editingItem ? 'Editar unidad de medida' : 'Nueva unidad de medida'" description="Unidad para cuantificar productos del inventario">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormInput v-model="form.nombre" label="Nombre" placeholder="Ej: Kilogramo" required :error="formErrors.nombre?.[0]" />
        <FormInput v-model="form.abreviatura" label="Abreviatura" placeholder="Ej: kg" required :error="formErrors.abreviatura?.[0]" />
        <FormTextarea v-model="form.descripcion" label="Descripción" placeholder="Descripción opcional..." :rows="2" :error="formErrors.descripcion?.[0]" />
        <FormSelect v-model="form.status" label="Estado" :options="statusFormOptions" :error="formErrors.status?.[0]" />
        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showForm = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmit">
          {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear unidad') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de unidades" description="Unidades eliminadas. Puedes restaurarlas o eliminarlas permanentemente.">
      <div v-if="trashedLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando papelera...</span>
      </div>
      <div v-else-if="!trashedItems.length" class="py-6 text-center text-sm text-slate-400">No hay unidades eliminadas.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashedItems" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
            <p class="text-xs text-slate-400">{{ item.abreviatura }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" :disabled="restoringId === item.id" class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500" @click="handleRestore(item)">Restaurar</button>
            <button type="button" :disabled="forceDeleting === item.id" class="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500" @click="handleForceDelete(item)">Eliminar definitivo</button>
          </div>
        </li>
      </ul>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showTrashed = false">Cerrar</button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invUnidadMedidaService from '@/services/invUnidadMedidaService.js'
import { authService }        from '@/services/authService.js'
import { useNotification }    from '@/composables/useNotification'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import StatusBadge     from '@/components/activos/StatusBadge.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormTextarea    from '@/components/forms/FormTextarea.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import ModalBase       from '@/components/ModalBase.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)
const canCreate   = computed(() => hasPermission('inv_unidadesCrear'))
const canEditar   = computed(() => hasPermission('inv_unidadesEditar'))
const canInactivar = computed(() => hasPermission('inv_unidadesInactivar'))

async function loadPermissions() {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos */ }
}

const unidades    = ref([])
const loading     = ref(false)
const error       = ref('')
const actionError = ref('')
const deleting    = ref({})
const pagination  = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters     = reactive({ search: '', status: '' })

const tableColumns = [
  { key: 'nombre',      label: 'Nombre' },
  { key: 'abreviatura', label: 'Abreviatura' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'status',      label: 'Estado' },
]
const statusOptions     = [{ value: '', label: 'Todos' }, { value: '1', label: 'Activa' }, { value: '0', label: 'Inactiva' }]
const statusFormOptions = [{ value: 1, label: 'Activa' }, { value: 0, label: 'Inactiva' }]

async function loadUnidades(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)        params.search = filters.search
    if (filters.status !== '') params.status  = filters.status
    const res = await invUnidadMedidaService.getAll(params)
    unidades.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar las unidades.'
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadUnidades(1), 400) }
function onFilterChange() { loadUnidades(1) }
function clearFilters() { filters.search = ''; filters.status = ''; loadUnidades(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadUnidades(p) }

async function handleDelete(row) {
  if (!confirm(`¿Eliminar la unidad "${row.nombre}"?`)) return
  deleting.value = { ...deleting.value, [row.id]: true }; actionError.value = ''
  try {
    await invUnidadMedidaService.delete(row.id)
    notifySuccess('Unidad eliminada.')
    loadUnidades(pagination.currentPage)
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar.'
  } finally {
    const next = { ...deleting.value }; delete next[row.id]; deleting.value = next
  }
}

const showTrashed = ref(false); const trashedItems = ref([]); const trashedLoading = ref(false)
const restoringId = ref(null); const forceDeleting = ref(null)

async function openTrashed() {
  showTrashed.value = true; trashedLoading.value = true
  try { const res = await invUnidadMedidaService.getTrashed(); trashedItems.value = res.data ?? [] }
  catch { trashedItems.value = [] } finally { trashedLoading.value = false }
}

async function handleRestore(item) {
  restoringId.value = item.id
  try {
    await invUnidadMedidaService.restore(item.id)
    notifySuccess(`Unidad "${item.nombre}" restaurada.`)
    trashedItems.value = trashedItems.value.filter(i => i.id !== item.id)
    loadUnidades(pagination.currentPage)
  } catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo restaurar.' }
  finally { restoringId.value = null }
}

async function handleForceDelete(item) {
  if (!confirm(`¿Eliminar permanentemente "${item.nombre}"?`)) return
  forceDeleting.value = item.id
  try {
    await invUnidadMedidaService.forceDelete(item.id)
    notifySuccess(`Unidad "${item.nombre}" eliminada permanentemente.`)
    trashedItems.value = trashedItems.value.filter(i => i.id !== item.id)
  } catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar permanentemente.' }
  finally { forceDeleting.value = null }
}

const showForm = ref(false); const editingItem = ref(null); const saving = ref(false)
const formError = ref(''); const formErrors = ref({})
const form = reactive({ nombre: '', abreviatura: '', descripcion: '', status: 1 })

function openCreate() {
  editingItem.value = null; Object.assign(form, { nombre: '', abreviatura: '', descripcion: '', status: 1 })
  formError.value = ''; formErrors.value = {}; showForm.value = true
}
function openEdit(row) {
  editingItem.value = row
  Object.assign(form, { nombre: row.nombre ?? '', abreviatura: row.abreviatura ?? '', descripcion: row.descripcion ?? '', status: row.status ?? 1 })
  formError.value = ''; formErrors.value = {}; showForm.value = true
}

async function handleSubmit() {
  formError.value = ''; formErrors.value = {}; saving.value = true
  const payload = { nombre: form.nombre.trim(), abreviatura: form.abreviatura.trim(), descripcion: form.descripcion.trim() || null, status: form.status }
  try {
    if (editingItem.value) { await invUnidadMedidaService.update(editingItem.value.id, payload); notifySuccess('Unidad actualizada.') }
    else { await invUnidadMedidaService.create(payload); notifySuccess('Unidad creada.') }
    showForm.value = false; loadUnidades(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) { formErrors.value = e.response.data?.errors ?? {}; formError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { formError.value = e?.response?.data?.message ?? 'Ocurrió un error.' }
  } finally { saving.value = false }
}

onMounted(() => { loadPermissions(); loadUnidades(1) })
</script>
