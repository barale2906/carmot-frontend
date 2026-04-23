<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-horarios-heading">
      <h2 id="stats-horarios-heading" class="sr-only">Resumen de horarios</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total horarios"
            :value="stats.total"
            description="Registrados en el sistema"
            icon="calendar_today"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="Vigentes en el sistema"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivos"
            :value="stats.eliminados"
            description="Eliminados del sistema"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-horarios-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-horarios-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Sede, área, día..."
            help="Filtra franjas por sede, área o día."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.sede_id"
            label="Sede:"
            placeholder="Todas las sedes"
            help="Filtra horarios de una sede."
            :options="sedeOptions"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.area_id"
            label="Área:"
            placeholder="Todas las áreas"
            help="Filtra por área o taller."
            :options="areaOptions"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.dia"
            label="Día:"
            placeholder="Todos los días"
            help="Filtra por día de la semana."
            :options="diaOptions"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo horario
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de horarios -->
    <section aria-labelledby="listado-horarios-heading">
      <SectionHeader
        id="listado-horarios-heading"
        title="Listado de horarios"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada horario."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando horarios...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="() => loadHorarios(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="horarios"
        row-key="id"
        aria-label="Listado de horarios"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'sede'">
            {{ row.sede?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'area'">
            {{ row.area?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'hora'">
            {{ formatHora(value) }}
          </template>
          <template v-else-if="column.key === 'dia'">
            <span class="capitalize">{{ value ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'tipo'">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="row.tipo ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'"
            >
              {{ row.tipo ? 'Sede' : 'Grupo' }}
            </span>
          </template>
          <template v-else-if="column.key === 'periodo'">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="row.periodo ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'"
            >
              {{ row.periodo ? 'Inicio' : 'Fin' }}
            </span>
          </template>
          <template v-else-if="column.key === 'estado'">
            <StatusBadge
              :label="row.deleted_at ? 'Eliminado' : (row.status === 1 ? 'Activo' : 'Inactivo')"
              :variant="row.deleted_at ? 'inactivo' : (row.status === 1 ? 'activo' : 'inactivo')"
            />
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ver detalle"
            @click="openDetail(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            v-if="!row.deleted_at"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar"
            @click="openEdit(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="!row.deleted_at"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Inactivar"
            @click="openInactivar(row)"
          >
            <NavIcon name="close" class="size-4" />
          </button>
          <button
            v-else
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Restaurar"
            @click="openRestaurar(row)"
          >
            <NavIcon name="track_changes" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} horarios
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="goToPage(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="goToPage(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- ── Modal Crear / Editar horario ───────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      :title="editingHorario ? 'Editar horario' : 'Nuevo horario'"
      :description="editingHorario ? 'Modifica los datos del horario.' : 'Completa los campos para registrar un nuevo horario.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="calendar_today" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="form.sede_id"
            label="Sede"
            placeholder="Seleccione sede"
            help="Sede donde aplica esta franja horaria."
            :options="sedeOptions"
            :required="true"
            span="full"
          />
          <FormSelect
            v-model="form.area_id"
            label="Área"
            placeholder="Seleccione área"
            help="Área o espacio dentro de la sede."
            :options="areaOptions"
            :required="true"
          />
          <FormSelect
            v-model="form.dia"
            label="Día"
            placeholder="Seleccione día"
            help="Día de la semana de la franja."
            :options="diaOptions"
            :required="true"
          />
          <FormInput
            v-model="form.hora"
            label="Hora"
            type="time"
            help="Hora exacta de inicio o fin según el período."
            :required="true"
          />

          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-1">
              <label class="text-sm font-medium text-slate-900">Tipo</label>
              <FormFieldHelp text="Sede: uso general del espacio; Grupo: ligado a un grupo concreto." />
            </div>
            <div class="flex gap-3">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input v-model="form.tipo" type="radio" :value="true" class="accent-[#213360]" />
                Sede
              </label>
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input v-model="form.tipo" type="radio" :value="false" class="accent-[#213360]" />
                Grupo
              </label>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-1">
              <label class="text-sm font-medium text-slate-900">Período</label>
              <FormFieldHelp text="Inicio o fin del bloque horario en el calendario." />
            </div>
            <div class="flex gap-3">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input v-model="form.periodo" type="radio" :value="true" class="accent-[#213360]" />
                Inicio
              </label>
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input v-model="form.periodo" type="radio" :value="false" class="accent-[#213360]" />
                Fin
              </label>
            </div>
          </div>

          <!-- Campos de grupo (solo si tipo = false) -->
          <template v-if="form.tipo === false">
            <FormInput
              v-model="form.grupo_nombre"
              label="Nombre del grupo"
              placeholder="Ej: Inglés Básico A1"
              help="Identificador del grupo cuando el horario es de tipo Grupo."
              span="full"
            />
          </template>
        </div>

        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </div>
        <div v-if="fieldErrors && Object.keys(fieldErrors).length > 0" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <ul class="list-inside list-disc space-y-1">
            <li v-for="(msgs, field) in fieldErrors" :key="field">
              <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
            </li>
          </ul>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showFormModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="formLoading"
          class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="submitForm"
        >
          <span v-if="formLoading">Guardando...</span>
          <span v-else>{{ editingHorario ? 'Guardar cambios' : 'Crear horario' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Inactivar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showInactivarModal"
      title="Inactivar horario"
      description="El horario quedará inactivo. Podrás restaurarlo en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas inactivar este horario?
          <span v-if="targetHorario" class="block mt-1 font-medium text-slate-900">
            {{ targetHorario.dia ? capitalizar(targetHorario.dia) : '' }}
            {{ formatHora(targetHorario.hora) }} —
            {{ targetHorario.sede?.nombre }}
          </span>
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showInactivarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmInactivar"
        >
          {{ actionLoading ? 'Inactivando...' : 'Inactivar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Restaurar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showRestaurarModal"
      title="Restaurar horario"
      description="El horario volverá a estar activo."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar este horario?
          <span v-if="targetHorario" class="block mt-1 font-medium text-slate-900">
            {{ targetHorario.dia ? capitalizar(targetHorario.dia) : '' }}
            {{ formatHora(targetHorario.hora) }} —
            {{ targetHorario.sede?.nombre }}
          </span>
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showRestaurarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
          @click="confirmRestaurar"
        >
          {{ actionLoading ? 'Restaurando...' : 'Restaurar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Detalle ───────────────────────────────────────────────────── -->
    <ModalBase v-model="showDetailModal" title="Detalle del horario">
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="calendar_today" class="size-5" />
        </span>
      </template>
      <div v-if="detailHorario" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="font-medium text-slate-500">Sede</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailHorario.sede?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Área</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailHorario.area?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Día</dt>
            <dd class="mt-0.5 capitalize text-slate-900">{{ detailHorario.dia ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Hora</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatHora(detailHorario.hora) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Tipo</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailHorario.tipo ? 'Horario de Sede' : 'Horario de Grupo' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Período</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailHorario.periodo ? 'Inicio' : 'Fin' }}</dd>
          </div>
          <div v-if="detailHorario.grupo_nombre">
            <dt class="font-medium text-slate-500">Grupo</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailHorario.grupo_nombre }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailHorario.deleted_at ? 'Eliminado' : (detailHorario.status === 1 ? 'Activo' : 'Inactivo')"
                :variant="detailHorario.deleted_at ? 'inactivo' : (detailHorario.status === 1 ? 'activo' : 'inactivo')"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailHorario.created_at) }}</dd>
          </div>
        </dl>
      </div>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import horarioService from '@/services/horarioService.js'
import sedeService from '@/services/sedeService.js'
import areaService from '@/services/areaService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

const DIAS_OPTIONS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miércoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
]

// ─── Estado principal ──────────────────────────────────────────────────────────
const horarios = ref([])
const loading = ref(false)
const error = ref('')
const availableSedes = ref([])
const availableAreas = ref([])
const stats = reactive({ total: 0, activos: 0, eliminados: 0 })

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const filters = reactive({ search: '', sede_id: '', area_id: '', dia: '' })

let searchTimer = null

const sedeOptions = computed(() =>
  availableSedes.value.map((s) => ({ value: s.id, label: s.nombre }))
)
const areaOptions = computed(() =>
  availableAreas.value.map((a) => ({ value: a.id, label: a.nombre }))
)
const diaOptions = DIAS_OPTIONS

const tableColumns = [
  { key: 'sede', label: 'Sede' },
  { key: 'area', label: 'Área' },
  { key: 'dia', label: 'Día' },
  { key: 'hora', label: 'Hora' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'periodo', label: 'Período' },
  { key: 'estado', label: 'Estado' }
]

watch(() => filters.sede_id, () => loadHorarios(1))
watch(() => filters.area_id, () => loadHorarios(1))
watch(() => filters.dia, () => loadHorarios(1))

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadHorarios(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'sede,area'
    }
    if (filters.search) params.search = filters.search
    if (filters.sede_id) params.sede_id = filters.sede_id
    if (filters.area_id) params.area_id = filters.area_id
    if (filters.dia) params.dia = filters.dia
    const res = await horarioService.getAll(params)
    horarios.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from
      pagination.to = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los horarios.'
  } finally {
    loading.value = false
  }
}

async function loadSedes() {
  try {
    const res = await sedeService.getAll({ per_page: 100, sort_by: 'nombre' })
    availableSedes.value = res.data ?? []
  } catch {
    // Fallar silenciosamente
  }
}

async function loadAreas() {
  try {
    const res = await areaService.getAll({ per_page: 100, sort_by: 'nombre' })
    availableAreas.value = res.data ?? []
  } catch {
    // Fallar silenciosamente
  }
}

async function loadStatistics() {
  try {
    const res = await horarioService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Las estadísticas son informativas
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadHorarios(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadHorarios(page)
}

// ─── Formulario ───────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingHorario = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  sede_id: '',
  area_id: '',
  dia: '',
  hora: '',
  tipo: true,
  periodo: true,
  grupo_id: null,
  grupo_nombre: ''
})

function resetForm() {
  form.sede_id = ''
  form.area_id = ''
  form.dia = ''
  form.hora = ''
  form.tipo = true
  form.periodo = true
  form.grupo_id = null
  form.grupo_nombre = ''
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingHorario.value = null
  resetForm()
  showFormModal.value = true
}

function openEdit(horario) {
  editingHorario.value = horario
  form.sede_id = horario.sede_id ?? ''
  form.area_id = horario.area_id ?? ''
  form.dia = horario.dia ?? ''
  form.hora = horaToTime(horario.hora)
  form.tipo = horario.tipo ?? true
  form.periodo = horario.periodo ?? true
  form.grupo_id = horario.grupo_id ?? null
  form.grupo_nombre = horario.grupo_nombre ?? ''
  formError.value = ''
  fieldErrors.value = {}
  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    const payload = {
      sede_id: form.sede_id || undefined,
      area_id: form.area_id || undefined,
      dia: form.dia,
      hora: timeToBackend(form.hora),
      tipo: form.tipo,
      periodo: form.periodo,
      grupo_id: form.tipo === false ? (form.grupo_id || undefined) : undefined,
      grupo_nombre: form.tipo === false ? (form.grupo_nombre || undefined) : undefined
    }
    if (editingHorario.value) {
      await horarioService.update(editingHorario.value.id, payload, { _silent: true })
      notifySuccess('El horario fue actualizado correctamente.')
    } else {
      await horarioService.create(payload, { _silent: true })
      notifySuccess('El horario fue creado correctamente.')
    }
    showFormModal.value = false
    await Promise.all([loadHorarios(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else if (e?.response?.status === 403) {
      formError.value = 'No tienes permisos para realizar esta acción.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Inactivar ──────────────────────────────────────────────────────────
const showInactivarModal = ref(false)
const targetHorario = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openInactivar(horario) {
  targetHorario.value = horario
  actionError.value = ''
  showInactivarModal.value = true
}

async function confirmInactivar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await horarioService.inactivate(targetHorario.value.id)
    notifySuccess('El horario fue inactivado.')
    showInactivarModal.value = false
    await Promise.all([loadHorarios(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al inactivar el horario.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(horario) {
  targetHorario.value = horario
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await horarioService.restore(targetHorario.value.id)
    notifySuccess('El horario fue restaurado.')
    showRestaurarModal.value = false
    await Promise.all([loadHorarios(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el horario.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailHorario = ref(null)

async function openDetail(horario) {
  detailHorario.value = horario
  showDetailModal.value = true
  try {
    const res = await horarioService.getById(horario.id, { with: 'sede,area' })
    detailHorario.value = res.data
  } catch {
    // Mantener datos del listado si falla el detalle
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function horaToTime(hora) {
  if (!hora) return ''
  return hora.substring(0, 5)
}

function timeToBackend(time) {
  if (!time) return ''
  return time.length === 5 ? `${time}:00` : time
}

function formatHora(hora) {
  if (!hora) return '—'
  return hora.substring(0, 5)
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  Promise.all([loadSedes(), loadAreas(), loadHorarios(), loadStatistics()])
})
</script>
