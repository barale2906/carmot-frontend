<template>
  <div class="flex flex-col gap-6">

    <!-- Acciones -->
    <section aria-labelledby="acciones-movimientos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="acciones-movimientos-heading" class="mb-4 text-sm font-semibold text-slate-700">Registrar movimiento</h2>
      <div class="flex flex-wrap gap-3">
        <button v-if="canRegistrar" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openMovimiento('entrada')">
          <NavIcon name="plus" class="size-4" /> Entrada de mercancía
        </button>
        <button v-if="canRegistrar" type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openMovimiento('ajuste')">
          <NavIcon name="edit" class="size-4" /> Ajuste de inventario
        </button>
        <button v-if="canRegistrar" type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openMovimiento('traslado')">
          <NavIcon name="layout" class="size-4" /> Traslado entre almacenes
        </button>
        <button v-if="canRegistrar" type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openMovimiento('devolucion')">
          <NavIcon name="eye" class="size-4" /> Devolución de cliente
        </button>
      </div>
    </section>

    <!-- Filtros -->
    <section aria-labelledby="filtros-movimientos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-movimientos-heading" class="sr-only">Filtros</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.tipo" label="Tipo:" placeholder="Todos" :options="tipoOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.almacen_id" label="Almacén:" placeholder="Todos" :options="almacenOptions" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_inicio" label="Desde:" type="date" @change="onFilterChange" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_fin" label="Hasta:" type="date" @change="onFilterChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
        </div>
      </div>
    </section>

    <!-- Tabla de movimientos -->
    <section aria-labelledby="historial-movimientos-heading">
      <SectionHeader id="historial-movimientos-heading" title="Historial de movimientos" description="Registro de todas las entradas, ajustes, traslados y devoluciones de inventario." class="mb-4" />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando movimientos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadMovimientos(1)">Reintentar</button>
      </div>

      <DataTable v-else :columns="tableColumns" :data="movimientos" row-key="id" aria-label="Historial de movimientos" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'tipo'">
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800':   tipoRaw(row) === 'entrada',
                'bg-blue-100 text-blue-800':     tipoRaw(row) === 'ajuste',
                'bg-purple-100 text-purple-800': tipoRaw(row) === 'traslado',
                'bg-amber-100 text-amber-800':   tipoRaw(row) === 'devolucion',
              }"
            >{{ tipoLabel(tipoRaw(row)) }}</span>
          </template>
          <template v-else-if="column.key === 'almacen'">
            {{ row.almacen?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'productos'">
            <ul v-if="lineasDeRow(row).length" class="flex flex-col gap-0.5">
              <li v-for="l in lineasDeRow(row)" :key="l.id" class="text-sm text-slate-900">
                {{ l.producto?.nombre ?? '—' }}
              </li>
            </ul>
            <span v-else class="text-slate-400">—</span>
          </template>
          <template v-else-if="column.key === 'cantidad'">
            <ul v-if="lineasDeRow(row).length" class="flex flex-col gap-0.5">
              <li v-for="l in lineasDeRow(row)" :key="l.id" class="text-sm font-mono font-medium text-slate-800">{{ Math.abs(Number(l.cantidad)) }}</li>
            </ul>
            <span v-else class="text-slate-400">—</span>
          </template>
          <template v-else-if="column.key === 'usuario'">
            <span class="text-slate-700">{{ usuarioNombre(row) ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'numero_documento'">
            <code v-if="value" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value }}</code>
            <span v-else class="text-slate-400">—</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge
              :label="row.status === 'anulado' ? 'Anulado' : 'Confirmado'"
              :variant="row.status === 'anulado' ? 'inactivo' : 'activo'"
            />
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
            v-if="canAnular && row.status !== 'anulado'"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Anular movimiento"
            :disabled="!!anulando[row.id]"
            @click="handleAnular(row)"
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

    <!-- Modal: Nuevo movimiento -->
    <ModalBase v-model="showMovimiento" :title="tituloMovimiento" :description="descripcionMovimiento" size="lg">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmitMovimiento">
        <FormSelect v-model="movForm.almacen_id" :label="labelAlmacen" placeholder="Selecciona..." :options="almacenFormOptions" required :error="movErrors.almacen_id?.[0]" />
        <FormSelect
          v-if="movForm.tipo === 'entrada'"
          v-model="movForm.proveedor_id"
          label="Proveedor"
          placeholder="Selecciona el proveedor..."
          :options="proveedorOptions"
          :error="movErrors.proveedor_id?.[0]"
        />
        <FormSelect
          v-if="movForm.tipo === 'traslado'"
          v-model="movForm.almacen_destino_id"
          label="Almacén destino"
          placeholder="Selecciona..."
          :options="almacenFormOptions"
          required
          :error="movErrors.almacen_destino_id?.[0]"
        />
        <FormTextarea v-model="movForm.motivo" label="Motivo / Observaciones" placeholder="Motivo u observaciones del movimiento..." :rows="2" />

        <!-- Líneas del movimiento -->
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Líneas del movimiento</p>
          <div v-for="(linea, idx) in movForm.lineas" :key="idx" class="mb-3 flex gap-3 items-end">
            <div class="flex-1">
              <InvProductoBuscador
                :label="idx === 0 ? 'Producto' : ''"
                placeholder="Buscar producto..."
                :clear-on-select="false"
                @select="p => linea.producto_id = p.id"
                @clear="() => linea.producto_id = ''"
              />
            </div>
            <div class="w-24">
              <FormInput v-model="linea.cantidad" :label="idx === 0 ? 'Cantidad' : ''" type="number" min="1" />
            </div>
            <div v-if="movForm.tipo === 'ajuste'" class="w-32">
              <FormSelect
                v-model="linea.tipo_ajuste"
                :label="idx === 0 ? 'Tipo ajuste' : ''"
                :options="[{ value: 'ajuste_positivo', label: 'Positivo (+)' }, { value: 'ajuste_negativo', label: 'Negativo (-)' }]"
                placeholder="Tipo..."
              />
            </div>
            <div v-if="movForm.tipo === 'entrada'" class="w-28">
              <FormInput v-model="linea.precio_costo" :label="idx === 0 ? 'Costo unit.' : ''" type="number" min="0" step="0.01" placeholder="0.00" />
            </div>
            <button type="button" class="mb-[2px] flex size-9 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" @click="removeLinea(idx)">
              <NavIcon name="trash" class="size-4" />
            </button>
          </div>
          <button type="button" class="text-xs font-medium text-blue-600 hover:underline focus:outline-none" @click="addLinea">+ Agregar línea</button>
        </div>

        <div v-if="movError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ movError }}</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showMovimiento = false">Cancelar</button>
        <button type="button" :disabled="savingMov" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmitMovimiento">
          {{ savingMov ? 'Registrando...' : 'Registrar movimiento' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Detalle movimiento -->
    <ModalBase v-model="showDetalle" title="Detalle del movimiento" description="Líneas y datos del movimiento seleccionado" size="lg">
      <div v-if="!detalleItem" class="py-8 text-center text-sm text-slate-400">Sin datos.</div>
      <div v-else class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
          <div><p class="text-xs text-slate-400">Tipo</p><p class="font-medium">{{ tipoLabel(tipoRaw(detalleItem)) }}</p></div>
          <div><p class="text-xs text-slate-400">Fecha</p><p class="font-medium">{{ detalleItem.created_at?.split('T')[0] ?? '—' }}</p></div>
          <div><p class="text-xs text-slate-400">Almacén</p><p class="font-medium">{{ detalleItem.almacen?.nombre ?? '—' }}</p></div>
          <div v-if="detalleItem.almacen_destino"><p class="text-xs text-slate-400">Destino</p><p class="font-medium">{{ detalleItem.almacen_destino?.nombre }}</p></div>
          <div v-if="detalleItem.proveedor"><p class="text-xs text-slate-400">Proveedor</p><p class="font-medium">{{ detalleItem.proveedor?.razon_social ?? '—' }}</p></div>
          <div><p class="text-xs text-slate-400">N° Documento</p><p class="font-medium font-mono">{{ detalleItem.numero_documento ?? '—' }}</p></div>
          <div><p class="text-xs text-slate-400">Estado</p><p :class="detalleItem.status === 'anulado' ? 'font-medium text-red-600' : 'font-medium text-green-700'">{{ detalleItem.status === 'anulado' ? 'Anulado' : 'Confirmado' }}</p></div>
        </div>
        <div v-if="detalleItem.motivo" class="text-sm text-slate-600">
          <p class="text-xs text-slate-400">Motivo / Observaciones</p>
          <p>{{ detalleItem.motivo }}</p>
        </div>
        <ul v-if="detalleLíneas.length" class="divide-y divide-slate-100 rounded-lg border border-slate-200">
          <li v-for="l in detalleLíneas" :key="l.id" class="flex items-center justify-between px-4 py-3">
            <div>
              <p class="text-sm font-medium text-slate-900">{{ l.producto?.nombre ?? '—' }}</p>
              <p class="text-xs text-slate-400">{{ l.producto?.codigo ?? '' }}</p>
            </div>
            <span class="text-sm font-bold" :class="l.cantidad > 0 ? 'text-green-700' : 'text-red-700'">
              {{ l.cantidad > 0 ? '+' : '' }}{{ l.cantidad }}
            </span>
          </li>
        </ul>
        <p v-else class="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">Sin líneas registradas</p>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showDetalle = false">Cerrar</button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import invMovimientoService from '@/services/invMovimientoService.js'
import invAlmacenService    from '@/services/invAlmacenService.js'
import invProveedorService  from '@/services/invProveedorService.js'
import { authService }      from '@/services/authService.js'
import { useNotification }  from '@/composables/useNotification'
import SectionHeader  from '@/components/activos/SectionHeader.vue'
import DataTable      from '@/components/activos/DataTable.vue'
import StatusBadge    from '@/components/activos/StatusBadge.vue'
import NavIcon        from '@/components/icons/NavIcon.vue'
import FormInput      from '@/components/forms/FormInput.vue'
import FormTextarea   from '@/components/forms/FormTextarea.vue'
import FormSelect           from '@/components/forms/FormSelect.vue'
import InvProductoBuscador from '@/components/inventario/InvProductoBuscador.vue'
import ModalBase           from '@/components/ModalBase.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const canRegistrar = computed(() => userPermissions.value.includes('inv_movimientosRegistrar'))
const canAnular    = computed(() => userPermissions.value.includes('inv_movimientosAnular'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const movimientos = ref([])
const loading = ref(false); const error = ref(''); const actionError = ref(''); const anulando = ref({})
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters = reactive({ tipo: '', almacen_id: '', fecha_inicio: '', fecha_fin: '' })
const almacenOptions      = ref([{ value: '', label: 'Todos los almacenes' }])
const almacenFormOptions  = computed(() => almacenOptions.value.filter(o => o.value !== ''))
const proveedorOptions    = ref([])

// El backend puede devolver el tipo en 'tipo_documento' o en 'tipo'
const tipoRaw   = (row) => row?.tipo_documento ?? row?.tipo ?? ''
const tipoLabel = (t) => ({ entrada: 'Entrada', ajuste: 'Ajuste', traslado: 'Traslado', devolucion: 'Devolución' }[t] ?? t)
const tipoOptions = [{ value: '', label: 'Todos' }, { value: 'entrada', label: 'Entrada' }, { value: 'salida', label: 'Salida' }, { value: 'ajuste', label: 'Ajuste' }, { value: 'traslado', label: 'Traslado' }, { value: 'devolucion', label: 'Devolución' }]

const tableColumns = [
  { key: 'tipo',              label: 'Tipo' },
  { key: 'almacen',          label: 'Almacén' },
  { key: 'productos',        label: 'Producto(s)' },
  { key: 'cantidad',         label: 'Cantidad' },
  { key: 'usuario',          label: 'Registrado por' },
  { key: 'numero_documento', label: 'N° Documento' },
  { key: 'status',           label: 'Estado' },
  { key: 'created_at',       label: 'Fecha' },
]

// Helpers para las celdas de productos/cantidades del listado
const lineasDeRow     = (row) => row?.movimientos ?? row?.lineas ?? row?.detalles ?? row?.items ?? []
const productosResumen = (row) => {
  const ls = lineasDeRow(row)
  if (!ls.length) return null
  const primero = ls[0]?.producto?.nombre ?? ls[0]?.nombre ?? '—'
  return { nombre: primero, extras: ls.length - 1 }
}
const cantidadTotal = (row) => {
  const ls = lineasDeRow(row)
  return ls.reduce((s, l) => s + Math.abs(Number(l.cantidad ?? 0)), 0) || null
}
const usuarioNombre = (row) => row?.usuario?.nombre ?? row?.usuario?.name ?? row?.user?.name ?? null

async function loadSelectores() {
  try {
    const [almacenes, proveedores] = await Promise.all([invAlmacenService.getActivos(), invProveedorService.getActivos()])
    almacenOptions.value   = [{ value: '', label: 'Todos los almacenes' }, ...(almacenes.data ?? almacenes).map(a => ({ value: a.id, label: a.nombre }))]
    proveedorOptions.value = (proveedores.data ?? proveedores).map(p => ({ value: p.id, label: p.razon_social }))
  } catch { /* no bloquea */ }
}

async function loadMovimientos(page = 1) {
  loading.value = true; error.value = ''
  try {
    const params = { page, per_page: 20, sort: 'created_at', direction: 'desc' }
    if (filters.tipo)         params.tipo_documento = filters.tipo
    if (filters.almacen_id)   params.almacen_id   = filters.almacen_id
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio
    if (filters.fecha_fin)    params.fecha_fin    = filters.fecha_fin
    const res = await invMovimientoService.getAll(params)
    movimientos.value = res.data ?? []
    if (res.meta) { pagination.currentPage = res.meta.current_page; pagination.lastPage = res.meta.last_page; pagination.total = res.meta.total; pagination.from = res.meta.from ?? 0; pagination.to = res.meta.to ?? 0 }
  } catch (e) { error.value = e?.response?.data?.message ?? 'Error al cargar los movimientos.' }
  finally { loading.value = false }
}

function onFilterChange() { loadMovimientos(1) }
function clearFilters() { Object.assign(filters, { tipo: '', almacen_id: '', fecha_inicio: '', fecha_fin: '' }); loadMovimientos(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadMovimientos(p) }

async function handleAnular(row) {
  const motivo = prompt(`Motivo de anulación del movimiento:`)
  if (motivo === null) return
  anulando.value = { ...anulando.value, [row.id]: true }; actionError.value = ''
  try { await invMovimientoService.anular(row.id, motivo); notifySuccess('Movimiento anulado.'); loadMovimientos(pagination.currentPage) }
  catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo anular el movimiento.' }
  finally { const n = { ...anulando.value }; delete n[row.id]; anulando.value = n }
}

// ─── Detalle ───────────────────────────────────────────────────────────────────
const showDetalle    = ref(false)
const detalleItem    = ref(null)
const detalleLoading = ref(false)
const detalleLíneas  = computed(() => detalleItem.value?.movimientos ?? detalleItem.value?.lineas ?? detalleItem.value?.detalles ?? [])

async function openDetalle(row) {
  showDetalle.value   = true
  detalleLoading.value = true
  try { const res = await invMovimientoService.getById(row.id); detalleItem.value = res.data ?? row }
  catch { detalleItem.value = row } finally { detalleLoading.value = false }
}

// ─── Nuevo movimiento ──────────────────────────────────────────────────────────
const showMovimiento  = ref(false)
const savingMov       = ref(false)
const movError        = ref('')
const movErrors       = ref({})
const movForm = reactive({ tipo: 'entrada', proveedor_id: '', almacen_id: '', almacen_destino_id: '', motivo: '', lineas: [{ producto_id: '', cantidad: 1, tipo_ajuste: '', precio_costo: '' }] })

const tituloMovimiento      = computed(() => ({ entrada: 'Entrada de mercancía', ajuste: 'Ajuste de inventario', traslado: 'Traslado entre almacenes', devolucion: 'Devolución de cliente' }[movForm.tipo] ?? 'Nuevo movimiento'))
const descripcionMovimiento = computed(() => ({ entrada: 'Registra el ingreso de productos al almacén.', ajuste: 'Corrige diferencias en el conteo de inventario.', traslado: 'Mueve productos de un almacén a otro.', devolucion: 'Registra la devolución de productos de un cliente.' }[movForm.tipo] ?? ''))
const labelAlmacen          = computed(() => ({ entrada: 'Almacén de destino', ajuste: 'Almacén', traslado: 'Almacén origen', devolucion: 'Almacén' }[movForm.tipo] ?? 'Almacén'))

function openMovimiento(tipo) {
  Object.assign(movForm, { tipo, proveedor_id: '', almacen_id: '', almacen_destino_id: '', motivo: '', lineas: [{ producto_id: '', cantidad: 1, tipo_ajuste: '', precio_costo: '' }] })
  movError.value = ''; movErrors.value = {}; showMovimiento.value = true
}

function addLinea() { movForm.lineas.push({ producto_id: '', cantidad: 1, tipo_ajuste: '', precio_costo: '' }) }
function removeLinea(idx) { if (movForm.lineas.length > 1) movForm.lineas.splice(idx, 1) }

async function handleSubmitMovimiento() {
  movError.value = ''; movErrors.value = {}; savingMov.value = true
  const payload = {
    tipo_documento: movForm.tipo,
    almacen_id: movForm.almacen_id,
    almacen_destino_id: movForm.almacen_destino_id || undefined,
    proveedor_id: movForm.proveedor_id || undefined,
    motivo: movForm.motivo.trim() || undefined,
    lineas: movForm.lineas.filter(l => l.producto_id).map(l => {
      const item = { producto_id: Number(l.producto_id), cantidad: Number(l.cantidad) }
      if (movForm.tipo === 'ajuste' && l.tipo_ajuste) item.tipo_ajuste = l.tipo_ajuste
      if (movForm.tipo === 'entrada' && l.precio_costo) item.precio_costo = Number(l.precio_costo)
      return item
    }),
  }
  try {
    await invMovimientoService.create(payload)
    notifySuccess('Movimiento registrado correctamente.')
    showMovimiento.value = false
    loadMovimientos(1)
  } catch (e) {
    if (e?.response?.status === 422) { movErrors.value = e.response.data?.errors ?? {}; movError.value = e.response.data?.message ?? 'Verifica los datos.' }
    else { movError.value = e?.response?.data?.message ?? 'Error al registrar el movimiento.' }
  } finally { savingMov.value = false }
}

onMounted(() => { loadPermissions(); loadMovimientos(1); loadSelectores() })
</script>
