<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-tipos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-tipos-heading" class="sr-only">Filtros de tipos de documento</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre del tipo..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" placeholder="Todos" :options="statusOptions" @change="loadTipos(1)" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('aca_docTipoCrear')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" /> Nuevo tipo
          </button>
          <button
            v-if="can('aca_docTipoInactivar')"
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
    <section aria-labelledby="listado-tipos-heading">
      <SectionHeader
        id="listado-tipos-heading"
        title="Tipos de documento"
        description="Cada tipo define de qué registro toma sus datos, si su versión se ata a una fecha y su numeración consecutiva."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando tipos de documento...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadTipos(1)">Reintentar</button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="tipos"
        row-key="id"
        aria-label="Listado de tipos de documento"
        actions-first
      >
        <template #cell="{ column, row }">
          <template v-if="column.key === 'nombre'">
            <p class="font-medium text-slate-900">{{ row.nombre }}</p>
            <p class="font-mono text-xs text-slate-400">{{ row.codigo }}</p>
          </template>
          <template v-else-if="column.key === 'entidad'">
            <span class="text-slate-700">{{ row.entidad_nombre ?? 'Sin registro asociado' }}</span>
          </template>
          <template v-else-if="column.key === 'fecha'">
            <span v-if="row.se_ata_fecha" class="text-slate-700">
              {{ row.campo_fecha_referencia ? etiquetaCampoFecha(row.campo_fecha_referencia) : 'Fecha de generación' }}
            </span>
            <span v-else class="text-slate-400">Siempre la vigente hoy</span>
          </template>
          <template v-else-if="column.key === 'prefijo_numero'">
            <span class="font-mono text-slate-700">{{ row.prefijo_numero }}</span>
          </template>
          <template v-else-if="column.key === 'variables'">
            {{ row.variables_count ?? row.variables?.length ?? '—' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge :label="row.status_text ?? (row.status === 1 ? 'Activo' : 'Inactivo')" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
          </template>
        </template>

        <template #actions="{ row }">
          <button
            v-if="can('aca_docTipoEditar')"
            type="button"
            title="Editar tipo"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openEdit(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="can('aca_docTipoVariables')"
            type="button"
            title="Variables habilitadas"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openVariables(row)"
          >
            <NavIcon name="list_alt" class="size-4" />
          </button>
          <RouterLink
            v-if="can('aca_docPlantillas')"
            :to="{ path: '/academico/documentacion/plantillas', query: { tipo_documento_id: row.id } }"
            title="Ver versiones de plantilla"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <NavIcon name="description" class="size-4" />
          </RouterLink>
          <button
            v-if="can('aca_docTipoInactivar')"
            type="button"
            title="Eliminar tipo"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <DocPaginacion :pagination="pagination" entidad="tipos" @page="goToPage" />
    </section>

    <!-- Modal: Crear / Editar -->
    <ModalBase
      v-model="showForm"
      :title="editingItem ? 'Editar tipo de documento' : 'Nuevo tipo de documento'"
      description="Contrato, pagaré, certificado, carta... sin límite de tipos."
      size="lg"
    >
      <form class="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2" @submit.prevent="handleSubmit">
        <FormInput v-model="form.nombre" label="Nombre" placeholder="Ej: Contrato de matrícula" required :error="formErrors.nombre?.[0]" />
        <FormInput v-model="form.codigo" label="Código" placeholder="Ej: CONTRATO" required :error="formErrors.codigo?.[0]" />
        <FormInput
          v-model="form.prefijo_numero"
          label="Prefijo del consecutivo"
          placeholder="Ej: CONT"
          required
          help="Cada tipo lleva su propia serie (CONT-2026-000001). Debe ser único entre todos los tipos."
          :error="formErrors.prefijo_numero?.[0]"
        />
        <FormSelect
          v-model="form.entidad_type"
          label="Toma los datos de"
          placeholder="Sin registro asociado"
          :options="entidadOptions"
          help="Registro del que salen las variables y tablas. Al generar se pide elegir uno."
          :error="formErrors.entidad_type?.[0]"
          @change="form.campo_fecha_referencia = ''"
        />
        <div class="md:col-span-2">
          <FormTextarea v-model="form.descripcion" label="Descripción" placeholder="Descripción opcional..." :rows="2" />
        </div>

        <div class="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 md:col-span-2">
          <label class="flex items-start gap-2 text-sm text-slate-700">
            <input v-model="form.se_ata_fecha" type="checkbox" class="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span>
              <span class="font-medium">La versión aplicable depende de una fecha del registro</span>
              <span class="block text-xs text-slate-500">
                Marcar en contratos, pagarés y hojas de matrícula: se usa la versión vigente en esa fecha, no la de hoy.
                Dejar sin marcar en cartas y certificaciones.
              </span>
            </span>
          </label>
          <FormSelect
            v-if="form.se_ata_fecha"
            v-model="form.campo_fecha_referencia"
            label="Fecha de referencia"
            placeholder="Fecha de generación del documento"
            :options="camposFechaOptions"
            :disabled="!form.entidad_type"
            :error="formErrors.campo_fecha_referencia?.[0]"
          />
        </div>

        <FormSelect
          v-if="editingItem"
          v-model="form.status"
          label="Estado"
          :options="statusFormOptions"
          :error="formErrors.status?.[0]"
        />

        <p v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{{ formError }}</p>
      </form>

      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showForm = false">Cancelar</button>
        <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmit">
          {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear tipo') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Variables habilitadas -->
    <ModalBase
      v-model="showVariables"
      title="Variables habilitadas"
      :description="variablesTarget ? `${variablesTarget.nombre}: datos que se podrán insertar en sus plantillas.` : ''"
      size="lg"
    >
      <div v-if="variablesLoading" class="py-8 text-center text-sm text-slate-500">Cargando catálogo...</div>
      <div v-else class="flex flex-col gap-5 pb-2">
        <FormCheckboxGroup
          v-if="opcionesEntidad.length"
          v-model="seleccionEntidad"
          label="Datos del registro"
          search-placeholder="Buscar variable..."
          :options="opcionesEntidad"
        />
        <FormCheckboxGroup
          v-model="seleccionGlobal"
          label="Datos generales"
          search-placeholder="Buscar variable..."
          hint="Número y fecha del documento, datos del instituto y usuario que genera."
          :options="opcionesGlobal"
        />
        <p class="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Si necesitas un dato que no aparece aquí, debe agregarse al catálogo en el backend.
          Quitar una variable que ya usa una versión en proceso impedirá aprobarla.
        </p>
        <p v-if="variablesError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ variablesError }}</p>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showVariables = false">Cancelar</button>
        <button type="button" :disabled="saving || variablesLoading" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleGuardarVariables">
          {{ saving ? 'Guardando...' : 'Guardar variables' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase v-model="showTrashed" title="Papelera de tipos de documento" description="Tipos eliminados. Puedes restaurarlos o eliminarlos permanentemente.">
      <div v-if="trashedLoading" class="py-8 text-center text-sm text-slate-500">Cargando papelera...</div>
      <div v-else-if="!trashedItems.length" class="py-6 text-center text-sm text-slate-400">No hay tipos eliminados.</div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in trashedItems" :key="item.id" class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
            <p class="font-mono text-xs text-slate-400">{{ item.codigo }} · {{ item.prefijo_numero }}</p>
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
import { ref, reactive, computed, onMounted } from 'vue'
import docTipoDocumentoService from '@/services/docTipoDocumentoService.js'
import { usePermisos }         from '@/composables/usePermisos.js'
import { useNotification }     from '@/composables/useNotification'
import { useConfirm }          from '@/composables/useConfirm.js'
import { etiquetaCampoFecha }  from '@/utils/documentacion.js'
import SectionHeader     from '@/components/activos/SectionHeader.vue'
import DataTable         from '@/components/activos/DataTable.vue'
import StatusBadge       from '@/components/activos/StatusBadge.vue'
import NavIcon           from '@/components/icons/NavIcon.vue'
import FormInputSearch   from '@/components/forms/FormInputSearch.vue'
import FormInput         from '@/components/forms/FormInput.vue'
import FormTextarea      from '@/components/forms/FormTextarea.vue'
import FormSelect        from '@/components/forms/FormSelect.vue'
import FormCheckboxGroup from '@/components/forms/FormCheckboxGroup.vue'
import ModalBase         from '@/components/ModalBase.vue'
import DocPaginacion     from '@/components/documentacion/DocPaginacion.vue'

const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()
const { can, loadPermisos } = usePermisos()

const mensajeError = (e, fallback) => e?.response?.data?.message ?? fallback

// ─── Opciones del backend (entidades y estados) ───────────────────────────────
const entidades     = ref([])
const statusOptions = ref([])

const entidadOptions = computed(() => entidades.value.map((e) => ({ value: e.entidad_type, label: e.nombre })))
const statusFormOptions = computed(() => statusOptions.value.map((o) => ({ value: Number(o.value), label: o.label })))

const camposFechaOptions = computed(() => {
  const entidad = entidades.value.find((e) => e.entidad_type === form.entidad_type)
  return (entidad?.campos_fecha ?? []).map((campo) => ({ value: campo, label: etiquetaCampoFecha(campo) }))
})

async function loadFilters() {
  try {
    const res = await docTipoDocumentoService.getFilters()
    entidades.value     = res.data?.entidades ?? []
    statusOptions.value = Object.entries(res.data?.status_options ?? {}).map(([value, label]) => ({ value, label }))
  } catch { /* selectores vacíos */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const tipos      = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', status: '' })

const tableColumns = [
  { key: 'nombre',         label: 'Tipo' },
  { key: 'entidad',        label: 'Toma datos de' },
  { key: 'fecha',          label: 'Versión según' },
  { key: 'prefijo_numero', label: 'Prefijo' },
  { key: 'variables',      label: 'Variables' },
  { key: 'status',         label: 'Estado' },
]

async function loadTipos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)        params.search = filters.search
    if (filters.status !== '') params.status = filters.status
    const res = await docTipoDocumentoService.getAll(params)
    tipos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = mensajeError(e, 'Error al cargar los tipos de documento.')
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadTipos(1), 400)
}
function clearFilters() { filters.search = ''; filters.status = ''; loadTipos(1) }
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadTipos(page) }

// ─── Crear / Editar ───────────────────────────────────────────────────────────
const showForm    = ref(false)
const editingItem = ref(null)
const saving      = ref(false)
const formError   = ref('')
const formErrors  = ref({})
const form = reactive({
  codigo: '', nombre: '', descripcion: '', entidad_type: '',
  se_ata_fecha: false, campo_fecha_referencia: '', prefijo_numero: '', status: 1,
})

function resetForm(tipo = null) {
  form.codigo                 = tipo?.codigo ?? ''
  form.nombre                 = tipo?.nombre ?? ''
  form.descripcion            = tipo?.descripcion ?? ''
  form.entidad_type           = tipo?.entidad_type ?? ''
  form.se_ata_fecha           = tipo?.se_ata_fecha ?? false
  form.campo_fecha_referencia = tipo?.campo_fecha_referencia ?? ''
  form.prefijo_numero         = tipo?.prefijo_numero ?? ''
  form.status                 = tipo?.status ?? 1
  formError.value = ''; formErrors.value = {}
}

function openCreate() { editingItem.value = null; resetForm(); showForm.value = true }
function openEdit(tipo) { editingItem.value = tipo; resetForm(tipo); showForm.value = true }

function buildPayload() {
  const payload = {
    codigo:                 form.codigo.trim().toUpperCase(),
    nombre:                 form.nombre.trim(),
    descripcion:            form.descripcion.trim() || null,
    entidad_type:           form.entidad_type || null,
    se_ata_fecha:           form.se_ata_fecha,
    campo_fecha_referencia: form.se_ata_fecha ? (form.campo_fecha_referencia || null) : null,
    prefijo_numero:         form.prefijo_numero.trim().toUpperCase(),
  }
  if (editingItem.value) payload.status = Number(form.status)
  return payload
}

async function handleSubmit() {
  formError.value = ''; formErrors.value = {}
  saving.value = true
  try {
    if (editingItem.value) {
      await docTipoDocumentoService.update(editingItem.value.id, buildPayload())
      notifySuccess('Tipo de documento actualizado.')
      showForm.value = false
    } else {
      const res = await docTipoDocumentoService.create(buildPayload())
      notifySuccess('Tipo de documento creado. Ahora elige sus variables.')
      showForm.value = false
      if (can('aca_docTipoVariables')) openVariables(res.data)
    }
    loadTipos(pagination.currentPage)
  } catch (e) {
    formErrors.value = e?.response?.data?.errors ?? {}
    formError.value  = mensajeError(e, 'Ocurrió un error. Intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

async function handleDelete(tipo) {
  if (!await confirm(`¿Eliminar el tipo "${tipo.nombre}"?`, { title: 'Eliminar tipo de documento', confirmLabel: 'Eliminar' })) return
  try {
    await docTipoDocumentoService.delete(tipo.id)
    notifySuccess('Tipo de documento eliminado.')
    loadTipos(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar el tipo de documento.'))
  }
}

// ─── Variables habilitadas ────────────────────────────────────────────────────
const showVariables    = ref(false)
const variablesTarget  = ref(null)
const variablesLoading = ref(false)
const variablesError   = ref('')
const catalogo         = ref([])
const seleccionEntidad = ref([])
const seleccionGlobal  = ref([])

const aOpcion = (v) => ({ value: v.clave, label: v.label })
const opcionesEntidad = computed(() => catalogo.value.filter((v) => v.grupo !== 'global').map(aOpcion))
const opcionesGlobal  = computed(() => catalogo.value.filter((v) => v.grupo === 'global').map(aOpcion))

async function openVariables(tipo) {
  variablesTarget.value  = tipo
  variablesError.value   = ''
  showVariables.value    = true
  variablesLoading.value = true
  try {
    const res = await docTipoDocumentoService.getVariables(tipo.id)
    catalogo.value = res.data ?? []
    const habilitadas = catalogo.value.filter((v) => v.habilitada)
    seleccionEntidad.value = habilitadas.filter((v) => v.grupo !== 'global').map((v) => v.clave)
    seleccionGlobal.value  = habilitadas.filter((v) => v.grupo === 'global').map((v) => v.clave)
  } catch (e) {
    catalogo.value = []
    variablesError.value = mensajeError(e, 'No se pudo cargar el catálogo de variables.')
  } finally {
    variablesLoading.value = false
  }
}

async function handleGuardarVariables() {
  variablesError.value = ''
  saving.value = true
  try {
    await docTipoDocumentoService.syncVariables(variablesTarget.value.id, [...seleccionEntidad.value, ...seleccionGlobal.value])
    notifySuccess('Variables actualizadas.')
    showVariables.value = false
    loadTipos(pagination.currentPage)
  } catch (e) {
    const errores = e?.response?.data?.errors
    variablesError.value = (errores && Object.values(errores)[0]?.[0]) ?? mensajeError(e, 'No se pudieron guardar las variables.')
  } finally {
    saving.value = false
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
    const res = await docTipoDocumentoService.getTrashed({ per_page: 50 })
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
    await docTipoDocumentoService.restore(item.id)
    notifySuccess(`Tipo "${item.nombre}" restaurado.`)
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
    loadTipos(pagination.currentPage)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo restaurar el tipo.'))
  } finally {
    trashedBusy.value = null
  }
}

async function handleForceDelete(item) {
  if (!await confirm(`¿Eliminar permanentemente "${item.nombre}"? Esta acción no se puede deshacer.`, { title: 'Eliminar definitivamente', confirmLabel: 'Eliminar' })) return
  trashedBusy.value = item.id
  try {
    await docTipoDocumentoService.forceDelete(item.id)
    notifySuccess(`Tipo "${item.nombre}" eliminado permanentemente.`)
    trashedItems.value = trashedItems.value.filter((i) => i.id !== item.id)
  } catch (e) {
    notifyError(mensajeError(e, 'No se pudo eliminar el tipo.'))
  } finally {
    trashedBusy.value = null
  }
}

onMounted(() => {
  loadPermisos()
  loadFilters()
  loadTipos(1)
})
</script>
