<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-documentos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-documentos-heading" class="sr-only">Filtros de documentos</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Número de documento..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[260px]">
          <FormSelect v-model="filters.tipo_documento_id" label="Tipo de documento:" placeholder="Todos" :options="tiposOptions" @change="loadDocumentos(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="statusOptions" @change="loadDocumentos(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('aca_documentoGenerar')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="showGenerar = true"
          >
            <NavIcon name="plus" class="size-4" /> Generar documento
          </button>
          <button
            v-if="can('aca_documentoAnular')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openTrashed"
          >
            <NavIcon name="trash" class="size-4" /> Papelera
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="clearFilters"
          >
            Limpiar
          </button>
        </div>
      </div>
      <!-- Filtro por registro llegado desde otra pantalla (p. ej. una matrícula) -->
      <div v-if="filters.entidad_id" class="mt-4 flex items-center gap-2 text-xs text-slate-600">
        <span class="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
          Solo documentos del registro #{{ filters.entidad_id }}
        </span>
        <button type="button" class="font-medium text-blue-700 underline" @click="quitarFiltroEntidad">Quitar</button>
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-documentos-heading">
      <SectionHeader
        id="listado-documentos-heading"
        title="Documentos emitidos"
        description="El contenido de cada documento queda congelado al emitirlo: no cambia aunque cambien la plantilla o los datos."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando documentos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadDocumentos(1)">Reintentar</button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="documentos"
        row-key="id"
        aria-label="Listado de documentos emitidos"
        actions-first
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'numero_documento'">
            <span class="font-mono font-medium text-slate-900">{{ row.numero_documento }}</span>
          </template>
          <template v-else-if="column.key === 'tipo'">
            {{ row.tipo_documento?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'entidad'">
            <span v-if="row.entidad_id" class="text-slate-700">
              {{ row.tipo_documento?.entidad_nombre ?? 'Registro' }} #{{ row.entidad_id }}
            </span>
            <span v-else class="text-slate-400">—</span>
          </template>
          <template v-else-if="column.key === 'fecha_referencia'">
            {{ row.fecha_referencia ?? '—' }}
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ fechaHoraLocal(row.created_at) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" :class="documentoStatusClass(row.status)">
              {{ row.status_text }}
            </span>
          </template>
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            title="Ver documento"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openDetalle(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            type="button"
            title="Descargar PDF"
            :disabled="descargando === row.id"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
            @click="descargarPdf(row)"
          >
            <NavIcon name="download" class="size-4" />
          </button>
          <button
            v-if="can('aca_documentoAnular') && row.status === DOCUMENTO_STATUS.VIGENTE"
            type="button"
            title="Anular documento"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openAnular(row)"
          >
            <NavIcon name="ban" class="size-4" />
          </button>
          <button
            v-if="can('aca_documentoAnular') && row.status === DOCUMENTO_STATUS.ANULADO"
            type="button"
            title="Eliminar documento anulado"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <DocPaginacion :pagination="pagination" entidad="documentos" @page="goToPage" />
    </section>

    <DocGenerarModal v-model="showGenerar" @generado="onGenerado" />

    <!-- Modal: Detalle -->
    <ModalBase
      v-model="showDetalle"
      :title="detalle?.numero_documento ?? 'Documento'"
      :description="detalle?.tipo_documento?.nombre ?? ''"
      size="xl"
    >
      <div v-if="detalleLoading" class="py-12 text-center text-sm text-slate-500">Cargando documento...</div>
      <div v-else-if="detalle" class="flex flex-col gap-4 pb-4">
        <dl class="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-4">
          <div>
            <dt class="text-xs text-slate-500">Versión aplicada</dt>
            <dd class="font-medium text-slate-800">
              {{ detalle.plantilla ? `${detalle.plantilla.nombre} (v${detalle.plantilla.version})` : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">Fecha de referencia</dt>
            <dd class="font-medium text-slate-800">{{ detalle.fecha_referencia ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">Generado</dt>
            <dd class="font-medium text-slate-800">{{ fechaHoraLocal(detalle.created_at) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">Por</dt>
            <dd class="font-medium text-slate-800">{{ detalle.generador?.nombre ?? '—' }}</dd>
          </div>
        </dl>
        <DocHtmlPreview
          :html="detalle.contenido_renderizado ?? ''"
          :anulado="detalle.status === DOCUMENTO_STATUS.ANULADO"
          :motivo-anulacion="detalle.motivo_anulacion ?? ''"
        />
      </div>
      <p v-else-if="detalleError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ detalleError }}</p>

      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showDetalle = false">Cerrar</button>
        <button
          v-if="detalle"
          type="button"
          :disabled="descargando === detalle.id"
          class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="descargarPdf(detalle)"
        >
          <NavIcon name="download" class="size-4" />
          {{ descargando === detalle.id ? 'Descargando...' : 'Descargar PDF' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Anular -->
    <ModalBase v-model="showAnular" title="Anular documento" :description="anularTarget?.numero_documento ?? ''">
      <div class="flex flex-col gap-3 pb-2">
        <p class="text-sm text-slate-600">
          El documento no se borra: queda marcado como anulado (también en su PDF) y se conserva el motivo.
        </p>
        <FormTextarea v-model="motivo" label="Motivo de anulación" placeholder="Ej: Error en el valor de la matrícula" :rows="3" required />
        <p v-if="anularError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ anularError }}</p>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showAnular = false">Cancelar</button>
        <button
          type="button"
          :disabled="anulando || !motivo.trim()"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          @click="handleAnular"
        >
          {{ anulando ? 'Anulando...' : 'Anular documento' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de documentos" description="Documentos eliminados. Puedes restaurarlos o eliminarlos permanentemente.">
      <div v-if="trashedLoading" class="py-8 text-center text-sm text-slate-500">Cargando papelera...</div>
      <div v-else-if="!trashedItems.length" class="py-6 text-center text-sm text-slate-400">No hay documentos eliminados.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashedItems" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="font-mono text-sm font-medium text-slate-900">{{ item.numero_documento }}</p>
            <p class="text-xs text-slate-400">{{ item.tipo_documento?.nombre ?? '—' }} · {{ item.status_text }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button type="button" :disabled="trashedBusy === item.id" class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500" @click="handleRestore(item)">Restaurar</button>
            <button type="button" :disabled="trashedBusy === item.id" class="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500" @click="handleForceDelete(item)">Eliminar definitivo</button>
          </div>
        </li>
      </ul>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showTrashed = false">Cerrar</button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import docDocumentoService      from '@/services/docDocumentoService.js'
import { usePermisos }          from '@/composables/usePermisos.js'
import { useDocTiposDocumento } from '@/composables/useDocTiposDocumento.js'
import { useNotification }      from '@/composables/useNotification'
import { useConfirm }           from '@/composables/useConfirm.js'
import {
  DOCUMENTO_STATUS,
  documentoStatusClass,
  fechaHoraLocal,
  nombreArchivoDocumento,
} from '@/utils/documentacion.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import FormTextarea    from '@/components/forms/FormTextarea.vue'
import ModalBase       from '@/components/ModalBase.vue'
import DocPaginacion   from '@/components/documentacion/DocPaginacion.vue'
import DocGenerarModal from '@/components/documentacion/DocGenerarModal.vue'
import DocHtmlPreview  from '@/components/documentacion/DocHtmlPreview.vue'

const route  = useRoute()
const router = useRouter()
const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()
const { can, loadPermisos } = usePermisos()
const { tiposOptions, loadTipos } = useDocTiposDocumento()

const mensajeError = (e, fallback) => e?.response?.data?.message ?? fallback

const statusOptions = ref([])

async function loadFilters() {
  try {
    const res = await docDocumentoService.getFilters()
    statusOptions.value = Object.entries(res.data?.status_options ?? {}).map(([value, label]) => ({ value, label }))
  } catch { /* selector vacío */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const documentos = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({
  search:            '',
  tipo_documento_id: '',
  status:            '',
  entidad_type:      route.query.entidad_type ?? '',
  entidad_id:        route.query.entidad_id ?? '',
})

const tableColumns = [
  { key: 'numero_documento', label: 'Número' },
  { key: 'tipo',             label: 'Tipo' },
  { key: 'entidad',          label: 'Registro' },
  { key: 'fecha_referencia', label: 'Fecha de referencia' },
  { key: 'created_at',       label: 'Generado' },
  { key: 'status',           label: 'Estado' },
]

async function loadDocumentos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)            params.search            = filters.search
    if (filters.tipo_documento_id) params.tipo_documento_id = filters.tipo_documento_id
    if (filters.status !== '')     params.status            = filters.status
    if (filters.entidad_id) {
      params.entidad_type = filters.entidad_type
      params.entidad_id   = filters.entidad_id
    }
    const res = await docDocumentoService.getAll(params)
    documentos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = mensajeError(e, 'Error al cargar los documentos.')
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadDocumentos(1), 400)
}
function clearFilters() {
  filters.search = ''; filters.tipo_documento_id = ''; filters.status = ''
  loadDocumentos(1)
}
function quitarFiltroEntidad() {
  filters.entidad_type = ''; filters.entidad_id = ''
  router.replace({ query: {} })
  loadDocumentos(1)
}
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadDocumentos(page) }

// ─── Generar ──────────────────────────────────────────────────────────────────
const showGenerar = ref(false)

function onGenerado(documento) {
  notifySuccess(`Documento ${documento.numero_documento} generado.`)
  loadDocumentos(1)
  openDetalle(documento)
}

// ─── Detalle y PDF ────────────────────────────────────────────────────────────
const showDetalle    = ref(false)
const detalle        = ref(null)
const detalleLoading = ref(false)
const detalleError   = ref('')
const descargando    = ref(null)

async function openDetalle(documento) {
  showDetalle.value    = true
  detalle.value        = null
  detalleError.value   = ''
  detalleLoading.value = true
  try {
    const res = await docDocumentoService.getById(documento.id)
    detalle.value = res.data
  } catch (e) {
    detalleError.value = mensajeError(e, 'No se pudo cargar el documento.')
  } finally {
    detalleLoading.value = false
  }
}

async function descargarPdf(documento) {
  descargando.value = documento.id
  try {
    const res = await docDocumentoService.descargarPdf(documento.id)
    descargarBlob(res.data, nombreArchivoDocumento(documento), 'application/pdf')
  } catch (e) {
    notifyError(await mensajeErrorBlob(e, 'No se pudo descargar el PDF.'))
  } finally {
    descargando.value = null
  }
}

// ─── Anular / eliminar ────────────────────────────────────────────────────────
const showAnular   = ref(false)
const anularTarget = ref(null)
const motivo       = ref('')
const anulando     = ref(false)
const anularError  = ref('')

function openAnular(documento) {
  anularTarget.value = documento
  motivo.value       = ''
  anularError.value  = ''
  showAnular.value   = true
}

async function handleAnular() {
  anulando.value    = true
  anularError.value = ''
  try {
    await docDocumentoService.anular(anularTarget.value.id, motivo.value.trim())
    showAnular.value = false
    notifySuccess(`Documento ${anularTarget.value.numero_documento} anulado.`)
    loadDocumentos(pagination.currentPage)
  } catch (e) {
    anularError.value = e?.response?.data?.errors?.motivo?.[0] ?? mensajeError(e, 'No se pudo anular el documento.')
  } finally {
    anulando.value = false
  }
}

async function handleDelete(documento) {
  if (!await confirm(`¿Eliminar el documento anulado ${documento.numero_documento}? Podrás restaurarlo desde la papelera.`, { title: 'Eliminar documento', confirmLabel: 'Eliminar' })) return
  try {
    await docDocumentoService.delete(documento.id)
    notifySuccess('Documento eliminado.')
    loadDocumentos(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar el documento.'))
  }
}

// ─── Papelera ─────────────────────────────────────────────────────────────────
const showTrashed    = ref(false)
const trashedItems   = ref([])
const trashedLoading = ref(false)
const trashedBusy    = ref(null)

async function openTrashed() {
  showTrashed.value    = true
  trashedLoading.value = true
  try {
    const res = await docDocumentoService.getTrashed({ per_page: 50 })
    trashedItems.value = res.data ?? []
  } catch {
    trashedItems.value = []
  } finally {
    trashedLoading.value = false
  }
}

async function handleRestore(item) {
  trashedBusy.value = item.id
  try {
    await docDocumentoService.restore(item.id)
    notifySuccess(`Documento ${item.numero_documento} restaurado.`)
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
    loadDocumentos(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo restaurar el documento.'))
  } finally {
    trashedBusy.value = null
  }
}

async function handleForceDelete(item) {
  if (!await confirm(`¿Eliminar permanentemente ${item.numero_documento}? Esta acción no se puede deshacer.`, { title: 'Eliminar definitivamente', confirmLabel: 'Eliminar' })) return
  trashedBusy.value = item.id
  try {
    await docDocumentoService.forceDelete(item.id)
    notifySuccess(`Documento ${item.numero_documento} eliminado permanentemente.`)
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar el documento.'))
  } finally {
    trashedBusy.value = null
  }
}

onMounted(() => {
  loadPermisos()
  loadFilters()
  loadTipos()
  loadDocumentos(1)
})
</script>
