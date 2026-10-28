<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros -->
    <section aria-labelledby="filtros-seguimientos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-seguimientos-heading" class="sr-only">Filtros</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar lead:"
            placeholder="Nombre o celular..."
            help="Muestra el lead con toda su bitácora de seguimientos."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[220px]">
          <FormSelect v-model="filters.status" label="Estado del lead:" :options="opcionesFiltroEstado" @change="loadLeads(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_desde" type="date" label="Seguimientos desde:" @change="loadLeads(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_hasta" type="date" label="Hasta:" @change="loadLeads(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            type="button"
            :disabled="!lapsoCompleto || descargando"
            :title="lapsoCompleto ? 'Descarga los seguimientos del lapso con los filtros aplicados' : 'Indica las fechas desde y hasta para descargar'"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            @click="descargarExcel"
          >
            <NavIcon name="download" class="size-4" />
            {{ descargando ? 'Generando...' : 'Descargar Excel' }}
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
      <p class="mt-2 text-xs text-slate-400">Para descargar en Excel indica el lapso con las fechas desde y hasta.</p>
    </section>

    <!-- Bitácora agrupada por lead -->
    <section aria-labelledby="listado-seguimientos-heading">
      <SectionHeader
        id="listado-seguimientos-heading"
        title="Bitácora de seguimientos"
        description="Cada lead con todos sus seguimientos y el estado en que quedó en cada uno. Despliega un lead para ver su historial o registra un nuevo seguimiento."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando seguimientos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadLeads(1)">Reintentar</button>
      </div>
      <div v-else-if="!leads.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay leads con los filtros seleccionados.
      </div>

      <div v-else class="flex flex-col gap-3">
        <article
          v-for="lead in leads"
          :key="lead.id"
          class="overflow-hidden rounded-[14px] border border-black/10 bg-white"
        >
          <!-- Cabecera del lead: acción a la izquierda, datos y resumen -->
          <div class="flex items-center gap-2 pl-3">
            <button
              v-if="can('crm_seguimientoCrear')"
              type="button"
              class="shrink-0 rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :title="`Registrar seguimiento a ${lead.nombre || lead.celular}`"
              :aria-label="`Registrar seguimiento a ${lead.nombre || lead.celular}`"
              @click="openRegistrar(lead)"
            >
              <NavIcon name="plus" class="size-4" />
            </button>
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-4 px-2 py-4 pr-5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              :aria-expanded="expandidos.has(lead.id)"
              :aria-controls="`bitacora-${lead.id}`"
              @click="toggleLead(lead.id)"
            >
              <span class="shrink-0 text-slate-400" aria-hidden="true">
                <NavIcon :name="expandidos.has(lead.id) ? 'expand_less' : 'expand_more'" class="size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">{{ lead.nombre || 'Sin nombre' }}</p>
                <p class="mt-0.5 truncate text-xs text-slate-500">
                  {{ lead.celular }}
                  <span v-if="lead.curso?.nombre"> · {{ lead.curso.nombre }}</span>
                  <span v-if="lead.gestor?.name"> · Asesor: {{ lead.gestor.name }}</span>
                </p>
              </div>
              <div class="hidden shrink-0 items-center gap-6 sm:flex">
                <div class="text-right">
                  <p class="text-xs text-slate-500">Seguimientos</p>
                  <p class="text-sm font-medium text-slate-700">{{ lead.seguimientos_count ?? 0 }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-slate-500">Último</p>
                  <p class="text-sm font-medium text-slate-700">{{ fechaCorta(lead.seguimientos?.[0]?.fecha) }}</p>
                </div>
              </div>
              <span class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoReferido(lead.status)">
                {{ lead.status_text }}
              </span>
            </button>
          </div>

          <!-- Historial de seguimientos (colapsable) -->
          <div :id="`bitacora-${lead.id}`" v-show="expandidos.has(lead.id)" class="border-t border-slate-100">
            <p v-if="!lead.seguimientos?.length" class="px-5 py-4 text-sm text-slate-400">Sin seguimientos registrados.</p>
            <div v-else class="overflow-x-auto">
              <table class="w-full min-w-[640px] text-left text-sm">
                <thead class="bg-slate-50/80">
                  <tr>
                    <th class="px-5 py-2.5 text-xs font-medium text-slate-600">Fecha</th>
                    <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Registró</th>
                    <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Seguimiento</th>
                    <th class="px-4 py-2.5 text-xs font-medium text-slate-600">Estado del lead</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in lead.seguimientos" :key="item.id" class="align-top transition-colors hover:bg-slate-50/50">
                    <td class="whitespace-nowrap px-5 py-3 text-slate-700">{{ fechaCorta(item.fecha) }}</td>
                    <td class="whitespace-nowrap px-4 py-3 text-slate-700">{{ item.seguidor?.name ?? '—' }}</td>
                    <td class="px-4 py-3">
                      <p class="max-w-xl whitespace-pre-line text-slate-700">{{ item.seguimiento }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <!-- Los seguimientos anteriores al registro del estado no lo tienen -->
                      <span
                        v-if="item.estado_referido_text"
                        class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        :class="claseEstadoReferido(item.estado_referido)"
                      >
                        {{ item.estado_referido_text }}
                      </span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </div>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} leads
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadLeads(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadLeads(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- Modal: registrar seguimiento al lead -->
    <ModalBase
      v-model="showForm"
      title="Registrar seguimiento"
      :description="leadForm ? `${leadForm.nombre || 'Sin nombre'} · ${leadForm.celular}` : ''"
    >
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormInput v-model="form.fecha" type="date" label="Fecha" required :max="hoy" :error="formErrors.fecha?.[0]" />
        <SeguimientoForm
          v-model:texto="form.seguimiento"
          v-model:estado="form.estado"
          v-model:proxima="form.proxima"
          texto-requerido
          :permitir-matricular="can('aca_matriculaCrear') && puedeConvertirse(leadForm)"
          :permitir-agendar="can('crm_agendaCrear')"
          :errores="formErrors"
        />
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
          :disabled="saving || !form.seguimiento.trim()"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleSubmit"
        >
          {{ saving ? 'Guardando...' : 'Registrar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import seguimientoService from '@/services/seguimientoService.js'
import { authService }    from '@/services/authService.js'
import SectionHeader      from '@/components/activos/SectionHeader.vue'
import NavIcon            from '@/components/icons/NavIcon.vue'
import FormInputSearch    from '@/components/forms/FormInputSearch.vue'
import FormInput          from '@/components/forms/FormInput.vue'
import FormSelect         from '@/components/forms/FormSelect.vue'
import ModalBase          from '@/components/ModalBase.vue'
import SeguimientoForm    from '@/components/crm/SeguimientoForm.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import {
  OPCIONES_ESTADO_REFERIDO, claseEstadoReferido, puedeConvertirse, resolverEstadoSeguimiento,
  proximaAccionVacia, proximaAccionPayload, fechaISO, fechaCorta
} from '@/utils/crm.js'

const router = useRouter()
const { can, loadPermisos } = usePermisos()
const { success: notifySuccess, error: notifyError } = useNotification()

const hoy = fechaISO()
const opcionesFiltroEstado = [{ value: '', label: 'Todos los estados' }, ...OPCIONES_ESTADO_REFERIDO]

// ─── Listado por lead ─────────────────────────────────────────────────────────
const leads      = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', status: '', fecha_desde: '', fecha_hasta: '' })
const expandidos = ref(new Set())

async function loadLeads(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    for (const [clave, valor] of Object.entries(filters)) {
      if (valor !== '' && valor !== null) params[clave] = valor
    }
    const res = await seguimientoService.getPorLead(params)
    leads.value = res.data ?? []
    // Al buscar un lead se despliega toda su bitácora
    expandidos.value = new Set(filters.search.trim() ? leads.value.map(l => l.id) : [])
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los seguimientos.'
  } finally {
    loading.value = false
  }
}

function toggleLead(id) {
  const abiertos = new Set(expandidos.value)
  abiertos.has(id) ? abiertos.delete(id) : abiertos.add(id)
  expandidos.value = abiertos
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadLeads(1), 400)
}

function clearFilters() {
  Object.assign(filters, { search: '', status: '', fecha_desde: '', fecha_hasta: '' })
  loadLeads(1)
}

// ─── Descarga en Excel ────────────────────────────────────────────────────────
const descargando   = ref(false)
const lapsoCompleto = computed(() => !!filters.fecha_desde && !!filters.fecha_hasta)

/** Descarga los seguimientos del lapso, con la búsqueda y el estado aplicados en la pantalla. */
async function descargarExcel() {
  descargando.value = true
  try {
    const params = { fecha_desde: filters.fecha_desde, fecha_hasta: filters.fecha_hasta }
    if (filters.search.trim()) params.search = filters.search.trim()
    if (filters.status !== '') params.status = filters.status
    const blob = await seguimientoService.exportarExcel(params)
    descargarBlob(blob, `seguimientos-${filters.fecha_desde}-a-${filters.fecha_hasta}.xlsx`)
  } catch (e) {
    notifyError(await mensajeErrorBlob(e, 'No se pudo descargar el Excel de seguimientos.'))
  } finally {
    descargando.value = false
  }
}

// ─── Registrar seguimiento ────────────────────────────────────────────────────
const showForm   = ref(false)
const leadForm   = ref(null)
const saving     = ref(false)
const formError  = ref('')
const formErrors = ref({})
const form       = reactive({ fecha: hoy, seguimiento: '', estado: '', proxima: proximaAccionVacia() })

function openRegistrar(lead) {
  leadForm.value   = lead
  formError.value  = ''
  formErrors.value = {}
  Object.assign(form, { fecha: hoy, seguimiento: '', estado: String(lead.status), proxima: proximaAccionVacia() })
  showForm.value = true
}

/**
 * Registra el seguimiento con el estado y la próxima acción elegidos. Matriculado guarda el
 * seguimiento y abre el asistente de matrícula con el lead.
 */
async function handleSubmit() {
  saving.value     = true
  formError.value  = ''
  formErrors.value = {}
  const lead = leadForm.value
  const { estado, convertir } = resolverEstadoSeguimiento(form.estado, lead.status)
  try {
    const user = await authService.getUser()
    await seguimientoService.create({
      referido_id:     lead.id,
      seguidor_id:     user?.id,
      fecha:           form.fecha,
      seguimiento:     form.seguimiento.trim(),
      estado_referido: estado,
      proxima_accion:  proximaAccionPayload(form.proxima)
    })
    notifySuccess('Seguimiento registrado.')
    showForm.value = false
    if (convertir) {
      router.push({ path: '/academico/matriculas', query: { referido: lead.id } })
      return
    }
    await loadLeads(pagination.currentPage)
    expandidos.value = new Set([...expandidos.value, lead.id])
  } catch (e) {
    if (e?.response?.status === 422) formErrors.value = e.response.data?.errors ?? {}
    formError.value = e?.response?.data?.message ?? 'No se pudo registrar el seguimiento.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadLeads(1)
})
</script>
