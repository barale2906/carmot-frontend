<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-sedes-heading">
      <h2 id="stats-sedes-heading" class="sr-only">Resumen de sedes</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total sedes"
            :value="stats.total"
            description="Registradas en el sistema"
            icon="location_city"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activas"
            :value="stats.activos"
            description="En funcionamiento"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivas"
            :value="stats.eliminados"
            description="Eliminadas del sistema"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-sedes-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-sedes-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre, email, dirección..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect
            v-model="filters.poblacion_id"
            label="Ciudad:"
            placeholder="Todas las ciudades"
            :options="poblacionOptions"
          />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nueva sede
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de sedes -->
    <section aria-labelledby="listado-sedes-heading">
      <SectionHeader
        id="listado-sedes-heading"
        title="Listado de sedes"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada sede."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando sedes...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="() => loadSedes(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="sedes"
        row-key="id"
        aria-label="Listado de sedes"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'poblacion'">
            {{ row.poblacion?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'horario'">
            <span class="text-slate-600">
              {{ formatHora(row.hora_inicio) }} – {{ formatHora(row.hora_fin) }}
            </span>
          </template>
          <template v-else-if="column.key === 'areas_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ row.areas?.length ?? row.areas_count ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'estado'">
            <StatusBadge
              :label="row.deleted_at ? 'Inactiva' : 'Activa'"
              :variant="row.deleted_at ? 'inactivo' : 'activo'"
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} sedes
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

    <!-- ── Modal Crear / Editar sede ─────────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      size="lg"
      :title="editingSede ? 'Editar sede' : 'Nueva sede'"
      :description="editingSede
        ? 'Modifica los datos de la sede. Puedes regenerar los horarios automáticamente o conservar los personalizados.'
        : 'Completa los campos para registrar una nueva sede. Los horarios se generan automáticamente o puedes definirlos manualmente.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="location_city" class="size-5" />
        </span>
      </template>

      <form class="relative flex flex-col gap-5 pb-2" @submit.prevent="submitForm">
        <div
          v-if="formLoading && !formDataReady"
          class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80"
        >
          <span class="text-sm text-slate-600">Cargando datos de la sede...</span>
        </div>
        <div class="flex max-h-[min(70vh,600px)] flex-col gap-5 overflow-y-auto pr-1 -mr-1">
        <!-- Datos básicos -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre de la sede"
            placeholder="Ej: Sede Norte"
            :required="true"
            span="full"
          />
          <FormInput
            v-model="form.direccion"
            label="Dirección"
            placeholder="Ej: Calle 10 # 20-30"
            :required="true"
            span="full"
          />
          <FormInput
            v-model="form.telefono"
            label="Teléfono"
            type="tel"
            placeholder="Ej: 3001234567"
            :required="true"
          />
          <FormInput
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            placeholder="sede@carmot.com"
            :required="true"
          />
          <FormInput
            v-model="form.hora_inicio"
            label="Hora apertura"
            type="time"
            :required="true"
          />
          <FormInput
            v-model="form.hora_fin"
            label="Hora cierre"
            type="time"
            :required="true"
          />
          <FormSelect
            v-model="form.poblacion_id"
            label="Ciudad"
            placeholder="Seleccione ciudad"
            :options="poblacionOptions"
            :required="true"
            span="full"
          />
        </div>

        <!-- Áreas disponibles -->
        <div>
          <p class="mb-2 text-sm font-medium text-slate-900">Áreas asociadas <span class="text-red-500" aria-hidden="true">*</span></p>
          <div v-if="availableAreas.length === 0" class="text-xs text-slate-400">
            No hay áreas disponibles.
          </div>
          <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label
              v-for="area in availableAreas"
              :key="area.id"
              class="flex cursor-pointer items-center gap-2 rounded-lg bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 hover:bg-slate-200"
            >
              <input
                type="checkbox"
                :value="area.id"
                v-model="form.areas"
                class="accent-[#213360]"
              />
              {{ area.nombre }}
            </label>
          </div>
        </div>

        <!-- Modo de horarios -->
        <div class="rounded-lg border border-black/10 bg-slate-50 p-4">
          <p class="mb-3 text-sm font-medium text-slate-900">Horarios</p>
          <p
            v-if="editingSede && form.horarios.length > 15 && !form.usarHorariosPersonalizados"
            class="mb-2 text-xs text-slate-500"
          >
            Esta sede tiene {{ form.horarios.length }} horarios. Puedes cambiar a "Definir manualmente" para editarlos.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="form.usarHorariosPersonalizados"
                type="radio"
                :value="false"
                class="accent-[#213360]"
              />
              <span>
                {{ editingSede ? 'Regenerar automáticamente' : 'Generar automáticamente' }}
                <span class="block text-xs text-slate-500">Usa hora apertura y cierre para cada área</span>
              </span>
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="form.usarHorariosPersonalizados"
                type="radio"
                :value="true"
                class="accent-[#213360]"
              />
              <span>
                Definir horarios manualmente
                <span class="block text-xs text-slate-500">Configura cada franja por área y día</span>
              </span>
            </label>
          </div>
        </div>

        <!-- Horarios personalizados (solo si modo manual) -->
        <div v-if="form.usarHorariosPersonalizados">
          <p v-if="form.areas.length === 0" class="text-xs text-amber-600">
            Selecciona al menos un área arriba para poder definir horarios.
          </p>
          <template v-else>
            <div class="mb-3">
              <FormSelect
                v-model="semanarioAreaId"
                label="Área a editar"
                placeholder="Selecciona un área"
                :options="semanarioAreaOptions"
              />
            </div>
            <div v-if="semanarioAreaId != null && semanarioAreaId !== ''" class="mt-2">
              <SemanarioSedes
                :area-id="semanarioAreaId"
                :area-nombre="semanarioAreaSeleccionada?.nombre ?? ''"
                :hora-inicio="form.hora_inicio || '08:00'"
                :hora-fin="form.hora_fin || '18:00'"
                :horarios="horariosParaSemanarioActual"
                @update:horarios="onSemanarioUpdateHorarios"
              />
            </div>
            <p v-else class="text-sm text-slate-500">
              Selecciona un área para ver y editar su semanario de horarios.
            </p>
          </template>
        </div>

        <!-- Errores -->
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
          <span v-if="formLoading && !formDataReady">Cargando...</span>
          <span v-else-if="formLoading">Guardando...</span>
          <span v-else>{{ editingSede ? 'Guardar cambios' : 'Crear sede' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal Inactivar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showInactivarModal"
      title="Inactivar sede"
      description="La sede quedará inactiva y no aparecerá en el listado principal. Podrás restaurarla en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas inactivar la sede
          <strong>{{ targetSede?.nombre }}</strong>?
        </p>
        <p class="mt-1 text-xs text-amber-600">
          No se puede inactivar una sede con grupos académicos activos.
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
      title="Restaurar sede"
      description="La sede volverá a estar activa y visible en el listado principal."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar la sede <strong>{{ targetSede?.nombre }}</strong>?
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
    <ModalBase v-model="showDetailModal" title="Detalle de sede">
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="location_city" class="size-5" />
        </span>
      </template>
      <div v-if="detailSede" class="space-y-4 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailSede.nombre }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Dirección</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailSede.direccion }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Teléfono</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailSede.telefono }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Correo</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailSede.email }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Ciudad</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailSede.poblacion?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailSede.deleted_at ? 'Inactiva' : 'Activa'"
                :variant="detailSede.deleted_at ? 'inactivo' : 'activo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Horario general</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ formatHora(detailSede.hora_inicio) }} – {{ formatHora(detailSede.hora_fin) }}
              <span v-if="detailSede.duracion_horas" class="text-xs text-slate-400">({{ detailSede.duracion_horas }}h)</span>
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creada</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailSede.created_at) }}</dd>
          </div>
        </dl>

        <!-- Áreas -->
        <div v-if="detailSede.areas?.length">
          <p class="mb-2 text-sm font-medium text-slate-500">Áreas asociadas ({{ detailSede.areas.length }})</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="area in detailSede.areas"
              :key="area.id"
              class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {{ area.nombre }}
            </span>
          </div>
        </div>

        <!-- Horarios -->
        <div v-if="detailSede.horarios?.length">
          <p class="mb-2 text-sm font-medium text-slate-500">Horarios ({{ detailSede.horarios.length }})</p>
          <div class="flex flex-col gap-1.5">
            <div
              v-for="h in detailSede.horarios"
              :key="h.id"
              class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
            >
              <span class="capitalize">{{ h.dia }}</span>
              <span>{{ formatHora(h.hora) }}</span>
              <span class="text-slate-400">{{ h.periodo ? 'Inicio' : 'Fin' }} · {{ h.tipo ? 'Sede' : 'Grupo' }}</span>
              <span v-if="h.area" class="text-slate-500">{{ h.area.nombre }}</span>
            </div>
          </div>
        </div>
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
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import SemanarioSedes from '@/components/configuracion/SemanarioSedes.vue'
import sedeService from '@/services/sedeService.js'
import areaService from '@/services/areaService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess, error: notifyError } = useNotification()

const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miércoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
]

