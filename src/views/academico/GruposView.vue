<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-grupos-heading">
      <h2 id="stats-grupos-heading" class="sr-only">Resumen de grupos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total grupos"
            :value="stats.total"
            description="Registrados en el sistema"
            icon="people"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="Disponibles para matricular"
            icon="activos"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Eliminados"
            :value="stats.eliminados"
            description="En papelera (soft delete)"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Barra de filtros y acciones -->
    <section aria-labelledby="filtros-grupos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-grupos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del grupo..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            :options="filterStatusOptions"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.sede_id"
            label="Sede:"
            :options="filterSedeOptions"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.modulo_id"
            label="Módulo:"
            :options="filterModuloOptions"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.jornada"
            label="Jornada:"
            :options="filterJornadaOptions"
          />
        </div>
        <div class="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          <button
            v-if="viewTrashed"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="toggleTrashed"
          >
            <NavIcon name="eye" class="size-4" />
            Ver activos
          </button>
          <button
            v-else
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="toggleTrashed"
          >
            <NavIcon name="track_changes" class="size-4" />
            Ver eliminados
          </button>
          <button
            v-if="!viewTrashed"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo grupo
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de grupos -->
    <section aria-labelledby="listado-grupos-heading">
      <SectionHeader
        id="listado-grupos-heading"
        :title="viewTrashed ? 'Grupos eliminados' : 'Listado de grupos'"
        :description="viewTrashed
          ? 'Grupos en papelera. Puedes restaurarlos o eliminarlos permanentemente.'
          : 'Gestiona los grupos académicos. Haz clic en el ícono de ojo para ver el detalle.'"
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando grupos...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadGrupos(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="grupos"
        row-key="id"
        aria-label="Listado de grupos"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status ? 'Activo' : 'Inactivo')"
              :variant="row.status ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'jornada'">
            <span class="text-slate-700">{{ row.jornada_nombre ?? getJornadaLabel(row.jornada) ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'sede'">
            {{ row.sede?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'modulo'">
            {{ row.modulo?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'profesor'">
            {{ row.profesor?.name ?? '—' }}
          </template>
          <template v-else-if="column.key === 'horarios'">
            <span v-if="row.tiene_horarios" class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {{ row.total_horas_semana ?? 0 }}h/sem
            </span>
            <span v-else class="text-slate-400">—</span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ formatDate(value) }}
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
            title="Eliminar"
            @click="openEliminar(row)"
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} grupos
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

    <!-- ── Modal: Crear / Editar ────────────────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      :title="editingGrupo ? 'Editar grupo' : 'Nuevo grupo'"
      :description="editingGrupo
        ? 'Modifica los datos del grupo.'
        : 'Completa los campos para crear un nuevo grupo.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="form.sede_id"
            label="Sede"
            :options="formSedeOptions"
            :required="true"
          />
          <FormSelect
            v-model="form.modulo_id"
            label="Módulo"
            :options="formModuloOptions"
            :required="true"
          />
          <FormSelect
            v-model="form.profesor_id"
            label="Profesor"
            :options="formProfesorOptions"
            :required="true"
          />
          <FormInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Ej: Grupo A"
            hint="Máximo 255 caracteres. Debe ser único."
            :required="true"
            maxlength="255"
          />
          <FormInput
            v-model="form.inscritos"
            label="Inscritos"
            type="number"
            placeholder="0"
            min="0"
            max="50"
          />
          <FormSelect
            v-model="form.jornada"
            label="Jornada"
            :options="jornadaFormOptions"
            :required="true"
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            :options="statusFormOptions"
          />
        </div>

        <!-- Horarios: Semanario de disponibilidad -->
        <div class="flex flex-col gap-4">
          <div>
            <label class="text-sm font-medium text-slate-900">Horarios</label>
            <p class="text-xs text-slate-500 mt-0.5">
              Selecciona sede y área para ver la disponibilidad. Haz clic en los slots disponibles para asignarlos al grupo.
            </p>
          </div>

          <!-- Selectores para cargar semanario -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect
              v-model="semanarioAreaId"
              label="Área para consultar disponibilidad"
              placeholder="Selecciona un área"
              :options="formAreaOptions"
              @update:model-value="onSemanarioAreaChange"
            />
          </div>

          <!-- Semanario (solo cuando hay sede y área) -->
          <div v-if="form.sede_id && semanarioAreaId" class="mt-2">
            <SemanarioGrupos
              :semanario-data="semanarioData"
              :loading="semanarioLoading"
              :error="semanarioError"
              :selected-horarios="horariosParaSemanarioActual"
              @select-slot="onSemanarioSelectSlot"
              @remove-slot="onSemanarioRemoveSlot"
            />
          </div>
          <p v-else-if="form.sede_id" class="text-sm text-slate-500">
            Selecciona un área para ver el semanario de disponibilidad.
          </p>
          <p v-else class="text-sm text-slate-500">
            Selecciona primero la sede del grupo para poder consultar la disponibilidad de áreas.
          </p>

          <!-- Horarios asignados -->
          <div v-if="form.horarios.length" class="mt-2">
            <p class="text-sm font-medium text-slate-900 mb-2">Horarios asignados ({{ form.horarios.length }})</p>
            <div class="space-y-2">
              <div
                v-for="(h, idx) in form.horarios"
                :key="idx"
                class="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-3 py-2"
              >
                <span class="text-sm font-medium text-slate-900">
                  {{ getAreaNombre(h.area_id) }} · {{ capitalizar(h.dia) }} {{ formatHoraCorta(h.hora) }}
                </span>
                <label class="flex items-center gap-1 text-sm text-slate-600">
                  <input
                    v-model.number="h.duracion_horas"
                    type="number"
                    min="1"
                    max="8"
                    class="w-14 rounded border-0 bg-[#f3f3f5] px-2 py-1 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  h
                </label>
                <button
                  type="button"
                  class="ml-auto rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  title="Eliminar horario"
                  @click="removeHorario(idx)"
                >
                  <NavIcon name="close" class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </div>
        <div v-if="fieldErrors && Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
          <span v-else>{{ editingGrupo ? 'Guardar cambios' : 'Crear grupo' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showEliminarModal"
      title="Eliminar grupo"
      description="Esta acción moverá el grupo a la papelera. No se puede eliminar si tiene estudiantes inscritos."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ targetGrupo?.nombre }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showEliminarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmEliminar"
        >
          {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Restaurar ────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showRestaurarModal"
      title="Restaurar grupo"
      description="El grupo volverá a estar disponible en el sistema."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar <strong>{{ targetGrupo?.nombre }}</strong>?
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

    <!-- ── Modal: Detalle ──────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showDetailModal"
      title="Detalle del grupo"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>
      <div v-if="detailGrupo" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.nombre }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Sede</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.sede?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Módulo</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.modulo?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Profesor</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.profesor?.name ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Jornada</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.jornada_nombre ?? getJornadaLabel(detailGrupo.jornada) ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Inscritos</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.inscritos ?? 0 }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailGrupo.status_text ?? (detailGrupo.status ? 'Activo' : 'Inactivo')"
                :variant="detailGrupo.status ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Horas/semana</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailGrupo.total_horas_semana ?? 0 }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailGrupo.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailGrupo.updated_at) }}</dd>
          </div>
          <div v-if="detailGrupo.horarios?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Horarios</dt>
            <dd class="mt-2 space-y-2">
              <div
                v-for="h in detailGrupo.horarios"
                :key="h.id"
                class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-900">{{ h.area?.nombre ?? '—' }}</span>
                <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {{ h.dia }} {{ h.hora }}
                </span>
              </div>
            </dd>
          </div>
          <div v-if="detailGrupo.dias_clase?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Días de clase</dt>
            <dd class="mt-0.5 text-slate-900">{{ (detailGrupo.dias_clase || []).join(', ') }}</dd>
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
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import grupoService from '@/services/grupoService.js'
import areaService from '@/services/areaService.js'
import horarioService from '@/services/horarioService.js'
import SemanarioGrupos from '@/components/academico/SemanarioGrupos.vue'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

const JORNADAS = [
  { value: 0, label: 'Mañana' },
  { value: 1, label: 'Tarde' },
  { value: 2, label: 'Noche' },
  { value: 3, label: 'Fin de semana mañana' },
  { value: 4, label: 'Fin de semana tarde' }
]

const jornadaFormOptions = JORNADAS
const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]


const grupos = ref([])
const loading = ref(false)
const error = ref('')
const viewTrashed = ref(false)

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const stats = reactive({ total: 0, activos: 0, eliminados: 0 })

const filters = reactive({
  search: '',
  status: '',
  sede_id: '',
  modulo_id: '',
  jornada: ''
})

const filterOptions = reactive({
  status_options: [{ value: '', label: 'Todos' }, { value: '1', label: 'Activos' }, { value: '0', label: 'Inactivos' }],
  jornada_options: [{ value: '', label: 'Todas' }, ...JORNADAS.map((j) => ({ value: String(j.value), label: j.label }))],
  sedes: [],
  modulos: [],
  profesores: []
})

const filterStatusOptions = computed(() => [
  { value: '', label: 'Todos' },
  ...(filterOptions.status_options?.map((o) => ({ value: String(o.value), label: o.label })) ?? [])
])

const filterJornadaOptions = computed(() => [
  { value: '', label: 'Todas' },
  ...(filterOptions.jornada_options?.map((o) => ({ value: String(o.value), label: o.label })) ?? [])
])

const filterSedeOptions = computed(() => [
  { value: '', label: 'Todas las sedes' },
  ...(filterOptions.sedes ?? []).map((s) => ({ value: String(s.id), label: s.nombre }))
])

const filterModuloOptions = computed(() => [
  { value: '', label: 'Todos los módulos' },
  ...(filterOptions.modulos ?? []).map((m) => ({ value: String(m.id), label: m.nombre }))
])

const formSedeOptions = computed(() =>
  (filterOptions.sedes ?? []).map((s) => ({ value: s.id, label: s.nombre }))
)
const formModuloOptions = computed(() =>
  (filterOptions.modulos ?? []).map((m) => ({ value: m.id, label: m.nombre }))
)
const formProfesorOptions = computed(() =>
  (filterOptions.profesores ?? []).map((p) => ({ value: p.id, label: p.name ?? p.email }))
)

const areas = ref([])
const formAreaOptions = computed(() =>
  areas.value.map((a) => ({ value: a.id, label: a.nombre }))
)

const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'sede', label: 'Sede' },
  { key: 'modulo', label: 'Módulo' },
  { key: 'profesor', label: 'Profesor' },
  { key: 'inscritos', label: 'Inscritos' },
  { key: 'jornada', label: 'Jornada' },
  { key: 'horarios', label: 'Horas/sem' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Creado' }
]

let searchTimer = null

watch(() => filters.status, () => loadGrupos(1))
watch(() => filters.sede_id, () => loadGrupos(1))
watch(() => filters.modulo_id, () => loadGrupos(1))
watch(() => filters.jornada, () => loadGrupos(1))
watch(viewTrashed, () => loadGrupos(1))

function getJornadaLabel(val) {
  return JORNADAS.find((j) => j.value === val)?.label
}

async function loadFilters() {
  try {
    const res = await grupoService.getFilters()
    const data = res.data ?? {}
    if (data.status_options?.length) filterOptions.status_options = [{ value: '', label: 'Todos' }, ...data.status_options.map((o) => ({ value: String(o.value), label: o.label }))]
    if (data.jornada_options?.length) filterOptions.jornada_options = [{ value: '', label: 'Todas' }, ...data.jornada_options.map((o) => ({ value: String(o.value), label: o.label }))]
    if (data.sedes?.length) filterOptions.sedes = data.sedes
    if (data.modulos?.length) filterOptions.modulos = data.modulos
    if (data.profesores?.length) filterOptions.profesores = data.profesores
  } catch {
    // Usar valores por defecto
  }
}

async function loadAreas() {
  try {
    const res = await areaService.getAll({ per_page: 200, sort_by: 'nombre', sort_direction: 'asc' })
    areas.value = res.data ?? []
  } catch {
    areas.value = []
  }
}

async function loadGrupos(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const fetcher = viewTrashed.value ? grupoService.getTrashed : grupoService.getAll
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'sede,modulo,profesor,horarios',
      sort_by: 'nombre',
      sort_direction: 'asc'
    }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status
    if (filters.sede_id) params.sede_id = filters.sede_id
    if (filters.modulo_id) params.modulo_id = filters.modulo_id
    if (filters.jornada !== '') params.jornada = filters.jornada

    const res = await fetcher(params)
    grupos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from ?? 0
      pagination.to = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los grupos.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await grupoService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadGrupos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadGrupos(page)
}

