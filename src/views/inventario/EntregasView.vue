<template>
  <div class="flex flex-col gap-6">

    <!-- Tabs de bandeja -->
    <div class="flex gap-1 rounded-xl border border-black/10 bg-white p-1">
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="tab === 'pendientes' ? 'bg-[#213360] text-white' : 'text-slate-600 hover:bg-slate-100'"
        @click="tab = 'pendientes'"
      >
        Entregas pendientes
        <span v-if="paginacionPendientes.total" class="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{{ paginacionPendientes.total }}</span>
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="tab === 'necesidades' ? 'bg-[#213360] text-white' : 'text-slate-600 hover:bg-slate-100'"
        @click="tab = 'necesidades'"
      >
        Necesidades de compra
        <span v-if="paginacionNecesidades.total" class="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">{{ paginacionNecesidades.total }}</span>
      </button>
    </div>

    <!-- Panel: Entregas pendientes -->
    <section v-if="tab === 'pendientes'" aria-labelledby="entregas-pendientes-heading">
      <SectionHeader id="entregas-pendientes-heading" title="Entregas pendientes de despacho" description="Pedidos pagados con productos por entregar. Puedes entregar por cantidad o, en los kits, componente por componente." class="mb-4" />

      <div v-if="loadingPendientes" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando entregas pendientes...</span>
      </div>
      <div v-else-if="errorPendientes" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ errorPendientes }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPendientes(paginacionPendientes.currentPage)">Reintentar</button>
      </div>
      <div v-else-if="!pendientes.length" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <div class="text-center">
          <p class="text-sm font-medium text-slate-700">Sin entregas pendientes</p>
          <p class="mt-1 text-xs text-slate-400">Todos los pedidos pagados han sido despachados.</p>
        </div>
      </div>
      <ul v-else class="flex flex-col gap-4">
        <li
          v-for="pedido in pendientes"
          :key="pedido.id"
          class="rounded-[14px] border border-black/10 bg-white px-6 py-4"
        >
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <p class="text-sm font-semibold text-slate-900">Pedido #{{ pedido.id }}</p>
              <p class="text-xs text-slate-500">
                {{ pedido.estudiante?.nombre ?? '—' }}
                <span v-if="pedido.estudiante?.documento"> · {{ pedido.estudiante.documento }}</span>
                <span v-if="pedido.almacen?.nombre"> · Almacén: {{ pedido.almacen.nombre }}</span>
              </p>
            </div>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="pedido.status === 'pagado' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
            >{{ pedido.status === 'pagado' ? 'Pagado' : 'Entregando' }}</span>
          </div>

          <!-- Ítems por entregar -->
          <div class="divide-y divide-slate-100">
            <InvEntregaItemCard
              v-for="item in itemsPorEntregar(pedido)"
              :key="item.id"
              :item="item"
              :can-completar="canCompletar"
              @actualizado="loadPendientes(paginacionPendientes.currentPage)"
            />
          </div>

          <!-- Ítems ya entregados (solo referencia) -->
          <p v-if="itemsEntregados(pedido).length" class="mt-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
            Ya entregado: {{ itemsEntregados(pedido).map(i => `${i.producto?.nombre ?? '—'} ×${i.cantidad}`).join(', ') }}
          </p>
        </li>
      </ul>

      <div v-if="paginacionPendientes.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ paginacionPendientes.from }}–{{ paginacionPendientes.to }} de {{ paginacionPendientes.total }}</p>
        <div class="flex gap-2">
          <button type="button" :disabled="paginacionPendientes.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadPendientes(paginacionPendientes.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="paginacionPendientes.currentPage === paginacionPendientes.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadPendientes(paginacionPendientes.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>

    <!-- Panel: Necesidades de compra -->
    <section v-if="tab === 'necesidades'" aria-labelledby="necesidades-heading">
      <SectionHeader id="necesidades-heading" title="Necesidades de compra pendientes" description="Productos vendidos cuyo stock no alcanza para entregarlos. Cuando llegue el producto vía orden de compra, podrás completar la entrega." class="mb-4" />

      <div v-if="loadingNecesidades" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando necesidades...</span>
      </div>
      <div v-else-if="!necesidades.length" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <div class="text-center">
          <p class="text-sm font-medium text-slate-700">Sin necesidades pendientes</p>
          <p class="mt-1 text-xs text-slate-400">Todo el inventario está cubierto.</p>
        </div>
      </div>

      <template v-else>
        <DataTable :columns="necesidadesColumns" :data="necesidades" row-key="id" aria-label="Necesidades de compra">
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'producto'">
              <span class="font-medium text-slate-900">{{ row.producto?.nombre ?? '—' }}</span>
              <span v-if="row.producto?.codigo" class="ml-1 text-xs text-slate-400">{{ row.producto.codigo }}</span>
            </template>
            <template v-else-if="column.key === 'estudiante'">{{ row.estudiante?.nombre ?? '—' }}</template>
            <template v-else-if="column.key === 'almacen'">{{ row.almacen?.nombre ?? '—' }}</template>
            <template v-else-if="column.key === 'pedido_id'">
              <code v-if="row.pedido_id" class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">#{{ row.pedido_id }}</code>
              <span v-else>—</span>
            </template>
            <template v-else>{{ value ?? '—' }}</template>
          </template>
        </DataTable>

        <div v-if="paginacionNecesidades.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">Mostrando {{ paginacionNecesidades.from }}–{{ paginacionNecesidades.to }} de {{ paginacionNecesidades.total }}</p>
          <div class="flex gap-2">
            <button type="button" :disabled="paginacionNecesidades.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadNecesidades(paginacionNecesidades.currentPage - 1)">Anterior</button>
            <button type="button" :disabled="paginacionNecesidades.currentPage === paginacionNecesidades.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadNecesidades(paginacionNecesidades.currentPage + 1)">Siguiente</button>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import invEntregaService  from '@/services/invEntregaService.js'
import { authService }    from '@/services/authService.js'
import { itemEntregado }  from '@/utils/invEntregas.js'
import SectionHeader      from '@/components/activos/SectionHeader.vue'
import DataTable          from '@/components/activos/DataTable.vue'
import InvEntregaItemCard from '@/components/inventario/InvEntregaItemCard.vue'

const PER_PAGE = 15

const userPermissions = ref([])
const canCompletar = computed(() => userPermissions.value.includes('inv_entregasCompletar'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const tab = ref('pendientes')

function nuevaPaginacion() {
  return reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
}

function aplicarMeta(paginacion, meta) {
  if (!meta) return
  paginacion.currentPage = meta.current_page
  paginacion.lastPage    = meta.last_page
  paginacion.total       = meta.total
  paginacion.from        = meta.from ?? 0
  paginacion.to          = meta.to ?? 0
}

// ─── Entregas pendientes ───────────────────────────────────────────────────────
const pendientes           = ref([])
const loadingPendientes    = ref(false)
const errorPendientes      = ref('')
const paginacionPendientes = nuevaPaginacion()

async function loadPendientes(page = 1) {
  // Tras una entrega se recarga sin mostrar el loader para no desmontar las tarjetas
  if (!pendientes.value.length) loadingPendientes.value = true
  errorPendientes.value = ''
  try {
    const res = await invEntregaService.getPendientes({ page, per_page: PER_PAGE })
    pendientes.value = res.data ?? []
    aplicarMeta(paginacionPendientes, res.meta)
    // Si la página quedó vacía tras entregar su último pedido, retroceder una
    if (!pendientes.value.length && page > 1) return loadPendientes(page - 1)
  } catch (e) {
    errorPendientes.value = e?.response?.data?.message ?? 'Error al cargar las entregas.'
  } finally {
    loadingPendientes.value = false
  }
}

const itemsPorEntregar = (pedido) => (pedido.items ?? []).filter(i => !itemEntregado(i))
const itemsEntregados  = (pedido) => (pedido.items ?? []).filter(itemEntregado)

// ─── Necesidades de compra ─────────────────────────────────────────────────────
const necesidades           = ref([])
const loadingNecesidades    = ref(false)
const paginacionNecesidades = nuevaPaginacion()

async function loadNecesidades(page = 1) {
  loadingNecesidades.value = true
  try {
    const res = await invEntregaService.getNecesidades({ page, per_page: PER_PAGE })
    necesidades.value = res.data ?? []
    aplicarMeta(paginacionNecesidades, res.meta)
  } catch { necesidades.value = [] }
  finally { loadingNecesidades.value = false }
}

const necesidadesColumns = [
  { key: 'pedido_id',          label: 'Pedido' },
  { key: 'estudiante',         label: 'Estudiante' },
  { key: 'producto',           label: 'Producto' },
  { key: 'almacen',            label: 'Almacén' },
  { key: 'cantidad_necesaria', label: 'Cantidad faltante' },
]

// Las necesidades cambian con cada entrega: se recargan al abrir la pestaña
watch(tab, (t) => { if (t === 'necesidades') loadNecesidades(paginacionNecesidades.currentPage) })

onMounted(() => { loadPermissions(); loadPendientes(); loadNecesidades() })
</script>
