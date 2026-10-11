<template>
  <div class="flex flex-col gap-6">
    <!-- Filtros -->
    <section aria-labelledby="filtros-libro-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-libro-heading" class="sr-only">Filtros</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filtrosForm.sede_id" label="Sede:" placeholder="Todas mis sedes" :options="opcionesSede" @change="buscar" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filtrosForm.fecha_desde" type="date" label="Desde:" @change="buscar" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filtrosForm.fecha_hasta" type="date" label="Hasta:" @change="buscar" />
        </div>
        <div class="w-full sm:w-[190px]">
          <FormSelect v-model="filtrosForm.origen" label="Origen:" placeholder="Todos" :options="opcionesDe(catalogos.origenes)" @change="buscar" />
        </div>
        <div class="w-full sm:w-[170px]">
          <FormSelect v-model="filtrosForm.naturaleza" label="Naturaleza:" placeholder="Todas" :options="opcionesDe(catalogos.naturalezas)" @change="buscar" />
        </div>
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filtrosForm.search" label="Buscar:" placeholder="Tercero, documento o usuario..." @input="onBuscarTexto" />
        </div>
      </div>
    </section>

    <!-- Resumen por sede -->
    <section aria-labelledby="resumen-libro-heading">
      <SectionHeader
        id="resumen-libro-heading"
        title="Resumen por sede"
        description="Ingresos por recibos académicos, de inventario y otros ingresos; egresos y consignaciones del periodo."
        class="mb-4"
      />
      <ul class="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li><StatCard title="Ingresos" :value="formatCOP(resumen.totales.total_ingresos)" description="Académicos, inventario y otros" icon="cartera" icon-variant="blue" /></li>
        <li><StatCard title="Egresos" :value="formatCOP(resumen.totales.egresos)" description="Pagos registrados" icon="pendientes" icon-variant="slate" /></li>
        <li><StatCard title="Consignaciones" :value="formatCOP(resumen.totales.consignaciones)" description="Efectivo llevado al banco" icon="activos" icon-variant="blue" /></li>
        <li><StatCard title="Neto" :value="formatCOP(resumen.totales.neto)" description="Ingresos − egresos" icon="dashboard" icon-variant="blue" /></li>
      </ul>
      <div class="overflow-x-auto rounded-[14px] border border-black/10 bg-white">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr class="text-left text-xs uppercase text-slate-500">
              <th class="px-4 py-2.5 font-semibold">Sede</th>
              <th class="px-4 py-2.5 text-right font-semibold">Académico</th>
              <th class="px-4 py-2.5 text-right font-semibold">Inventario</th>
              <th class="px-4 py-2.5 text-right font-semibold">Otros ingresos</th>
              <th class="px-4 py-2.5 text-right font-semibold">Egresos</th>
              <th class="px-4 py-2.5 text-right font-semibold">Consignaciones</th>
              <th class="px-4 py-2.5 text-right font-semibold">Neto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in resumen.sedes" :key="s.sede_id" class="border-t border-slate-100">
              <td class="px-4 py-2.5 font-medium text-slate-900">{{ s.sede }}</td>
              <td class="px-4 py-2.5 text-right">{{ formatCOP(s.ingresos_academico) }}</td>
              <td class="px-4 py-2.5 text-right">{{ formatCOP(s.ingresos_inventario) }}</td>
              <td class="px-4 py-2.5 text-right">{{ formatCOP(s.otros_ingresos) }}</td>
              <td class="px-4 py-2.5 text-right">{{ formatCOP(s.egresos) }}</td>
              <td class="px-4 py-2.5 text-right">{{ formatCOP(s.consignaciones) }}</td>
              <td class="px-4 py-2.5 text-right font-semibold">{{ formatCOP(s.neto) }}</td>
            </tr>
            <tr v-if="!resumen.sedes.length">
              <td colspan="7" class="px-4 py-6 text-center text-slate-400">Sin movimientos en el periodo.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Registros -->
    <section aria-labelledby="registros-libro-heading">
      <SectionHeader
        id="registros-libro-heading"
        title="Registros del libro"
        description="Recibos, movimientos y consignaciones vigentes. Los anulados y las transferencias por aprobar no se muestran."
        class="mb-4"
      />

      <div v-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-16 text-center text-sm text-slate-500">
        Cargando registros...
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{{ error }}</div>

      <DataTable
        v-else
        :columns="columnas"
        :data="registros"
        :row-key="'clave'"
        aria-label="Registros del libro diario"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'naturaleza_text'">
            <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="claseNaturaleza(row.naturaleza)">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'valor'">
            <span class="font-medium" :class="row.naturaleza === 'ingreso' ? 'text-green-700' : 'text-slate-900'">
              {{ row.naturaleza === 'ingreso' ? '' : '−' }}{{ formatCOP(value) }}
            </span>
          </template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button
            v-if="esRegistroManual(row)"
            type="button"
            class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ver detalle"
            @click="verDetalle(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div v-if="paginacion.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ paginacion.from }}–{{ paginacion.to }} de {{ paginacion.total }} registros</p>
        <div class="flex gap-2">
          <button type="button" :disabled="paginacion.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40" @click="cargarRegistros(paginacion.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="paginacion.currentPage === paginacion.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40" @click="cargarRegistros(paginacion.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>

    <RegistroDetalleModal
      v-model="mostrarDetalle"
      :tipo="detalle.tipo"
      :registro-id="detalle.id"
      :tipos-soporte="catalogos.tipos_soporte ?? {}"
      :puede-subir-soportes="can('fin_ldRegistroCrear')"
      :puede-anular="can('fin_ldRegistroAnular')"
      :puede-anular-cerrado="can('fin_ldAnularCerrado')"
      @cambio="buscar"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import DataTable from '@/components/activos/DataTable.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import RegistroDetalleModal from '@/components/financiero/libroDiario/RegistroDetalleModal.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { usePermisos } from '@/composables/usePermisos.js'
import { formatCOP } from '@/utils/libroDiario.js'

/**
 * Libro diario por sede: resumen de ingresos (académicos, inventario, otros),
 * egresos y consignaciones, y el listado unificado de registros del periodo.
 */
const { can, loadPermisos } = usePermisos()

const hoy = new Date().toLocaleDateString('en-CA')
const filtrosForm = reactive({ sede_id: '', fecha_desde: hoy, fecha_hasta: hoy, origen: '', naturaleza: '', search: '' })
const catalogos = ref({})

const opcionesDe = (mapa) => Object.entries(mapa ?? {}).map(([value, label]) => ({ value, label }))
const opcionesSede = computed(() => (catalogos.value.sedes ?? []).map((s) => ({ value: s.id, label: s.nombre })))

const parametros = () => Object.fromEntries(Object.entries(filtrosForm).filter(([, v]) => v !== '' && v !== null))

// ─── Resumen ──────────────────────────────────────────────────────────────────
const resumen = reactive({ sedes: [], totales: {} })

async function cargarResumen() {
  try {
    const { origen, naturaleza, search, ...params } = parametros()
    const res = await libroDiarioService.getResumen(params)
    resumen.sedes = res.data?.sedes ?? []
    resumen.totales = res.data?.totales ?? {}
  } catch {
    resumen.sedes = []
    resumen.totales = {}
  }
}

// ─── Registros ────────────────────────────────────────────────────────────────
const registros = ref([])
const cargando = ref(false)
const error = ref('')
const paginacion = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

const columnas = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'sede', label: 'Sede' },
  { key: 'usuario', label: 'Registrado por' },
  { key: 'origen_text', label: 'Origen' },
  { key: 'naturaleza_text', label: 'Naturaleza' },
  { key: 'concepto', label: 'Concepto' },
  { key: 'tercero', label: 'Tercero' },
  { key: 'documento', label: 'Documento' },
  { key: 'valor', label: 'Valor' },
]