// ─── Estado principal ──────────────────────────────────────────────────────────
const sedes = ref([])
const loading = ref(false)
const error = ref('')
const availablePoblaciones = ref([])
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

const filters = reactive({
  search: '',
  poblacion_id: ''
})

let searchTimer = null

// ─── Formulario (declarado antes de computeds que lo usan) ──────────────────────
const form = reactive({
  nombre: '',
  direccion: '',
  telefono: '',
  email: '',
  hora_inicio: '',
  hora_fin: '',
  poblacion_id: '',
  areas: [],
  usarHorariosPersonalizados: false,
  horarios: []
})

// ─── Opciones computadas ──────────────────────────────────────────────────────
const poblacionOptions = computed(() =>
  availablePoblaciones.value.map((p) => ({ value: p.id, label: p.nombre }))
)

/** Áreas seleccionadas para la sede, usadas en el selector de horarios */
const areasSeleccionadasParaHorarios = computed(() => {
  const areas = Array.isArray(form.areas) ? form.areas : []
  return (availableAreas.value ?? []).filter((a) => areas.includes(a.id))
})

// ─── Semanario de horarios ────────────────────────────────────────────────────
const semanarioAreaId = ref(null)

const semanarioAreaOptions = computed(() =>
  (areasSeleccionadasParaHorarios.value ?? []).map((a) => ({
    value: a.id,
    label: a.nombre ?? String(a.id)
  }))
)

