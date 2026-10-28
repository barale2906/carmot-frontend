<template>
  <div class="flex flex-col gap-6">
    <!-- Gestión de activos -->
    <section aria-labelledby="gestion-activos-heading" class="flex flex-col gap-6">
      <div class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="gestion-activos-heading" class="sr-only">Filtros</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="w-full sm:w-[180px]">
            <FormSelect v-model="filters.sede_id" label="Sede:" :options="opcionesSede" help="Filtra activos por sede." @change="onSedeChange" />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect
              v-model="filters.area_id"
              label="Área:"
              :options="opcionesArea"
              :disabled="!filters.sede_id"
              help="Filtra por área o taller dentro de la sede."
              @change="loadActivos(1)"
            />
          </div>
          <div class="w-full sm:w-[190px]">
            <FormSelect v-model="filters.categoria_id" label="Categoría:" :options="opcionesCategoria" @change="loadActivos(1)" />
          </div>
          <div class="w-full sm:w-[170px]">
            <FormSelect v-model="filters.estado" label="Estado:" :options="opcionesEstadoFiltro" @change="loadActivos(1)" />
          </div>
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="ID, nombre o serial..."
              help="Busca activos por ID (número exacto), nombre o serial."
              @input="onSearchInput"
            />
          </div>
          <div v-if="can('act_activoCrear')" class="w-full sm:w-auto">
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openForm(null)"
            >
              <NavIcon name="plus" class="size-4" />
              Nuevo activo
            </button>
          </div>
        </div>
      </div>

      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard title="Total activos" :value="stats.total ?? '—'" :description="sedeSeleccionada?.nombre ?? 'Todas tus sedes'" icon="inventario" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Valor del inventario" :value="formatoCOP(stats.valor_total)" description="Valor de adquisición" icon="cartera" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="En mantenimiento" :value="stats.por_estado?.mantenimiento ?? 0" description="Fuera de uso temporalmente" icon="pendientes" icon-variant="amber" />
        </li>
        <li role="listitem">
          <StatCard title="Áreas con activos" :value="areasConActivos" :description="sedeSeleccionada ? `de ${areasSede.length} áreas` : 'En todas tus sedes'" icon="location" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- Distribución por área -->
    <section v-if="distribucion.length" aria-labelledby="distribucion-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <SectionHeader
        id="distribucion-heading"
        :title="`Distribución de activos por área${sedeSeleccionada ? ' - ' + sedeSeleccionada.nombre : ''}`"
        description="Cantidad de activos en uso en cada área (sin los dados de baja)"
        class="mb-6"
      />
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
        <li v-for="item in distribucion" :key="item.area" role="listitem">
          <AreaDistributionCard :area-name="item.area" :count="item.count" />
        </li>
      </ul>
    </section>

    <!-- Listado de Activos -->
    <section aria-labelledby="listado-activos-heading">
      <h2 id="listado-activos-heading" class="mb-4 text-base font-medium text-slate-900">
        Listado de activos
      </h2>

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando activos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{{ error }}</div>
      <div v-else-if="!activos.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay activos con los filtros seleccionados.
      </div>

      <DataTable v-else :columns="tableColumns" :data="activos" row-key="id" aria-label="Listado de activos" actions-first>
        <template #cell="{ column, value, row, formatted }">
          <StatusBadge v-if="column.key === 'estado'" :label="row.estado_texto" :variant="varianteEstado(row.estado)" />
          <span v-else-if="column.key === 'area'" class="flex flex-col gap-1">
            <span class="inline-flex items-center gap-1">
              <NavIcon name="location" class="size-4 text-slate-500" />
              {{ [row.sede?.nombre, row.area?.nombre].filter(Boolean).join(' · ') }}
            </span>
            <span
              v-if="estaEnTransito(row)"
              class="inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
              :title="`Pendiente de recepción desde el ${fechaCorta(row.traslado_pendiente.fecha)}`"
            >
              <NavIcon name="swap_horiz" class="size-3.5" />
              En tránsito a {{ row.traslado_pendiente.destino }}
            </span>
          </span>
          <span v-else-if="column.key === 'categoria'">{{ row.categoria?.nombre ?? '—' }}</span>
          <span v-else-if="column.key === 'id'" class="font-medium text-slate-900">{{ value }}</span>
          <span v-else-if="column.key === 'fecha_ingreso'">{{ fechaCorta(value) }}</span>
          <span v-else-if="column.key === 'valor'">{{ formatoCOP(value) }}</span>
          <span v-else>{{ formatted ?? value ?? '—' }}</span>
        </template>
        <template #actions="{ row }">
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ficha e historial"
            @click="verFicha(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
          <template v-if="!esDeBaja(row)">
            <button
              v-if="can('act_activoTrasladar') && !estaEnTransito(row)"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Trasladar a otra sede o área"
              @click="openMovimiento(row, 'traslado')"
            >
              <NavIcon name="location" class="size-4" />
            </button>
            <button
              v-if="can('act_activoEditar') && !estaEnTransito(row)"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Cambiar estado"
              @click="openMovimiento(row, 'estado')"
            >
              <NavIcon name="construction" class="size-4" />
            </button>
            <button
              v-if="can('act_activoEditar')"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Editar"
              @click="openForm(row)"
            >
              <NavIcon name="pencil" class="size-4" />
            </button>
          </template>
          <button
            v-if="can('act_activoInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar (registro creado por error)"
            @click="eliminar(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} activos
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadActivos(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadActivos(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <ActivoFormModal
      v-model="showForm"
      :activo="activoSeleccionado"
      :catalogos="catalogos"
      :sede-id="filters.sede_id"
      @saved="refrescar"
    />
    <ActivoMovimientoModal
      v-model="showMovimiento"
      :activo="activoSeleccionado"
      :modo="modoMovimiento"
      :catalogos="catalogos"
      @saved="refrescar"
    />
    <ActivoFichaModal v-model="showFicha" :activo-id="activoSeleccionado?.id ?? null" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SectionHeader         from '@/components/activos/SectionHeader.vue'
import AreaDistributionCard  from '@/components/activos/AreaDistributionCard.vue'
import StatusBadge           from '@/components/activos/StatusBadge.vue'
import DataTable             from '@/components/activos/DataTable.vue'
import ActivoFormModal       from '@/components/activos/ActivoFormModal.vue'
import ActivoMovimientoModal from '@/components/activos/ActivoMovimientoModal.vue'
import ActivoFichaModal      from '@/components/activos/ActivoFichaModal.vue'
import FormSelect            from '@/components/forms/FormSelect.vue'
import FormInputSearch       from '@/components/forms/FormInputSearch.vue'
import StatCard              from '@/components/dashboard/StatCard.vue'
import NavIcon               from '@/components/icons/NavIcon.vue'
import activoService         from '@/services/activoService.js'
import { usePermisos }       from '@/composables/usePermisos.js'
import { useConfirm }        from '@/composables/useConfirm.js'
import { useNotification }   from '@/composables/useNotification'
import { fechaCorta } from '@/utils/crm.js'
import {
  ESTADOS_ACTIVO, varianteEstado, esDeBaja, estaEnTransito, etiquetaActivo, areasDeSede, distribucionPorArea, formatoCOP
} from '@/utils/activos.js'

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Catálogos ─────────────────────────────────────────────────────────────────
const catalogos = ref({ sedes: [], categorias: [], responsables: [] })

const sedeSeleccionada  = computed(() => catalogos.value.sedes.find(s => String(s.id) === String(filters.sede_id)) ?? null)
const areasSede         = computed(() => areasDeSede(catalogos.value.sedes, filters.sede_id))
const opcionesSede      = computed(() => [{ value: '', label: 'Todas mis sedes' }, ...catalogos.value.sedes.map(s => ({ value: s.id, label: s.nombre }))])
const opcionesArea      = computed(() => [{ value: '', label: 'Todas las áreas' }, ...areasSede.value.map(a => ({ value: a.id, label: a.nombre }))])
const opcionesCategoria = computed(() => [{ value: '', label: 'Todas' }, ...catalogos.value.categorias.map(c => ({ value: c.id, label: c.nombre }))])
const opcionesEstadoFiltro = [{ value: '', label: 'En uso (sin bajas)' }, ...ESTADOS_ACTIVO]

async function loadCatalogos() {
  try {
    const res = await activoService.getFilters()
    catalogos.value = { sedes: [], categorias: [], responsables: [], ...(res.data ?? {}) }
  } catch { /* los filtros quedan vacíos */ }
}

// ─── Listado y estadísticas ───────────────────────────────────────────────────
const activos    = ref([])
const loading    = ref(false)
const error      = ref('')
const stats      = ref({})
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ sede_id: '', area_id: '', categoria_id: '', estado: '', search: '' })

