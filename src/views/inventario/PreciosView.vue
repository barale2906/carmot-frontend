<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-listas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-listas-heading" class="sr-only">Filtros de listas de precios</h2>
      <div class="flex flex-wrap items-end gap-4">
        <FilterField size="search">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Lista o producto (mín. 2 letras)..." @input="onSearchInput" />
        </FilterField>
        <div class="w-full sm:w-[170px]">
          <FormSelect v-model="filters.vigencia" label="Vigencia:" :options="vigenciaOptions" @change="loadListas(1)" />
        </div>
        <div class="w-full sm:w-[170px]">
          <FormSelect v-model="filters.status" label="Estado:" :options="statusFilterOptions" @change="loadListas(1)" />
        </div>
        <div class="w-full sm:w-[220px]">
          <FormSelect
            v-model="filters.poblacion_id"
            label="Población:"
            :options="poblacionFilterOptions"
            @change="loadListas(1)"
          />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button v-if="canListasCrear" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openCreate">
            <NavIcon name="plus" class="size-4" /> Nueva lista
          </button>
          <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar</button>
        </div>
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-listas-heading">
      <SectionHeader
        id="listado-listas-heading"
        title="Listas de precios de inventario"
        :description="descripcionListado"
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando listas...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadListas(1)">Reintentar</button>
      </div>
      <p v-else-if="!listas.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay listas de precios para los filtros seleccionados.
      </p>

      <div v-else class="flex flex-col gap-3">
        <article
          v-for="lista in listas"
          :key="lista.id"
          class="overflow-hidden rounded-[14px] border border-black/10 bg-white"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-5">
            <!-- Acciones (primera columna) -->
            <div class="flex shrink-0 items-center gap-1">
              <button v-if="canListasEditar && lista.status === 1" type="button" title="Editar lista y sus precios" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="openEdit(lista)">
                <NavIcon name="edit" class="size-4" />
              </button>
              <button v-if="canListasAprobar && lista.status === 1" type="button" title="Aprobar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleAprobar(lista)">
                <NavIcon name="check" class="size-4" />
              </button>
              <button v-if="canListasAprobar && lista.status === 2" type="button" title="Activar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleActivar(lista)">
                <NavIcon name="check" class="size-4" />
              </button>
              <button v-if="canListasInactivar && lista.status !== 0" type="button" title="Inactivar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleInactivar(lista)">
                <NavIcon name="trash" class="size-4" />
              </button>
              <button v-if="canListasClonar" type="button" title="Clonar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="openClonar(lista)">
                <NavIcon name="copy" class="size-4" />
              </button>
            </div>

            <!-- Cabecera desplegable -->
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-3 rounded text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
              :aria-expanded="expandidas.has(lista.id)"
              :aria-controls="`productos-${lista.id}`"
              @click="toggleLista(lista)"
            >
              <NavIcon :name="expandidas.has(lista.id) ? 'expand_less' : 'expand_more'" class="size-5 shrink-0 text-slate-400" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-900">{{ lista.nombre }}</p>
                <p class="mt-0.5 truncate text-xs text-slate-500">
                  <span v-if="lista.fecha_inicio">{{ lista.fecha_inicio }} → {{ lista.fecha_fin ?? '∞' }}</span>
                  <span v-else>Sin vigencia definida</span>
                  <span v-if="lista.descripcion"> · {{ lista.descripcion }}</span>
                </p>
              </div>
              <div v-if="lista.poblaciones?.length" class="hidden max-w-[260px] flex-wrap justify-end gap-1 lg:flex">
                <span v-for="p in lista.poblaciones.slice(0, 3)" :key="p.id" class="inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{{ p.nombre }}</span>
                <span v-if="lista.poblaciones.length > 3" class="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600" :title="lista.poblaciones.slice(3).map(p => p.nombre).join(', ')">+{{ lista.poblaciones.length - 3 }}</span>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-xs text-slate-500">Productos</p>
                <p class="font-mono text-sm font-medium text-slate-700">{{ lista.precios_count ?? 0 }}</p>
              </div>
              <span class="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(lista.status)">
                {{ lista.status_text ?? statusText(lista.status) }}
              </span>
            </button>
          </div>

          <!-- Productos de la lista (colapsable) -->
          <div v-show="expandidas.has(lista.id)" :id="`productos-${lista.id}`" class="border-t border-slate-100">
            <p v-if="detalles[lista.id]?.loading" class="px-5 py-4 text-sm text-slate-500">Cargando productos...</p>
            <p v-else-if="detalles[lista.id]?.error" class="px-5 py-4 text-sm text-red-600">{{ detalles[lista.id].error }}</p>
            <p v-else-if="!detalles[lista.id]?.precios?.length" class="px-5 py-4 text-sm text-slate-400">Esta lista aún no tiene productos con precio.</p>
            <table v-else class="w-full text-sm" :aria-label="`Productos de ${lista.nombre}`">
              <thead>
                <tr class="bg-slate-50 text-left">
                  <th class="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</th>
                  <th class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Código</th>
                  <th class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                  <th class="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Precio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="precio in detalles[lista.id].precios" :key="precio.id" :class="coincideBusqueda(precio) ? 'bg-yellow-50' : ''">
                  <td class="px-5 py-2 font-medium text-slate-900">{{ precio.producto?.nombre ?? '—' }}</td>
                  <td class="px-4 py-2 text-slate-600">{{ precio.producto?.codigo ?? '—' }}</td>
                  <td class="px-4 py-2 text-slate-600">{{ tipoLabel(precio.producto?.tipo) }}</td>
                  <td class="px-5 py-2 text-right font-mono font-medium text-slate-900">{{ formatCurrency(precio.precio) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}</p>
        <div class="flex gap-2">
          <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadListas(pagination.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadListas(pagination.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>

    <!-- Wizard: crear / editar lista con sus precios -->
    <InvListaPrecioWizardModal
      :visible="showWizard"
      :lista="listaEnEdicion"
      :poblacion-options="poblacionOptions"
      :puede-editar-precios="canPreciosEditar"
      @close="showWizard = false"
      @saved="onWizardSaved"
    />

    <!-- Modal: Clonar lista -->
    <ModalBase v-model="showClonarForm" title="Clonar lista de precios" description="Crea una copia de la lista con sus precios en estado En Proceso.">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleClonar">
        <FormInput v-model="clonarForm.nombre" label="Nombre de la nueva lista" placeholder="Ej: Lista Uniformes 2026-II" required :error="clonarFormErrors.nombre?.[0]" />
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="clonarForm.fecha_inicio" label="Inicio de vigencia" type="date" :error="clonarFormErrors.fecha_inicio?.[0]" />
          <FormInput v-model="clonarForm.fecha_fin" label="Fin de vigencia" type="date" :error="clonarFormErrors.fecha_fin?.[0]" />
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input v-model="clonarForm.copiar_precios" type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Copiar precios de la lista origen
        </label>
        <div v-if="clonarFormError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p class="text-sm text-red-700">{{ clonarFormError }}</p>
        </div>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showClonarForm = false">Cancelar</button>
        <button type="button" :disabled="clonarSaving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleClonar">
          {{ clonarSaving ? 'Clonando...' : 'Clonar lista' }}
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
/**
 * Listas de precios de inventario: listado desplegable (cada lista muestra sus productos),
 * filtros por lista/producto, vigencia, estado y población, y wizard de creación/edición
 * (paso 1: lista y poblaciones; paso 2: productos y precios).
 */
import { ref, reactive, computed, onMounted } from 'vue'
import invListaPrecioService from '@/services/invListaPrecioService.js'
import { authService }       from '@/services/authService.js'
import { useNotification }   from '@/composables/useNotification'
import { usePoblacionSelector } from '@/composables/usePoblacion.js'
import { useConfirm }        from '@/composables/useConfirm.js'
import { normalizarTexto }   from '@/utils/busqueda.js'
import FilterField           from '@/components/forms/FilterField.vue'
import SectionHeader         from '@/components/activos/SectionHeader.vue'
import NavIcon               from '@/components/icons/NavIcon.vue'
import FormInputSearch       from '@/components/forms/FormInputSearch.vue'
import FormInput             from '@/components/forms/FormInput.vue'
import FormSelect            from '@/components/forms/FormSelect.vue'
import ModalBase             from '@/components/ModalBase.vue'
import InvListaPrecioWizardModal from '@/components/inventario/InvListaPrecioWizardModal.vue'

const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)

const canListasCrear     = computed(() => hasPermission('inv_listasCrear'))
const canListasEditar    = computed(() => hasPermission('inv_listasEditar'))
const canListasAprobar   = computed(() => hasPermission('inv_listasAprobar'))
const canListasInactivar = computed(() => hasPermission('inv_listasInactivar'))
const canListasClonar    = computed(() => hasPermission('inv_listasClonar'))
const canPreciosEditar   = computed(() => hasPermission('inv_preciosEditar'))

async function loadPermissions() {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos */ }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

const tipoLabel = (tipo) => ({ simple: 'Simple', kit: 'Kit', grupo: 'Grupo' }[tipo] ?? '—')
const statusText = (status) => ({ 0: 'Inactiva', 1: 'En Proceso', 2: 'Aprobada', 3: 'Activa' }[status] ?? '—')
const statusClass = (status) => ({
  0: 'bg-slate-100 text-slate-600',
  1: 'bg-blue-50 text-blue-700',
  2: 'bg-amber-50 text-amber-700',
  3: 'bg-green-50 text-green-700',
}[status] ?? 'bg-slate-100 text-slate-600')

// ─── Filtros ──────────────────────────────────────────────────────────────────
const MIN_BUSQUEDA = 2

const filters = reactive({ search: '', vigencia: 'vigentes', status: '', poblacion_id: '' })

const vigenciaOptions = [
  { value: 'vigentes', label: 'Vigentes' },
  { value: 'vencidas', label: 'Vencidas' },
  { value: 'todas',    label: 'Todas' },
]

const statusFilterOptions = [
  { value: '',  label: 'Todos' },
  { value: '1', label: 'En Proceso' },
  { value: '2', label: 'Aprobada' },
  { value: '3', label: 'Activa' },
  { value: '0', label: 'Inactiva' },
]

// Solo las poblaciones que tienen alguna lista (las demás nunca darían resultados)
const poblacionesConLista = ref([])
const poblacionFilterOptions = computed(() => [
  { value: '', label: 'Todas las poblaciones' },
  ...poblacionesConLista.value.map((p) => ({ value: String(p.id), label: p.nombre })),
])

async function loadPoblacionesConLista() {
  try {
    const res = await invListaPrecioService.getPoblaciones()
    poblacionesConLista.value = res.data ?? []
  } catch { /* el filtro queda solo con "Todas" */ }
}

const descripcionListado = computed(() => ({
  vigentes: 'Listas vigentes (no vencidas ni inactivas). Despliega una lista para ver sus productos. Flujo: En Proceso → Aprobada → Activa.',
  vencidas: 'Listas vencidas o inactivas. Despliega una lista para ver sus productos.',
  todas:    'Todas las listas, vigentes y vencidas. Despliega una lista para ver sus productos.',
}[filters.vigencia]))

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  const texto = filters.search.trim()
  // Con menos de 2 letras no se consulta, salvo que se acabe de vaciar el campo
  if (texto.length > 0 && texto.length < MIN_BUSQUEDA) return
  searchTimer = setTimeout(() => loadListas(1), 400)
}

function clearFilters() {
  Object.assign(filters, { search: '', vigencia: 'vigentes', status: '', poblacion_id: '' })
  loadListas(1)
}

/** Resalta en el desplegable los productos que coinciden con la búsqueda. */
function coincideBusqueda(precio) {
  const texto = normalizarTexto(filters.search.trim())
  if (texto.length < MIN_BUSQUEDA) return false
  return [precio.producto?.nombre, precio.producto?.codigo].some((v) => normalizarTexto(v ?? '').includes(texto))
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const listas     = ref([])
const loading    = ref(false)
const error      = ref('')
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

async function loadListas(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15, vigencia: filters.vigencia }
    if (filters.search.trim().length >= MIN_BUSQUEDA) params.search = filters.search.trim()
    if (filters.status !== '')       params.status       = filters.status
    if (filters.poblacion_id !== '') params.poblacion_id = filters.poblacion_id
    const res = await invListaPrecioService.getAll(params)
    listas.value = res.data ?? []
    Object.keys(detalles).forEach((id) => delete detalles[id])
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
    // Al buscar por producto, las listas se abren solas para mostrar la coincidencia
    expandidas.value = new Set()
    if (params.search) {
      listas.value.forEach(cargarDetalle)
      expandidas.value = new Set(listas.value.map((l) => l.id))
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar las listas de precios.'
  } finally {
    loading.value = false
  }
}

// ─── Desplegable de productos ─────────────────────────────────────────────────
const expandidas = ref(new Set())
const detalles   = reactive({})

async function cargarDetalle(lista) {
  if (detalles[lista.id]?.precios || detalles[lista.id]?.loading) return
  detalles[lista.id] = { loading: true, error: '', precios: null }
  try {
    const res = await invListaPrecioService.getById(lista.id)
    detalles[lista.id] = { loading: false, error: '', precios: res.data?.precios ?? [] }
  } catch (e) {
    detalles[lista.id] = { loading: false, error: e?.response?.data?.message ?? 'No se pudieron cargar los productos.', precios: null }
  }
}

function toggleLista(lista) {
  const siguiente = new Set(expandidas.value)
  if (siguiente.has(lista.id)) {
    siguiente.delete(lista.id)
  } else {
    siguiente.add(lista.id)
    cargarDetalle(lista)
  }
  expandidas.value = siguiente
}

// ─── Acciones de lista ────────────────────────────────────────────────────────
async function cambiarEstado(lista, { pregunta, titulo, etiqueta, peligro = true, accion, exito, fallo }) {
  if (!await confirm(pregunta, { title: titulo, confirmLabel: etiqueta, danger: peligro })) return
  try {
    await invListaPrecioService[accion](lista.id)
    notifySuccess(exito)
    loadListas(pagination.currentPage)
    loadPoblacionesConLista()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? fallo)
  }
}