function toggleTrashed() {
  viewTrashed.value = !viewTrashed.value
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingGrupo = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  sede_id: null,
  modulo_id: null,
  profesor_id: null,
  nombre: '',
  inscritos: 0,
  jornada: 0,
  status: 1,
  horarios: []
})

// ─── Semanario ───────────────────────────────────────────────────────────────
const semanarioAreaId = ref(null)
const semanarioData = ref(null)
const semanarioLoading = ref(false)
const semanarioError = ref('')

const horariosParaSemanarioActual = computed(() => {
  const areaId = semanarioAreaId.value
  if (!areaId) return []
  return form.horarios.filter((h) => Number(h.area_id) === Number(areaId))
})

watch(() => form.sede_id, () => {
  semanarioAreaId.value = null
  semanarioData.value = null
  semanarioError.value = ''
})

async function loadSemanario() {
  const sedeId = Number(form.sede_id)
  const areaId = Number(semanarioAreaId.value)
  if (!sedeId || !areaId) {
    semanarioData.value = null
    return
  }
  semanarioLoading.value = true
  semanarioError.value = ''
  try {
    const res = await horarioService.getSemanario(sedeId, areaId)
    semanarioData.value = res.data ?? res
  } catch (e) {
    semanarioError.value = e?.response?.data?.message ?? 'Error al cargar el semanario.'
    semanarioData.value = null
  } finally {
    semanarioLoading.value = false
  }
}

