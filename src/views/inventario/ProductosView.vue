<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-productos-heading">
      <h2 id="stats-productos-heading" class="sr-only">Resumen de productos</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard title="Total" :value="stats.total ?? '—'" description="Productos registrados" icon="activos" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Simples" :value="stats.simples ?? '—'" description="Con stock propio" icon="security" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Grupos" :value="stats.grupos ?? '—'" description="Agrupan variantes" icon="track_changes" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Kits" :value="stats.kits ?? '—'" description="Contienen grupos" icon="pendientes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-productos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-productos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre o código..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.tipo" label="Tipo:" placeholder="Todos" :options="tipoOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.categoria_id" label="Categoría:" placeholder="Todas" :options="categoriaOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="statusOptions" @change="onFilterChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button v-if="canCreate" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="showWizard = true">
            <NavIcon name="plus" class="size-4" /> Nuevo producto
          </button>
          <button v-if="canInactivar" type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openTrashed">
            <NavIcon name="trash" class="size-4" /> Papelera
          </button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla -->
    <section aria-labelledby="listado-productos-heading">
      <SectionHeader
        id="listado-productos-heading"
        title="Catálogo de productos"
        description="Simples tienen stock propio. Grupos agrupan simples como variantes (tallas, colores). Kits contienen grupos — el estudiante elige la variante al momento de la entrega."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando productos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadProductos(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="productos" row-key="id" aria-label="Listado de productos" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'nombre'">
            <span class="font-medium text-slate-900">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'tipo'">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-blue-100 text-blue-800':    row.tipo === 'simple',
                'bg-purple-100 text-purple-800': row.tipo === 'kit',
                'bg-amber-100 text-amber-800':   row.tipo === 'grupo',
              }"
            >{{ tipoLabel(row.tipo) }}</span>
          </template>
          <template v-else-if="column.key === 'categoria'">
            {{ row.categoria?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'unidad_medida'">
            {{ row.unidadMedida?.abreviatura ?? row.unidad_medida?.abreviatura ?? '—' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge :label="row.status === 1 ? 'Activo' : 'Inactivo'" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button v-if="canEditar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Editar datos básicos" @click="openEdit(row)">
            <NavIcon name="edit" class="size-4" />
          </button>
          <!-- Botón de composición para grupos y kits -->
          <button
            v-if="canEditar && (row.tipo === 'kit' || row.tipo === 'grupo')"
            type="button"
            class="rounded p-1.5 transition-colors focus:outline-none focus:ring-2"
            :class="row.tipo === 'kit' ? 'text-slate-500 hover:bg-purple-100 hover:text-purple-700 focus:ring-purple-500' : 'text-slate-500 hover:bg-amber-100 hover:text-amber-700 focus:ring-amber-500'"
            :title="row.tipo === 'kit' ? 'Gestionar grupos del kit' : 'Gestionar variantes del grupo'"
            @click="openComponentes(row)"
          >
            <NavIcon name="layout" class="size-4" />
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

    <!-- Wizard: Crear producto -->
    <InvProductoWizardModal
      :visible="showWizard"
      :categoria-options="categoriaOptions"
      :unidad-options="unidadOptions"
      :simples-options="simplesOptions"
      :grupos-options="gruposOptions"
      @close="showWizard = false"
      @created="onProductoCreado"
    />

    <!-- Modal: Editar producto (solo datos básicos, tipo no editable) -->
    <ModalBase v-model="showForm" title="Editar producto" description="Ajusta los datos básicos. Para cambiar la composición usa el botón correspondiente en la tabla.">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <!-- Tipo — solo informativo, no editable -->
        <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span class="text-xs text-slate-500">Tipo:</span>
          <span
            class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="{
              'bg-blue-100 text-blue-800':    editingItem?.tipo === 'simple',
              'bg-amber-100 text-amber-800':   editingItem?.tipo === 'grupo',
              'bg-purple-100 text-purple-800': editingItem?.tipo === 'kit',
            }"
          >{{ tipoLabel(editingItem?.tipo) }}</span>
          <span class="ml-auto text-xs text-slate-400">El tipo no se puede cambiar.</span>
        </div>
        <FormInput v-model="form.nombre" label="Nombre" placeholder="Nombre del producto" required :error="formErrors.nombre?.[0]" />
        <FormInput v-model="form.codigo" label="Código / SKU" placeholder="Ej: UNI-M-001 (opcional)" :error="formErrors.codigo?.[0]" />
        <div class="grid grid-cols-2 gap-4">
          <FormSelect v-model="form.categoria_id" label="Categoría" placeholder="Sin categoría" :options="categoriaOptions" :error="formErrors.categoria_id?.[0]" />
          <FormSelect v-model="form.unidad_medida_id" label="Unidad de medida" placeholder="Sin unidad" :options="unidadOptions" :error="formErrors.unidad_medida_id?.[0]" />
        </div>
        <FormTextarea v-model="form.descripcion" label="Descripción" placeholder="Descripción opcional..." :rows="2" :error="formErrors.descripcion?.[0]" />
        <FormSelect v-model="form.status" label="Estado" :options="statusFormOptions" :error="formErrors.status?.[0]" />
        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showForm = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmit">
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Gestionar composición (variantes de grupo / grupos de kit) -->
    <ModalBase
      v-model="showComponentes"
      :title="componentesProducto?.tipo === 'grupo'
        ? `Variantes — ${componentesProducto?.nombre ?? ''}`
        : `Componentes del kit — ${componentesProducto?.nombre ?? ''}`"
      :description="componentesProducto?.tipo === 'grupo'
        ? 'Productos simples que son variantes de este grupo'
        : 'Grupos que componen este kit (el estudiante elige la variante al entregar)'"
    >
      <div v-if="componentesLoading" class="flex items-center justify-center py-8"><span class="text-sm text-slate-500">Cargando...</span></div>
      <div v-else>
        <!-- Aviso contextual -->
        <div
          class="mb-4 rounded-lg px-4 py-3 text-sm"
          :class="componentesProducto?.tipo === 'grupo'
            ? 'border border-amber-200 bg-amber-50 text-amber-800'
            : 'border border-purple-200 bg-purple-50 text-purple-800'"
        >
          <template v-if="componentesProducto?.tipo === 'grupo'">
            Agrega los <strong>productos simples</strong> que son variantes de este grupo (ej: Camisa talla M, Camisa talla L).
          </template>
          <template v-else>
            Agrega los <strong>grupos</strong> que componen este kit y la cantidad de cada uno. Al entregar, el estudiante elige qué variante del grupo quiere.
          </template>
        </div>

        <!-- Lista de componentes existentes -->
        <ul v-if="componentes.length" class="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          <li v-for="comp in componentes" :key="comp.id" class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="flex-1">
              <p class="text-sm font-medium text-slate-900">{{ comp.componente?.nombre ?? '—' }}</p>
              <p class="text-xs text-slate-400">
                <template v-if="componentesProducto?.tipo === 'kit'">Cantidad: {{ comp.cantidad }}</template>
                <template v-else>Variante #{{ comp.orden }}</template>
              </p>
            </div>
            <button type="button" class="rounded p-1 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" title="Eliminar" @click="handleDeleteComponente(comp)">
              <NavIcon name="trash" class="size-4" />
            </button>
          </li>
        </ul>
        <p v-else class="mb-4 text-center text-sm text-slate-400">Sin elementos definidos aún.</p>

        <!-- Agregar nuevo elemento -->
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
            {{ componentesProducto?.tipo === 'grupo' ? 'Agregar variante (simple)' : 'Agregar grupo al kit' }}
          </p>
          <div class="flex flex-col gap-3">
            <FormSelect
              v-model="newComp.componente_id"
              :label="componentesProducto?.tipo === 'grupo' ? 'Producto simple' : 'Grupo'"
              placeholder="Selecciona..."
              :options="compModalOptions"
              :error="compErrors.componente_id?.[0]"
            />
            <FormInput
              v-if="componentesProducto?.tipo === 'kit'"
              v-model="newComp.cantidad"
              label="Cantidad"
              type="number"
              min="1"
              :error="compErrors.cantidad?.[0]"
            />
          </div>
          <div v-if="compError" class="mt-2 rounded-lg border border-red-200 bg-red-50 p-2">
            <p class="text-xs text-red-700">{{ compError }}</p>
          </div>
          <button
            type="button"
            :disabled="addingComp || !newComp.componente_id"
            class="mt-3 flex h-8 items-center gap-2 rounded-lg bg-slate-800 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="handleAddComponente"
          >{{ addingComp ? 'Agregando...' : 'Agregar' }}</button>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showComponentes = false">Cerrar</button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de productos" description="Productos eliminados.">
      <div v-if="trashedLoading" class="flex items-center justify-center py-8"><span class="text-sm text-slate-500">Cargando...</span></div>
      <div v-else-if="!trashedItems.length" class="py-6 text-center text-sm text-slate-400">No hay productos eliminados.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashedItems" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
            <p class="text-xs text-slate-400">{{ tipoLabel(item.tipo) }} · {{ item.codigo ?? 'Sin código' }}</p>
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
import invProductoService     from '@/services/invProductoService.js'
import invCategoriaService    from '@/services/invCategoriaService.js'
import invUnidadMedidaService from '@/services/invUnidadMedidaService.js'
import { authService }        from '@/services/authService.js'
import { useNotification }    from '@/composables/useNotification'
import StatCard        from '@/components/dashboard/StatCard.vue'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import StatusBadge     from '@/components/activos/StatusBadge.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormTextarea    from '@/components/forms/FormTextarea.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import ModalBase       from '@/components/ModalBase.vue'
import InvProductoWizardModal from '@/components/inventario/InvProductoWizardModal.vue'

const { success: notifySuccess } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)
const canCreate    = computed(() => hasPermission('inv_productosCrear'))
const canEditar    = computed(() => hasPermission('inv_productosEditar'))
const canInactivar = computed(() => hasPermission('inv_productosInactivar'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

// ─── Estadísticas ─────────────────────────────────────────────────────────────
const stats = reactive({ total: null, simples: null, kits: null, grupos: null })

async function loadStatistics() {
  try {
    const res = await invProductoService.getStatistics()
    const d = res.data ?? {}
    Object.assign(stats, { total: d.total ?? null, simples: d.simples ?? null, kits: d.kits ?? null, grupos: d.grupos ?? null })
  } catch { /* no bloquea */ }
}

// ─── Catálogos de selección ───────────────────────────────────────────────────
const categoriaOptions = ref([{ value: '', label: 'Todas las categorías' }])
const unidadOptions    = ref([{ value: '', label: 'Sin unidad de medida' }])
const simplesOptions   = ref([]) // solo simples activos — para variantes de grupos
const gruposOptions    = ref([]) // solo grupos activos — para componentes de kits

async function loadCatalogos() {
  try {
    const [cats, units, prods] = await Promise.all([
      invCategoriaService.getActivas(),
      invUnidadMedidaService.getActivas(),
      invProductoService.getActivos(),
    ])
    categoriaOptions.value = [{ value: '', label: 'Todas las categorías' }, ...(cats.data ?? cats).map(c => ({ value: c.id, label: c.nombre }))]
    unidadOptions.value    = [{ value: '', label: 'Sin unidad de medida' }, ...(units.data ?? units).map(u => ({ value: u.id, label: `${u.nombre} (${u.abreviatura})` }))]
    const todos = prods.data ?? prods ?? []
    simplesOptions.value = todos.filter(p => p.tipo === 'simple').map(p => ({ value: p.id, label: p.nombre }))
    gruposOptions.value  = todos.filter(p => p.tipo === 'grupo').map(p => ({ value: p.id, label: p.nombre }))
  } catch { /* no bloquea */ }
}

// ─── Listado de productos ─────────────────────────────────────────────────────
const productos  = ref([])
const loading    = ref(false); const error = ref(''); const actionError = ref(''); const deleting = ref({})
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', tipo: '', categoria_id: '', status: '' })

const tipoLabel = (t) => ({ simple: 'Simple', kit: 'Kit', grupo: 'Grupo' }[t] ?? t)
const tipoOptions     = [{ value: '', label: 'Todos los tipos' }, { value: 'simple', label: 'Simple' }, { value: 'grupo', label: 'Grupo' }, { value: 'kit', label: 'Kit' }]
const statusOptions   = [{ value: '', label: 'Todos' }, { value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]
const statusFormOptions = [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }]

const tableColumns = [
  { key: 'nombre',        label: 'Nombre' },
  { key: 'codigo',        label: 'Código' },
  { key: 'tipo',          label: 'Tipo' },
  { key: 'categoria',     label: 'Categoría' },
  { key: 'unidad_medida', label: 'Unidad' },
  { key: 'status',        label: 'Estado' },
]

async function loadProductos(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)      params.search      = filters.search
    if (filters.tipo)         params.tipo         = filters.tipo
    if (filters.categoria_id) params.categoria_id = filters.categoria_id
    if (filters.status !== '') params.status       = filters.status
    const res = await invProductoService.getAll(params)
    productos.value = res.data ?? []
    if (res.meta) { pagination.currentPage = res.meta.current_page; pagination.lastPage = res.meta.last_page; pagination.total = res.meta.total; pagination.from = res.meta.from ?? 0; pagination.to = res.meta.to ?? 0 }
  } catch (e) { error.value = e?.response?.data?.message ?? 'Error al cargar los productos.' }
  finally { loading.value = false }
}

let searchTimer = null
function onSearchInput() { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadProductos(1), 400) }
function onFilterChange() { loadProductos(1) }
function clearFilters() { filters.search = ''; filters.tipo = ''; filters.categoria_id = ''; filters.status = ''; loadProductos(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadProductos(p) }

async function handleDelete(row) {
  if (!confirm(`¿Eliminar el producto "${row.nombre}"?`)) return
  deleting.value = { ...deleting.value, [row.id]: true }; actionError.value = ''
  try { await invProductoService.delete(row.id); notifySuccess('Producto eliminado.'); loadProductos(pagination.currentPage); loadStatistics() }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar.' }
  finally { const n = { ...deleting.value }; delete n[row.id]; deleting.value = n }
}

// ─── Wizard de creación ───────────────────────────────────────────────────────
const showWizard = ref(false)

function onProductoCreado() {
  showWizard.value = false
  loadProductos(pagination.currentPage)
  loadStatistics()
  loadCatalogos() // refresca simples/grupos disponibles
}

// ─── Modal: Editar producto (datos básicos) ───────────────────────────────────
const showForm = ref(false); const editingItem = ref(null); const saving = ref(false)
const formError = ref(''); const formErrors = ref({})
const form = reactive({ nombre: '', codigo: '', categoria_id: '', unidad_medida_id: '', descripcion: '', status: 1 })

function openEdit(row) {
  editingItem.value = row
  Object.assign(form, { nombre: row.nombre ?? '', codigo: row.codigo ?? '', categoria_id: row.categoria_id ?? '', unidad_medida_id: row.unidad_medida_id ?? '', descripcion: row.descripcion ?? '', status: row.status ?? 1 })
  formError.value = ''; formErrors.value = {}; showForm.value = true
}

async function handleSubmit() {
  formError.value = ''; formErrors.value = {}; saving.value = true
  const payload = {
    nombre:          form.nombre.trim(),
    codigo:          form.codigo.trim() || null,
    tipo:            editingItem.value.tipo, // tipo no cambia
    categoria_id:    form.categoria_id || null,
    unidad_medida_id: form.unidad_medida_id || null,
    descripcion:     form.descripcion.trim() || null,
    status:          form.status,
  }
  try {
    await invProductoService.update(editingItem.value.id, payload)
    notifySuccess('Producto actualizado.')
    showForm.value = false; loadProductos(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) { formErrors.value = e.response.data?.errors ?? {}; formError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { formError.value = e?.response?.data?.message ?? 'Ocurrió un error.' }
  } finally { saving.value = false }
}

// ─── Modal: Gestionar composición ─────────────────────────────────────────────
const showComponentes     = ref(false)
const componentesProducto = ref(null)
const componentesLoading  = ref(false)
const componentes         = ref([])
const addingComp          = ref(false)
const compError           = ref('')
const compErrors          = ref({})
const newComp = reactive({ componente_id: '', cantidad: 1 })

// Opciones filtradas según tipo: grupo → simples disponibles, kit → grupos disponibles
const compModalOptions = computed(() => {
  if (!componentesProducto.value) return []
  if (componentesProducto.value.tipo === 'grupo') {
    // Excluye simples que ya son variantes de este grupo
    const yaAgregados = new Set(componentes.value.map(c => c.id))
    return simplesOptions.value.filter(p => !yaAgregados.has(p.value))
  } else {
    // Kit: excluye grupos ya incluidos como componentes
    const yaAgregados = new Set(componentes.value.map(c => c.grupo_producto_id ?? c.grupo?.id))
    return gruposOptions.value.filter(p => !yaAgregados.has(p.value))
  }
})

async function openComponentes(row) {
  componentesProducto.value = row
  showComponentes.value     = true
  componentesLoading.value  = true
  Object.assign(newComp, { componente_id: '', cantidad: 1 })
  compError.value  = ''; compErrors.value = {}
  try {
    const res = row.tipo === 'grupo'
      ? await invProductoService.getVariantes(row.id)
      : await invProductoService.getComponentes(row.id)
    componentes.value = res.data ?? []
  } catch { componentes.value = [] } finally { componentesLoading.value = false }
}

async function handleAddComponente() {
  compError.value = ''; compErrors.value = {}; addingComp.value = true
  const tipo = componentesProducto.value?.tipo
  try {
    if (tipo === 'grupo') {
      // Vincula el simple al grupo actualizando producto_padre_id en el simple
      await invProductoService.addVariante(
        Number(newComp.componente_id),
        componentesProducto.value.id,
      )
      notifySuccess('Variante agregada.')
      const res = await invProductoService.getVariantes(componentesProducto.value.id)
      componentes.value = res.data ?? []
    } else {
      // Kit: agrega un grupo al kit via inv_kit_componentes
      await invProductoService.addComponente(componentesProducto.value.id, {
        grupo_producto_id: Number(newComp.componente_id),
        cantidad:          Number(newComp.cantidad) || 1,
        orden:             componentes.value.length + 1,
      })
      notifySuccess('Componente agregado.')
      const res = await invProductoService.getComponentes(componentesProducto.value.id)
      componentes.value = res.data ?? []
    }
    Object.assign(newComp, { componente_id: '', cantidad: 1 })
  } catch (e) {
    if (e?.response?.status === 422) { compErrors.value = e.response.data?.errors ?? {}; compError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { compError.value = e?.response?.data?.message ?? 'Error al agregar.' }
  } finally { addingComp.value = false }
}

async function handleDeleteComponente(comp) {
  if (!confirm('¿Eliminar este elemento?')) return
  const tipo = componentesProducto.value?.tipo
  try {
    if (tipo === 'grupo') {
      // Desvincula el simple del grupo poniendo producto_padre_id en null
      await invProductoService.removeVariante(comp.id)
      notifySuccess('Variante eliminada del grupo.')
    } else {
      await invProductoService.deleteComponente(componentesProducto.value.id, comp.id)
      notifySuccess('Componente eliminado.')
    }
    componentes.value = componentes.value.filter(c => c.id !== comp.id)
  } catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar.' }
}

// ─── Papelera ─────────────────────────────────────────────────────────────────
const showTrashed = ref(false); const trashedItems = ref([]); const trashedLoading = ref(false)
const restoringId = ref(null); const forceDeleting = ref(null)

async function openTrashed() {
  showTrashed.value = true; trashedLoading.value = true
  try { const res = await invProductoService.getTrashed(); trashedItems.value = res.data ?? [] }
  catch { trashedItems.value = [] } finally { trashedLoading.value = false }
}
async function handleRestore(item) {
  restoringId.value = item.id
  try { await invProductoService.restore(item.id); notifySuccess(`"${item.nombre}" restaurado.`); trashedItems.value = trashedItems.value.filter(i => i.id !== item.id); loadProductos(pagination.currentPage); loadStatistics() }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo restaurar.' }
  finally { restoringId.value = null }
}
async function handleForceDelete(item) {
  if (!confirm(`¿Eliminar permanentemente "${item.nombre}"?`)) return
  forceDeleting.value = item.id
  try { await invProductoService.forceDelete(item.id); notifySuccess(`"${item.nombre}" eliminado.`); trashedItems.value = trashedItems.value.filter(i => i.id !== item.id); loadStatistics() }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar permanentemente.' }
  finally { forceDeleting.value = null }
}

onMounted(() => { loadPermissions(); loadProductos(1); loadStatistics(); loadCatalogos() })
</script>