const handleAprobar = (lista) => cambiarEstado(lista, {
  pregunta: `¿Aprobar la lista "${lista.nombre}"?`, titulo: 'Aprobar lista', etiqueta: 'Aprobar', peligro: false,
  accion: 'aprobar', exito: 'Lista aprobada.', fallo: 'No se pudo aprobar la lista.',
})
const handleActivar = (lista) => cambiarEstado(lista, {
  pregunta: `¿Activar la lista "${lista.nombre}"?`, titulo: 'Activar lista', etiqueta: 'Activar', peligro: false,
  accion: 'activar', exito: 'Lista activada.', fallo: 'No se pudo activar la lista.',
})
const handleInactivar = (lista) => cambiarEstado(lista, {
  pregunta: `¿Inactivar la lista "${lista.nombre}"?`, titulo: 'Inactivar lista', etiqueta: 'Inactivar',
  accion: 'inactivar', exito: 'Lista inactivada.', fallo: 'No se pudo inactivar la lista.',
})

// ─── Wizard crear / editar ────────────────────────────────────────────────────
const { poblacionesOptions: poblacionOptions, loadPoblaciones } = usePoblacionSelector()
const showWizard     = ref(false)
const listaEnEdicion = ref(null)

function openCreate() {
  listaEnEdicion.value = null
  showWizard.value = true
}

