<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros -->
    <section aria-labelledby="filtros-inv-recibos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-inv-recibos-heading" class="sr-only">Filtros de recibos</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <label class="mb-1 block text-xs font-medium text-slate-700">Buscar estudiante:</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Nombre o documento..."
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" :options="statusOptions" @change="loadRecibos(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_inicio" label="Desde:" type="date" @change="loadRecibos(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_fin" label="Hasta:" type="date" @change="loadRecibos(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="clearFilters">Limpiar</button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadRecibos(1)">Actualizar</button>
        </div>
      </div>
    </section>

    <!-- Carga / Error / Vacío -->
    <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
      <span class="text-sm text-slate-500">Cargando recibos de inventario...</span>
    </div>

    <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
      <p class="text-sm text-red-700">{{ error }}</p>
      <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadRecibos(1)">Reintentar</button>
    </div>

    <template v-else>
      <SectionHeader
        title="Recibos de pago — Inventario"
        description="Comprobantes de venta de inventario. Cada pedido puede generar uno o más recibos según los abonos registrados."
        class="mb-1"
      />

      <div v-if="!recibos.length" class="rounded-[14px] border border-black/10 bg-white py-16 text-center">
        <p class="text-sm text-slate-500">No se encontraron recibos con los filtros actuales.</p>
      </div>

      <!-- Tabla -->
      <div v-else class="overflow-hidden rounded-[14px] border border-black/10 bg-white">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-black/10 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th class="px-4 py-3">N.° Recibo</th>
                <th class="px-4 py-3">Estudiante</th>
                <th class="px-4 py-3">Cajero</th>
                <th class="px-4 py-3">Fecha</th>
                <th class="px-4 py-3 text-right">Valor</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              <tr v-for="r in recibos" :key="r.id" class="transition-colors hover:bg-slate-50">
                <td class="px-4 py-3 font-mono text-slate-800">
                  {{ r.numero_recibo ?? `#${r.id}` }}
                </td>
                <td class="px-4 py-3 font-medium text-slate-900">{{ r.estudiante?.name ?? '—' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ r.cajero?.name ?? '—' }}</td>
                <td class="px-4 py-3 text-slate-600">{{ r.fecha_recibo ?? '—' }}</td>
                <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                  $ {{ formatMoney(r.valor_total) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusClass(r.status)"
                  >{{ statusLabel(r.status) }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="r.numero_recibo"
                      type="button"
                      title="Descargar PDF"
                      class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      @click="descargarPdf(r)"
                    >
                      <NavIcon name="layout" class="size-4" />
                    </button>
                    <!-- Transferencias pendientes: acceso rápido -->
                    <span
                      v-if="r.status === 4"
                      class="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                    >Pendiente aprobación</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="pagination.lastPage > 1" class="flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}</p>
        <div class="flex gap-2">
          <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import reciboPagoService   from '@/services/reciboPagoService.js'
import SectionHeader       from '@/components/activos/SectionHeader.vue'
import NavIcon             from '@/components/icons/NavIcon.vue'
import FormSelect          from '@/components/forms/FormSelect.vue'
import FormInput           from '@/components/forms/FormInput.vue'

const recibos   = ref([])
const loading   = ref(false)
const error     = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters   = reactive({ search: '', status: '', fecha_inicio: '', fecha_fin: '' })

// Estados válidos para recibos de inventario (origen=0): 0=Anulado, 1=Creado, 4=Pend. aprobación, 5=Rechazado
const statusOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '1', label: 'Creado' },
  { value: '4', label: 'Pendiente aprobación (Transferencia)' },
  { value: '5', label: 'Rechazado' },
  { value: '0', label: 'Anulado' },
]

function statusLabel(s) {
  return { 0: 'Anulado', 1: 'Creado', 4: 'Pend. aprobación', 5: 'Rechazado' }[s] ?? `Status ${s}`
}

function statusClass(s) {
  return {
    0: 'bg-slate-100 text-slate-600',
    1: 'bg-blue-100 text-blue-800',
    4: 'bg-amber-100 text-amber-800',
    5: 'bg-red-100 text-red-800',
  }[s] ?? 'bg-slate-100 text-slate-700'
}

function formatMoney(val) {
  if (val == null) return '0'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

async function loadRecibos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 20, origen: 0 }
    if (filters.search)       params.search       = filters.search
    if (filters.status)       params.status       = filters.status
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio
    if (filters.fecha_fin)    params.fecha_fin    = filters.fecha_fin
    const res = await reciboPagoService.getAll(params)
    recibos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los recibos de inventario.'
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadRecibos(page)
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadRecibos(1), 400)
}

function clearFilters() {
  Object.assign(filters, { search: '', status: '', fecha_inicio: '', fecha_fin: '' })
  loadRecibos(1)
}

async function descargarPdf(recibo) {
  try {
    const res = await reciboPagoService.getPdf(recibo.id)
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a   = document.createElement('a')
    a.href     = url
    a.download = `recibo-inv-${recibo.numero_recibo ?? recibo.id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch { /* silencio — el PDF puede no estar listo aún */ }
}

onMounted(() => loadRecibos(1))
</script>
