<template>
  <div class="flex flex-col gap-6">

    <TurnoCajaAviso v-if="canCreate" />

    <!-- Acción principal: Nueva venta -->
    <section v-if="canCreate" aria-labelledby="nueva-venta-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 id="nueva-venta-heading" class="text-sm font-semibold text-slate-700">Caja de inventario</h2>
          <p class="mt-0.5 text-xs text-slate-500">Registra una nueva venta de productos del inventario a un estudiante.</p>
        </div>
        <button
          type="button"
          :disabled="!listaVigente"
          class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openNuevaVenta"
        >
          <NavIcon name="plus" class="size-4" /> Nueva venta
        </button>
      </div>
      <p v-if="!listaVigente" class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        No hay una lista de precios de inventario activa y vigente. Activa una lista en Inventario → Precios de venta para poder vender.
      </p>
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
            <span class="font-medium text-slate-900">{{ row.estudiante?.nombre ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'almacen'">
            {{ row.almacen?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'valor_total'">
            <span class="font-mono">{{ formatCurrency(value) }}</span>
          </template>
          <template v-else-if="column.key === 'saldo'">
            <span class="font-mono" :class="value > 0 ? 'text-amber-700 font-medium' : 'text-slate-400'">{{ formatCurrency(value) }}</span>
            <span v-if="row.abono_pendiente_aprobacion > 0" class="block text-xs text-blue-700">
              {{ formatCurrency(row.abono_pendiente_aprobacion) }} en transferencia por aprobar
            </span>
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
            {{ value ? new Date(value).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }) : '—' }}
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
            title="Cancelar pedido (anula sus recibos)"
            @click="openAnulacion(row, 'cancelar')"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
          <button
            v-if="canAnular && row.status !== 'cancelado'"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-orange-100 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Anular pedido (reintegra inventario y anula recibos)"
            @click="openAnulacion(row, 'anular')"
          >
            <NavIcon name="track_changes" class="size-4" />
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
      @close="showNuevaVenta = false"
      @venta-creada="onVentaCreada"
    />

    <!-- Banner: transferencia pendiente de notificación -->
    <div v-if="pendingNotifyRecibo" class="rounded-[14px] border border-amber-200 bg-amber-50 p-5">
      <p class="text-sm font-semibold text-amber-900">Transferencia pendiente de aprobación</p>
      <p class="mt-1 text-xs text-amber-700">
        La venta fue registrada. El recibo quedó en estado <strong>Pendiente de aprobación</strong>.
        Notifica al validador para que revise el comprobante.
      </p>
      <div class="mt-3 flex gap-3">
        <button
          type="button"
          :disabled="notificando"
          class="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @click="handleNotificarTransferencia"
        >
          {{ notificando ? 'Enviando...' : 'Notificar al validador' }}
        </button>
        <button type="button" class="text-xs text-amber-700 underline" @click="pendingNotifyRecibo = null">Omitir</button>
      </div>
    </div>

    <!-- Modal: Abono a pedido activo -->
    <ModalBase v-model="showAbono" :title="`Abonar al pedido #${abonoTarget?.id ?? ''}`" description="Registra un abono adicional al pedido activo">
      <div v-if="abonoTarget" class="flex flex-col gap-4 pb-2">
        <div class="rounded-lg bg-slate-50 p-4 text-sm">
          <p class="text-xs text-slate-400">Estudiante</p>
          <p class="font-medium text-slate-900">{{ abonoTarget.estudiante?.nombre ?? '—' }}</p>
          <p class="mt-2 text-xs text-slate-400">Saldo pendiente</p>
          <p class="text-lg font-bold text-amber-700">{{ formatCurrency(abonoTarget.saldo) }}</p>
          <p v-if="abonoPendienteAprobacion > 0" class="mt-1 text-xs text-blue-700">
            {{ formatCurrency(abonoPendienteAprobacion) }} en transferencias por aprobar · disponible para abonar: {{ formatCurrency(abonoDisponible) }}
          </p>
        </div>
        <FormInput v-model="abonoForm.monto" label="Monto del abono" type="number" min="1" :max="abonoDisponible" required :error="abonoErrors.monto_abono?.[0]" />
        <FormSelect v-model="abonoForm.medio_pago" label="Medio de pago" :options="mediosPagoOptions" :error="abonoErrors['medios_pago.0.medio_pago']?.[0]" />
        <template v-if="abonoForm.medio_pago === 'transferencia'">
          <FormSelect v-model="abonoForm.banco_id" label="Banco" placeholder="Selecciona..." :options="bancoOptions" :error="abonoErrors['medios_pago.0.banco_id']?.[0]" />
          <FormInput v-model="abonoForm.referencia" label="Referencia de la transferencia" placeholder="Ej: REF-2024-001" :error="abonoErrors['medios_pago.0.referencia']?.[0]" />
        </template>
        <p v-if="abonoForm.medio_pago === 'transferencia'" class="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          La transferencia queda por aprobar: no se suma al pedido ni se entrega nada hasta que el validador la apruebe.
          Al aprobarla, si el pedido queda pagado, los productos quedan pendientes en Entregas.
        </p>
        <!-- Al saldar el pedido el backend despacha el inventario, salvo que el cajero lo difiera -->
        <label v-else-if="Number(abonoForm.monto) >= Number(abonoTarget.saldo)" class="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
          <input v-model="abonoForm.entrega_inmediata" type="checkbox" class="mt-0.5 rounded" />
          <span>
            <span class="block text-sm font-medium text-slate-800">Entregar ahora los productos disponibles</span>
            <span class="block text-xs text-slate-500">Si lo desmarcas, todo queda pendiente en Entregas.</span>
          </span>
        </label>
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

    <!-- Modal: Cancelar / anular pedido (motivo obligatorio) -->
    <ModalBase
      v-model="showAnulacion"
      :title="anulacionAccion === 'anular' ? `Anular pedido #${anulacionTarget?.id ?? ''}` : `Cancelar pedido #${anulacionTarget?.id ?? ''}`"
      description="Esta acción no se puede deshacer."
    >
      <div v-if="anulacionTarget" class="space-y-4 pb-2">
        <p class="text-sm text-slate-700">
          Pedido de <strong>{{ anulacionTarget.estudiante?.nombre ?? '—' }}</strong>
          por <strong>{{ formatCurrency(anulacionTarget.valor_total) }}</strong>. Al confirmar:
        </p>
        <ul class="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li v-if="anulacionAccion === 'anular' && anulacionTarget.status !== 'activo'">
            Todo lo ya entregado vuelve al almacén (documento de devolución) y se cancelan sus necesidades de compra.
          </li>
          <li v-else>No se mueve inventario: el pedido aún no tiene entregas.</li>
          <li v-if="Number(anulacionTarget.abono_acumulado) > 0 || Number(anulacionTarget.abono_pendiente_aprobacion) > 0">
            Se anulan todos sus recibos
            (abonado {{ formatCurrency(anulacionTarget.abono_acumulado) }}<template v-if="Number(anulacionTarget.abono_pendiente_aprobacion) > 0">
            + {{ formatCurrency(anulacionTarget.abono_pendiente_aprobacion) }} en transferencias por aprobar</template>):
            <strong>debes devolver ese dinero al estudiante</strong>.
          </li>
          <li v-else>El pedido no tiene dinero recibido.</li>
        </ul>
        <div>
          <label for="motivo-anulacion-pedido" class="mb-1 block text-sm font-medium text-slate-700">
            Motivo <span class="text-red-500">*</span>
          </label>
          <textarea
            id="motivo-anulacion-pedido"
            v-model="motivoAnulacion"
            rows="3"
            maxlength="500"
            placeholder="Describe por qué se cancela el pedido..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-right text-xs text-slate-400">{{ motivoAnulacion.length }}/500</p>
        </div>
        <div v-if="anulacionError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ anulacionError }}</div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showAnulacion = false">Volver</button>
        <button type="button" :disabled="anulandoPedido || motivoAnulacion.trim().length < 5" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500" @click="confirmarAnulacion">
          {{ anulandoPedido ? 'Procesando...' : (anulacionAccion === 'anular' ? 'Confirmar anulación' : 'Confirmar cancelación') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Recibo de caja de un pago, o estado de cuenta del pedido -->
    <InvReciboPrintModal
      v-if="showDetallePedido"
      :pedido="detallePedido"
      :recibo-id="detalleReciboId"
      @close="showDetallePedido = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invPedidoService  from '@/services/invPedidoService.js'
import invVentaService   from '@/services/invVentaService.js'
import TurnoCajaAviso   from '@/components/financiero/libroDiario/TurnoCajaAviso.vue'
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
const canAnular    = computed(() => hasPermission('inv_pedidosAnular'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

// Sin lista de precios de inventario activa y vigente no se puede vender (el backend lo rechaza)
const listaVigente = ref(true)

async function loadListaVigente() {
  try { const res = await invVentaService.preciosVigentes(); listaVigente.value = !!res.data?.disponible }
  catch { listaVigente.value = true /* si falla la consulta, el backend sigue validando al vender */ }
}

const formatCurrency = (v) => v != null ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v) : '—'
const statusLabel = (s) => ({ activo: 'Activo', pagado: 'Pagado', entregando: 'Entregando', entregado: 'Entregado', cancelado: 'Cancelado' }[s] ?? s)

const pedidos    = ref([])
const loading    = ref(false); const error = ref(''); const actionError = ref('')
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
  { key: 'valor_total', label: 'Total' },
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

// ─── Cancelar / anular ────────────────────────────────────────────────────────
const showAnulacion   = ref(false)
const anulacionTarget = ref(null)
const anulacionAccion = ref('anular')
const motivoAnulacion = ref('')
const anulacionError  = ref('')
const anulandoPedido  = ref(false)

function openAnulacion(row, accion) {
  anulacionTarget.value = row
  anulacionAccion.value = accion
  motivoAnulacion.value = ''
  anulacionError.value  = ''
  showAnulacion.value   = true
}

async function confirmarAnulacion() {
  anulandoPedido.value = true; anulacionError.value = ''
  try {
    const servicio = anulacionAccion.value === 'anular' ? invPedidoService.anular : invPedidoService.cancelar
    const res = await servicio(anulacionTarget.value.id, motivoAnulacion.value.trim())
    notifySuccess(res?.message ?? 'Pedido cancelado.')
    showAnulacion.value = false
    loadPedidos(pagination.currentPage)
  } catch (e) {
    const errs = e?.response?.data?.errors ?? {}
    anulacionError.value = Object.values(errs).flat().join(' ') || e?.response?.data?.message || 'No se pudo cancelar el pedido.'
  } finally { anulandoPedido.value = false }
}

// ─── Detalle / Recibo ─────────────────────────────────────────────────────────
const showDetallePedido = ref(false)
const detallePedido     = ref(null)
// Con un recibo, el modal imprime el recibo de caja de ese pago; sin él, el estado de cuenta del pedido
const detalleReciboId   = ref(null)

async function openDetalle(row, reciboId = null) {
  try {
    const res = await invPedidoService.getById(row.id)
    detallePedido.value = res.data ?? row
  } catch { detallePedido.value = row }
  detalleReciboId.value   = reciboId
  showDetallePedido.value = true
}

// ─── Nueva venta ──────────────────────────────────────────────────────────────
const showNuevaVenta      = ref(false)
const pendingNotifyRecibo = ref(null)
const notificando         = ref(false)

function openNuevaVenta() { showNuevaVenta.value = true }

function onVentaCreada(pedido, recibo) {
  showNuevaVenta.value = false
  loadPedidos(1)
  // Si el recibo quedó en PENDIENTE_APROBACION (status 4) por transferencia, mostrar banner
  if (recibo && recibo.status === 4) {
    pendingNotifyRecibo.value = recibo
  }
  openDetalle(pedido, recibo?.id ?? null)
}

async function handleNotificarTransferencia() {
  if (!pendingNotifyRecibo.value) return
  notificando.value = true
  try {
    const res = await invVentaService.notificarTransferencia(pendingNotifyRecibo.value.id)
    notifySuccess(res.message ?? 'Validadores notificados.')
    pendingNotifyRecibo.value = null
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al notificar al validador.'
  } finally {
    notificando.value = false
  }
}

// ─── Abono ────────────────────────────────────────────────────────────────────
const showAbono   = ref(false)
const abonoTarget = ref(null)
const savingAbono = ref(false)
const abonoError  = ref('')
const abonoErrors = ref({})
const abonoForm   = reactive({ monto: '', medio_pago: 'efectivo', banco_id: '', referencia: '', entrega_inmediata: true })

// Las transferencias por aprobar no descuentan el saldo, pero sí reservan ese monto
const abonoPendienteAprobacion = computed(() => Number(abonoTarget.value?.abono_pendiente_aprobacion ?? 0))
const abonoDisponible = computed(() => Math.max(0, Number(abonoTarget.value?.saldo ?? 0) - abonoPendienteAprobacion.value))

function openAbono(row) {
  abonoTarget.value = row
  Object.assign(abonoForm, { monto: Math.max(0, Number(row.saldo ?? 0) - Number(row.abono_pendiente_aprobacion ?? 0)), medio_pago: 'efectivo', banco_id: '', referencia: '', entrega_inmediata: true })
  abonoError.value = ''; abonoErrors.value = {}; showAbono.value = true
}

async function handleAbono() {
  abonoError.value = ''; abonoErrors.value = {}; savingAbono.value = true
  const medio = { medio_pago: abonoForm.medio_pago, valor: Number(abonoForm.monto) }
  if (abonoForm.medio_pago === 'transferencia') { medio.banco_id = abonoForm.banco_id; medio.referencia = abonoForm.referencia }
  try {
    const res = await invVentaService.abonar(abonoTarget.value.id, {
      monto_abono:       Number(abonoForm.monto),
      medios_pago:       [medio],
      entrega_inmediata: abonoForm.entrega_inmediata,
    })
    notifySuccess(res?.message ?? 'Abono registrado correctamente.')
    showAbono.value = false; loadPedidos(pagination.currentPage)
    // Cada abono genera su propio recibo de caja: se abre para imprimirlo o enviarlo
    openDetalle(abonoTarget.value, res?.recibo?.id ?? null)
  } catch (e) {
    if (e?.response?.status === 422) { abonoErrors.value = e.response.data?.errors ?? {}; abonoError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { abonoError.value = e?.response?.data?.message ?? 'Error al registrar el abono.' }
  } finally { savingAbono.value = false }
}

onMounted(() => { loadPermissions(); loadPedidos(1); loadSelectores(); loadListaVigente() })
</script>
