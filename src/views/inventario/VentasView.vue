<template>
  <div class="flex flex-col gap-6">

    <!-- Acción principal: Nueva venta -->
    <section v-if="canCreate" aria-labelledby="nueva-venta-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 id="nueva-venta-heading" class="text-sm font-semibold text-slate-700">Caja de inventario</h2>
          <p class="mt-0.5 text-xs text-slate-500">Registra una nueva venta de productos del inventario a un estudiante.</p>
        </div>
        <button
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openNuevaVenta"
        >
          <NavIcon name="plus" class="size-4" /> Nueva venta
        </button>
      </div>
    </section>

    <!-- Filtros de pedidos -->
    <section aria-labelledby="filtros-pedidos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-pedidos-heading" class="sr-only">Filtros de pedidos</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="statusOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.almacen_id" label="Almacén:" placeholder="Todos" :options="almacenOptions" @change="onFilterChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla de pedidos -->
    <section aria-labelledby="listado-pedidos-heading">
      <SectionHeader id="listado-pedidos-heading" title="Pedidos de inventario" description="Registro de ventas de inventario. Los pedidos activos tienen saldo pendiente; los entregados están completamente pagados y despachados." class="mb-4" />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando pedidos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPedidos(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="pedidos" row-key="id" aria-label="Listado de pedidos de inventario" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'estudiante'">
            <span class="font-medium text-slate-900">{{ row.estudiante?.nombre_completo ?? row.estudiante?.name ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'almacen'">
            {{ row.almacen?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'total'">
            <span class="font-mono">{{ formatCurrency(value) }}</span>
          </template>
          <template v-else-if="column.key === 'saldo'">
            <span class="font-mono" :class="value > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'">{{ formatCurrency(value) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-amber-100 text-amber-800':  row.status === 'activo',
                'bg-blue-100 text-blue-800':    row.status === 'pagado',
                'bg-purple-100 text-purple-800': row.status === 'entregando',
                'bg-green-100 text-green-800':  row.status === 'entregado',
                'bg-red-100 text-red-800':      row.status === 'cancelado',
              }"
            >{{ statusLabel(row.status) }}</span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ value ? value.split('T')[0] : '—' }}
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Ver detalle / imprimir recibo" @click="openDetalle(row)">
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            v-if="canAbonar && row.status === 'activo'"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Abonar al pedido"
            @click="openAbono(row)"
          >
            <NavIcon name="receipt" class="size-4" />
          </button>
          <button
            v-if="canCancelar && row.status === 'activo'"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Cancelar pedido"
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

    <!-- Modal: Nueva venta (wizard) -->
    <InvVentaWizardModal
      v-if="showNuevaVenta"
      :almacenes="almacenesActivos"
      @close="showNuevaVenta = false"
      @venta-creada="onVentaCreada"
    />

    <!-- Modal: Abono a pedido activo -->
    <ModalBase v-model="showAbono" :title="`Abonar al pedido #${abonoTarget?.id ?? ''}`" description="Registra un abono adicional al pedido activo">
      <div v-if="abonoTarget" class="flex flex-col gap-4 pb-2">
        <div class="rounded-lg bg-slate-50 p-4 text-sm">
          <p class="text-xs text-slate-400">Estudiante</p>
          <p class="font-medium text-slate-900">{{ abonoTarget.estudiante?.nombre_completo ?? '—' }}</p>
          <p class="mt-2 text-xs text-slate-400">Saldo pendiente</p>
          <p class="text-lg font-bold text-amber-700">{{ formatCurrency(abonoTarget.saldo) }}</p>
        </div>
        <FormInput v-model="abonoForm.monto" label="Monto del abono" type="number" min="1" :max="abonoTarget.saldo" required :error="abonoErrors.monto_abono?.[0]" />
        <FormSelect v-model="abonoForm.medio_pago" label="Medio de pago" :options="mediosPagoOptions" :error="abonoErrors['medios_pago.0.medio_pago']?.[0]" />
        <template v-if="abonoForm.medio_pago === 'transferencia'">
          <FormSelect v-model="abonoForm.banco_id" label="Banco" placeholder="Selecciona..." :options="bancoOptions" :error="abonoErrors['medios_pago.0.banco_id']?.[0]" />
          <FormInput v-model="abonoForm.referencia" label="Referencia de la transferencia" placeholder="Ej: REF-2024-001" :error="abonoErrors['medios_pago.0.referencia']?.[0]" />
        </template>
        <div v-if="abonoError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ abonoError }}</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showAbono = false">Cancelar</button>
        <button type="button" :disabled="savingAbono" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleAbono">
          {{ savingAbono ? 'Procesando...' : 'Registrar abono' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Detalle / Recibo -->
    <InvReciboPrintModal
      v-if="showDetallePedido"
      :pedido="detallePedido"
      @close="showDetallePedido = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invPedidoService  from '@/services/invPedidoService.js'
import invVentaService   from '@/services/invVentaService.js'
import invAlmacenService from '@/services/invAlmacenService.js'
import bancoService      from '@/services/bancoService.js'
import { authService }   from '@/services/authService.js'
import { useNotification } from '@/composables/useNotification'
import SectionHeader    from '@/components/activos/SectionHeader.vue'
import DataTable        from '@/components/activos/DataTable.vue'
import NavIcon          from '@/components/icons/NavIcon.vue'
import FormInput        from '@/components/forms/FormInput.vue'
import FormSelect       from '@/components/forms/FormSelect.vue'
import ModalBase        from '@/components/ModalBase.vue'
import InvVentaWizardModal from '@/components/inventario/InvVentaWizardModal.vue'
import InvReciboPrintModal from '@/components/inventario/InvReciboPrintModal.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)
const canCreate    = computed(() => hasPermission('inv_ventasCrear'))
const canAbonar    = computed(() => hasPermission('inv_ventasAbonar'))
const canCancelar  = computed(() => hasPermission('inv_pedidosCancelar'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const formatCurrency = (v) => v != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v) : '—'
const statusLabel = (s) => ({ activo: 'Activo', pagado: 'Pagado', entregando: 'Entregando', entregado: 'Entregado', cancelado: 'Cancelado' }[s] ?? s)

const pedidos    = ref([])
const loading    = ref(false); const error = ref(''); const actionError = ref(''); const cancelando = ref({})
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ status: '', almacen_id: '' })
const almacenOptions    = ref([{ value: '', label: 'Todos los almacenes' }])
const almacenesActivos  = ref([])
const bancoOptions      = ref([])

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'activo',     label: 'Activo' },
  { value: 'pagado',     label: 'Pagado' },
  { value: 'entregando', label: 'Entregando' },
  { value: 'entregado',  label: 'Entregado' },
  { value: 'cancelado',  label: 'Cancelado' },
]

const mediosPagoOptions = [
  { value: 'efectivo',     label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta',      label: 'Tarjeta' },
]

const tableColumns = [
  { key: 'estudiante',  label: 'Estudiante' },
  { key: 'almacen',    label: 'Almacén' },
  { key: 'total',      label: 'Total' },
  { key: 'saldo',      label: 'Saldo pendiente' },
  { key: 'status',     label: 'Estado' },
  { key: 'created_at', label: 'Fecha' },
]

async function loadSelectores() {
  try {
    const [almacenes, bancos] = await Promise.all([invAlmacenService.getActivos(), bancoService.getActivos()])
    almacenesActivos.value = almacenes.data ?? almacenes ?? []
    almacenOptions.value   = [{ value: '', label: 'Todos los almacenes' }, ...almacenesActivos.value.map(a => ({ value: a.id, label: a.nombre }))]
    bancoOptions.value     = (bancos.data ?? bancos ?? []).map(b => ({ value: b.id, label: b.nombre }))
  } catch { /* no bloquea */ }
}

async function loadPedidos(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 20 }
    if (filters.status)     params.status     = filters.status
    if (filters.almacen_id) params.almacen_id = filters.almacen_id
    const res = await invPedidoService.getAll(params)
    pedidos.value = res.data ?? []
    if (res.meta) { pagination.currentPage = res.meta.current_page; pagination.lastPage = res.meta.last_page; pagination.total = res.meta.total; pagination.from = res.meta.from ?? 0; pagination.to = res.meta.to ?? 0 }
  } catch (e) { error.value = e?.response?.data?.message ?? 'Error al cargar los pedidos.' }
  finally { loading.value = false }
}

function onFilterChange() { loadPedidos(1) }
function clearFilters() { filters.status = ''; filters.almacen_id = ''; loadPedidos(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadPedidos(p) }

async function handleCancelar(row) {
  const motivo = prompt('Motivo de cancelación del pedido:')
  if (motivo === null) return
  cancelando.value = { ...cancelando.value, [row.id]: true }; actionError.value = ''
  try { await invPedidoService.cancelar(row.id, motivo); notifySuccess('Pedido cancelado.'); loadPedidos(pagination.currentPage) }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo cancelar el pedido.' }
  finally { const n = { ...cancelando.value }; delete n[row.id]; cancelando.value = n }
}

// ─── Detalle / Recibo ─────────────────────────────────────────────────────────
const showDetallePedido = ref(false)
const detallePedido     = ref(null)

async function openDetalle(row) {
  try {
    const res = await invPedidoService.getById(row.id)
    detallePedido.value = res.data ?? row
  } catch { detallePedido.value = row }
  showDetallePedido.value = true
}

// ─── Nueva venta ──────────────────────────────────────────────────────────────
const showNuevaVenta = ref(false)
function openNuevaVenta() { showNuevaVenta.value = true }
function onVentaCreada(pedido) {
  showNuevaVenta.value = false
  notifySuccess('Venta registrada correctamente.')
  loadPedidos(1)
  detallePedido.value = pedido
  showDetallePedido.value = true
}

// ─── Abono ────────────────────────────────────────────────────────────────────
const showAbono   = ref(false)
const abonoTarget = ref(null)
const savingAbono = ref(false)
const abonoError  = ref('')
const abonoErrors = ref({})
const abonoForm   = reactive({ monto: '', medio_pago: 'efectivo', banco_id: '', referencia: '' })

function openAbono(row) {
  abonoTarget.value = row
  Object.assign(abonoForm, { monto: row.saldo ?? '', medio_pago: 'efectivo', banco_id: '', referencia: '' })
  abonoError.value = ''; abonoErrors.value = {}; showAbono.value = true
}

async function handleAbono() {
  abonoError.value = ''; abonoErrors.value = {}; savingAbono.value = true
  const medio = { medio_pago: abonoForm.medio_pago, valor: Number(abonoForm.monto) }
  if (abonoForm.medio_pago === 'transferencia') { medio.banco_id = abonoForm.banco_id; medio.referencia = abonoForm.referencia }
  try {
    await invVentaService.abonar(abonoTarget.value.id, { monto_abono: Number(abonoForm.monto), medios_pago: [medio] })
    notifySuccess('Abono registrado correctamente.')
    showAbono.value = false; loadPedidos(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) { abonoErrors.value = e.response.data?.errors ?? {}; abonoError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { abonoError.value = e?.response?.data?.message ?? 'Error al registrar el abono.' }
  } finally { savingAbono.value = false }
}

onMounted(() => { loadPermissions(); loadPedidos(1); loadSelectores() })
</script>
