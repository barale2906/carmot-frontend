<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-agendas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-agendas-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre o celular del lead..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_desde" type="date" label="Desde:" @change="loadAgendas(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_hasta" type="date" label="Hasta:" @change="loadAgendas(1)" />
        </div>
        <div class="w-full sm:w-[170px]">
          <FormSelect v-model="filters.tipo" label="Tipo:" :options="opcionesFiltroTipo" @change="loadAgendas(1)" />
        </div>
        <div class="w-full sm:w-[170px]">
          <FormSelect v-model="filters.status" label="Estado:" :options="opcionesFiltroEstado" @change="loadAgendas(1)" />
        </div>
        <div class="w-full sm:w-[220px]">
          <FormSelect v-model="filters.agendador_id" label="Asesor:" :options="opcionesFiltroAgendador" @change="loadAgendas(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('crm_agendaCrear')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Programar acción
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="clearFilters"
          >
            Próximos 7 días
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla -->
    <section aria-labelledby="listado-agendas-heading">
      <SectionHeader
        id="listado-agendas-heading"
        title="Agenda"
        description="Llamadas, visitas y demás acciones programadas con cada lead. Registra su resultado; al programar o reprogramar, la bitácora del lead se actualiza automáticamente."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando agenda...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
      <div v-else-if="!agendas.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay acciones programadas en el rango seleccionado.
      </div>

      <DataTable v-else :columns="tableColumns" :data="agendas" row-key="id" aria-label="Agenda" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'fecha'">
            <span class="font-medium text-slate-900">{{ fechaCorta(value) }}</span>
          </template>
          <template v-else-if="column.key === 'hora'">
            {{ horaCorta(value) }}
          </template>
          <template v-else-if="column.key === 'tipo'">
            <span class="font-medium text-slate-900">{{ row.tipo_text }}</span>
            <span v-if="row.nota" class="block max-w-xs text-xs text-slate-500">{{ row.nota }}</span>
          </template>
          <template v-else-if="column.key === 'referido'">
            <span class="text-slate-900">{{ row.referido?.nombre || 'Sin nombre' }}</span>
            <span class="block text-xs text-slate-400">{{ row.referido?.celular }}</span>
          </template>
          <template v-else-if="column.key === 'agendador'">
            {{ row.agendador?.name ?? '—' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoAgenda(row.status)">
              {{ row.status_text }}
            </span>
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <template v-if="can('crm_agendaEditar') && citaAbierta(row)">
            <button
              type="button"
              class="rounded p-1.5 text-green-700 transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              :title="textoEstadoAgenda(ESTADOS_AGENDA.REALIZADA, row.tipo)"
              @click="marcar(row, ESTADOS_AGENDA.REALIZADA)"
            >
              <NavIcon name="check" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              :title="textoEstadoAgenda(ESTADOS_AGENDA.NO_REALIZADA, row.tipo)"
              @click="marcar(row, ESTADOS_AGENDA.NO_REALIZADA)"
            >
              <NavIcon name="ban" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-amber-700 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Reprogramar"
              @click="openReprogramar(row)"
            >
              <NavIcon name="calendario" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Cancelar"
              @click="marcar(row, ESTADOS_AGENDA.CANCELO)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
          <button
            v-if="can('crm_agendaInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar"
            @click="handleDelete(row)"
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} acciones
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadAgendas(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadAgendas(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- Modal: programar acción / reprogramar -->
    <ModalBase
      v-model="showForm"
      :title="reprogramando ? 'Reprogramar' : 'Programar acción'"
      :description="reprogramando
        ? `La acción del ${fechaCorta(reprogramando.fecha)} queda como Reprogramó y se crea una nueva.`
        : 'Programa una llamada, visita u otra acción con un lead del CRM'"
    >
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormSelect
          v-if="!reprogramando"
          v-model="form.referido_id"
          label="Lead"
          required
          :options="opcionesReferido"
          :error="formErrors.referido_id?.[0]"
        />
        <FormSelect v-model="form.tipo" label="Tipo" required :options="OPCIONES_TIPO_AGENDA" :error="formErrors.tipo?.[0]" />
        <FormInput v-model="form.fecha" type="date" label="Fecha" required :min="hoy" :error="formErrors.fecha?.[0]" />
        <FormInput v-model="form.hora" type="time" label="Hora" required :error="formErrors.hora?.[0]" />
        <FormInput v-model="form.nota" label="Nota" placeholder="Qué se debe hacer" :error="formErrors.nota?.[0]" />
        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showForm = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleSubmit"
        >
          {{ saving ? 'Guardando...' : (reprogramando ? 'Reprogramar' : 'Agendar') }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import agendaService   from '@/services/agendaService.js'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import ModalBase       from '@/components/ModalBase.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'
import {
  OPCIONES_TIPO_AGENDA, ESTADOS_AGENDA, opcionesEstadoAgenda, textoEstadoAgenda, claseEstadoAgenda, citaAbierta,
  jornadaDeHora, horaCorta, fechaISO, fechaCorta, rangoProximosDias
} from '@/utils/crm.js'

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

const hoy = fechaISO()

// ─── Catálogos ─────────────────────────────────────────────────────────────────
const referidos   = ref([])
const agendadores = ref([])

const opcionesReferido = computed(() => referidos.value.map(r => ({
  value: r.id,
  label: `${r.nombre || 'Sin nombre'} — ${r.celular}`
})))
const opcionesFiltroAgendador = computed(() => [
  { value: '', label: 'Todos los asesores' },
  ...agendadores.value.map(a => ({ value: a.id, label: a.name }))
])
// Con un tipo elegido, el filtro de estado usa sus textos (Contestó, Asistió...)
const opcionesFiltroEstado = computed(() => [{ value: '', label: 'Todos los estados' }, ...opcionesEstadoAgenda(filters.tipo)])
const opcionesFiltroTipo   = [{ value: '', label: 'Todos los tipos' }, ...OPCIONES_TIPO_AGENDA]

async function loadCatalogos() {
  try {
    const { data } = await agendaService.getFilters()
    referidos.value   = data?.referidos ?? []
    agendadores.value = data?.agendadores ?? []
  } catch { /* el backend valida */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const agendas    = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', tipo: '', status: '', agendador_id: '', ...rangoProximosDias(7) })

const tableColumns = [
  { key: 'fecha',     label: 'Fecha' },
  { key: 'hora',      label: 'Hora' },
  { key: 'tipo',      label: 'Acción' },
  { key: 'referido',  label: 'Lead' },
  { key: 'agendador', label: 'Agendó' },
  { key: 'status',    label: 'Estado' }
]

async function loadAgendas(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 20, sort_by: 'fecha', sort_direction: 'asc' }
    for (const [clave, valor] of Object.entries(filters)) {
      if (valor !== '' && valor !== null) params[clave] = valor
    }
    const res = await agendaService.getAll(params)
    agendas.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar la agenda.'
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadAgendas(1), 400)
}

function clearFilters() {
  Object.assign(filters, { search: '', tipo: '', status: '', agendador_id: '', ...rangoProximosDias(7) })
  loadAgendas(1)
}

// ─── Resultado de la acción ─────────────────────────────────────────────────────
async function marcar(row, status) {
  try {
    await agendaService.update(row.id, { status })
    notifySuccess('Agenda actualizada.')
    loadAgendas(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo actualizar la agenda.')
  }
}

async function handleDelete(row) {
  if (!await confirm(`¿Eliminar la acción del ${fechaCorta(row.fecha)} con "${row.referido?.nombre || row.referido?.celular}"?`)) return
  try {
    await agendaService.delete(row.id)
    notifySuccess('Acción eliminada.')
    loadAgendas(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar la acción.')
  }
}

// ─── Nueva cita / reprogramar ─────────────────────────────────────────────────
const showForm      = ref(false)
const reprogramando = ref(null)
const saving        = ref(false)
const formError     = ref('')
const formErrors    = ref({})
const form          = reactive({ referido_id: '', tipo: 'llamada', fecha: '', hora: '', nota: '' })

function abrirFormulario(cita = null) {
  reprogramando.value = cita
  formError.value     = ''
  formErrors.value    = {}
  // Al reprogramar se conservan el tipo y la nota de la acción original
  Object.assign(form, {
    referido_id: cita?.referido_id ?? '',
    tipo:        cita?.tipo ?? 'llamada',
    fecha:       '',
    hora:        horaCorta(cita?.hora),
    nota:        cita?.nota ?? ''
  })
  showForm.value = true
}

const openCreate       = () => abrirFormulario()
const openReprogramar  = (row) => abrirFormulario(row)

async function handleSubmit() {
  saving.value     = true
  formError.value  = ''
  formErrors.value = {}
  try {
    // Primero se crea la nueva cita: si la fecha es inválida, la original queda intacta.
    await agendaService.create({
      referido_id: Number(form.referido_id),
      tipo:        form.tipo,
      fecha:       form.fecha,
      hora:        form.hora,
      jornada:     jornadaDeHora(form.hora),
      nota:        form.nota.trim() || null
    })
    if (reprogramando.value) {
      await agendaService.update(reprogramando.value.id, { status: ESTADOS_AGENDA.REPROGRAMO })
    }
    notifySuccess(reprogramando.value ? 'Acción reprogramada.' : 'Acción programada.')
    showForm.value = false
    loadAgendas(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) formErrors.value = e.response.data?.errors ?? {}
    formError.value = e?.response?.data?.message ?? 'No se pudo guardar la acción.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadCatalogos()
  loadAgendas(1)
})
</script>
