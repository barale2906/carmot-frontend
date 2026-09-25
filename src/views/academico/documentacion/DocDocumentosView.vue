<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-documentos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-documentos-heading" class="sr-only">Filtros de la bitácora</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre del archivo subido..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[260px]">
          <FormSelect v-model="filters.tipo_documento_id" label="Tipo de documento:" placeholder="Todos" :options="tiposOptions" @change="loadDocumentos(1)" />
        </div>
        <div class="w-full sm:w-[190px]">
          <FormSelect v-model="filters.origen" label="Origen:" placeholder="Todos" :options="origenOptions" @change="loadDocumentos(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('aca_documentoGenerar')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openImprimir()"
          >
            <NavIcon name="plus" class="size-4" /> Imprimir documento
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
          Solo impresiones del registro #{{ filters.entidad_id }}
        </span>
        <button type="button" class="font-medium text-blue-700 underline" @click="quitarFiltroEntidad">Quitar</button>
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-documentos-heading">
      <SectionHeader
        id="listado-documentos-heading"
        title="Bitácora de impresiones"
        description="Los documentos no se almacenan: se arman cada vez que se imprimen. Aquí queda quién imprimió qué, cuándo y con qué versión."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando bitácora...</span>
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
        aria-label="Bitácora de impresiones de documentos"
        actions-first
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'tipo'">
            <p class="font-medium text-slate-900">{{ row.tipo_documento?.nombre ?? '—' }}</p>
            <p v-if="row.nombre_original" class="text-xs text-slate-400">{{ row.nombre_original }}</p>
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
          <template v-else-if="column.key === 'generador'">
            {{ row.generador?.nombre ?? '—' }}
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ fechaHoraLocal(row.created_at) }}
          </template>
          <template v-else-if="column.key === 'origen'">
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" :class="documentoOrigenClass(row.origen)">
              {{ row.origen_text }}
            </span>
          </template>
        </template>

        <template #actions="{ row }">
          <template v-if="row.origen === DOCUMENTO_ORIGEN.GENERADO && can('aca_documentoGenerar')">
            <button
              type="button"
              title="Reimprimir en pantalla"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="openImprimir(row)"
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
          </template>
          <a
            v-else-if="row.google_drive_url"
            :href="row.google_drive_url"
            target="_blank"
            rel="noopener"
            title="Abrir archivo"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <NavIcon name="download" class="size-4" />
          </a>
          <button
            v-if="can('aca_documentoAnular')"
            type="button"
            title="Eliminar de la bitácora"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <DocPaginacion :pagination="pagination" entidad="registros" @page="goToPage" />
    </section>

    <DocImprimirModal v-model="showImprimir" :inicial="imprimirInicial" @impreso="onImpreso" />

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de la bitácora" description="Entradas eliminadas. Puedes restaurarlas o eliminarlas permanentemente.">
      <div v-if="trashedLoading" class="py-8 text-center text-sm text-slate-500">Cargando papelera...</div>
      <div v-else-if="!trashedItems.length" class="py-6 text-center text-sm text-slate-400">No hay entradas eliminadas.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashedItems" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ describirEntrada(item) }}</p>
            <p class="text-xs text-slate-400">{{ item.origen_text }} · {{ fechaHoraLocal(item.created_at) }}</p>
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
  DOCUMENTO_ORIGEN,
  documentoOrigenClass,
  fechaHoraLocal,
  nombreArchivoDocumento,
} from '@/utils/documentacion.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import SectionHeader    from '@/components/activos/SectionHeader.vue'
import DataTable        from '@/components/activos/DataTable.vue'
import NavIcon          from '@/components/icons/NavIcon.vue'
import FormInputSearch  from '@/components/forms/FormInputSearch.vue'
import FormSelect       from '@/components/forms/FormSelect.vue'
import ModalBase        from '@/components/ModalBase.vue'
import DocPaginacion    from '@/components/documentacion/DocPaginacion.vue'
import DocImprimirModal from '@/components/documentacion/DocImprimirModal.vue'

const route  = useRoute()
const router = useRouter()
const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()
const { can, loadPermisos } = usePermisos()
const { tiposOptions, loadTipos } = useDocTiposDocumento()

