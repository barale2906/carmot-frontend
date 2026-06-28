<template>
  <div class="flex flex-col gap-6">

    <!-- ── Estadísticas ─────────────────────────────────────────────────────── -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-cartera-heading">
      <h2 id="stats-cartera-heading" class="sr-only">Resumen de cartera</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-5" role="list">
        <li role="listitem">
          <StatCard title="Total"     :value="stats.total"     description="Cuotas registradas"       icon="cartera"       icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activas"   :value="stats.activas"   description="Pendientes de pago"       icon="pendientes"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Abonadas"  :value="stats.abonadas"  description="Con pagos parciales"      icon="disponible"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Cerradas"  :value="stats.cerradas"  description="Saldo en cero"            icon="activos"       icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Vencidas"  :value="stats.vencidas"  description="Fecha vencida con saldo"  icon="track_changes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- ── API no disponible ─────────────────────────────────────────────────── -->
    <section v-if="apiError" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
      <p class="text-sm text-amber-800">{{ apiError }}</p>
      <p class="mt-2 text-xs text-amber-700">
        Verifica que el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/carteras</code>
        esté disponible.
      </p>
    </section>

    <template v-else>

      <!-- ── Filtros ──────────────────────────────────────────────────────── -->
      <section aria-labelledby="filtros-cartera-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-cartera-heading" class="sr-only">Filtros de cartera</h2>
        <div class="flex flex-wrap items-end gap-4">

          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInput
              v-model="filters.estudiante_id"
              label="ID Estudiante:"
              type="number"
              placeholder="Ej: 42"
              help="Filtra todas las cuotas de un estudiante específico."
              @change="loadCartera(1)"
            />
          </div>

          <div class="w-full sm:w-[180px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              help="Filtra por estado de la cuota en el cobro."
              :options="statusFilterOptions"
            />
          </div>

          <div class="w-full sm:w-[170px]">
            <FormInput
              v-model="filters.fecha_desde"
              label="Vence desde:"
              type="date"
              help="Inicio del rango de vencimiento."
              @change="loadCartera(1)"
            />
          </div>

          <div class="w-full sm:w-[170px]">
            <FormInput
              v-model="filters.fecha_hasta"
              label="Vence hasta:"
              type="date"
              help="Fin del rango de vencimiento."
              @change="loadCartera(1)"
            />
          </div>

          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="filters.solo_pendientes
                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="togglePendientes"
            >
              Solo pendientes
            </button>

            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              :class="filters.solo_vencidas
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="toggleVencidas"
            >
              Solo vencidas
            </button>

            <button
              v-if="hayFiltros"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="limpiarFiltros"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <!-- ── Tabla ──────────────────────────────────────────────────────────── -->
      <section aria-labelledby="listado-cartera-heading">
        <SectionHeader
          id="listado-cartera-heading"
          title="Cartera — cuentas por cobrar"
          description="Cada fila es una cuota de pago generada al matricular un estudiante. La modificación del saldo ocurre a través de los recibos de pago."
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando cartera...</span>
        </div>

        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadCartera(1)">Reintentar</button>
        </div>

        <DataTable
          v-else
          :columns="tableColumns"
          :data="carteras"
          row-key="id"
          aria-label="Listado de cartera"
          actions-first
        >
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'numero_cuota'">
              <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                Cuota {{ value === 0 ? 'Matrícula' : value }}
              </span>
            </template>

            <template v-else-if="column.key === 'valor'">
              <span class="font-mono text-sm text-slate-900">$ {{ formatMoney(value) }}</span>
            </template>

            <template v-else-if="column.key === 'saldo'">
              <span class="font-mono text-sm" :class="Number(value) > 0 ? 'font-semibold text-amber-700' : 'text-slate-500'">
                $ {{ formatMoney(value) }}
              </span>
            </template>

            <template v-else-if="column.key === 'abono'">
              <span class="font-mono text-sm text-green-700">$ {{ formatMoney(value) }}</span>
            </template>

            <template v-else-if="column.key === 'status_text'">
              <StatusBadge :label="value ?? '—'" :variant="statusBadgeCarteraVariant(row.status)" />
            </template>

            <template v-else-if="column.key === 'fecha_vencimiento'">
              <span :class="esVencida(row) ? 'font-medium text-red-600' : 'text-slate-700'">
                {{ value ?? '—' }}
              </span>
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
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} cuotas
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

  <!-- ── Modal: Detalle de cartera ────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle de cartera" size="lg">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="cartera" class="size-5" />
      </span>
    </template>

    <div v-if="detailLoading" class="flex justify-center py-8">
      <span class="text-sm text-slate-500">Cargando detalle...</span>
    </div>

    <div v-else-if="detailCartera" class="space-y-4 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt class="font-medium text-slate-500">Cuota</dt>
          <dd class="mt-0.5 text-slate-900">
            {{ detailCartera.numero_cuota === 0 ? 'Matrícula' : `Cuota ${detailCartera.numero_cuota}` }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="detailCartera.status_text ?? '—'" :variant="statusBadgeCarteraVariant(detailCartera.status)" />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Valor original</dt>
          <dd class="mt-0.5 font-mono font-semibold text-slate-900">$ {{ formatMoney(detailCartera.valor) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Saldo pendiente</dt>
          <dd class="mt-0.5 font-mono font-semibold" :class="Number(detailCartera.saldo) > 0 ? 'text-amber-700' : 'text-green-700'">
            $ {{ formatMoney(detailCartera.saldo) }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Total abonado</dt>
          <dd class="mt-0.5 font-mono text-green-700">$ {{ formatMoney(detailCartera.abono) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Descuento aplicado</dt>
          <dd class="mt-0.5 font-mono text-slate-700">$ {{ formatMoney(detailCartera.descuento) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Vencimiento</dt>
          <dd class="mt-0.5" :class="esVencida(detailCartera) ? 'font-medium text-red-600' : 'text-slate-900'">
            {{ detailCartera.fecha_vencimiento ?? '—' }}
            <span v-if="esVencida(detailCartera)" class="ml-1 text-xs text-red-500">(vencida)</span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Sede</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCartera.sede?.nombre ?? detailCartera.sede_id }}</dd>
        </div>
        <div v-if="detailCartera.matricula" class="col-span-2">
          <dt class="font-medium text-slate-500">Matrícula</dt>
          <dd class="mt-0.5 text-slate-900">
            {{ detailCartera.matricula.curso ?? `ID ${detailCartera.matricula_id}` }}
            <span v-if="detailCartera.matricula.estudiante" class="text-slate-500"> — {{ detailCartera.matricula.estudiante }}</span>
          </dd>
        </div>
        <div v-if="detailCartera.observaciones" class="col-span-2">
          <dt class="font-medium text-slate-500">Observaciones</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailCartera.observaciones }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Última actualización</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailCartera.updated_at ?? '—' }}</dd>
        </div>
      </dl>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showDetailModal = false"
      >Cerrar</button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard      from '@/components/dashboard/StatCard.vue'
import DataTable     from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge   from '@/components/activos/StatusBadge.vue'
import FormInput     from '@/components/forms/FormInput.vue'
import FormSelect    from '@/components/forms/FormSelect.vue'
import NavIcon       from '@/components/icons/NavIcon.vue'
import ModalBase     from '@/components/ModalBase.vue'
import carteraService from '@/services/carteraService.js'

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'numero_cuota',      label: 'Cuota' },
  { key: 'fecha_vencimiento', label: 'Vencimiento' },
  { key: 'valor',             label: 'Valor' },
  { key: 'saldo',             label: 'Saldo' },
  { key: 'abono',             label: 'Abonado' },
  { key: 'status_text',       label: 'Estado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const carteras   = ref([])
const loading    = ref(false)
const error      = ref('')
const apiError   = ref('')

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, activas: 0, abonadas: 0, cerradas: 0, vencidas: 0 })
const filters    = reactive({
  estudiante_id:  '',
  status:         '',
  fecha_desde:    '',
  fecha_hasta:    '',
  solo_pendientes: false,
  solo_vencidas:   false,
})

const statusFilterOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '0', label: 'Activa' },
  { value: '1', label: 'Abonada' },
  { value: '2', label: 'Cerrada' },
  { value: '3', label: 'Anulada' },
  { value: '4', label: 'En Acuerdo' },
]

