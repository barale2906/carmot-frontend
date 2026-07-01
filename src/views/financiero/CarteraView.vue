<template>
  <div class="flex flex-col gap-6">

    <!-- ── Estadísticas ─────────────────────────────────────────────────────── -->
    <section v-if="!apiError" aria-labelledby="stats-cartera-heading">
      <h2 id="stats-cartera-heading" class="sr-only">Resumen de cartera</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-5" role="list">
        <li role="listitem">
          <StatCard title="Total cuotas"  :value="stats.total"     description="Cuotas registradas"      icon="cartera"       icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activas"       :value="stats.activas"   description="Pendientes de pago"      icon="pendientes"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Abonadas"      :value="stats.abonadas"  description="Con pagos parciales"     icon="disponible"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Cerradas"      :value="stats.cerradas"  description="Saldo en cero"           icon="activos"       icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Por cobrar"    :value="`$ ${formatMoney(stats.totalSaldo)}`" description="Saldo total pendiente" icon="cartera" icon-variant="amber" />
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

          <!-- Búsqueda de estudiante por nombre o documento -->
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <div class="flex flex-col gap-2">
              <span class="text-sm font-medium text-slate-900">Estudiante:</span>

              <!-- Estudiante seleccionado -->
              <div
                v-if="estudianteSeleccionado"
                class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3"
              >
                <div class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium text-slate-900">{{ estudianteSeleccionado.nombre }}</span>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  title="Limpiar filtro de estudiante"
                  @click="limpiarEstudiante"
                >
                  <NavIcon name="close" class="size-3.5" />
                </button>
              </div>

              <!-- Input de búsqueda -->
              <div v-else class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                  <NavIcon name="search" class="size-4" />
                </span>
                <input
                  v-model="busquedaEst"
                  type="search"
                  placeholder="Nombre o documento..."
                  class="w-full rounded-lg border-0 bg-[#f3f3f5] py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @input="onBusquedaEstInput"
                />
                <!-- Dropdown de resultados -->
                <div
                  v-if="resultadosEst.length || buscandoEst || sinResultadosEst"
                  class="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
                >
                  <div v-if="buscandoEst" class="px-4 py-3 text-sm text-slate-500">Buscando...</div>
                  <template v-else-if="resultadosEst.length">
                    <button
                      v-for="est in resultadosEst"
                      :key="est.id"
                      type="button"
                      class="flex w-full items-center justify-between border-b border-black/5 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500"
                      @mousedown.prevent="seleccionarEstudiante(est)"
                    >
                      <span class="truncate font-medium text-slate-900">{{ est.name ?? [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' ') }}</span>
                      <span class="ml-2 shrink-0 text-xs text-slate-500">{{ est.documento ?? est.email }}</span>
                    </button>
                  </template>
                  <p v-else-if="sinResultadosEst" class="px-4 py-3 text-sm text-slate-500">Sin resultados.</p>
                </div>
              </div>
            </div>
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

      <!-- ── Grupos de matrículas ───────────────────────────────────────────── -->
      <section aria-labelledby="listado-cartera-heading">
        <div class="mb-4 flex items-end justify-between gap-4">
          <SectionHeader
            id="listado-cartera-heading"
            title="Cartera — cuentas por cobrar"
            description="Cada grupo es una matrícula. Expande para ver el detalle de cuotas."
          />

          <!-- Resumen filtrado -->
          <div v-if="totalSaldoFiltrado !== null" class="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-right">
            <p class="text-xs font-medium text-amber-700">Total por cobrar (filtros)</p>
            <p class="text-base font-bold text-amber-900">$ {{ formatMoney(totalSaldoFiltrado) }}</p>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando cartera...</span>
        </div>

        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadCartera(1)">Reintentar</button>
        </div>

        <div v-else-if="grupos.length === 0" class="rounded-[14px] border border-black/10 bg-white px-6 py-16 text-center">
          <p class="text-sm text-slate-500">No hay registros de cartera que coincidan con los filtros.</p>
        </div>

        <div v-else class="flex flex-col gap-3">
          <article
            v-for="grupo in grupos"
            :key="grupo.matricula_id"
            class="overflow-hidden rounded-[14px] border border-black/10 bg-white"
          >
            <!-- Cabecera del grupo -->
            <button
              type="button"
              class="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              :aria-expanded="expandedGroups.has(grupo.matricula_id)"
              :aria-controls="`cuotas-${grupo.matricula_id}`"
              @click="toggleGrupo(grupo.matricula_id)"
            >
              <!-- Ícono expandir -->
              <span class="shrink-0 text-slate-400" aria-hidden="true">
                <NavIcon
                  :name="expandedGroups.has(grupo.matricula_id) ? 'expand_less' : 'expand_more'"
                  class="size-5"
                />
              </span>

              <!-- Datos del estudiante y matrícula -->
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">
                  {{ grupo.estudiante?.nombre ?? `Estudiante #${grupo.estudiante?.id}` }}
                </p>
                <p class="mt-0.5 truncate text-xs text-slate-500">
                  {{ grupo.matricula?.curso ?? `Matrícula #${grupo.matricula_id}` }}
                  <span v-if="grupo.sede?.nombre"> · {{ grupo.sede.nombre }}</span>
                  <span v-if="grupo.matricula?.fecha_matricula"> · Matric. {{ grupo.matricula.fecha_matricula }}</span>
                </p>
              </div>

              <!-- Totales del grupo -->
              <div class="hidden shrink-0 items-center gap-6 sm:flex" @click.stop>
                <div class="text-right">
                  <p class="text-xs text-slate-500">Cuotas</p>
                  <p class="text-sm font-medium text-slate-700">{{ grupo.carteras?.length ?? 0 }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-slate-500">Valor total</p>
                  <p class="font-mono text-sm font-medium text-slate-700">$ {{ formatMoney(grupo.total_valor) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-slate-500">Abonado</p>
                  <p class="font-mono text-sm font-medium text-green-700">$ {{ formatMoney(grupo.total_abono) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-slate-500">Saldo</p>
                  <p
                    class="font-mono text-sm font-semibold"
                    :class="grupo.total_saldo > 0 ? 'text-amber-700' : 'text-slate-400'"
                  >
                    $ {{ formatMoney(grupo.total_saldo) }}
                  </p>
                </div>
              </div>
            </button>

            <!-- Tabla de cuotas (colapsable) -->
            <div
              :id="`cuotas-${grupo.matricula_id}`"
              v-show="expandedGroups.has(grupo.matricula_id)"
            >
              <div class="border-t border-slate-100 overflow-x-auto">
                <table class="w-full min-w-[640px] text-left text-sm">
                  <thead class="bg-slate-50/80">
                    <tr>
                      <th class="px-5 py-2.5 text-xs font-medium text-slate-600">Cuota</th>
                      <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Vencimiento</th>
                      <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Valor</th>
                      <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Abonado</th>
                      <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Saldo</th>
                      <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Estado</th>
                      <th class="px-4 py-2.5 text-xs font-medium text-slate-600 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="cuota in grupo.carteras"
                      :key="cuota.id"
                      class="transition-colors hover:bg-slate-50/50"
                    >
                      <td class="px-5 py-3">
                        <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {{ cuota.numero_cuota === 0 ? 'Matrícula' : `Cuota ${cuota.numero_cuota}` }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <span :class="esVencida(cuota) ? 'font-medium text-red-600' : 'text-slate-700'">
                          {{ cuota.fecha_vencimiento ?? '—' }}
                          <span v-if="esVencida(cuota)" class="ml-1 text-xs text-red-400">(vencida)</span>
                        </span>
                      </td>
                      <td class="px-4 py-3 font-mono text-sm text-slate-900">$ {{ formatMoney(cuota.valor) }}</td>
                      <td class="px-4 py-3 font-mono text-sm text-green-700">$ {{ formatMoney(cuota.abono) }}</td>
                      <td class="px-4 py-3">
                        <span
                          class="font-mono text-sm"
                          :class="Number(cuota.saldo) > 0 ? 'font-semibold text-amber-700' : 'text-slate-400'"
                        >
                          $ {{ formatMoney(cuota.saldo) }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <StatusBadge :label="cuota.status_text ?? '—'" :variant="statusBadgeVariant(cuota.status)" />
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          type="button"
                          class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          title="Ver detalle de cuota"
                          @click="openDetail(cuota)"
                        >
                          <NavIcon name="eye" class="size-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} matrículas
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

  <!-- ── Modal: Detalle de cuota ───────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle de cuota" size="lg">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="cartera" class="size-5" />
      </span>
    </template>

    <div v-if="detailLoading" class="flex justify-center py-8">
      <span class="text-sm text-slate-500">Cargando detalle...</span>
    </div>

    <div v-else-if="detailCuota" class="space-y-4 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt class="font-medium text-slate-500">Cuota</dt>
          <dd class="mt-0.5 text-slate-900">
            {{ detailCuota.numero_cuota === 0 ? 'Matrícula' : `Cuota ${detailCuota.numero_cuota}` }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="detailCuota.status_text ?? '—'" :variant="statusBadgeVariant(detailCuota.status)" />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Valor original</dt>
          <dd class="mt-0.5 font-mono font-semibold text-slate-900">$ {{ formatMoney(detailCuota.valor) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Saldo pendiente</dt>
          <dd class="mt-0.5 font-mono font-semibold" :class="Number(detailCuota.saldo) > 0 ? 'text-amber-700' : 'text-green-700'">
            $ {{ formatMoney(detailCuota.saldo) }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Total abonado</dt>
          <dd class="mt-0.5 font-mono text-green-700">$ {{ formatMoney(detailCuota.abono) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Descuento aplicado</dt>
          <dd class="mt-0.5 font-mono text-slate-700">$ {{ formatMoney(detailCuota.descuento) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Vencimiento</dt>
          <dd class="mt-0.5" :class="esVencida(detailCuota) ? 'font-medium text-red-600' : 'text-slate-900'">
            {{ detailCuota.fecha_vencimiento ?? '—' }}
            <span v-if="esVencida(detailCuota)" class="ml-1 text-xs text-red-500">(vencida)</span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Sede</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCuota.sede?.nombre ?? detailCuota.sede_id }}</dd>
        </div>
        <div v-if="detailCuota.matricula" class="col-span-2">
          <dt class="font-medium text-slate-500">Matrícula</dt>
          <dd class="mt-0.5 text-slate-900">
            {{ detailCuota.matricula.curso ?? `ID ${detailCuota.matricula_id}` }}
            <span v-if="detailCuota.matricula.estudiante" class="text-slate-500"> — {{ detailCuota.matricula.estudiante }}</span>
          </dd>
        </div>
        <div v-if="detailCuota.observaciones" class="col-span-2">
          <dt class="font-medium text-slate-500">Observaciones</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailCuota.observaciones }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Última actualización</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailCuota.updated_at ?? '—' }}</dd>
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
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge   from '@/components/activos/StatusBadge.vue'
import FormInput     from '@/components/forms/FormInput.vue'
import FormSelect    from '@/components/forms/FormSelect.vue'
import NavIcon       from '@/components/icons/NavIcon.vue'
import ModalBase     from '@/components/ModalBase.vue'
import carteraService from '@/services/carteraService.js'
import userService    from '@/services/userService.js'

// ─── Estado del listado ───────────────────────────────────────────────────────
const grupos             = ref([])
const loading            = ref(false)
const error              = ref('')
const apiError           = ref('')
const totalSaldoFiltrado = ref(null)

const expandedGroups = ref(new Set())

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, activas: 0, abonadas: 0, cerradas: 0, totalSaldo: 0 })

const filters = reactive({
  estudiante_id:   '',
  status:          '',
  fecha_desde:     '',
  fecha_hasta:     '',
  solo_pendientes: false,
  solo_vencidas:   false,
})

const statusFilterOptions = [
  { value: '',   label: 'Todos los estados' },
  { value: '0',  label: 'Activa' },
  { value: '1',  label: 'Abonada' },
  { value: '2',  label: 'Cerrada' },
  { value: '3',  label: 'Anulada' },
  { value: '4',  label: 'En Acuerdo' },
]

const hayFiltros = computed(() =>
  filters.estudiante_id || filters.status !== '' ||
  filters.fecha_desde || filters.fecha_hasta ||
  filters.solo_pendientes || filters.solo_vencidas
)

function statusBadgeVariant(status) {
  const map = { 0: 'disponible', 1: 'mantenimiento', 2: 'activo', 3: 'inactivo', 4: 'disponible' }
  return map[status] ?? 'inactivo'
}

function formatMoney(val) {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function esVencida(cuota) {
  if (!cuota.fecha_vencimiento) return false
  if (Number(cuota.saldo) <= 0) return false
  return new Date(cuota.fecha_vencimiento) < new Date()
}

// ─── Acordeón ─────────────────────────────────────────────────────────────────
function toggleGrupo(matriculaId) {
  const next = new Set(expandedGroups.value)
  if (next.has(matriculaId)) {
    next.delete(matriculaId)
  } else {
    next.add(matriculaId)
  }
  expandedGroups.value = next
}

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadCartera(page = 1) {
  if (apiError.value) return
  loading.value          = true
  error.value            = ''
  totalSaldoFiltrado.value = null

  try {
    const params = { page, per_page: pagination.perPage }
    if (filters.estudiante_id)   params.estudiante_id    = filters.estudiante_id
    if (filters.status !== '')   params.status           = filters.status
    if (filters.fecha_desde)     params.fecha_desde      = filters.fecha_desde
    if (filters.fecha_hasta)     params.fecha_hasta      = filters.fecha_hasta
    if (filters.solo_pendientes) params.solo_pendientes  = true
    if (filters.solo_vencidas)   params.solo_vencidas    = true

    const res = await carteraService.getAll(params)
    grupos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
      totalSaldoFiltrado.value = res.meta.total_saldo_filtrado ?? null
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
    const res = await carteraService.getReportes()
    const porStatus = res.data?.por_status ?? []

    stats.activas   = porStatus.find(s => s.status === 0)?.total  ?? 0
    stats.abonadas  = porStatus.find(s => s.status === 1)?.total  ?? 0
    stats.cerradas  = porStatus.find(s => s.status === 2)?.total  ?? 0
    stats.total     = stats.activas + stats.abonadas + stats.cerradas
    stats.totalSaldo = res.data?.total_saldo ?? 0
  } catch {
    // Informativo, no bloquea la vista
  }
}

// ─── Búsqueda de estudiante (filtro) ─────────────────────────────────────────
const busquedaEst          = ref('')
const resultadosEst        = ref([])
const buscandoEst          = ref(false)
const sinResultadosEst     = ref(false)
const estudianteSeleccionado = ref(null)  // { id, nombre, documento }
let   searchTimerEst       = null

function onBusquedaEstInput() {
  clearTimeout(searchTimerEst)
  sinResultadosEst.value = false
  resultadosEst.value    = []
  if (busquedaEst.value.length < 3) return
  searchTimerEst = setTimeout(ejecutarBusquedaEst, 400)
}

async function ejecutarBusquedaEst() {
  if (busquedaEst.value.length < 3) return
  buscandoEst.value      = true
  resultadosEst.value    = []
  sinResultadosEst.value = false
  try {
    const res = await userService.getAll({ search: busquedaEst.value, per_page: 10 })
    resultadosEst.value    = res.data ?? []
    sinResultadosEst.value = resultadosEst.value.length === 0
  } catch {
    sinResultadosEst.value = true
  } finally {
    buscandoEst.value = false
  }
}

function seleccionarEstudiante(est) {
  estudianteSeleccionado.value = {
    id:        est.id,
    nombre:    est.name ?? [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' '),
    documento: est.documento ?? est.email ?? '',
  }
  filters.estudiante_id  = est.id
  resultadosEst.value    = []
  busquedaEst.value      = ''
  sinResultadosEst.value = false
  loadCartera(1)
}

function limpiarEstudiante() {
  estudianteSeleccionado.value = null
  filters.estudiante_id        = ''
  busquedaEst.value            = ''
  resultadosEst.value          = []
  sinResultadosEst.value       = false
  loadCartera(1)
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
  estudianteSeleccionado.value = null
  busquedaEst.value            = ''
  resultadosEst.value          = []
  sinResultadosEst.value       = false
  filters.estudiante_id        = ''
  filters.status               = ''
  filters.fecha_desde          = ''
  filters.fecha_hasta          = ''
  filters.solo_pendientes      = false
  filters.solo_vencidas        = false
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadCartera(page)
}

watch(() => filters.status,          () => loadCartera(1))
watch(() => filters.solo_pendientes, () => loadCartera(1))
watch(() => filters.solo_vencidas,   () => loadCartera(1))

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailCuota     = ref(null)
const detailLoading   = ref(false)

async function openDetail(cuota) {
  detailCuota.value     = cuota
  showDetailModal.value = true
  detailLoading.value   = true
  try {
    const res = await carteraService.getById(cuota.id, { with: 'matricula,sede,estudiante' })
    detailCuota.value = res.data
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
