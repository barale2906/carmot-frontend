<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-stock-heading">
      <h2 id="stats-stock-heading" class="sr-only">Resumen de stock</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard title="Total registros" :value="stats.total_registros ?? '—'" description="Combinaciones producto-almacén" icon="activos" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Productos con stock" :value="stats.productos_con_stock ?? '—'" description="Tienen cantidad disponible > 0" icon="security" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Bajo stock" :value="stats.bajo_stock ?? '—'" description="Por debajo del punto de reorden" icon="pendientes" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Sin stock" :value="stats.sin_stock ?? '—'" description="Cantidad disponible = 0" icon="track_changes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- Alerta bajo stock -->
    <div
      v-if="(stats.bajo_stock ?? 0) > 0"
      class="flex items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-5 py-3"
    >
      <svg class="size-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="text-sm text-amber-800">
        <strong>{{ stats.bajo_stock }}</strong> producto(s) por debajo del punto de reorden. Considera crear órdenes de compra.
      </p>
      <button type="button" class="ml-auto text-xs font-medium text-amber-700 hover:underline" @click="filters.bajo_stock = true; loadStock(1)">Ver solo bajo stock</button>
    </div>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-stock-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-stock-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.almacen_id" label="Almacén:" placeholder="Todos" :options="almacenOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.producto_id" label="Producto:" placeholder="Todos" :options="productoOptions" @change="onFilterChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="filters.bajo_stock ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
            @click="filters.bajo_stock = !filters.bajo_stock; loadStock(1)"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ filters.bajo_stock ? 'Solo bajo stock' : 'Todos' }}
          </button>
          <button v-if="canImportar" type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openImportar">
            <NavIcon name="plus" class="size-4" /> Cargar stock inicial
          </button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla -->
    <section aria-labelledby="listado-stock-heading">
      <SectionHeader id="listado-stock-heading" title="Stock por producto y almacén" description="Disponibilidad actual. La cantidad disponible es la total menos las reservadas por pedidos activos." class="mb-4" />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando stock...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadStock(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="stockItems" row-key="id" aria-label="Listado de stock">
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'producto'">
            <span class="font-medium text-slate-900">{{ row.producto?.nombre ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'almacen'">
            {{ row.almacen?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'cantidad_disponible'">
            <strong :class="row.bajo_stock ? 'text-amber-700' : 'text-green-700'">{{ value }}</strong>
          </template>
          <template v-else-if="column.key === 'cantidad_reservada'">
            <span v-if="value > 0" class="text-slate-500">{{ value }}</span>
            <span v-else class="text-slate-300">0</span>
          </template>
          <template v-else-if="column.key === 'bajo_stock'">
            <span v-if="value" class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Bajo stock</span>
            <span v-else class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">OK</span>
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
      </DataTable>

      <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}</p>
        <div class="flex gap-2">
          <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>

    <!-- Modal: Importar stock inicial -->
    <ModalBase v-model="showImportar" title="Cargar stock inicial" description="Importa el inventario inicial desde un archivo CSV">
      <div class="flex flex-col gap-4 pb-2">
        <p class="text-sm text-slate-600">
          Descarga la plantilla CSV, rellénala con los datos de stock inicial y súbela aquí.
        </p>
        <button type="button" :disabled="downloadingPlantilla" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="downloadPlantilla">
          <NavIcon name="layout" class="size-4" />
          {{ downloadingPlantilla ? 'Descargando...' : 'Descargar plantilla CSV' }}
        </button>
        <FormFileUpload
          v-model="importFile"
          label="Archivo CSV"
          accept=".csv"
          help="Formato: producto_id, almacen_id, cantidad, punto_reorden"
          :error="importError"
        />
        <div v-if="importResult" class="rounded-lg border border-green-200 bg-green-50 p-3">
          <p class="text-sm text-green-700">{{ importResult }}</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showImportar = false">Cancelar</button>
        <button type="button" :disabled="importing || !importFile" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleImportar">
          {{ importing ? 'Importando...' : 'Importar stock' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invStockService   from '@/services/invStockService.js'
import invAlmacenService from '@/services/invAlmacenService.js'
import invProductoService from '@/services/invProductoService.js'
import { authService }   from '@/services/authService.js'
import { useNotification } from '@/composables/useNotification'
import StatCard        from '@/components/dashboard/StatCard.vue'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import FormFileUpload  from '@/components/forms/FormFileUpload.vue'
import ModalBase       from '@/components/ModalBase.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const canImportar = computed(() => userPermissions.value.includes('inv_stockImportar'))
async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const stats = reactive({ total_registros: null, productos_con_stock: null, bajo_stock: null, sin_stock: null })

async function loadStatistics() {
  try { const res = await invStockService.getStatistics(); const d = res.data ?? {}; Object.assign(stats, { total_registros: d.total_registros ?? null, productos_con_stock: d.productos_con_stock ?? null, bajo_stock: d.bajo_stock ?? null, sin_stock: d.sin_stock ?? null }) }
  catch { /* no bloquea */ }
}

const stockItems   = ref([])
const loading      = ref(false); const error = ref('')
const pagination   = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters      = reactive({ almacen_id: '', producto_id: '', bajo_stock: false })
const almacenOptions = ref([{ value: '', label: 'Todos los almacenes' }])
const productoOptions = ref([{ value: '', label: 'Todos los productos' }])

const tableColumns = [
  { key: 'producto',           label: 'Producto' },
  { key: 'almacen',            label: 'Almacén' },
  { key: 'cantidad_total',     label: 'Total' },
  { key: 'cantidad_reservada', label: 'Reservado' },
  { key: 'cantidad_disponible', label: 'Disponible' },
  { key: 'punto_reorden',      label: 'Punto reorden' },
  { key: 'bajo_stock',         label: 'Estado' },
]

async function loadSelectores() {
  try {
    const [almacenes, productos] = await Promise.all([invAlmacenService.getActivos(), invProductoService.getActivos()])
    almacenOptions.value  = [{ value: '', label: 'Todos los almacenes' }, ...(almacenes.data ?? almacenes).map(a => ({ value: a.id, label: a.nombre }))]
    productoOptions.value = [{ value: '', label: 'Todos los productos' }, ...(productos.data ?? productos).map(p => ({ value: p.id, label: p.nombre }))]
  } catch { /* no bloquea */ }
}

async function loadStock(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 20 }
    if (filters.almacen_id)  params.almacen_id  = filters.almacen_id
    if (filters.producto_id) params.producto_id = filters.producto_id
    if (filters.bajo_stock)  params.bajo_stock  = 1
    const res = await invStockService.getAll(params)
    stockItems.value = res.data ?? []
    if (res.meta) { pagination.currentPage = res.meta.current_page; pagination.lastPage = res.meta.last_page; pagination.total = res.meta.total; pagination.from = res.meta.from ?? 0; pagination.to = res.meta.to ?? 0 }
  } catch (e) { error.value = e?.response?.data?.message ?? 'Error al cargar el stock.' }
  finally { loading.value = false }
}

function onFilterChange() { loadStock(1) }
function clearFilters() { filters.almacen_id = ''; filters.producto_id = ''; filters.bajo_stock = false; loadStock(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadStock(p) }

// ─── Importar stock inicial ────────────────────────────────────────────────────
const showImportar        = ref(false)
const importFile          = ref(null)
const importing           = ref(false)
const importError         = ref('')
const importResult        = ref('')
const downloadingPlantilla = ref(false)

function openImportar() { showImportar.value = true; importFile.value = null; importError.value = ''; importResult.value = '' }

async function downloadPlantilla() {
  downloadingPlantilla.value = true
  try {
    const res = await invStockService.getPlantilla()
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a'); a.href = url; a.download = 'stock_plantilla.csv'; a.click(); URL.revokeObjectURL(url)
  } catch { /* silencioso */ } finally { downloadingPlantilla.value = false }
}

async function handleImportar() {
  if (!importFile.value) return
  importing.value = true; importError.value = ''; importResult.value = ''
  const fd = new FormData()
  fd.append('archivo', importFile.value)
  try {
    const res = await invStockService.importar(fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    importResult.value = res.message ?? `${res.data?.importados ?? 0} registros importados correctamente.`
    loadStock(1); loadStatistics()
  } catch (e) { importError.value = e?.response?.data?.message ?? 'Error al importar el archivo.' }
  finally { importing.value = false }
}

onMounted(() => { loadPermissions(); loadStock(1); loadStatistics(); loadSelectores() })
</script>