function openEdit(lista) {
  listaEnEdicion.value = lista
  showWizard.value = true
}

function onWizardSaved() {
  loadListas(pagination.currentPage)
  loadPoblacionesConLista()
}

// ─── Modal: Clonar lista ──────────────────────────────────────────────────────
const showClonarForm   = ref(false)
const clonarOrigen     = ref(null)
const clonarSaving     = ref(false)
const clonarFormError  = ref('')
const clonarFormErrors = ref({})
const clonarForm       = reactive({ nombre: '', fecha_inicio: '', fecha_fin: '', copiar_precios: true })

function openClonar(lista) {
  clonarOrigen.value = lista
  Object.assign(clonarForm, { nombre: `${lista.nombre} (copia)`, fecha_inicio: '', fecha_fin: '', copiar_precios: true })
  clonarFormError.value  = ''
  clonarFormErrors.value = {}
  showClonarForm.value   = true
}

async function handleClonar() {
  clonarFormError.value  = ''
  clonarFormErrors.value = {}
  clonarSaving.value     = true
  try {
    const res = await invListaPrecioService.clonar(clonarOrigen.value.id, {
      nombre:         clonarForm.nombre.trim(),
      fecha_inicio:   clonarForm.fecha_inicio || null,
      fecha_fin:      clonarForm.fecha_fin    || null,
      copiar_precios: clonarForm.copiar_precios,
    })
    notifySuccess(`Lista clonada con ${res.precios_copiados ?? 0} precio(s) copiado(s).`)
    showClonarForm.value = false
    loadListas(1)
    loadPoblacionesConLista()
  } catch (e) {
    if (e?.response?.status === 422) {
      clonarFormErrors.value = e.response.data?.errors ?? {}
      clonarFormError.value  = e.response.data?.message ?? 'Verifica los datos.'
    } else {
      clonarFormError.value = e?.response?.data?.message ?? 'Ocurrió un error al clonar.'
    }
  } finally {
    clonarSaving.value = false
  }
}

onMounted(() => {
  loadPermissions()
  loadListas(1)
  loadPoblaciones()
  loadPoblacionesConLista()
})
</script>
