<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-oc-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-oc-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="statusOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filters.proveedor_id" label="Proveedor:" placeholder="Todos" :options="proveedorOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.almacen_id" label="Almacén:" placeholder="Todos" :options="almacenOptions" @change="onFilterChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button v-if="canCreate" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openCreate">
            <NavIcon name="plus" class="size-4" /> Nueva OC
          </button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla -->
    <section aria-labelledby="listado-oc-heading">
      <SectionHeader id="listado-oc-heading" title="Órdenes de compra" description="Compras a proveedores para reponer el inventario. Al recepcionar una OC, el stock se actualiza automáticamente." class="mb-4" />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando órdenes de compra...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadOC(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="ordenes" row-key="id" aria-label="Listado de órdenes de compra" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'numero'">
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">{{ value ?? `OC-${row.id}` }}</code>
          </template>
          <template v-else-if="column.key === 'proveedor'">
            {{ row.proveedor?.razon_social ?? '—' }}
          </template>
          <template v-else-if="column.key === 'almacen'">
            {{ row.almacen?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'total'">
            <span class="font-mono">{{ formatCurrency(value) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-slate-100 text-slate-700': row.status === 'borrador',
                'bg-blue-100 text-blue-800':   row.status === 'enviada',
                'bg-amber-100 text-amber-800': row.status === 'recibida_parcial',
                'bg-green-100 text-green-800': row.status === 'recibida',
                'bg-red-100 text-red-800':     row.status === 'cancelada',
              }"
            >{{ statusLabel(row.status) }}</span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ value ? value.split('T')[0] : '—' }}
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Ver detalle" @click="openDetalle(row)">
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            v-if="canEnviar && row.status === 'borrador'"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Enviar OC al proveedor"
            :disabled="!!enviando[row.id]"
            @click="handleEnviar(row)"
          >
            <NavIcon name="layout" class="size-4" />
          </button>
          <button
            v-if="canRecibir && ['enviada', 'recibida_parcial'].includes(row.status)"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Recepcionar mercancía"
            @click="openRecepcion(row)"
          >
            <NavIcon name="activos" class="size-4" />
          </button>
          <button
            v-if="canCancelar && ['borrador', 'enviada'].includes(row.status)"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Cancelar OC"
            :disabled="!!cancelando[row.id]"
            @click="handleCancelar(row)"
          >
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

    <!-- Modal: Crear OC -->
    <ModalBase v-model="showForm" title="Nueva orden de compra" description="Solicitud de productos a un proveedor (se crea en estado borrador)">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormSelect v-model="ocForm.proveedor_id" label="Proveedor" placeholder="Selecciona..." :options="proveedorOptions" required :error="ocErrors.proveedor_id?.[0]" />
        <FormSelect v-model="ocForm.almacen_id" label="Almacén de destino" placeholder="Selecciona..." :options="almacenOptions" required :error="ocErrors.almacen_id?.[0]" />
        <FormInput v-model="ocForm.fecha_esperada" label="Fecha esperada de entrega" type="date" :error="ocErrors.fecha_esperada?.[0]" />
        <FormTextarea v-model="ocForm.observaciones" label="Observaciones" :rows="2" :error="ocErrors.observaciones?.[0]" />

        <!-- Ítems -->
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Productos a comprar</p>
          <div v-for="(item, idx) in ocForm.items" :key="idx" class="mb-3 flex items-end gap-3">
            <div class="flex-1">
              <FormSelect v-model="item.producto_id" :label="idx === 0 ? 'Producto' : ''" placeholder="Selecciona..." :options="productoOptions" />
            </div>
            <div class="w-24">
              <FormInput v-model="item.cantidad" :label="idx === 0 ? 'Cantidad' : ''" type="number" min="1" />
            </div>
            <div class="w-32">
              <FormInput v-model="item.precio_unitario" :label="idx === 0 ? 'Precio unit.' : ''" type="number" min="0" step="0.01" />
            </div>
            <button type="button" class="mb-[2px] flex size-9 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" @click="removeOcItem(idx)">
              <NavIcon name="trash" class="size-4" />
            </button>
          </div>
          <button type="button" class="text-xs font-medium text-blue-600 hover:underline focus:outline-none" @click="addOcItem">+ Agregar producto</button>
        </div>

        <div v-if="ocError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ ocError }}</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showForm = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmit">
          {{ saving ? 'Creando...' : 'Crear orden de compra' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Detalle OC -->
    <ModalBase v-model="showDetalle" title="Detalle de orden de compra" description="Ítems y estado de la orden de compra">
      <div v-if="!detalleOC" class="py-8 text-center text-sm text-slate-400">Sin datos.</div>
      <div v-else class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div><p class="text-xs text-slate-400">Proveedor</p><p class="font-medium">{{ detalleOC.proveedor?.razon_social ?? '—' }}</p></div>
          <div><p class="text-xs text-slate-400">Almacén destino</p><p class="font-medium">{{ detalleOC.almacen?.nombre ?? '—' }}</p></div>
          <div><p class="text-xs text-slate-400">Estado</p><p class="font-medium">{{ statusLabel(detalleOC.status) }}</p></div>
          <div><p class="text-xs text-slate-400">Total</p><p class="font-mono font-medium">{{ formatCurrency(detalleOC.total) }}</p></div>
        </div>
        <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
          <li v-for="item in detalleOC.items ?? []" :key="item.id" class="flex items-center justify-between px-4 py-3">
            <div>
              <p class="text-sm font-medium text-slate-900">{{ item.producto?.nombre ?? '—' }}</p>
              <p class="text-xs text-slate-400">Solicitado: {{ item.cantidad }} · Recibido: {{ item.cantidad_recibida ?? 0 }}</p>
            </div>
            <span class="font-mono text-sm">{{ formatCurrency(item.precio_unitario) }}</span>
          </li>
        </ul>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showDetalle = false">Cerrar</button>
      </template>
    </ModalBase>

    <!-- Modal: Recepción de mercancía -->
    <ModalBase v-model="showRecepcion" title="Recepcionar mercancía" description="Registra las cantidades recibidas del proveedor. El stock se actualiza automáticamente.">
      <div v-if="recepcionOC" class="flex flex-col gap-4 pb-2">
        <p class="text-sm text-slate-600">Ingresa las cantidades y precios de costo reales recibidos.</p>
        <div v-for="item in recepcionItems" :key="item.orden_item_id" class="flex items-end gap-3">
          <div class="flex-1">
            <p class="text-xs text-slate-500 mb-1">{{ item.nombre }}</p>
            <p class="text-xs text-slate-400">Solicitado: {{ item.cantidad_solicitada }}</p>
          </div>
          <div class="w-24">
            <FormInput v-model="item.cantidad_recibida" label="Recibido" type="number" min="0" :max="item.cantidad_solicitada" />
          </div>
          <div class="w-32">
            <FormInput v-model="item.precio_costo_unitario" label="Precio costo" type="number" min="0" step="0.01" />
          </div>
        </div>
        <div v-if="recepcionError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ recepcionError }}</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showRecepcion = false">Cancelar</button>
        <button type="button" :disabled="savingRecepcion" class="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50" @click="handleRecibir">
          {{ savingRecepcion ? 'Procesando...' : 'Confirmar recepción' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invOrdenCompraService from '@/services/invOrdenCompraService.js'
import invProveedorService   from '@/services/invProveedorService.js'
import invAlmacenService     from '@/services/invAlmacenService.js'
import invProductoService    from '@/services/invProductoService.js'
import { authService }       from '@/services/authService.js'
import { useNotification }   from '@/composables/useNotification'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormTextarea    from '@/components/forms/FormTextarea.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import ModalBase       from '@/components/ModalBase.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)
const canCreate   = computed(() => hasPermission('inv_ocCrear'))
const canEnviar   = computed(() => hasPermission('inv_ocEnviar'))
const canRecibir  = computed(() => hasPermission('inv_ocRecibir'))
const canCancelar = computed(() => hasPermission('inv_ocCancelar'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const formatCurrency = (v) => v != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v) : '—'
const statusLabel = (s) => ({ borrador: 'Borrador', enviada: 'Enviada', recibida_parcial: 'Parcialmente recibida', recibida: 'Recibida', cancelada: 'Cancelada' }[s] ?? s)

const ordenes    = ref([])
const loading    = ref(false); const error = ref(''); const actionError = ref('')
const enviando   = ref({}); const cancelando = ref({})
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ status: '', proveedor_id: '', almacen_id: '' })
const proveedorOptions = ref([{ value: '', label: 'Todos' }])
const almacenOptions   = ref([{ value: '', label: 'Todos' }])
const productoOptions  = ref([])

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador',         label: 'Borrador' },
  { value: 'enviada',          label: 'Enviada' },
  { value: 'recibida_parcial', label: 'Parcialmente recibida' },
  { value: 'recibida',         label: 'Recibida' },
  { value: 'cancelada',        label: 'Cancelada' },
]

const tableColumns = [
  { key: 'numero',     label: 'N° OC' },
  { key: 'proveedor',  label: 'Proveedor' },
  { key: 'almacen',    label: 'Almacén' },
  { key: 'total',      label: 'Total estimado' },
  { key: 'status',     label: 'Estado' },
  { key: 'created_at', label: 'Fecha' },
]

async function loadSelectores() {
  try {
    const [provs, almacenes, productos] = await Promise.all([invProveedorService.getActivos(), invAlmacenService.getActivos(), invProductoService.getActivos()])
    proveedorOptions.value = [{ value: '', label: 'Todos' }, ...(provs.data ?? provs).map(p => ({ value: p.id, label: p.razon_social }))]
    almacenOptions.value   = [{ value: '', label: 'Todos' }, ...(almacenes.data ?? almacenes).map(a => ({ value: a.id, label: a.nombre }))]
    productoOptions.value  = (productos.data ?? productos).map(p => ({ value: p.id, label: p.nombre }))
  } catch { /* no bloquea */ }
}

async function loadOC(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 20 }
    if (filters.status)      params.status      = filters.status
    if (filters.proveedor_id) params.proveedor_id = filters.proveedor_id
    if (filters.almacen_id)   params.almacen_id   = filters.almacen_id
    const res = await invOrdenCompraService.getAll(params)
    ordenes.value = res.data ?? []
    if (res.meta) { pagination.currentPage = res.meta.current_page; pagination.lastPage = res.meta.last_page; pagination.total = res.meta.total; pagination.from = res.meta.from ?? 0; pagination.to = res.meta.to ?? 0 }
  } catch (e) { error.value = e?.response?.data?.message ?? 'Error al cargar las órdenes de compra.' }
  finally { loading.value = false }
}

function onFilterChange() { loadOC(1) }
function clearFilters() { Object.assign(filters, { status: '', proveedor_id: '', almacen_id: '' }); loadOC(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadOC(p) }

async function handleEnviar(row) {
  if (!confirm(`¿Enviar la OC #${row.id} al proveedor?`)) return
  enviando.value = { ...enviando.value, [row.id]: true }; actionError.value = ''
  try { await invOrdenCompraService.enviar(row.id); notifySuccess('Orden de compra enviada al proveedor.'); loadOC(pagination.currentPage) }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo enviar la OC.' }
  finally { const n = { ...enviando.value }; delete n[row.id]; enviando.value = n }
}

async function handleCancelar(row) {
  const motivo = prompt('Motivo de cancelación:')
  if (motivo === null) return
  cancelando.value = { ...cancelando.value, [row.id]: true }; actionError.value = ''
  try { await invOrdenCompraService.cancelar(row.id, motivo); notifySuccess('Orden de compra cancelada.'); loadOC(pagination.currentPage) }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo cancelar la OC.' }
  finally { const n = { ...cancelando.value }; delete n[row.id]; cancelando.value = n }
}

// ─── Detalle ───────────────────────────────────────────────────────────────────
const showDetalle = ref(false)
const detalleOC   = ref(null)

async function openDetalle(row) {
  try { const res = await invOrdenCompraService.getById(row.id); detalleOC.value = res.data ?? row }
  catch { detalleOC.value = row }
  showDetalle.value = true
}

// ─── Recepción ─────────────────────────────────────────────────────────────────
const showRecepcion    = ref(false)
const recepcionOC      = ref(null)
const recepcionItems   = ref([])
const savingRecepcion  = ref(false)
const recepcionError   = ref('')

async function openRecepcion(row) {
  try {
    const res = await invOrdenCompraService.getById(row.id)
    recepcionOC.value = res.data ?? row
    recepcionItems.value = (recepcionOC.value.items ?? []).map(item => ({
      orden_item_id: item.id,
      nombre: item.producto?.nombre ?? '—',
      cantidad_solicitada: item.cantidad,
      cantidad_recibida: item.cantidad - (item.cantidad_recibida ?? 0),
      precio_costo_unitario: item.precio_unitario ?? '',
    }))
  } catch { recepcionOC.value = row; recepcionItems.value = [] }
  recepcionError.value = ''; showRecepcion.value = true
}

async function handleRecibir() {
  savingRecepcion.value = true; recepcionError.value = ''
  const items = recepcionItems.value.map(i => ({ orden_item_id: i.orden_item_id, cantidad_recibida: Number(i.cantidad_recibida), precio_costo_unitario: Number(i.precio_costo_unitario) }))
  try {
    await invOrdenCompraService.recibir(recepcionOC.value.id, items)
    notifySuccess('Recepción registrada. El stock fue actualizado.')
    showRecepcion.value = false; loadOC(pagination.currentPage)
  } catch (e) { recepcionError.value = e?.response?.data?.message ?? 'Error al registrar la recepción.' }
  finally { savingRecepcion.value = false }
}

// ─── Formulario nueva OC ──────────────────────────────────────────────────────
const showForm = ref(false); const saving = ref(false)
const ocError = ref(''); const ocErrors = ref({})
const ocForm = reactive({ proveedor_id: '', almacen_id: '', fecha_esperada: '', observaciones: '', items: [{ producto_id: '', cantidad: 1, precio_unitario: '' }] })

function openCreate() {
  Object.assign(ocForm, { proveedor_id: '', almacen_id: '', fecha_esperada: '', observaciones: '', items: [{ producto_id: '', cantidad: 1, precio_unitario: '' }] })
  ocError.value = ''; ocErrors.value = {}; showForm.value = true
}
function addOcItem() { ocForm.items.push({ producto_id: '', cantidad: 1, precio_unitario: '' }) }
function removeOcItem(idx) { if (ocForm.items.length > 1) ocForm.items.splice(idx, 1) }

async function handleSubmit() {
  ocError.value = ''; ocErrors.value = {}; saving.value = true
  const payload = {
    proveedor_id: ocForm.proveedor_id,
    almacen_id: ocForm.almacen_id,
    fecha_esperada: ocForm.fecha_esperada || null,
    observaciones: ocForm.observaciones.trim() || null,
    items: ocForm.items.filter(i => i.producto_id).map(i => ({ producto_id: Number(i.producto_id), cantidad: Number(i.cantidad), precio_unitario: i.precio_unitario ? Number(i.precio_unitario) : null })),
  }
  try {
    await invOrdenCompraService.create(payload)
    notifySuccess('Orden de compra creada en estado borrador.')
    showForm.value = false; loadOC(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) { ocErrors.value = e.response.data?.errors ?? {}; ocError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { ocError.value = e?.response?.data?.message ?? 'Error al crear la OC.' }
  } finally { saving.value = false }
}

onMounted(() => { loadPermissions(); loadOC(1); loadSelectores() })
</script>