const semanarioAreaSeleccionada = computed(() =>
  availableAreas.value.find((a) => Number(a.id) === Number(semanarioAreaId.value))
)

const horariosParaSemanarioActual = computed(() => {
  const areaId = semanarioAreaId.value
  if (areaId == null || areaId === '') return []
  const list = Array.isArray(form.horarios) ? form.horarios : []
  return list.filter((h) => Number(h.area_id) === Number(areaId))
})

function onSemanarioUpdateHorarios(nuevosHorarios) {
  const areaId = semanarioAreaId.value
  if (areaId == null || areaId === '') return
  const lista = Array.isArray(nuevosHorarios) ? nuevosHorarios : []
  const otros = (form.horarios ?? []).filter((h) => Number(h.area_id) !== Number(areaId))
  form.horarios = [...otros, ...lista.map((h) => ({
    area_id: h.area_id,
    dia: h.dia ?? '',
    hora: h.hora ? (String(h.hora).length === 5 ? h.hora : `${String(h.hora).slice(0, 5)}:00`) : '',
    tipo: h.tipo ?? true,
    periodo: h.periodo ?? true
  }))]
}

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'poblacion', label: 'Ciudad' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Correo' },
  { key: 'horario', label: 'Horario' },
  { key: 'areas_count', label: 'Áreas' },
  { key: 'estado', label: 'Estado' }
]

watch(() => filters.poblacion_id, () => loadSedes(1))

watch(
  () => form.areas,
  (areas) => {
    const list = Array.isArray(areas) ? areas : []
    const current = semanarioAreaId.value
    if (current != null && current !== '' && !list.includes(current)) {
      semanarioAreaId.value = list[0] ?? null
    }
  },
  { deep: true }
)

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadSedes(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'poblacion,areas,horarios'
    }
    if (filters.search) params.search = filters.search
    if (filters.poblacion_id) params.poblacion_id = filters.poblacion_id
    const res = await sedeService.getAll(params)
    sedes.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from
      pagination.to = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar las sedes.'
  } finally {
    loading.value = false
  }
}

