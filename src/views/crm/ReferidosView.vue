<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-referidos-heading">
      <h2 id="stats-referidos-heading" class="sr-only">Resumen de leads</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard title="Leads" :value="stats.totales?.activos ?? '—'" description="Registrados en el CRM" icon="estudiantes" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Interesados" :value="stats.por_status?.interesados ?? '—'" description="Con intención de inscribirse" icon="pendientes" icon-variant="amber" />
        </li>
        <li role="listitem">
          <StatCard title="Por matricular" :value="stats.por_status?.pendientes ?? '—'" description="Listos para convertir" icon="formularios" icon-variant="orange" />
        </li>
        <li role="listitem">
          <StatCard title="Matriculados" :value="stats.por_status?.matriculados ?? '—'" description="Convertidos en matrícula" icon="academico" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-referidos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-referidos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre o celular..."
            help="Filtra por nombre o número de celular del aspirante."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filters.status" label="Estado:" :options="opcionesFiltroEstado" @change="loadReferidos(1)" />
        </div>
        <div class="w-full sm:w-[220px]">
          <FormSelect v-model="filters.curso_id" label="Curso:" :options="opcionesFiltroCurso" @change="loadReferidos(1)" />
        </div>
        <div class="w-full sm:w-[220px]">
          <FormSelect v-model="filters.gestor_id" label="Asesor:" :options="opcionesFiltroGestor" @change="loadReferidos(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('crm_referidoCrear')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo lead
          </button>
          <button
            v-if="can('crm_referidoInactivar')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openTrashed"
          >
            <NavIcon name="trash" class="size-4" />
            Papelera
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
    </section>

    <!-- Tabla principal -->
    <section aria-labelledby="listado-referidos-heading">
      <SectionHeader
        id="listado-referidos-heading"
        title="Leads"
        description="Aspirantes registrados por los asesores. Abre la ficha para ver su bitácora, agendar citas o convertirlos en matrícula."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando leads...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadReferidos(1)">
          Reintentar
        </button>
      </div>

      <div v-else-if="!referidos.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay leads con los filtros seleccionados.
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="referidos"
        row-key="id"
        aria-label="Listado de leads"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'nombre'">
            <span class="font-medium text-slate-900">{{ value || 'Sin nombre' }}</span>
          </template>
          <template v-else-if="column.key === 'curso'">
            {{ row.curso?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'gestor'">
            {{ row.gestor?.name ?? '—' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoReferido(row.status)">
              {{ row.status_text }}
            </span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ fechaCorta(value) }}
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ver ficha y bitácora"
            @click="openFicha(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            v-if="can('crm_referidoEditar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar lead"
            @click="openEdit(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="can('aca_matriculaCrear') && puedeConvertirse(row)"
            type="button"
            class="rounded p-1.5 text-green-700 transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Convertir en matrícula"
            @click="convertir(row)"
          >
            <NavIcon name="school" class="size-4" />
          </button>
          <button
            v-if="can('crm_referidoInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Eliminar lead"
            :disabled="!row.can_be_deleted"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
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
            @click="loadReferidos(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadReferidos(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- Modal: Crear / Editar lead -->
    <ModalBase
      v-model="showForm"
      size="lg"
      :title="editing ? 'Editar lead' : 'Nuevo lead'"
      description="Datos de contacto del aspirante y curso de su interés"
    >
      <form class="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2" @submit.prevent="handleSubmit">
        <FormInput v-model="form.nombre" label="Nombre" placeholder="Nombre completo" span="full" :error="formErrors.nombre?.[0]" />
        <FormInput v-model="form.celular" type="tel" label="Celular" required :error="formErrors.celular?.[0]" />
        <FormInput v-model="form.ciudad" label="Ciudad" required :error="formErrors.ciudad?.[0]" />
        <FormSelect v-model="form.curso_id" label="Curso de interés" required :options="opcionesCurso" :error="formErrors.curso_id?.[0]" />
        <FormSelect
          v-model="form.gestor_id"
          label="Asesor"
          required
          :options="opcionesGestor"
          :error="formErrors.gestor_id?.[0]"
          hint="Gestiona el lead hasta matricularlo. Cambiarlo lo reasigna y queda en la bitácora."
        />
        <!-- Primer seguimiento: queda en la bitácora junto con el lead -->
        <SeguimientoForm
          v-if="!editing && can('crm_seguimientoCrear')"
          v-model:texto="form.seguimiento"
          v-model:estado="form.status"
          v-model:proxima="form.proxima"
          class="md:col-span-2"
          label="Primer seguimiento"
          :permitir-matricular="can('aca_matriculaCrear')"
          :permitir-agendar="can('crm_agendaCrear')"
          :errores="formErrors"
        />
        <FormSelect
          v-if="editing"
          v-model="form.status"
          label="Estado"
          :options="opcionesEstadoEditable"
          :error="formErrors.status?.[0]"
        />

        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3 md:col-span-2">
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
          {{ saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear lead') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Ficha del lead -->
    <ReferidoFichaModal
      v-model="showFicha"
      :referido="fichaReferido"
      :can-seguimiento="can('crm_seguimientoCrear')"
      :can-agendar="can('crm_agendaCrear')"
      :can-convertir="can('aca_matriculaCrear')"
      @changed="refrescar"
      @convertir="convertir"
    />

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de leads" description="Leads eliminados. Puedes restaurarlos o eliminarlos permanentemente.">
      <div v-if="trashedLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando papelera...</span>
      </div>
      <div v-else-if="!trashed.length" class="py-6 text-center text-sm text-slate-400">
        No hay leads eliminados.
      </div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashed" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre || 'Sin nombre' }}</p>
            <p class="text-xs text-slate-400">{{ item.celular }} · {{ item.ciudad }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              @click="handleRestore(item)"
            >
              Restaurar
            </button>
            <button
              type="button"
              class="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="handleForceDelete(item)"
            >
              Eliminar definitivo
            </button>
          </div>
        </li>
      </ul>
      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showTrashed = false"
        >
          Cerrar
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import referidoService    from '@/services/referidoService.js'
import { authService }    from '@/services/authService.js'
import StatCard           from '@/components/dashboard/StatCard.vue'
import SectionHeader      from '@/components/activos/SectionHeader.vue'
import DataTable          from '@/components/activos/DataTable.vue'
import NavIcon            from '@/components/icons/NavIcon.vue'
import FormInputSearch    from '@/components/forms/FormInputSearch.vue'
import FormInput          from '@/components/forms/FormInput.vue'
import FormSelect         from '@/components/forms/FormSelect.vue'
import ModalBase          from '@/components/ModalBase.vue'
import ReferidoFichaModal from '@/components/crm/ReferidoFichaModal.vue'
import SeguimientoForm    from '@/components/crm/SeguimientoForm.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'
import {
  OPCIONES_ESTADO_REFERIDO, ESTADOS_REFERIDO,
  claseEstadoReferido, puedeConvertirse, resolverEstadoSeguimiento,
  proximaAccionVacia, proximaAccionPayload, fechaCorta
} from '@/utils/crm.js'

const router = useRouter()
const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Catálogos ─────────────────────────────────────────────────────────────────
const cursos   = ref([])
const gestores = ref([])

const opcionesCurso  = computed(() => cursos.value.map(c => ({ value: c.id, label: c.nombre })))
const opcionesGestor = computed(() => gestores.value.map(g => ({ value: g.id, label: g.name })))
const opcionesFiltroCurso  = computed(() => [{ value: '', label: 'Todos los cursos' }, ...opcionesCurso.value])
const opcionesFiltroGestor = computed(() => [{ value: '', label: 'Todos los asesores' }, ...opcionesGestor.value])
const opcionesFiltroEstado = [{ value: '', label: 'Todos los estados' }, ...OPCIONES_ESTADO_REFERIDO]
// "Matriculado" solo lo asigna la conversión desde la matrícula.
const opcionesEstadoEditable = OPCIONES_ESTADO_REFERIDO.filter(o => o.value !== ESTADOS_REFERIDO.MATRICULADO)

async function loadCatalogos() {
  try {
    const { data } = await referidoService.getFilters()
    cursos.value   = data?.cursos ?? []
    gestores.value = data?.gestores ?? []
  } catch { /* los selects quedan vacíos; el backend valida */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const referidos  = ref([])
const loading    = ref(false)
const error      = ref('')
const stats      = reactive({ totales: null, por_status: null })
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', status: '', curso_id: '', gestor_id: '' })

const tableColumns = [
  { key: 'nombre',     label: 'Nombre' },
  { key: 'celular',    label: 'Celular' },
  { key: 'ciudad',     label: 'Ciudad' },
  { key: 'curso',      label: 'Curso' },
  { key: 'gestor',     label: 'Asesor' },
  { key: 'status',     label: 'Estado' },
  { key: 'created_at', label: 'Registro' }
]

async function loadReferidos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15, with: 'curso,gestor', sort_by: 'created_at', sort_direction: 'desc' }
    for (const [clave, valor] of Object.entries(filters)) {
      if (valor !== '' && valor !== null) params[clave] = valor
    }
    const res = await referidoService.getAll(params)
    referidos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los leads.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const { data } = await referidoService.getStatistics()
    stats.totales    = data?.totales ?? null
    stats.por_status = data?.por_status ?? null
  } catch { /* no bloquea */ }
}

function refrescar() {
  loadReferidos(pagination.currentPage)
  loadStatistics()
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadReferidos(1), 400)
}

function clearFilters() {
  Object.assign(filters, { search: '', status: '', curso_id: '', gestor_id: '' })
  loadReferidos(1)
}

// ─── Ficha y conversión ───────────────────────────────────────────────────────
const showFicha     = ref(false)
const fichaReferido = ref(null)

function openFicha(row) {
  fichaReferido.value = row
  showFicha.value     = true
}

/** La conversión abre el wizard de matrícula precargado con el lead. */
function convertir(row) {
  router.push({ path: '/academico/matriculas', query: { referido: row.id } })
}

// ─── Formulario ───────────────────────────────────────────────────────────────
const showForm   = ref(false)
const editing    = ref(null)
const saving     = ref(false)
const formError  = ref('')
const formErrors = ref({})
const form = reactive({})

/** Formulario en blanco; el asesor por defecto es quien registra el lead. */
async function formularioVacio() {
  const user = await authService.getUser().catch(() => null)
  return {
    nombre: '', celular: '', ciudad: '', curso_id: '', gestor_id: user?.id ?? '',
    seguimiento: '', status: ESTADOS_REFERIDO.CREADO, proxima: proximaAccionVacia()
  }
}

async function openCreate() {
  editing.value    = null
  formError.value  = ''
  formErrors.value = {}
  Object.assign(form, await formularioVacio())
  showForm.value = true
}

function openEdit(row) {
  editing.value    = row
  formError.value  = ''
  formErrors.value = {}
  Object.assign(form, {
    nombre:       row.nombre ?? '',
    celular:      row.celular ?? '',
    ciudad:       row.ciudad ?? '',
    curso_id:     row.curso_id ?? '',
    gestor_id:    row.gestor_id ?? '',
    status:       row.status
  })
  showForm.value = true
}

async function handleSubmit() {
  saving.value     = true
  formError.value  = ''
  formErrors.value = {}
  const payload = {
    nombre:       form.nombre.trim() || null,
    celular:      form.celular.trim(),
    ciudad:       form.ciudad.trim(),
    curso_id:     form.curso_id ? Number(form.curso_id) : null,
    gestor_id:    form.gestor_id ? Number(form.gestor_id) : null
  }
  try {
    if (editing.value) {
      await referidoService.update(editing.value.id, { ...payload, status: Number(form.status) })
      notifySuccess('Lead actualizado.')
    } else {
      // Elegir Matriculado crea el lead "Pendiente por matricular" y abre el asistente de
      // matrícula; el backend lo pasa a Matriculado al generar la matrícula.
      const { estado, convertir: abrirMatricula } = resolverEstadoSeguimiento(form.status, null)
      const res = await referidoService.create({
        ...payload,
        status:      abrirMatricula ? ESTADOS_REFERIDO.PENDIENTE : (estado ?? ESTADOS_REFERIDO.CREADO),
        seguimiento:    form.seguimiento.trim() || null,
        proxima_accion: proximaAccionPayload(form.proxima)
      })
      notifySuccess('Lead creado.')
      if (abrirMatricula) {
        showForm.value = false
        convertir(res.data)
        return
      }
    }
    showForm.value = false
    refrescar()
  } catch (e) {
    if (e?.response?.status === 422) formErrors.value = e.response.data?.errors ?? {}
    formError.value = e?.response?.data?.message ?? 'Ocurrió un error. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}

// ─── Eliminar / papelera ──────────────────────────────────────────────────────
async function handleDelete(row) {
  if (!await confirm(`¿Eliminar el lead "${row.nombre || row.celular}"?`)) return
  try {
    await referidoService.delete(row.id)
    notifySuccess('Lead eliminado.')
    refrescar()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar el lead.')
  }
}

const showTrashed    = ref(false)
const trashed        = ref([])
const trashedLoading = ref(false)

async function openTrashed() {
  showTrashed.value    = true
  trashedLoading.value = true
  try {
    const res = await referidoService.getTrashed({ per_page: 100 })
    trashed.value = res.data ?? []
  } catch {
    trashed.value = []
  } finally {
    trashedLoading.value = false
  }
}

async function handleRestore(item) {
  try {
    await referidoService.restore(item.id)
    notifySuccess('Lead restaurado.')
    trashed.value = trashed.value.filter(r => r.id !== item.id)
    refrescar()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo restaurar el lead.')
  }
}

async function handleForceDelete(item) {
  if (!await confirm(`¿Eliminar permanentemente "${item.nombre || item.celular}"? Esta acción no se puede deshacer.`)) return
  try {
    await referidoService.forceDelete(item.id)
    notifySuccess('Lead eliminado permanentemente.')
    trashed.value = trashed.value.filter(r => r.id !== item.id)
    loadStatistics()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar el lead.')
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadCatalogos()
  loadReferidos(1)
  loadStatistics()
})
</script>
