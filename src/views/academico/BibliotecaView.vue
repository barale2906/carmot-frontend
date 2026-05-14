<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-biblioteca-heading">
      <h2 id="stats-biblioteca-heading" class="sr-only">Resumen de biblioteca</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total documentos"
            :value="stats.total"
            description="Registrados en la biblioteca"
            icon="biblioteca"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Vigentes"
            :value="stats.vigentes"
            description="No han alcanzado su fecha de obsolescencia"
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

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-biblioteca-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-biblioteca-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del documento..."
            help="Filtra documentos por nombre."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            :options="statusOptions"
          />
        </div>
        <div class="w-full sm:w-[150px]">
          <FormSelect
            v-model="filters.tipo_archivo"
            label="Tipo:"
            :options="tipoArchivoOptions"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.vigencia"
            label="Vigencia:"
            :options="vigenciaOptions"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo documento
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de documentos -->
    <section aria-labelledby="listado-biblioteca-heading">
      <SectionHeader
        id="listado-biblioteca-heading"
        title="Listado de documentos"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada documento."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando documentos...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadDocumentos(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="documentos"
        row-key="id"
        aria-label="Listado de documentos de biblioteca"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status'">
            <StatusBadge
              :label="row.status ? 'Activo' : 'Inactivo'"
              :variant="row.status ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'vigente'">
            <StatusBadge
              :label="row.vigente ? 'Vigente' : 'Obsoleto'"
              :variant="row.vigente ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'tipo_archivo'">
            <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
              {{ value ?? '—' }}
            </span>
          </template>
          <template v-else-if="column.key === 'cursos_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'fecha_carga' || column.key === 'fecha_obsolescencia'">
            {{ value ? formatDate(value) : '—' }}
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
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Descargar"
            @click="downloadDocumento(row)"
          >
            <NavIcon name="download" class="size-4" />
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
          <template v-if="row.deleted_at">
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Restaurar"
              @click="openRestaurar(row)"
            >
              <NavIcon name="track_changes" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar permanentemente"
              @click="openForceDelete(row)"
            >
              <NavIcon name="trash" class="size-4" />
            </button>
          </template>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} documentos
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
      :title="editingDoc ? 'Editar documento' : 'Nuevo documento'"
      :description="editingDoc
        ? 'Modifica los datos del documento de la biblioteca.'
        : 'Completa los campos para agregar un documento a la biblioteca.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="biblioteca" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Ej: Manual de Excel Avanzado"
            help="Nombre descriptivo del documento."
            :required="true"
            span="full"
          />
          <FormInput
            v-model="form.fecha_carga"
            label="Fecha de carga"
            type="date"
            help="Fecha en que se incorpora el documento a la biblioteca."
            :required="true"
          />
          <FormInput
            v-model="form.fecha_obsolescencia"
            label="Fecha de obsolescencia"
            type="date"
            help="Fecha a partir de la cual el documento se considera obsoleto. Opcional."
          />
          <div v-if="editingDoc" class="flex flex-col gap-2">
            <FormSelect
              v-model="form.status"
              label="Estado"
              help="Activo: disponible; inactivo: restringido."
              :options="statusFormOptions"
            />
          </div>

          <FormFileUpload
            v-model="form.archivo"
            label="Archivo"
            description="Sube el documento (PDF, Word, Excel, etc.)"
            upload-label="Seleccionar archivo"
            hint="Formatos permitidos: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar."
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            :required="!editingDoc"
            span="full"
          />
          <div v-if="editingDoc && editingDoc.nombre" class="sm:col-span-2">
            <p class="text-xs text-slate-500">
              Archivo actual:
              <span class="font-medium text-slate-700">{{ editingDoc.nombre }} ({{ editingDoc.tamanio_legible }})</span>
              — Sube uno nuevo solo si deseas reemplazarlo.
            </p>
          </div>

          <div class="sm:col-span-2">
            <FormCheckboxGroup
              v-model="form.cursos"
              label="Cursos asociados"
              help="Selecciona los cursos a los que aplica este documento. Puedes elegir varios."
              search-placeholder="Buscar curso..."
              :options="cursosOptions"
              span="full"
            />
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
          <span v-else>{{ editingDoc ? 'Guardar cambios' : 'Agregar documento' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showEliminarModal"
      title="Eliminar documento"
      description="Esta acción moverá el documento a la papelera. Podrás restaurarlo en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ targetDoc?.nombre }}</strong>?
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
      title="Restaurar documento"
      description="El documento volverá a estar disponible en la biblioteca."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar <strong>{{ targetDoc?.nombre }}</strong>?
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

    <!-- ── Modal: Eliminar permanente ─────────────────────────────────────── -->
    <ModalBase
      v-model="showForceDeleteModal"
      title="Eliminar permanentemente"
      description="Esta acción no se puede deshacer. El documento y su archivo serán eliminados definitivamente."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Confirmas la eliminación permanente de
          <strong>{{ targetDoc?.nombre }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showForceDeleteModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmForceDelete"
        >
          {{ actionLoading ? 'Eliminando...' : 'Eliminar definitivamente' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Detalle ──────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showDetailModal"
      title="Detalle del documento"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="biblioteca" class="size-5" />
        </span>
      </template>
      <div v-if="detailDoc" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailDoc.nombre }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Tipo de archivo</dt>
            <dd class="mt-0.5">
              <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700">
                {{ detailDoc.tipo_archivo ?? '—' }}
              </span>
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Tamaño</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailDoc.tamanio_legible ?? '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Fecha de carga</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailDoc.fecha_carga) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Fecha de obsolescencia</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailDoc.fecha_obsolescencia ? formatDate(detailDoc.fecha_obsolescencia) : '—' }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailDoc.status ? 'Activo' : 'Inactivo'"
                :variant="detailDoc.status ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Vigencia</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailDoc.vigente ? 'Vigente' : 'Obsoleto'"
                :variant="detailDoc.vigente ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Cursos vinculados</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailDoc.cursos_count ?? detailDoc.cursos?.length ?? 0 }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailDoc.created_at) }}</dd>
          </div>
          <div v-if="detailDoc.cursos?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Cursos</dt>
            <dd class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="curso in detailDoc.cursos"
                :key="curso.id"
                class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ curso.nombre }}
              </span>
            </dd>
          </div>
          <div v-if="detailDoc.url" class="col-span-2">
            <dt class="font-medium text-slate-500">Archivo</dt>
            <dd class="mt-0.5">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[#213360] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="downloadDocumento(detailDoc)"
              >
                <NavIcon name="download" class="size-3.5" />
                Descargar
              </button>
            </dd>
          </div>
        </dl>
      </div>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormFileUpload from '@/components/forms/FormFileUpload.vue'
import FormCheckboxGroup from '@/components/forms/FormCheckboxGroup.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import bibliotecaService from '@/services/bibliotecaService.js'
import cursoService from '@/services/cursoService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Estado principal ─────────────────────────────────────────────────────────
const documentos = ref([])
const loading    = ref(false)
const error      = ref('')

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const stats = reactive({ total: 0, vigentes: 0, eliminados: 0 })

const filters = reactive({
  search:       '',
  status:       '',
  tipo_archivo: '',
  vigencia:     ''
})

let searchTimer = null

// ─── Opciones de filtros ──────────────────────────────────────────────────────
const statusOptions = [
  { value: '',  label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' }
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]

const tipoArchivoOptions = [
  { value: '',      label: 'Todos' },
  { value: 'pdf',   label: 'PDF' },
  { value: 'doc',   label: 'DOC' },
  { value: 'docx',  label: 'DOCX' },
  { value: 'xls',   label: 'XLS' },
  { value: 'xlsx',  label: 'XLSX' },
  { value: 'ppt',   label: 'PPT' },
  { value: 'pptx',  label: 'PPTX' },
  { value: 'txt',   label: 'TXT' },
  { value: 'zip',   label: 'ZIP' },
  { value: 'rar',   label: 'RAR' }
]

const vigenciaOptions = [
  { value: '',         label: 'Todos' },
  { value: 'vigentes', label: 'Vigentes' },
  { value: 'obsoletos', label: 'Obsoletos' }
]

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',              label: 'Nombre' },
  { key: 'tipo_archivo',        label: 'Tipo' },
  { key: 'tamanio_legible',     label: 'Tamaño' },
  { key: 'fecha_carga',         label: 'Fecha carga' },
  { key: 'fecha_obsolescencia', label: 'Obsolescencia' },
  { key: 'vigente',             label: 'Vigencia' },
  { key: 'cursos_count',        label: 'Cursos' },
  { key: 'status',              label: 'Estado' }
]

// ─── Cursos disponibles para el selector ─────────────────────────────────────
const cursosOptions = ref([])

async function loadCursos() {
  try {
    const res = await cursoService.getAll({ per_page: 100, status: 1 })
    cursosOptions.value = (res.data ?? []).map((c) => ({
      value: c.id,
      label: c.nombre,
      description: c.duracion ? `${c.duracion} h` : undefined
    }))
  } catch {
    // No bloquea la vista
  }
}

// ─── Watchers de filtros ──────────────────────────────────────────────────────
watch(() => [filters.status, filters.tipo_archivo, filters.vigencia], () => loadDocumentos(1))

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadDocumentos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'cursos'
    }
    if (filters.search)       params.search       = filters.search
    if (filters.status !== '') params.status        = filters.status
    if (filters.tipo_archivo) params.tipo_archivo  = filters.tipo_archivo
    if (filters.vigencia === 'vigentes')  params.vigentes  = true
    if (filters.vigencia === 'obsoletos') params.obsoletos = true

    const res = await bibliotecaService.getAll(params)
    documentos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from
      pagination.to          = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los documentos.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await bibliotecaService.getStatistics()
    const totales = res.data?.totales ?? res.data ?? {}
    stats.total     = totales.total     ?? 0
    stats.vigentes  = totales.vigentes  ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo — no bloquea la vista
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadDocumentos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadDocumentos(page)
}

// ─── Descarga ─────────────────────────────────────────────────────────────────
async function downloadDocumento(doc) {
  try {
    const res = await bibliotecaService.getDownloadUrl(doc.id)
    const url = res.data?.url ?? doc.url
    if (url) window.open(url, '_blank', 'noopener')
    else notifyError('No se pudo obtener la URL de descarga.')
  } catch {
    notifyError('Error al obtener el enlace de descarga.')
  }
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingDoc    = ref(null)
const formLoading   = ref(false)
const formError     = ref('')
const fieldErrors   = ref({})

const form = reactive({
  nombre:              '',
  fecha_carga:         '',
  fecha_obsolescencia: '',
  archivo:             null,
  cursos:              [],
  status:              1
})

function resetForm() {
  form.nombre              = ''
  form.fecha_carga         = todayISO()
  form.fecha_obsolescencia = ''
  form.archivo             = null
  form.cursos              = []
  form.status              = 1
  formError.value          = ''
  fieldErrors.value        = {}
}

function openCreate() {
  editingDoc.value    = null
  resetForm()
  showFormModal.value = true
}

function openEdit(doc) {
  editingDoc.value             = doc
  form.nombre                  = doc.nombre ?? ''
  form.fecha_carga             = doc.fecha_carga ?? ''
  form.fecha_obsolescencia     = doc.fecha_obsolescencia ?? ''
  form.archivo                 = null
  form.cursos                  = (doc.cursos ?? []).map((c) => c.id)
  form.status                  = doc.status ?? 1
  formError.value              = ''
  fieldErrors.value            = {}
  showFormModal.value          = true
}

function buildFormData(isEdit) {
  const fd = new FormData()
  fd.append('nombre', form.nombre)
  if (form.fecha_carga)         fd.append('fecha_carga', form.fecha_carga)
  if (form.fecha_obsolescencia) fd.append('fecha_obsolescencia', form.fecha_obsolescencia)
  if (form.archivo) fd.append('archivo', form.archivo)
  form.cursos.forEach((id) => fd.append('cursos[]', id))
  if (isEdit) fd.append('status', String(form.status))
  return fd
}

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}

  const isEdit = !!editingDoc.value
  const fd     = buildFormData(isEdit)

  formLoading.value = true
  try {
    if (isEdit) {
      await bibliotecaService.update(editingDoc.value.id, fd, { _silent: true })
      notifySuccess(`El documento "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await bibliotecaService.create(fd, { _silent: true })
      notifySuccess(`El documento "${form.nombre}" fue agregado a la biblioteca.`)
    }
    showFormModal.value = false
    await Promise.all([loadDocumentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
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
const targetDoc         = ref(null)
const actionLoading     = ref(false)
const actionError       = ref('')

function openEliminar(doc) {
  targetDoc.value         = doc
  actionError.value       = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await bibliotecaService.delete(targetDoc.value.id)
    notifySuccess(`El documento "${targetDoc.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadDocumentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el documento.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(doc) {
  targetDoc.value          = doc
  actionError.value        = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await bibliotecaService.restore(targetDoc.value.id)
    notifySuccess(`El documento "${targetDoc.value.nombre}" fue restaurado.`)
    showRestaurarModal.value = false
    await Promise.all([loadDocumentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el documento.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Force Delete ───────────────────────────────────────────────────────
const showForceDeleteModal = ref(false)

function openForceDelete(doc) {
  targetDoc.value            = doc
  actionError.value          = ''
  showForceDeleteModal.value = true
}

async function confirmForceDelete() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await bibliotecaService.forceDelete(targetDoc.value.id)
    notifySuccess(`El documento "${targetDoc.value.nombre}" fue eliminado permanentemente.`)
    showForceDeleteModal.value = false
    await Promise.all([loadDocumentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar permanentemente el documento.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailDoc       = ref(null)

async function openDetail(doc) {
  detailDoc.value       = doc
  showDetailModal.value = true
  try {
    const res = await bibliotecaService.getById(doc.id, { with: 'cursos' })
    detailDoc.value = res.data
  } catch {
    // Mantener datos del listado si falla
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadDocumentos()
  loadStatistics()
  loadCursos()
})
</script>