const mensajeError = (e, fallback) => e?.response?.data?.message ?? fallback

/** Texto corto de una entrada para confirmaciones y papelera. */
function describirEntrada(item) {
  const tipo = item.tipo_documento?.nombre ?? item.nombre_original ?? 'Documento'
  return item.entidad_id ? `${tipo} · registro #${item.entidad_id}` : tipo
}

const origenOptions = ref([])

async function loadFilters() {
  try {
    const res = await docDocumentoService.getFilters()
    origenOptions.value = Object.entries(res.data?.origen_options ?? {}).map(([value, label]) => ({ value, label }))
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
  origen:            '',
  entidad_type:      route.query.entidad_type ?? '',
  entidad_id:        route.query.entidad_id ?? '',
})

const tableColumns = [
  { key: 'tipo',             label: 'Documento' },
  { key: 'entidad',          label: 'Registro' },
  { key: 'fecha_referencia', label: 'Fecha de referencia' },
  { key: 'generador',        label: 'Impreso por' },
  { key: 'created_at',       label: 'Fecha' },
  { key: 'origen',           label: 'Origen' },
]

async function loadDocumentos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)            params.search            = filters.search
    if (filters.tipo_documento_id) params.tipo_documento_id = filters.tipo_documento_id
    if (filters.origen !== '')     params.origen            = filters.origen
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
    error.value = mensajeError(e, 'Error al cargar la bitácora.')
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
  filters.search = ''; filters.tipo_documento_id = ''; filters.origen = ''
  loadDocumentos(1)
}
function quitarFiltroEntidad() {
  filters.entidad_type = ''; filters.entidad_id = ''
  router.replace({ query: {} })
  loadDocumentos(1)
}
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadDocumentos(page) }

// ─── Imprimir / reimprimir ────────────────────────────────────────────────────
const showImprimir    = ref(false)
const imprimirInicial = ref(null)
const descargando     = ref(null)

/** Sin entrada abre el formulario vacío; con una entrada de la bitácora la reimprime. */
function openImprimir(entrada = null) {
  imprimirInicial.value = entrada
    ? { tipo_documento_id: entrada.tipo_documento_id, entidad_id: entrada.entidad_id }
    : null
  showImprimir.value = true
}

// Cada impresión deja una entrada nueva: se refresca la primera página.
function onImpreso() { loadDocumentos(1) }

async function descargarPdf(entrada) {
  descargando.value = entrada.id
  try {
    const res = await docDocumentoService.pdf({
      tipo_documento_id: entrada.tipo_documento_id,
      ...(entrada.entidad_id ? { entidad_id: entrada.entidad_id } : {}),
    })
    descargarBlob(res.data, nombreArchivoDocumento(entrada.tipo_documento?.codigo, entrada.entidad_id), 'application/pdf')
    loadDocumentos(1)
  } catch (e) {
    notifyError(await mensajeErrorBlob(e, 'No se pudo descargar el PDF.'))
  } finally {
    descargando.value = null
  }
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────
async function handleDelete(entrada) {
  if (!await confirm(`¿Eliminar de la bitácora "${describirEntrada(entrada)}"? Podrás restaurarla desde la papelera.`, { title: 'Eliminar entrada', confirmLabel: 'Eliminar' })) return
  try {
    await docDocumentoService.delete(entrada.id)
    notifySuccess('Entrada eliminada de la bitácora.')
    loadDocumentos(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar la entrada.'))
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
    notifySuccess('Entrada restaurada.')
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
    loadDocumentos(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo restaurar la entrada.'))
  } finally {
    trashedBusy.value = null
  }
}

async function handleForceDelete(item) {
  if (!await confirm(`¿Eliminar permanentemente "${describirEntrada(item)}"? Esta acción no se puede deshacer.`, { title: 'Eliminar definitivamente', confirmLabel: 'Eliminar' })) return
  trashedBusy.value = item.id
  try {
    await docDocumentoService.forceDelete(item.id)
    notifySuccess('Entrada eliminada permanentemente.')
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar la entrada.'))
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
