<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-modulos-heading">
      <h2 id="stats-modulos-heading" class="sr-only">Resumen de módulos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total módulos"
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
            description="Disponibles para asignar"
            icon="security"
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
    <section aria-labelledby="filtros-modulos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-modulos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del módulo..."
            help="Filtra módulos por nombre."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            help="Activo o inactivo en el catálogo."
            :options="statusOptions"
          />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect
            v-model="filters.curso_id"
            label="Curso:"
            help="Filtra módulos asociados a un curso."
            :options="cursoFilterOptions"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo módulo
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de módulos -->
    <section aria-labelledby="listado-modulos-heading">
      <SectionHeader
        id="listado-modulos-heading"
        title="Listado de módulos"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada módulo."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando módulos...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadModulos(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="modulos"
        row-key="id"
        aria-label="Listado de módulos"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status ? 'Activo' : 'Inactivo')"
              :variant="row.status ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'cursos_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? row.cursos?.length ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'grupos_count'">
            <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {{ value ?? row.grupos?.length ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'topicos_count'">
            <span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {{ value ?? row.topicos?.length ?? 0 }}
            </span>
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
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} módulos
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
      :title="editingModulo ? 'Editar módulo' : 'Nuevo módulo'"
      :description="editingModulo
        ? 'Modifica los datos del módulo.'
        : 'Completa los campos para crear un nuevo módulo en el sistema.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Ej: Módulo de Matemáticas"
            hint="Máximo 255 caracteres. Debe ser único."
            help="Nombre del módulo en el plan y en productos LP."
            :required="true"
            maxlength="255"
            span="full"
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            help="Activo: usable en cursos; inactivo: restringido."
            :options="statusFormOptions"
          />
          <FormInput
            v-model="form.duracion"
            label="Duración (horas)"
            type="number"
            placeholder="0"
            hint="Se precarga con la suma de los tópicos. Puedes editarla manualmente."
            help="Carga horaria total del módulo (referencia o manual)."
            min="0"
            step="0.1"
          />
        </div>

        <!-- Selector de cursos -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-1">
            <label class="text-sm font-medium text-slate-900">Cursos</label>
            <FormFieldHelp text="Cursos que incluyen este módulo en su malla." />
          </div>

          <!-- Dropdown para agregar cursos -->
          <div class="relative">
            <select
              class="w-full appearance-none rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 pr-9 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :value="''"
              :disabled="cursosLoading"
              @change="addCurso($event.target.value); $event.target.value = ''"
            >
              <option value="" disabled>
                {{ cursosLoading ? 'Cargando cursos...' : 'Seleccionar curso para agregar...' }}
              </option>
              <option
                v-for="curso in cursosDisponibles"
                :key="curso.id"
                :value="curso.id"
              >
                {{ curso.duracion != null ? `${curso.duracion}h — ` : '' }}{{ curso.nombre }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          <!-- Badges de cursos seleccionados -->
          <div v-if="form.cursoIds.length" class="flex flex-wrap gap-1.5 rounded-lg border border-black/10 bg-slate-50 p-2">
            <span
              v-for="id in form.cursoIds"
              :key="id"
              class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
            >
              {{ getCursoNombre(id) }}
              <button
                type="button"
                class="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-200 hover:text-blue-900 focus:outline-none"
                :aria-label="`Quitar ${getCursoNombre(id)}`"
                @click="removeCurso(id)"
              >
                <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <p v-else class="text-xs text-slate-400">
            Sin cursos asignados. Puedes asociar cursos al módulo más adelante.
          </p>
        </div>

        <!-- Selector de tópicos -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-900">Tópicos</label>

          <!-- Dropdown para agregar tópicos -->
          <div class="relative">
            <select
              class="w-full appearance-none rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 pr-9 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              :value="''"
              :disabled="topicosLoading"
              @change="addTopico($event.target.value); $event.target.value = ''"
            >
              <option value="" disabled>
                {{ topicosLoading ? 'Cargando tópicos...' : 'Seleccionar tópico para agregar...' }}
              </option>
              <option
                v-for="topico in topicosDisponibles"
                :key="topico.id"
                :value="topico.id"
              >
                {{ topico.duracion != null ? `${topico.duracion}h — ` : '' }}{{ topico.nombre }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true">
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>

          <!-- Badges de tópicos seleccionados -->
          <div v-if="form.topicoIds.length" class="flex flex-wrap gap-1.5 rounded-lg border border-black/10 bg-slate-50 p-2">
            <span
              v-for="id in form.topicoIds"
              :key="id"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800"
            >
              {{ getTopicoNombre(id) }}{{ getTopicoDuracion(id) != null ? ` (${getTopicoDuracion(id)}h)` : '' }}
              <button
                type="button"
                class="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-200 hover:text-emerald-900 focus:outline-none"
                :aria-label="`Quitar ${getTopicoNombre(id)}`"
                @click="removeTopico(id)"
              >
                <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <p v-else class="text-xs text-slate-400">
            Sin tópicos asignados. Puedes asociar tópicos al módulo más adelante.
          </p>
          <p class="text-xs text-slate-500">
            La duración del módulo se calcula automáticamente como la suma de las duraciones de los tópicos seleccionados. Si no hay tópicos, la duración queda en 0.
          </p>
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
          <span v-else>{{ editingModulo ? 'Guardar cambios' : 'Crear módulo' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showEliminarModal"
      title="Eliminar módulo"
      description="Esta acción moverá el módulo a la papelera. Podrás restaurarlo en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ targetModulo?.nombre }}</strong>?
        </p>
        <p class="mt-2 text-xs text-slate-500">
          No se puede eliminar si el módulo tiene cursos o grupos asociados.
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
      title="Restaurar módulo"
      description="El módulo volverá a estar disponible en el sistema."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar <strong>{{ targetModulo?.nombre }}</strong>?
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
      title="Detalle del módulo"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>
      <div v-if="detailModulo" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailModulo.nombre }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailModulo.status_text ?? (detailModulo.status ? 'Activo' : 'Inactivo')"
                :variant="detailModulo.status ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Cursos vinculados</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailModulo.cursos_count ?? detailModulo.cursos?.length ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Grupos vinculados</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailModulo.grupos_count ?? detailModulo.grupos?.length ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Duración total</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailModulo.duracion != null ? `${detailModulo.duracion}h` : '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailModulo.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailModulo.updated_at) }}</dd>
          </div>
          <div v-if="detailModulo.cursos?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Cursos</dt>
            <dd class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="curso in detailModulo.cursos"
                :key="curso.id"
                class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ curso.nombre }}
                <span v-if="curso.duracion != null" class="ml-0.5 text-blue-600">({{ curso.duracion }}h)</span>
              </span>
            </dd>
          </div>
          <div v-if="detailModulo.grupos?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Grupos</dt>
            <dd class="mt-2 space-y-2">
              <div
                v-for="grupo in detailModulo.grupos"
                :key="grupo.id"
                class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-900">{{ grupo.nombre }}</span>
                <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {{ grupo.jornada_nombre ?? '—' }} · {{ grupo.inscritos ?? 0 }} inscritos
                </span>
              </div>
            </dd>
          </div>
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Tópicos del módulo</dt>
            <dd v-if="detailModulo.topicos?.length" class="mt-2 space-y-2">
              <div
                v-for="topico in detailModulo.topicos"
                :key="topico.id"
                class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-900">{{ topico.nombre }}</span>
                <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  {{ topico.duracion != null ? `${topico.duracion}h` : '—' }}
                </span>
              </div>
            </dd>
            <dd v-else class="mt-0.5 text-sm text-slate-400">Sin tópicos asignados</dd>
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
import moduloService from '@/services/moduloService.js'
import cursoService from '@/services/cursoService.js'
import topicoService from '@/services/topicoService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Estado principal ─────────────────────────────────────────────────────────
const modulos = ref([])
const loading = ref(false)
const error = ref('')

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const stats = reactive({ total: 0, activos: 0, eliminados: 0 })

const filters = reactive({ search: '', status: '', curso_id: '' })

let searchTimer = null

// ─── Opciones de filtros / form ───────────────────────────────────────────────
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' }
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]

// Cursos para el filtro (se cargan al montar)
const cursosParaFiltro = ref([])
const cursoFilterOptions = computed(() => [
  { value: '', label: 'Todos los cursos' },
  ...cursosParaFiltro.value.map((c) => ({ value: String(c.id), label: c.nombre }))
])

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'cursos_count', label: 'Cursos' },
  { key: 'grupos_count', label: 'Grupos' },
  { key: 'topicos_count', label: 'Tópicos' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Creado' }
]

