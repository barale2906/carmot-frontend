<template>
  <div class="flex flex-col gap-6">
    <!-- Resumen: control y cumplimiento de los acuerdos -->
    <section aria-labelledby="stats-prorroga-heading">
      <h2 id="stats-prorroga-heading" class="sr-only">Resumen de plazos nuevos de pago</h2>
      <ul class="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4" role="list">
        <li v-for="tarjeta in tarjetas" :key="tarjeta.estado" role="listitem">
          <button
            type="button"
            class="w-full rounded-[14px] border bg-white p-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="filtros.estado === tarjeta.estado ? 'border-[#213360]' : 'border-black/10'"
            @click="filtrarEstado(tarjeta.estado)"
          >
            <span class="block text-sm text-slate-500">{{ tarjeta.label }}</span>
            <span class="block text-2xl font-semibold text-slate-900">{{ conteos[tarjeta.estado] ?? 0 }}</span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Filtros -->
    <section aria-labelledby="filtros-prorroga-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-prorroga-heading" class="sr-only">Filtros</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <FormSelect v-model="filtros.estado" label="Estado:" placeholder="Todos" :options="ESTADOS" clearable @change="cargar(1)" />
        <FormInput v-model="filtros.fecha_desde" type="date" label="Fecha compromiso desde:" @change="cargar(1)" />
        <FormInput v-model="filtros.fecha_hasta" type="date" label="Hasta:" @change="cargar(1)" />
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-prorroga-heading">
      <h2 id="listado-prorroga-heading" class="sr-only">Plazos nuevos de pago</h2>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div v-else-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-500">
        Cargando plazos...
      </div>
      <div v-else-if="!prorrogas.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay plazos nuevos de pago con los filtros aplicados.
      </div>
      <DataTable v-else :columns="columnas" :data="prorrogas" row-key="id" actions-first aria-label="Plazos nuevos de pago">
        <template #actions="{ row }">
          <button
            v-if="puedeCancelar && row.estado === 'vigente'"
            type="button"
            class="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="cancelar(row)"
          >
            Cancelar
          </button>
        </template>
        <template #cell="{ column, row }">
          <template v-if="column.key === 'estudiante'">
            <span class="font-medium text-slate-900">{{ row.estudiante?.name }}</span>
            <span class="block text-xs text-slate-500">{{ row.estudiante?.documento ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'saldo_vencido'">$ {{ formatMoney(row.saldo_vencido) }}</template>
          <template v-else-if="column.key === 'fecha_acuerdo'">{{ formatFechaCorta(row.fecha_acuerdo) }}</template>
          <template v-else-if="column.key === 'fecha_compromiso'">{{ formatFechaCorta(row.fecha_compromiso) }}</template>
          <template v-else-if="column.key === 'estado'">
            <span class="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold" :class="claseEstado(row.estado)">
              {{ etiquetaEstado(row.estado) }}
            </span>
          </template>
          <template v-else-if="column.key === 'registrada_por'">
            {{ row.registrada_por?.name ?? '—' }}
            <span v-if="row.observacion" class="block text-xs text-slate-500">{{ row.observacion }}</span>
          </template>
        </template>
      </DataTable>

      <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} plazos</p>
        <div class="flex gap-2">
          <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="cargar(pagination.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="cargar(pagination.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * Control de los plazos nuevos de pago (acuerdos verbales para entrar a clase estando en mora):
 * listado filtrable por estado y fecha compromiso, con el conteo por estado. El sistema marca cada
 * plazo como cumplido o incumplido a diario y avisa al estudiante y a recepción de los incumplidos.
 * Cancelar un plazo vigente exige `fin_prorrogaPagoCancelar`.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import prorrogaPagoService from '@/services/prorrogaPagoService.js'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormInput  from '@/components/forms/FormInput.vue'
import DataTable  from '@/components/activos/DataTable.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification'
import { useConfirm }      from '@/composables/useConfirm.js'
import { formatMoney } from '@/utils/formatters.js'
import { formatFechaCorta } from '@/utils/calendario.js'
import { ESTADOS_PRORROGA, etiquetaEstado, claseEstado } from '@/utils/prorrogaPago.js'

const { can, loadPermisos } = usePermisos()
const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()

const puedeCancelar = computed(() => can('fin_prorrogaPagoCancelar'))

const ESTADOS  = ESTADOS_PRORROGA.map(e => ({ value: e.value, label: e.label }))
const tarjetas = ESTADOS_PRORROGA

const filtros    = reactive({ estado: '', fecha_desde: '', fecha_hasta: '' })
const prorrogas  = ref([])
const conteos    = reactive({ vigente: 0, cumplido: 0, incumplido: 0 })
const cargando   = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

const columnas = [
  { key: 'estudiante',       label: 'Estudiante' },
  { key: 'saldo_vencido',    label: 'Saldo vencido' },
  { key: 'fecha_acuerdo',    label: 'Acordado' },
  { key: 'fecha_compromiso', label: 'Fecha compromiso' },
  { key: 'estado',           label: 'Estado' },
  { key: 'registrada_por',   label: 'Acordó' }
]

function paramsListado(pagina) {
  const params = { page: pagina, per_page: 25 }
  for (const [clave, valor] of Object.entries(filtros)) if (valor) params[clave] = valor
  return params
}

async function cargar(pagina = 1) {
  cargando.value = true
  error.value = ''
  try {
    const res = await prorrogaPagoService.listar(paramsListado(pagina))
    prorrogas.value = res.data ?? []
    Object.assign(pagination, {
      currentPage: res.meta.current_page, lastPage: res.meta.last_page,
      total: res.meta.total, from: res.meta.from ?? 0, to: res.meta.to ?? 0
    })
  } catch (e) {
    const errores = e?.response?.data?.errors
    error.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo cargar el listado de plazos.')
  } finally {
    cargando.value = false
  }
}

/** Cuenta los plazos de cada estado (sin tocar los filtros de fecha). */
async function cargarConteos() {
  await Promise.all(ESTADOS_PRORROGA.map(async ({ value }) => {
    try {
      const res = await prorrogaPagoService.listar({ estado: value, per_page: 1 })
      conteos[value] = res.meta?.total ?? 0
    } catch {
      conteos[value] = 0
    }
  }))
}

function filtrarEstado(estado) {
  filtros.estado = filtros.estado === estado ? '' : estado
  cargar(1)
}

async function cancelar(prorroga) {
  const nombre = prorroga.estudiante?.name ?? 'el estudiante'
  if (!await confirm(`¿Cancelar el plazo nuevo de ${nombre}? Dejará de aparecer en la asistencia y el sistema no lo vigilará.`, { danger: true, confirmLabel: 'Cancelar plazo' })) return
  try {
    const res = await prorrogaPagoService.cancelar(prorroga.id)
    notifySuccess(res.message ?? 'Plazo nuevo cancelado.')
    await Promise.all([cargar(pagination.currentPage), cargarConteos()])
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo cancelar el plazo nuevo.')
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  cargar(1)
  cargarConteos()
})
</script>