function onSemanarioAreaChange() {
  if (!form.sede_id || !semanarioAreaId.value) {
    semanarioData.value = null
    semanarioError.value = ''
    return
  }
  loadSemanario()
}

function onSemanarioSelectSlot({ dia, hora, duracion_horas }) {
  const areaId = semanarioAreaId.value
  if (!areaId) return
  form.horarios.push({
    area_id: Number(areaId),
    dia,
    hora: String(hora).slice(0, 5),
    duracion_horas: duracion_horas ?? 1,
    status: 1
  })
}

function onSemanarioRemoveSlot({ dia, hora }) {
  const areaId = semanarioAreaId.value
  if (!areaId) return
  const horaStr = String(hora).slice(0, 5)
  const idx = form.horarios.findIndex(
    (h) => Number(h.area_id) === Number(areaId) && h.dia === dia && String(h.hora || '').slice(0, 5) === horaStr
  )
  if (idx !== -1) form.horarios.splice(idx, 1)
}

function getAreaNombre(areaId) {
  return areas.value.find((a) => a.id === areaId)?.nombre ?? `Área #${areaId}`
}

function formatHoraCorta(t) {
  if (!t) return '—'
  return String(t).slice(0, 5)
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function removeHorario(idx) {
  form.horarios.splice(idx, 1)
}

function resetForm() {
  form.sede_id = null
  form.modulo_id = null
  form.profesor_id = null
  form.nombre = ''
  form.inscritos = 0
  form.jornada = 0
  form.status = 1
  form.horarios = []
  semanarioAreaId.value = null
  semanarioData.value = null
  semanarioError.value = ''
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingGrupo.value = null
  resetForm()
  loadFilters()
  loadAreas()
  showFormModal.value = true
}

async function openEdit(grupo) {
  editingGrupo.value = grupo
  resetForm()
  await Promise.all([loadFilters(), loadAreas()])

  form.sede_id = grupo.sede_id ?? grupo.sede?.id ?? null
  form.modulo_id = grupo.modulo_id ?? grupo.modulo?.id ?? null
  form.profesor_id = grupo.profesor_id ?? grupo.profesor?.id ?? null
  form.nombre = grupo.nombre ?? ''
  form.inscritos = grupo.inscritos ?? 0
  form.jornada = grupo.jornada ?? 0
  form.status = grupo.status ?? 1

  try {
    const res = await grupoService.getById(grupo.id, { with: 'sede,modulo,profesor,horarios' })
    const data = res.data ?? {}
    const horarios = data.horarios ?? []
    form.horarios = horarios.map((h) => ({
      area_id: h.area_id ?? h.area?.id ?? null,
      dia: h.dia ?? 'lunes',
      hora: (h.hora || '08:00').slice(0, 5),
      duracion_horas: h.duracion_horas ?? 1,
      status: h.status ?? 1
    }))
    if (form.horarios.length === 0) form.horarios = []
  } catch {
    form.horarios = []
  }
  showFormModal.value = true
}

function buildPayload() {
  const payload = {
    sede_id: Number(form.sede_id) || null,
    modulo_id: Number(form.modulo_id) || null,
    profesor_id: Number(form.profesor_id) || null,
    nombre: String(form.nombre || '').trim(),
    inscritos: Number(form.inscritos) || 0,
    jornada: Number(form.jornada) ?? 0,
    status: Number(form.status) ?? 1
  }
  const validHorarios = form.horarios.filter((h) => h.area_id && h.dia && h.hora)
  if (validHorarios.length) {
    payload.horarios = validHorarios.map((h) => ({
      area_id: Number(h.area_id),
      dia: h.dia,
      hora: String(h.hora).length === 5 ? h.hora : `${h.hora}:00`,
      duracion_horas: Number(h.duracion_horas) || 1,
      status: Number(h.status) ?? 1
    }))
  }
  return payload
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}

  const payload = buildPayload()
  formLoading.value = true
  try {
    if (editingGrupo.value) {
      await grupoService.update(editingGrupo.value.id, payload, { _silent: true })
      notifySuccess(`El grupo "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await grupoService.create(payload, { _silent: true })
      notifySuccess(`El grupo "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadGrupos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetGrupo = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openEliminar(grupo) {
  targetGrupo.value = grupo
  actionError.value = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await grupoService.delete(targetGrupo.value.id)
    notifySuccess(`El grupo "${targetGrupo.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadGrupos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el grupo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(grupo) {
  targetGrupo.value = grupo
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await grupoService.restore(targetGrupo.value.id)
    notifySuccess(`El grupo "${targetGrupo.value.nombre}" fue restaurado.`)
    showRestaurarModal.value = false
    await Promise.all([loadGrupos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el grupo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailGrupo = ref(null)

async function openDetail(grupo) {
  detailGrupo.value = grupo
  showDetailModal.value = true
  try {
    const res = await grupoService.getById(grupo.id, { with: 'sede,modulo,profesor,horarios' })
    detailGrupo.value = res.data
  } catch {
    // Mantener datos del listado
  }
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

onMounted(() => {
  loadFilters()
  loadAreas()
  loadGrupos()
  loadStatistics()
})
</script>