// ─── Watchers de filtros ──────────────────────────────────────────────────────
watch(() => filters.status, () => loadModulos(1))
watch(() => filters.curso_id, () => loadModulos(1))

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadModulos(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'cursos,grupos,topicos'
    }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status
    if (filters.curso_id) params.curso_id = filters.curso_id

    const res = await moduloService.getAll(params)
    modulos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from
      pagination.to = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los módulos.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await moduloService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo — no bloquea la vista
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadModulos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadModulos(page)
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingModulo = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  nombre: '',
  status: 1,
  duracion: '',
  cursoIds: [],
  topicoIds: []
})

// ─── Catálogo de cursos ────────────────────────────────────────────────────────
const todosLosCursos = ref([])
const cursosLoading = ref(false)

async function loadCursosCatalogo() {
  cursosLoading.value = true
  try {
    const res = await cursoService.getAll({ per_page: 500, status: 1, sort_by: 'nombre', sort_direction: 'asc' })
    todosLosCursos.value = res.data ?? []
  } catch {
    // No bloquea el formulario
  } finally {
    cursosLoading.value = false
  }
}

/** Cursos aún no seleccionados (para el dropdown) */
const cursosDisponibles = computed(() =>
  todosLosCursos.value.filter((c) => !form.cursoIds.includes(c.id))
)

