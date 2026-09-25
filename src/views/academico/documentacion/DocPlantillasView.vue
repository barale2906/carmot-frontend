<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-plantillas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-plantillas-heading" class="sr-only">Filtros de versiones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre de la versión..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[260px]">
          <FormSelect v-model="filters.tipo_documento_id" label="Tipo de documento:" placeholder="Todos" :options="tiposOptions" @change="loadPlantillas(1)" />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="STATUS_OPTIONS" @change="loadPlantillas(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('aca_docPlantillaCrear')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" /> Nueva versión
          </button>
          <button
            v-if="can('aca_docPlantillaInactivar')"
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
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-plantillas-heading">
      <SectionHeader
        id="listado-plantillas-heading"
        title="Versiones de plantillas"
        description="Flujo: En Proceso → Aprobada → Activa. Al activar una versión, la anterior se cierra y conserva su vigencia histórica."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando versiones...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPlantillas(1)">Reintentar</button>
      </div>

      <div v-else class="overflow-x-auto rounded-[14px] border border-black/10 bg-white">
        <table class="w-full text-sm" aria-label="Versiones de plantillas">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50 text-left">
              <th class="px-4 py-3"></th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de documento</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Versión</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Vigencia</th>
              <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="!plantillas.length">
              <td colspan="5" class="px-4 py-12 text-center text-sm text-slate-400">No hay versiones para los filtros seleccionados.</td>
            </tr>
            <tr v-for="plantilla in plantillas" :key="plantilla.id" class="transition-colors hover:bg-slate-50">
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <RouterLink
                    :to="`/academico/documentacion/plantillas/${plantilla.id}`"
                    :title="esEditable(plantilla) ? 'Editar contenido' : 'Ver contenido'"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <NavIcon :name="esEditable(plantilla) ? 'pencil' : 'eye'" class="size-4" />
                  </RouterLink>
                  <button
                    v-if="can('aca_docPlantillaAprobar') && plantilla.status === PLANTILLA_STATUS.EN_PROCESO"
                    type="button"
                    title="Aprobar versión"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="handleAprobar(plantilla)"
                  >
                    <NavIcon name="check" class="size-4" />
                  </button>
                  <button
                    v-if="can('aca_docPlantillaAprobar') && plantilla.status === PLANTILLA_STATUS.APROBADA"
                    type="button"
                    title="Activar versión"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="openActivar(plantilla)"
                  >
                    <NavIcon name="calendar_today" class="size-4" />
                  </button>
                  <button
                    v-if="can('aca_docPlantillaClonar')"
                    type="button"
                    title="Clonar como nuevo borrador"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="openClonar(plantilla)"
                  >
                    <NavIcon name="copy" class="size-4" />
                  </button>
                  <button
                    v-if="can('aca_docPlantillaInactivar') && plantilla.status !== PLANTILLA_STATUS.INACTIVA"
                    type="button"
                    title="Inactivar versión"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @click="handleInactivar(plantilla)"
                  >
                    <NavIcon name="ban" class="size-4" />
                  </button>
                  <button
                    v-if="can('aca_docPlantillaInactivar') && plantilla.status !== PLANTILLA_STATUS.ACTIVA"
                    type="button"
                    title="Eliminar versión"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="handleDelete(plantilla)"
                  >
                    <NavIcon name="trash" class="size-4" />
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900">{{ plantilla.tipo_documento?.nombre ?? '—' }}</p>
                <p v-if="plantilla.tipo_documento?.prefijo_numero" class="font-mono text-xs text-slate-400">{{ plantilla.tipo_documento.prefijo_numero }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-slate-900">{{ plantilla.nombre }}</p>
                <p class="font-mono text-xs text-slate-400">v{{ plantilla.version }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600">
                <span v-if="plantilla.fecha_inicio">{{ plantilla.fecha_inicio }} → {{ plantilla.fecha_fin ?? 'vigente' }}</span>
                <span v-else class="text-slate-400">Sin publicar</span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" :class="plantillaStatusClass(plantilla.status)">
                  {{ plantilla.status_text ?? plantillaStatusText(plantilla.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <DocPaginacion :pagination="pagination" entidad="versiones" @page="goToPage" />
    </section>

    <!-- Modal: Nueva versión -->
    <ModalBase v-model="showCreate" title="Nueva versión" description="Crea un borrador vacío y abre el editor para redactarlo.">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleCreate">
        <FormSelect
          v-model="createForm.tipo_documento_id"
          label="Tipo de documento"
          :options="tiposOptions"
          required
          :error="createErrors.tipo_documento_id?.[0]"
        />
        <FormInput
          v-model="createForm.nombre"
          label="Nombre de la versión"
          placeholder="Ej: Contrato 2026"
          required
          :error="createErrors.nombre?.[0]"
        />
        <p v-if="createError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ createError }}</p>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showCreate = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleCreate">
          {{ saving ? 'Creando...' : 'Crear y editar' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Activar -->
    <ModalBase v-model="showActivar" title="Activar versión" :description="activarTarget ? `${activarTarget.nombre} (v${activarTarget.version})` : ''">
      <div class="flex flex-col gap-4 pb-2">
        <FormInput
          v-model="fechaInicio"
          type="date"
          label="Inicio de vigencia"
          hint="Si lo dejas vacío, entra en vigencia hoy. Debe ser posterior al inicio de la versión vigente."
          :error="activarError"
        />
        <p class="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          La versión activa actual se cerrará automáticamente el día anterior. Los documentos de tipos atados a fecha
          seguirán usando la versión vigente en la fecha de su registro.
        </p>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showActivar = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleActivar">
          {{ saving ? 'Activando...' : 'Activar' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Clonar -->
    <ModalBase v-model="showClonar" title="Clonar versión" description="Crea un borrador En Proceso con el mismo contenido y configuración de tablas.">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleClonar">
        <FormInput v-model="clonarNombre" label="Nombre del nuevo borrador" required :error="clonarError" />
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showClonar = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleClonar">
          {{ saving ? 'Clonando...' : 'Clonar y editar' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de versiones" description="Versiones eliminadas. Puedes restaurarlas o eliminarlas permanentemente.">
      <div v-if="trashedLoading" class="py-8 text-center text-sm text-slate-500">Cargando papelera...</div>
      <div v-else-if="!trashedItems.length" class="py-6 text-center text-sm text-slate-400">No hay versiones eliminadas.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashedItems" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }} <span class="font-mono text-xs text-slate-400">v{{ item.version }}</span></p>
            <p class="text-xs text-slate-400">{{ item.tipo_documento?.nombre ?? '—' }}</p>
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
import { useRouter, useRoute } from 'vue-router'
import docPlantillaService      from '@/services/docPlantillaService.js'
import { usePermisos }          from '@/composables/usePermisos.js'
import { useDocTiposDocumento } from '@/composables/useDocTiposDocumento.js'
import { useNotification }      from '@/composables/useNotification'
import { useConfirm }           from '@/composables/useConfirm.js'
import {
  PLANTILLA_STATUS,
  plantillaStatusText,
  plantillaStatusClass,
  esPlantillaEditable,
} from '@/utils/documentacion.js'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import ModalBase       from '@/components/ModalBase.vue'
import DocPaginacion   from '@/components/documentacion/DocPaginacion.vue'

const router = useRouter()
const route  = useRoute()
const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()
const { can, loadPermisos } = usePermisos()
const { tiposOptions, loadTipos } = useDocTiposDocumento()

const STATUS_OPTIONS = Object.values(PLANTILLA_STATUS).map((s) => ({ value: String(s), label: plantillaStatusText(s) }))

// El backend exige contenido al crear; el borrador nace vacío y se redacta en el editor.
const CONTENIDO_BORRADOR = '<p></p>'

const esEditable = (plantilla) => esPlantillaEditable(plantilla) && can('aca_docPlantillaEditar')

const mensajeError = (e, fallback) => e?.response?.data?.message ?? fallback

// ─── Listado ──────────────────────────────────────────────────────────────────
const plantillas = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', tipo_documento_id: route.query.tipo_documento_id ?? '', status: '' })

async function loadPlantillas(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)            params.search            = filters.search
    if (filters.tipo_documento_id) params.tipo_documento_id = filters.tipo_documento_id
    if (filters.status !== '')     params.status            = filters.status
    const res = await docPlantillaService.getAll(params)
    plantillas.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = mensajeError(e, 'Error al cargar las versiones.')
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadPlantillas(1), 400)
}
function clearFilters() {
  filters.search = ''; filters.tipo_documento_id = ''; filters.status = ''
  loadPlantillas(1)
}
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadPlantillas(page) }

// ─── Crear ────────────────────────────────────────────────────────────────────
const showCreate   = ref(false)
const saving       = ref(false)
const createForm   = reactive({ tipo_documento_id: '', nombre: '' })
const createErrors = ref({})
const createError  = ref('')

function openCreate() {
  createForm.tipo_documento_id = filters.tipo_documento_id
  createForm.nombre = ''
  createErrors.value = {}; createError.value = ''
  showCreate.value = true
}

async function handleCreate() {
  createErrors.value = {}; createError.value = ''
  saving.value = true
  try {
    const res = await docPlantillaService.create({
      tipo_documento_id: Number(createForm.tipo_documento_id) || null,
      nombre:            createForm.nombre.trim(),
      contenido_html:    CONTENIDO_BORRADOR,
    })
    showCreate.value = false
    notifySuccess('Borrador creado.')
    router.push(`/academico/documentacion/plantillas/${res.data.id}`)
  } catch (e) {
    createErrors.value = e?.response?.data?.errors ?? {}
    createError.value  = mensajeError(e, 'No se pudo crear la versión.')
  } finally {
    saving.value = false
  }
}

// ─── Flujo de estados ─────────────────────────────────────────────────────────
async function handleAprobar(plantilla) {
  if (!await confirm(
    `¿Aprobar "${plantilla.nombre}" (v${plantilla.version})? Su contenido y tablas quedarán congelados.`,
    { title: 'Aprobar versión', confirmLabel: 'Aprobar', danger: false },
  )) return
  try {
    await docPlantillaService.aprobar(plantilla.id)
    notifySuccess('Versión aprobada.')
    loadPlantillas(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.errors?.contenido_html?.[0] ?? mensajeError(e, 'No se pudo aprobar la versión.'))
  }
}

const showActivar   = ref(false)
const activarTarget = ref(null)
const fechaInicio   = ref('')
const activarError  = ref('')

function openActivar(plantilla) {
  activarTarget.value = plantilla
  fechaInicio.value   = ''
  activarError.value  = ''
  showActivar.value   = true
}

async function handleActivar() {
  activarError.value = ''
  saving.value = true
  try {
    await docPlantillaService.activar(activarTarget.value.id, fechaInicio.value || null)
    showActivar.value = false
    notifySuccess('Versión activada.')
    loadPlantillas(pagination.currentPage)
  } catch (e) {
    activarError.value = e?.response?.data?.errors?.fecha_inicio?.[0] ?? mensajeError(e, 'No se pudo activar la versión.')
  } finally {
    saving.value = false
  }
}

async function handleInactivar(plantilla) {
  if (!await confirm(
    `¿Inactivar "${plantilla.nombre}" (v${plantilla.version})? Si es la versión vigente, dejará de haber versión para emitir documentos nuevos.`,
    { title: 'Inactivar versión', confirmLabel: 'Inactivar' },
  )) return
  try {
    await docPlantillaService.inactivar(plantilla.id)
    notifySuccess('Versión inactivada.')
    loadPlantillas(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo inactivar la versión.'))
  }
}

const showClonar   = ref(false)
const clonarTarget = ref(null)
const clonarNombre = ref('')
const clonarError  = ref('')

function openClonar(plantilla) {
  clonarTarget.value = plantilla
  clonarNombre.value = `${plantilla.nombre} (copia)`
  clonarError.value  = ''
  showClonar.value   = true
}

async function handleClonar() {
  clonarError.value = ''
  saving.value = true
  try {
    const res = await docPlantillaService.clonar(clonarTarget.value.id, { nombre: clonarNombre.value.trim() })
    showClonar.value = false
    notifySuccess('Borrador creado a partir de la versión.')
    router.push(`/academico/documentacion/plantillas/${res.data.id}`)
  } catch (e) {
    clonarError.value = e?.response?.data?.errors?.nombre?.[0] ?? mensajeError(e, 'No se pudo clonar la versión.')
  } finally {
    saving.value = false
  }
}

async function handleDelete(plantilla) {
  if (!await confirm(`¿Eliminar la versión "${plantilla.nombre}" (v${plantilla.version})?`, { title: 'Eliminar versión', confirmLabel: 'Eliminar' })) return
  try {
    await docPlantillaService.delete(plantilla.id)
    notifySuccess('Versión eliminada.')
    loadPlantillas(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar la versión.'))
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
    const res = await docPlantillaService.getTrashed({ per_page: 50 })
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
    await docPlantillaService.restore(item.id)
    notifySuccess(`Versión "${item.nombre}" restaurada.`)
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
    loadPlantillas(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo restaurar la versión.'))
  } finally {
    trashedBusy.value = null
  }
}

async function handleForceDelete(item) {
  if (!await confirm(`¿Eliminar permanentemente "${item.nombre}"? Esta acción no se puede deshacer.`, { title: 'Eliminar definitivamente', confirmLabel: 'Eliminar' })) return
  trashedBusy.value = item.id
  try {
    await docPlantillaService.forceDelete(item.id)
    notifySuccess(`Versión "${item.nombre}" eliminada permanentemente.`)
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar la versión.'))
  } finally {
    trashedBusy.value = null
  }
}

onMounted(() => {
  loadPermisos()
  loadTipos()
  loadPlantillas(1)
})
</script>
