<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-precios-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-precios-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre de producto..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[240px]">
          <InvProductoBuscador
            :key="filtroBuscadorKey"
            label="Producto:"
            tipo="simple"
            placeholder="Buscar producto..."
            @select="p => { filters.producto_id = p.id; onFilterChange() }"
            @clear="() => { filters.producto_id = ''; onFilterChange() }"
          />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button v-if="canCreate" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openCreate">
            <NavIcon name="plus" class="size-4" /> Nuevo precio
          </button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla -->
    <section aria-labelledby="listado-precios-heading">
      <SectionHeader id="listado-precios-heading" title="Precios de productos de inventario" description="Lista de precios asociada a las listas activas de tipo inventario (origen=0). El precio se resuelve automáticamente al crear una venta según la sede y población del estudiante." class="mb-4" />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando precios...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPrecios(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="precios" row-key="id" aria-label="Listado de precios de inventario" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'producto'">
            <span class="font-medium text-slate-900">{{ row.producto?.nombre ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'lista_precio'">
            {{ row.listaPrecio?.nombre ?? row.lista_precio?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'precio'">
            <span class="font-mono font-medium text-slate-900">{{ formatCurrency(value) }}</span>
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button v-if="canEditar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Editar" @click="openEdit(row)">
            <NavIcon name="edit" class="size-4" />
          </button>
          <button v-if="canEliminar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40" title="Eliminar" :disabled="!!deleting[row.id]" @click="handleDelete(row)">
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

    <!-- Modal: Crear / Editar precio -->
    <ModalBase v-model="showForm" :title="editingItem ? 'Editar precio' : 'Nuevo precio'" description="Precio de inventario vinculado a una lista de precios activa">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <InvProductoBuscador
          label="Producto"
          tipo="simple"
          placeholder="Buscar producto..."
          :selected-product="editingItem?.producto ?? null"
          @select="p => form.producto_id = p.id"
          @clear="() => form.producto_id = ''"
        />
        <p v-if="formErrors.producto_id?.[0]" class="mt-1 text-xs text-red-600">{{ formErrors.producto_id[0] }}</p>
        <FormSelect v-model="form.lista_precio_id" label="Lista de precios" placeholder="Selecciona..." :options="listaPrecioOptions" required :error="formErrors.lista_precio_id?.[0]" />
        <FormInput v-model="form.precio" label="Precio" type="number" min="0" step="0.01" placeholder="0.00" required :error="formErrors.precio?.[0]" />
        <FormTextarea v-model="form.observaciones" label="Observaciones" placeholder="Observaciones opcionales..." :rows="2" :error="formErrors.observaciones?.[0]" />
        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showForm = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmit">
          {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear precio') }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invPrecioService   from '@/services/invPrecioService.js'
import listaPrecioService from '@/services/listaPrecioService.js'
import { authService }    from '@/services/authService.js'
import { useNotification } from '@/composables/useNotification'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormTextarea    from '@/components/forms/FormTextarea.vue'
import FormSelect           from '@/components/forms/FormSelect.vue'
import InvProductoBuscador from '@/components/inventario/InvProductoBuscador.vue'
import ModalBase       from '@/components/ModalBase.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)
const canCreate    = computed(() => hasPermission('inv_preciosCrear'))
const canEditar    = computed(() => hasPermission('inv_preciosEditar'))
const canEliminar  = computed(() => hasPermission('inv_preciosEliminar'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const formatCurrency = (v) => v != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v) : '—'

const precios     = ref([])
const loading     = ref(false); const error = ref(''); const actionError = ref(''); const deleting = ref({})
const pagination  = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters            = reactive({ search: '', producto_id: '' })
const listaPrecioOptions = ref([])
const filtroBuscadorKey  = ref(0)   // se incrementa al limpiar filtros para resetear el buscador

const tableColumns = [
  { key: 'producto',     label: 'Producto' },
  { key: 'lista_precio', label: 'Lista de precios' },
  { key: 'precio',       label: 'Precio' },
]

async function loadSelectores() {
  try {
    const listas = await (listaPrecioService.getAll?.({ origen: 0, status: 3, per_page: 100 }) ?? listaPrecioService.getActivas?.())
    const lista  = listas?.data ?? listas ?? []
    listaPrecioOptions.value = Array.isArray(lista) ? lista.map(l => ({ value: l.id, label: l.nombre })) : []
  } catch { /* no bloquea */ }
}

async function loadPrecios(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 20 }
    if (filters.search)      params.search     = filters.search
    if (filters.producto_id) params.producto_id = filters.producto_id
    const res = await invPrecioService.getAll(params)
    precios.value = res.data ?? []
    if (res.meta) { pagination.currentPage = res.meta.current_page; pagination.lastPage = res.meta.last_page; pagination.total = res.meta.total; pagination.from = res.meta.from ?? 0; pagination.to = res.meta.to ?? 0 }
  } catch (e) { error.value = e?.response?.data?.message ?? 'Error al cargar los precios.' }
  finally { loading.value = false }
}

let searchTimer = null
function onSearchInput() { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadPrecios(1), 400) }
function onFilterChange() { loadPrecios(1) }
function clearFilters() { filters.search = ''; filters.producto_id = ''; filtroBuscadorKey.value++; loadPrecios(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadPrecios(p) }

async function handleDelete(row) {
  if (!confirm('¿Eliminar este precio?')) return
  deleting.value = { ...deleting.value, [row.id]: true }; actionError.value = ''
  try { await invPrecioService.delete(row.id); notifySuccess('Precio eliminado.'); loadPrecios(pagination.currentPage) }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar.' }
  finally { const n = { ...deleting.value }; delete n[row.id]; deleting.value = n }
}

const showForm = ref(false); const editingItem = ref(null); const saving = ref(false)
const formError = ref(''); const formErrors = ref({})
const emptyForm = { producto_id: '', lista_precio_id: '', precio: '', observaciones: '' }
const form = reactive({ ...emptyForm })

function openCreate() { editingItem.value = null; Object.assign(form, emptyForm); formError.value = ''; formErrors.value = {}; showForm.value = true }
function openEdit(row) {
  editingItem.value = row
  Object.assign(form, { producto_id: row.producto_id ?? '', lista_precio_id: row.lista_precio_id ?? '', precio: row.precio ?? '', observaciones: row.observaciones ?? '' })
  formError.value = ''; formErrors.value = {}; showForm.value = true
}

async function handleSubmit() {
  formError.value = ''; formErrors.value = {}; saving.value = true
  const payload = { producto_id: form.producto_id, lista_precio_id: form.lista_precio_id, precio: Number(form.precio), observaciones: form.observaciones.trim() || null }
  try {
    if (editingItem.value) { await invPrecioService.update(editingItem.value.id, payload); notifySuccess('Precio actualizado.') }
    else { await invPrecioService.create(payload); notifySuccess('Precio creado.') }
    showForm.value = false; loadPrecios(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) { formErrors.value = e.response.data?.errors ?? {}; formError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { formError.value = e?.response?.data?.message ?? 'Ocurrió un error.' }
  } finally { saving.value = false }
}

onMounted(() => { loadPermissions(); loadPrecios(1); loadSelectores() })
</script>