// ─── Catálogo de tópicos (desde /topicos/filters) ─────────────────────────────
const todosLosTopicos = ref([])
const topicosLoading = ref(false)

async function loadTopicosCatalogo() {
  topicosLoading.value = true
  try {
    const res = await topicoService.getAll({
      status: 1,
      per_page: 100,
      sort_by: 'nombre',
      sort_direction: 'asc'
    })
    todosLosTopicos.value = res.data ?? []
  } catch {
    // No bloquea el formulario
  } finally {
    topicosLoading.value = false
  }
}

/** Tópicos aún no seleccionados (para el dropdown) */
const topicosDisponibles = computed(() =>
  todosLosTopicos.value.filter((t) => !form.topicoIds.includes(t.id))
)

function getTopicoNombre(id) {
  return todosLosTopicos.value.find((t) => t.id === id)?.nombre ?? `#${id}`
}

function getTopicoDuracion(id) {
  return todosLosTopicos.value.find((t) => t.id === id)?.duracion ?? null
}

/** Duración calculada como suma de las duraciones de los tópicos seleccionados */
const duracionCalculada = computed(() => {
  return form.topicoIds.reduce((sum, id) => {
    const d = getTopicoDuracion(id)
    return sum + (d != null ? Number(d) : 0)
  }, 0)
})

function addTopico(rawId) {
  const id = Number(rawId)
  if (id && !form.topicoIds.includes(id)) {
    form.topicoIds.push(id)
    form.duracion = duracionCalculada.value
  }
}