async function cargarRegistros(page = 1) {
  cargando.value = true
  error.value = ''
  try {
    const res = await libroDiarioService.getLibro({ ...parametros(), page, per_page: 20 })
    registros.value = (res.data ?? []).map((r) => ({ ...r, clave: `${r.origen}-${r.registro_id}` }))
    Object.assign(paginacion, {
      currentPage: res.meta?.current_page ?? 1,
      lastPage: res.meta?.last_page ?? 1,
      total: res.meta?.total ?? 0,
      from: res.meta?.from ?? 0,
      to: res.meta?.to ?? 0,
    })
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar el libro diario.'
  } finally {
    cargando.value = false
  }
}

function buscar() {
  cargarResumen()
  cargarRegistros(1)
}

let temporizador = null
function onBuscarTexto() {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => cargarRegistros(1), 400)
}

const claseNaturaleza = (n) => ({
  ingreso: 'bg-green-100 text-green-800',
  egreso: 'bg-red-100 text-red-800',
  consignacion: 'bg-blue-100 text-blue-800',
}[n] ?? 'bg-slate-100 text-slate-700')

const esRegistroManual = (row) => ['movimiento', 'consignacion'].includes(row.origen)

// ─── Detalle ──────────────────────────────────────────────────────────────────
const mostrarDetalle = ref(false)
const detalle = reactive({ tipo: 'movimiento', id: null })

function verDetalle(row) {
  detalle.tipo = row.origen
  detalle.id = row.registro_id
  mostrarDetalle.value = true
}

onMounted(async () => {
  await loadPermisos()
  try {
    catalogos.value = (await libroDiarioService.getFilters()).data ?? {}
  } catch { /* los filtros quedan sin opciones */ }
  buscar()
})
</script>
