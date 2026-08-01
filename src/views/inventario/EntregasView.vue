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
        <span v-if="pendientes.length" class="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{{ pendientes.length }}</span>
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="tab === 'necesidades' ? 'bg-[#213360] text-white' : 'text-slate-600 hover:bg-slate-100'"
        @click="tab = 'necesidades'"
      >
        Necesidades de compra
        <span v-if="necesidades.length" class="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">{{ necesidades.length }}</span>
      </button>
    </div>

    <!-- Panel: Entregas pendientes -->
    <section v-if="tab === 'pendientes'" aria-labelledby="entregas-pendientes-heading">
      <SectionHeader id="entregas-pendientes-heading" title="Entregas pendientes de despacho" description="Pedidos pagados cuyo stock no fue despachado automáticamente. Marca cada ítem como entregado cuando tengas el producto disponible." class="mb-4" />

      <div v-if="loadingPendientes" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando entregas pendientes...</span>
      </div>
      <div v-else-if="errorPendientes" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ errorPendientes }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPendientes">Reintentar</button>
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
          class="rounded-[14px] border border-black/10 bg-white p-6"
        >
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <p class="text-sm font-semibold text-slate-900">Pedido #{{ pedido.id }}</p>
              <p class="text-xs text-slate-500">{{ pedido.estudiante?.nombre_completo ?? pedido.estudiante?.name ?? '—' }}</p>
            </div>
            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="pedido.status === 'pagado' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
            >{{ pedido.status === 'pagado' ? 'Pagado' : 'Entregando' }}</span>
          </div>

          <ul class="divide-y divide-slate-100">
            <li
              v-for="entrega in pedido.entregas_pendientes ?? pedido.items ?? []"
              :key="entrega.id"
              class="flex items-center justify-between gap-3 py-3"
            >
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900">{{ entrega.producto?.nombre ?? entrega.nombre ?? '—' }}</p>
                <p class="text-xs text-slate-400">Cantidad: {{ entrega.cantidad ?? 1 }}</p>
              </div>

              <!-- Entrega de kit con componentes tipo grupo -->
              <div v-if="entrega.es_kit" class="flex flex-col gap-2">
                <p class="text-xs text-slate-500">Selecciona variantes:</p>
                <div v-for="comp in entrega.componentes ?? []" :key="comp.id" class="flex items-center gap-2">
                  <span class="text-xs text-slate-600">{{ comp.componente?.nombre }}:</span>
                  <select v-if="comp.tipo === 'grupo'" v-model="kitSelecciones[`${entrega.id}-${comp.id}`]" class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Selecciona...</option>
                    <option v-for="v in comp.variantes ?? []" :key="v.id" :value="v.id">{{ v.nombre }}</option>
                  </select>
                </div>
                <button
                  v-if="canCompletar"
                  type="button"
                  :disabled="completando[entrega.id]"
                  class="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="handleCompletarKit(entrega)"
                >
                  {{ completando[entrega.id] ? 'Completando...' : 'Completar entrega de kit' }}
                </button>
              </div>

              <!-- Entrega simple -->
              <button
                v-else-if="canCompletar"
                type="button"
                :disabled="completando[entrega.id]"
                class="flex h-8 items-center gap-1.5 rounded-lg bg-green-600 px-3 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                @click="handleCompletarSimple(entrega)"
              >
                {{ completando[entrega.id] ? 'Completando...' : 'Marcar como entregado' }}
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </section>

    <!-- Panel: Necesidades de compra -->
    <section v-if="tab === 'necesidades'" aria-labelledby="necesidades-heading">
      <SectionHeader id="necesidades-heading" title="Necesidades de compra pendientes" description="Pedidos que no pudieron despacharse por falta de stock. Cuando llegue el producto vía orden de compra, aparecerán aquí para completar la entrega." class="mb-4" />

      <div v-if="loadingNecesidades" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando necesidades...</span>
      </div>
      <div v-else-if="!necesidades.length" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <div class="text-center">
          <p class="text-sm font-medium text-slate-700">Sin necesidades pendientes</p>
          <p class="mt-1 text-xs text-slate-400">Todo el inventario está cubierto.</p>
        </div>
      </div>

      <DataTable v-else :columns="necesidadesColumns" :data="necesidades" row-key="id" aria-label="Necesidades de compra">
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'producto'">
            <span class="font-medium text-slate-900">{{ row.producto?.nombre ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'estudiante'">
            {{ row.pedido?.estudiante?.nombre_completo ?? '—' }}
          </template>
          <template v-else-if="column.key === 'pedido_id'">
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">#{{ row.pedido_id }}</code>
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
      </DataTable>
    </section>

    <div v-if="actionError" class="flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4">
      <p class="text-sm text-red-700">{{ actionError }}</p>
      <button type="button" class="ml-auto text-sm font-medium text-red-700 underline" @click="actionError = ''">Cerrar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import invEntregaService from '@/services/invEntregaService.js'
import { authService }   from '@/services/authService.js'
import { useNotification } from '@/composables/useNotification'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import DataTable     from '@/components/activos/DataTable.vue'

const { success: notifySuccess } = useNotification()

const userPermissions = ref([])
const canCompletar = computed(() => userPermissions.value.includes('inv_entregasCompletar'))

async function loadPermissions() {
  try { const user = await authService.getUser(); userPermissions.value = user?.permissions ?? user?.all_permissions ?? [] }
  catch { /* permisos vacíos */ }
}

const tab         = ref('pendientes')
const actionError = ref('')

// ─── Entregas pendientes ───────────────────────────────────────────────────────
const pendientes        = ref([])
const loadingPendientes = ref(false)
const errorPendientes   = ref('')
const completando       = ref({})
const kitSelecciones    = reactive({})

async function loadPendientes() {
  loadingPendientes.value = true; errorPendientes.value = ''
  try { const res = await invEntregaService.getPendientes(); pendientes.value = res.data ?? [] }
  catch (e) { errorPendientes.value = e?.response?.data?.message ?? 'Error al cargar las entregas.' }
  finally { loadingPendientes.value = false }
}

async function handleCompletarSimple(entrega) {
  completando.value = { ...completando.value, [entrega.id]: true }; actionError.value = ''
  try {
    await invEntregaService.completarSimple(entrega.id)
    notifySuccess('Entrega completada correctamente.')
    loadPendientes()
  } catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo completar la entrega.' }
  finally { const n = { ...completando.value }; delete n[entrega.id]; completando.value = n }
}

async function handleCompletarKit(entrega) {
  const componentes = (entrega.componentes ?? []).map(comp => ({
    kit_componente_id: comp.id,
    producto_entregado_id: comp.tipo === 'grupo' ? (kitSelecciones[`${entrega.id}-${comp.id}`] || undefined) : undefined,
  }))
  completando.value = { ...completando.value, [entrega.id]: true }; actionError.value = ''
  try {
    await invEntregaService.completarKit(entrega.id, componentes)
    notifySuccess('Entrega de kit completada.')
    loadPendientes()
  } catch (e) { actionError.value = e?.response?.data?.message ?? 'No se pudo completar la entrega del kit.' }
  finally { const n = { ...completando.value }; delete n[entrega.id]; completando.value = n }
}

// ─── Necesidades de compra ─────────────────────────────────────────────────────
const necesidades        = ref([])
const loadingNecesidades = ref(false)

async function loadNecesidades() {
  loadingNecesidades.value = true
  try { const res = await invEntregaService.getNecesidades(); necesidades.value = res.data ?? [] }
  catch { necesidades.value = [] } finally { loadingNecesidades.value = false }
}

const necesidadesColumns = [
  { key: 'pedido_id',  label: 'Pedido' },
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'producto',   label: 'Producto' },
  { key: 'cantidad',   label: 'Cantidad requerida' },
]

watch(tab, (t) => {
  if (t === 'necesidades' && !necesidades.value.length) loadNecesidades()
})

onMounted(() => { loadPermissions(); loadPendientes() })
</script>