async function loadFilters() {
  try {
    const res = await sedeService.getFilters()
    availablePoblaciones.value = res.data?.poblaciones ?? []
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
    const res = await sedeService.getStatistics()
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
  searchTimer = setTimeout(() => loadSedes(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadSedes(page)
}

// ─── Formulario (modales y estado) ─────────────────────────────────────────────
const showFormModal = ref(false)
const editingSede = ref(null)
const formLoading = ref(false)
const formDataReady = ref(true)
const formError = ref('')
const fieldErrors = ref({})

function resetForm() {
  form.nombre = ''
  form.direccion = ''
  form.telefono = ''
  form.email = ''
  form.hora_inicio = ''
  form.hora_fin = ''
  form.poblacion_id = ''
  form.areas = []
  form.usarHorariosPersonalizados = false
  form.horarios = []
  semanarioAreaId.value = null
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingSede.value = null
  resetForm()
  formDataReady.value = true
  showFormModal.value = true
  loadAreas()
}

async function openEdit(sede) {
  editingSede.value = sede
  formError.value = ''
  fieldErrors.value = {}
  formLoading.value = true
  formDataReady.value = false
  showFormModal.value = true
  loadAreas()
  try {
    const res = await sedeService.getById(sede.id, { with: 'poblacion,areas,horarios' })
    const data = res.data ?? sede
    form.nombre = data.nombre ?? ''
    form.direccion = data.direccion ?? ''
    form.telefono = data.telefono ?? ''
    form.email = data.email ?? ''
    form.hora_inicio = horaToTime(data.hora_inicio)
    form.hora_fin = horaToTime(data.hora_fin)
    form.poblacion_id = data.poblacion_id ?? ''
    form.areas = (data.areas ?? []).map((a) => a.id)
    const horarios = data.horarios ?? []
    form.usarHorariosPersonalizados = horarios.length > 0 && horarios.length <= 15
    form.horarios = horarios.map((h) => ({
      area_id: h.area_id ?? '',
      dia: h.dia ?? '',
      hora: horaToTime(h.hora),
      tipo: h.tipo ?? true,
      periodo: h.periodo ?? true
    }))
    semanarioAreaId.value = form.areas[0] ?? null
  } catch {
    form.nombre = sede.nombre ?? ''
    form.direccion = sede.direccion ?? ''
    form.telefono = sede.telefono ?? ''
    form.email = sede.email ?? ''
    form.hora_inicio = horaToTime(sede.hora_inicio)
    form.hora_fin = horaToTime(sede.hora_fin)
    form.poblacion_id = sede.poblacion_id ?? ''
    form.areas = (sede.areas ?? []).map((a) => a.id)
    const horarios = sede.horarios ?? []
    form.usarHorariosPersonalizados = horarios.length > 0 && horarios.length <= 15
    form.horarios = horarios.length
      ? horarios.map((h) => ({
          area_id: h.area_id ?? '',
          dia: h.dia ?? '',
          hora: horaToTime(h.hora),
          tipo: h.tipo ?? true,
          periodo: h.periodo ?? true
        }))
      : []
    semanarioAreaId.value = form.areas[0] ?? null
  } finally {
    formLoading.value = false
    formDataReady.value = true
  }
}

function buildPayload() {
  const payload = {
    nombre: form.nombre,
    direccion: form.direccion,
    telefono: form.telefono,
    email: form.email,
    hora_inicio: timeToBackend(form.hora_inicio),
    hora_fin: timeToBackend(form.hora_fin),
    poblacion_id: form.poblacion_id || undefined,
    areas: form.areas
  }
  if (form.usarHorariosPersonalizados) {
    const horariosValidos = form.horarios.filter(
      (h) => h.area_id && form.areas.includes(h.area_id) && h.dia && h.hora
    )
    if (horariosValidos.length > 0) {
      payload.horarios = horariosValidos.map((h) => ({
        area_id: Number(h.area_id),
        dia: h.dia,
        hora: timeToBackend(h.hora),
        tipo: h.tipo,
        periodo: h.periodo
      }))
    }
  } else if (editingSede.value) {
    payload.horarios = []
  }
  return payload
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}
  if (form.usarHorariosPersonalizados) {
    const horariosValidos = form.horarios.filter(
      (h) => h.area_id && form.areas.includes(h.area_id) && h.dia && h.hora
    )
    if (horariosValidos.length === 0) {
      formError.value = 'Selecciona un área y configura al menos un horario en el semanario.'
      return
    }
  }
  formLoading.value = true
  try {
    const payload = buildPayload()
    if (editingSede.value) {
      await sedeService.update(editingSede.value.id, payload, { _silent: true })
      notifySuccess(`La sede "${form.nombre}" fue actualizada correctamente.`)
    } else {
      await sedeService.create(payload, { _silent: true })
      notifySuccess(`La sede "${form.nombre}" fue creada correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadSedes(pagination.currentPage), loadStatistics()])
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
const targetSede = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openInactivar(sede) {
  targetSede.value = sede
  actionError.value = ''
  showInactivarModal.value = true
}

async function confirmInactivar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await sedeService.inactivate(targetSede.value.id)
    notifySuccess(`La sede "${targetSede.value.nombre}" fue inactivada.`)
    showInactivarModal.value = false
    await Promise.all([loadSedes(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al inactivar la sede.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(sede) {
  targetSede.value = sede
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await sedeService.restore(targetSede.value.id)
    notifySuccess(`La sede "${targetSede.value.nombre}" fue restaurada.`)
    showRestaurarModal.value = false
    await Promise.all([loadSedes(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar la sede.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailSede = ref(null)

async function openDetail(sede) {
  detailSede.value = sede
  showDetailModal.value = true
  try {
    const res = await sedeService.getById(sede.id, { with: 'poblacion,areas,horarios' })
    detailSede.value = res.data
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

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  Promise.all([loadFilters(), loadAreas(), loadSedes(), loadStatistics()])
})
</script>
