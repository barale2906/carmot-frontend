<template>
  <div class="flex flex-col gap-6">
    <section aria-labelledby="filtros-act-traslados" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-act-traslados" class="sr-only">Filtros</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filters.estado" label="Estado:" :options="opcionesEstado" @change="loadTraslados(1)" />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filters.direccion" label="Dirección:" :options="opcionesDireccion" @change="loadTraslados(1)" />
        </div>
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="ID, nombre o serial..."
            help="Busca por el ID del activo (número exacto), su nombre o serial."
            @input="onSearchInput"
          />
        </div>
      </div>
    </section>

    <section aria-labelledby="listado-act-traslados">
      <SectionHeader
        id="listado-act-traslados"
        title="Traslados de activos"
        description="Un traslado queda pendiente hasta que en la sede de destino registren la recepción; solo entonces el activo cambia de ubicación."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando traslados...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{{ error }}</div>
      <div v-else-if="!traslados.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay traslados con los filtros seleccionados.
      </div>

      <DataTable v-else :columns="columnas" :data="traslados" row-key="id" aria-label="Traslados de activos" actions-first>
        <template #cell="{ column, row }">
          <span v-if="column.key === 'activo_id'" class="font-medium text-slate-900">{{ row.activo?.id }}</span>
          <span v-else-if="column.key === 'activo'" class="flex items-center gap-2">
            <img v-if="row.activo?.imagen_url" :src="row.activo.imagen_url" alt="" class="size-9 shrink-0 rounded border border-slate-200 object-cover" />
            <span>
              <span class="block text-slate-900">{{ row.activo?.nombre }}</span>
              <span class="block text-xs text-slate-500">{{ [row.activo?.categoria, row.activo?.serial].filter(Boolean).join(' · ') || '—' }}</span>
            </span>
          </span>
          <span v-else-if="column.key === 'ruta'" class="text-slate-700">{{ row.origen }} → {{ row.destino }}</span>
          <span v-else-if="column.key === 'envio'">
            <span class="block">{{ fechaCorta(row.fecha) }}</span>
            <span class="block text-xs text-slate-500">{{ row.usuario?.name ?? '—' }}</span>
          </span>
          <span v-else-if="column.key === 'estado'" class="flex flex-col gap-1">
            <StatusBadge :label="row.estado_traslado_texto" :variant="varianteTraslado(row.estado_traslado)" />
            <span v-if="row.estado_traslado === 'recibido'" class="text-xs text-slate-500">
              {{ fechaCorta(row.fecha_recepcion) }} · {{ row.recibido_por?.name ?? '—' }}
            </span>
          </span>
          <span v-else-if="column.key === 'detalle'" class="text-xs text-slate-600">
            {{ row.estado_traslado === 'cancelado' ? row.motivo_cancelacion : (row.observaciones_recepcion || row.motivo || '—') }}
          </span>
        </template>
        <template #actions="{ row }">
          <button
            v-if="acciones(row).recibir"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Registrar recepción"
            @click="abrirAccion(row, 'recibir')"
          >
            <NavIcon name="check" class="size-4" />
          </button>
          <button
            v-if="acciones(row).cancelar"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Cancelar traslado"
            @click="abrirAccion(row, 'cancelar')"
          >
            <NavIcon name="ban" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} traslados
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadTraslados(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadTraslados(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <TrasladoAccionModal
      v-model="showAccion"
      :traslado="trasladoSeleccionado"
      :modo="modoAccion"
      :responsables="catalogos.responsables"
      @saved="loadTraslados(pagination.currentPage)"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SectionHeader       from '@/components/activos/SectionHeader.vue'
import StatusBadge         from '@/components/activos/StatusBadge.vue'
import DataTable           from '@/components/activos/DataTable.vue'
import TrasladoAccionModal from '@/components/activos/TrasladoAccionModal.vue'
import FormSelect          from '@/components/forms/FormSelect.vue'
import FormInputSearch     from '@/components/forms/FormInputSearch.vue'
import NavIcon             from '@/components/icons/NavIcon.vue'
import activoService       from '@/services/activoService.js'
import { authService }     from '@/services/authService.js'
import { usePermisos }     from '@/composables/usePermisos.js'
import { fechaCorta } from '@/utils/crm.js'
import { ESTADOS_TRASLADO, varianteTraslado, accionesTraslado } from '@/utils/activos.js'

const { can, loadPermisos } = usePermisos()

// Sedes del usuario (para saber si recibe o cancela) y responsables para la recepción.
const catalogos = ref({ sedes: [], responsables: [] })
const misSedes  = computed(() => catalogos.value.sedes.map(s => s.id))

async function loadCatalogos() {
  try {
    const res = await activoService.getFilters()
    catalogos.value = { sedes: [], responsables: [], ...(res.data ?? {}) }
  } catch { /* sin catálogo no se ofrecen acciones */ }
}

const opcionesEstado    = [{ value: '', label: 'Todos' }, ...ESTADOS_TRASLADO]
const opcionesDireccion = [
  { value: '',          label: 'Entrantes y salientes' },
  { value: 'entrantes', label: 'Entrantes (por recibir)' },
  { value: 'salientes', label: 'Salientes (enviados)' }
]

const columnas = [
  { key: 'activo_id', label: 'ID' },
  { key: 'activo',    label: 'Activo' },
  { key: 'ruta',      label: 'Origen → destino', icon: 'location' },
  { key: 'envio',     label: 'Envío', icon: 'calendario' },
  { key: 'estado',    label: 'Estado' },
  { key: 'detalle',   label: 'Observaciones' }
]

// ─── Listado ──────────────────────────────────────────────────────────────────
const traslados  = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ estado: 'pendiente', direccion: '', search: '' })

async function loadTraslados(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    for (const [clave, valor] of Object.entries(filters)) {
      if (valor !== '' && valor !== null) params[clave] = valor
    }
    const res = await activoService.getTraslados(params)
    traslados.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los traslados.'
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTraslados(1), 400)
}

// ─── Acciones ─────────────────────────────────────────────────────────────────
const trasladoSeleccionado = ref(null)
const showAccion = ref(false)
const modoAccion = ref('recibir')

// Quien envió un traslado no registra su recepción (salvo el superusuario).
const usuario = ref({})
async function loadUsuario() {
  try {
    const [datos, superusuario] = await Promise.all([authService.getUser(), authService.esSuperusuario()])
    usuario.value = { id: datos?.id, superusuario }
  } catch { /* sin usuario el backend sigue validando */ }
}

const acciones = (row) => accionesTraslado(row, misSedes.value, can, usuario.value)

function abrirAccion(row, modo) {
  trasladoSeleccionado.value = row
  modoAccion.value = modo
  showAccion.value = true
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadUsuario()
  loadCatalogos()
  loadTraslados(1)
})
</script>