const hayFiltros = computed(() =>
  filters.estudiante_id || filters.status !== '' ||
  filters.fecha_desde || filters.fecha_hasta ||
  filters.solo_pendientes || filters.solo_vencidas
)

function statusBadgeCarteraVariant(status) {
  const map = { 0: 'disponible', 1: 'mantenimiento', 2: 'activo', 3: 'inactivo', 4: 'disponible' }
  return map[status] ?? 'inactivo'
}

function formatMoney(val) {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function esVencida(cartera) {
  if (!cartera.fecha_vencimiento) return false
  if (Number(cartera.saldo) <= 0) return false
  return new Date(cartera.fecha_vencimiento) < new Date()
}

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadCartera(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: pagination.perPage, sort_by: 'fecha_vencimiento', sort_direction: 'asc' }
    if (filters.estudiante_id)  params.estudiante_id   = filters.estudiante_id
    if (filters.status !== '')  params.status          = filters.status
    if (filters.fecha_desde)    params.fecha_desde     = filters.fecha_desde
    if (filters.fecha_hasta)    params.fecha_hasta     = filters.fecha_hasta
    if (filters.solo_pendientes) params.solo_pendientes = true
    if (filters.solo_vencidas)  params.solo_vencidas   = true

    const res = await carteraService.getAll(params)
    carteras.value = res.data ?? []
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
      apiError.value = 'El servicio de cartera no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar la cartera.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [activas, abonadas, cerradas, vencidas] = await Promise.all([
      carteraService.getAll({ per_page: 1, page: 1, status: 0 }),
      carteraService.getAll({ per_page: 1, page: 1, status: 1 }),
      carteraService.getAll({ per_page: 1, page: 1, status: 2 }),
      carteraService.getAll({ per_page: 1, page: 1, solo_vencidas: true }),
    ])
    stats.activas  = activas.meta?.total  ?? 0
    stats.abonadas = abonadas.meta?.total ?? 0
    stats.cerradas = cerradas.meta?.total ?? 0
    stats.vencidas = vencidas.meta?.total ?? 0
    stats.total    = stats.activas + stats.abonadas + stats.cerradas
  } catch {
    // Informativo, no bloquea la vista
  }
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
function togglePendientes() {
  filters.solo_pendientes = !filters.solo_pendientes
  if (filters.solo_pendientes) filters.solo_vencidas = false
}

function toggleVencidas() {
  filters.solo_vencidas = !filters.solo_vencidas
  if (filters.solo_vencidas) filters.solo_pendientes = false
}

function limpiarFiltros() {
  filters.estudiante_id   = ''
  filters.status          = ''
  filters.fecha_desde     = ''
  filters.fecha_hasta     = ''
  filters.solo_pendientes = false
  filters.solo_vencidas   = false
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadCartera(page)
}

watch(() => filters.status,          () => loadCartera(1))
watch(() => filters.solo_pendientes, () => loadCartera(1))
watch(() => filters.solo_vencidas,   () => loadCartera(1))

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailCartera   = ref(null)
const detailLoading   = ref(false)

async function openDetail(cartera) {
  detailCartera.value   = cartera
  showDetailModal.value = true
  detailLoading.value   = true
  try {
    const res = await carteraService.getById(cartera.id, { with: 'matricula,sede,estudiante' })
    detailCartera.value = res.data
  } catch {
    // Mantiene los datos del listado
  } finally {
    detailLoading.value = false
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadCartera(1)
  if (!apiError.value) {
    await loadStatistics()
  }
})
</script>