const tableColumns = [
  { key: 'id',            label: 'ID' },
  { key: 'nombre',        label: 'Nombre' },
  { key: 'categoria',     label: 'Categoría' },
  { key: 'area',          label: 'Ubicación', icon: 'location' },
  { key: 'fecha_ingreso', label: 'Fecha ingreso', icon: 'calendario' },
  { key: 'estado',        label: 'Estado' },
  { key: 'valor',         label: 'Valor' }
]

const distribucion    = computed(() => distribucionPorArea(stats.value.por_area, areasSede.value))
const areasConActivos = computed(() => (stats.value.por_area ?? []).filter(f => f.area_id !== null && f.total > 0).length)

async function loadActivos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    for (const [clave, valor] of Object.entries(filters)) {
      if (valor !== '' && valor !== null) params[clave] = valor
    }
    const res = await activoService.getAll(params)
    activos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los activos.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await activoService.getStatistics(filters.sede_id ? { sede_id: filters.sede_id } : {})
    stats.value = res.data ?? {}
  } catch { /* no bloquea */ }
}

function refrescar() {
  loadActivos(pagination.currentPage)
  loadStatistics()
}

function onSedeChange() {
  filters.area_id = ''
  loadActivos(1)
  loadStatistics()
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadActivos(1), 400)
}

// ─── Acciones ─────────────────────────────────────────────────────────────────
const activoSeleccionado = ref(null)
const showForm       = ref(false)
const showMovimiento = ref(false)
const showFicha      = ref(false)
const modoMovimiento = ref('traslado')

function openForm(row) {
  activoSeleccionado.value = row
  showForm.value = true
}

function openMovimiento(row, modo) {
  activoSeleccionado.value = row
  modoMovimiento.value     = modo
  showMovimiento.value     = true
}

function verFicha(row) {
  activoSeleccionado.value = row
  showFicha.value = true
}

async function eliminar(row) {
  const mensaje = `¿Eliminar el activo ${etiquetaActivo(row)}? Usa esta opción solo para registros creados por error; para retirarlo del inventario cámbialo a "De baja".`
  if (!await confirm(mensaje)) return
  try {
    await activoService.delete(row.id)
    notifySuccess('Activo eliminado.')
    refrescar()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar el activo.')
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadCatalogos()
  loadActivos(1)
  loadStatistics()
})
</script>