function removeTopico(id) {
  const idx = form.topicoIds.indexOf(id)
  if (idx !== -1) {
    form.topicoIds.splice(idx, 1)
    form.duracion = duracionCalculada.value
  }
}

function getCursoNombre(id) {
  return todosLosCursos.value.find((c) => c.id === id)?.nombre ?? `#${id}`
}

function addCurso(rawId) {
  const id = Number(rawId)
  if (id && !form.cursoIds.includes(id)) {
    form.cursoIds.push(id)
  }
}

function removeCurso(id) {
  const idx = form.cursoIds.indexOf(id)
  if (idx !== -1) form.cursoIds.splice(idx, 1)
}

function resetForm() {
  form.nombre = ''
  form.status = 1
  form.duracion = 0
  form.cursoIds.splice(0)
  form.topicoIds.splice(0)
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingModulo.value = null
  resetForm()
  loadCursosCatalogo()
  loadTopicosCatalogo()
  showFormModal.value = true
}

async function openEdit(modulo) {
  editingModulo.value = modulo
  form.nombre = modulo.nombre ?? ''
  form.status = modulo.status ?? 1
  form.cursoIds.splice(0)
  form.topicoIds.splice(0)
  formError.value = ''
  fieldErrors.value = {}

  await Promise.allSettled([
    loadCursosCatalogo(),
    loadTopicosCatalogo(),
    moduloService.getById(modulo.id, { with: 'cursos,topicos' })
      .then((res) => {
        const data = res.data ?? {}
        const cursoIds = (data.cursos ?? []).map((c) => c.id)
        const topicoIds = (data.topicos ?? []).map((t) => t.id)
        form.cursoIds.splice(0, form.cursoIds.length, ...cursoIds)
        form.topicoIds.splice(0, form.topicoIds.length, ...topicoIds)
        form.duracion = data.duracion != null ? data.duracion : duracionCalculada.value
      })
  ])

  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}

  const cursoIdsCopy = [...form.cursoIds]
  const topicoIdsCopy = [...form.topicoIds]
  const duracion = form.duracion !== '' && form.duracion != null
    ? parseFloat(form.duracion)
    : duracionCalculada.value

  const payload = {
    nombre: form.nombre,
    status: Number(form.status),
    curso_ids: cursoIdsCopy,
    topico_ids: topicoIdsCopy,
    duracion: Number.isFinite(duracion) ? duracion : 0
  }

  formLoading.value = true
  try {
    if (editingModulo.value) {
      await moduloService.update(editingModulo.value.id, payload, { _silent: true })
      notifySuccess(`El módulo "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await moduloService.create(payload, { _silent: true })
      notifySuccess(`El módulo "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadModulos(pagination.currentPage), loadStatistics()])
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

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetModulo = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openEliminar(modulo) {
  targetModulo.value = modulo
  actionError.value = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await moduloService.delete(targetModulo.value.id)
    notifySuccess(`El módulo "${targetModulo.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadModulos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el módulo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(modulo) {
  targetModulo.value = modulo
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await moduloService.restore(targetModulo.value.id)
    notifySuccess(`El módulo "${targetModulo.value.nombre}" fue restaurado.`)
    showRestaurarModal.value = false
    await Promise.all([loadModulos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el módulo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailModulo = ref(null)

async function openDetail(modulo) {
  detailModulo.value = modulo
  showDetailModal.value = true
  try {
    const res = await moduloService.getById(modulo.id, { with: 'cursos,grupos,topicos' })
    detailModulo.value = res.data
  } catch {
    // Mantener datos del listado si falla el detalle
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

async function loadCursosParaFiltro() {
  try {
    const res = await cursoService.getAll({
      per_page: 500,
      status: 1,
      sort_by: 'nombre',
      sort_direction: 'asc'
    })
    cursosParaFiltro.value = res.data ?? []
  } catch {
    // No bloquea la vista
  }
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadCursosParaFiltro()
  loadModulos()
  loadStatistics()
})
</script>
