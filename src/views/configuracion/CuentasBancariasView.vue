<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-cuentas-heading">
      <h2 id="stats-cuentas-heading" class="sr-only">Resumen de cuentas bancarias</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard
            title="Total"
            :value="stats.totales?.total ?? '—'"
            description="Cuentas registradas"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activas"
            :value="stats.totales?.activas ?? '—'"
            description="Disponibles para recibir pagos"
            icon="activos"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivas"
            :value="stats.totales?.inactivas ?? '—'"
            description="No disponibles"
            icon="pendientes"
            icon-variant="slate"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Con transferencias"
            :value="stats.con_transferencias?.con_pagos ?? '—'"
            description="Cuentas con pagos recibidos"
            icon="receipt"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-cuentas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-cuentas-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Número, titular o banco..."
            help="Filtra por número de cuenta, titular, descripción o nombre del banco."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect
            v-model="filters.sede_id"
            label="Sede:"
            placeholder="Todas"
            :options="sedeFilterOptions"
            @change="onFilterChange"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            placeholder="Todos"
            :options="statusOptions"
            @change="onFilterChange"
          />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="canCreate"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nueva cuenta
          </button>
          <button
            v-if="canInactivar"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openTrashed"
          >
            <NavIcon name="trash" class="size-4" />
            Papelera
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla principal -->
    <section aria-labelledby="listado-cuentas-heading">
      <SectionHeader
        id="listado-cuentas-heading"
        title="Cuentas bancarias del instituto"
        description="Cuentas donde se recibe el dinero de los pagos por transferencia. Cada cuenta aplica a las sedes elegidas y/o a todas las sedes de una ciudad; al registrar un pago solo aparecen las cuentas activas de la sede desde la que se factura."
        class="mb-4"
      />

      <div
        v-if="loading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando cuentas...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadCuentas(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="cuentas"
        row-key="id"
        aria-label="Listado de cuentas bancarias"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'alcance'">
            <span class="text-slate-700">{{ row.alcance || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'banco'">
            <span class="font-medium text-slate-900">{{ row.banco?.nombre ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'numero_cuenta'">
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value }}</code>
            <p v-if="row.descripcion" class="mt-0.5 text-xs text-slate-400">{{ row.descripcion }}</p>
          </template>
          <template v-else-if="column.key === 'medios_pago_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status === 1 ? 'Activo' : 'Inactivo')"
              :variant="row.status === 1 ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            v-if="canEditar"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar"
            @click="openEdit(row)"
          >
            <NavIcon name="edit" class="size-4" />
          </button>
          <button
            v-if="canInactivar"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Eliminar"
            :disabled="!!deleting[row.id]"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} cuentas
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

      <div
        v-if="actionError"
        class="mt-3 flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4"
      >
        <NavIcon name="pendientes" class="mt-0.5 size-4 shrink-0 text-red-500" />
        <p class="text-sm text-red-700">{{ actionError }}</p>
        <button
          type="button"
          class="ml-auto shrink-0 text-sm font-medium text-red-700 underline"
          @click="actionError = ''"
        >
          Cerrar
        </button>
      </div>
    </section>

    <!-- Modal: Crear / Editar cuenta -->
    <ModalBase
      v-model="showForm"
      :title="editingCuenta ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'"
      description="Cuenta del instituto donde la sede recibe pagos por transferencia"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Indica dónde se reciben pagos en esta cuenta: elige una ciudad para que aplique a todas
          sus sedes (incluidas las que se creen después), una o varias sedes, o ambas.
        </p>
        <FormSelect
          v-model="form.poblacion_id"
          label="Ciudad (todas sus sedes)"
          placeholder="-- Ninguna --"
          :options="poblacionOptions"
          :error="formErrors.poblacion_id?.[0]"
        />
        <FormCheckboxGroup
          v-model="form.sedes"
          label="Sedes"
          search-placeholder="Buscar sede..."
          :options="sedeCheckOptions"
          :hint="form.poblacion_id ? 'Las sedes de la ciudad elegida ya quedan incluidas.' : ''"
          :error="formErrors.sedes?.[0] ?? sedesItemError"
        />
        <FormSelect
          v-model="form.banco_id"
          label="Banco"
          placeholder="-- Seleccionar banco --"
          required
          :options="bancoOptions"
          :error="formErrors.banco_id?.[0]"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="form.tipo_cuenta"
            label="Tipo de cuenta"
            placeholder="-- Seleccionar --"
            required
            :options="tipoCuentaOptions"
            :error="formErrors.tipo_cuenta?.[0]"
          />
          <FormInput
            v-model="form.numero_cuenta"
            label="Número de cuenta"
            placeholder="Ej: 123-456789-00"
            required
            :error="formErrors.numero_cuenta?.[0]"
          />
        </div>
        <FormInput
          v-model="form.titular"
          label="Titular"
          placeholder="Ej: Centro de Capacitación CARMOT (opcional)"
          :error="formErrors.titular?.[0]"
        />
        <FormInput
          v-model="form.descripcion"
          label="Descripción"
          placeholder="Ej: Cuenta recaudo pensiones (opcional)"
          :error="formErrors.descripcion?.[0]"
        />
        <FormSelect
          v-model="form.status"
          label="Estado"
          :options="statusFormOptions"
          :error="formErrors.status?.[0]"
        />

        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showForm = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleSubmit"
        >
          {{ saving ? 'Guardando...' : (editingCuenta ? 'Guardar cambios' : 'Crear cuenta') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase
      v-model="showTrashed"
      title="Papelera de cuentas bancarias"
      description="Cuentas eliminadas. Puedes restaurarlas o eliminarlas permanentemente."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-slate-500">
          <NavIcon name="trash" class="size-5" />
        </span>
      </template>

      <div v-if="trashedLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando papelera...</span>
      </div>

      <div v-else-if="!trashedCuentas.length" class="py-6 text-center text-sm text-slate-400">
        No hay cuentas eliminadas.
      </div>

      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="item in trashedCuentas"
          :key="item.id"
          class="flex items-center justify-between gap-3 py-3"
        >
          <div>
            <p class="text-sm font-medium text-slate-900">{{ item.etiqueta ?? item.numero_cuenta }}</p>
            <p class="text-xs text-slate-400">{{ item.alcance || 'Sin sede' }}</p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              :disabled="restoringId === item.id"
              class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              @click="handleRestore(item)"
            >
              Restaurar
            </button>
            <button
              type="button"
              :disabled="forceDeleting === item.id"
              class="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="handleForceDelete(item)"
            >
              Eliminar definitivo
            </button>
          </div>
        </li>
      </ul>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showTrashed = false"
        >
          Cerrar
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import cuentaBancariaService from '@/services/cuentaBancariaService.js'
import { authService } from '@/services/authService.js'
import StatCard        from '@/components/dashboard/StatCard.vue'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import StatusBadge     from '@/components/activos/StatusBadge.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import FormCheckboxGroup from '@/components/forms/FormCheckboxGroup.vue'
import ModalBase       from '@/components/ModalBase.vue'
import { useNotification } from '@/composables/useNotification'
import { useConfirm } from '@/composables/useConfirm.js'

const { confirm } = useConfirm()

const { success: notifySuccess } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const userPermissions = ref([])

function hasPermission(perm) {
  return userPermissions.value.includes(perm)
}

const canCreate    = computed(() => hasPermission('co_cuentasBancariasCrear'))
const canEditar    = computed(() => hasPermission('co_cuentasBancariasEditar'))
const canInactivar = computed(() => hasPermission('co_cuentasBancariasInactivar'))

async function loadPermissions() {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos */ }
}

// ─── Opciones (sedes, ciudades, bancos, tipos) ───────────────────────────────
const sedes        = ref([])
const poblaciones  = ref([])
const bancos       = ref([])
const tiposCuenta  = ref({})

const sedeOptions       = computed(() => sedes.value.map(s => ({ value: s.id, label: s.nombre })))
const sedeFilterOptions = computed(() => [{ value: '', label: 'Todas las sedes' }, ...sedeOptions.value])
const poblacionOptions  = computed(() => [{ value: '', label: '-- Ninguna --' }, ...poblaciones.value.map(p => ({ value: p.id, label: p.nombre }))])
const nombreCiudad      = computed(() => Object.fromEntries(poblaciones.value.map(p => [p.id, p.nombre])))
// Cada sede muestra su ciudad para facilitar la elección
const sedeCheckOptions  = computed(() => sedes.value.map(s => ({
  value: s.id,
  label: s.nombre,
  description: nombreCiudad.value[s.poblacion_id] ?? '',
})))
const bancoOptions      = computed(() => bancos.value.map(b => ({ value: b.id, label: b.nombre })))
const tipoCuentaOptions = computed(() => Object.entries(tiposCuenta.value).map(([value, label]) => ({ value, label })))

async function loadOptions() {
  try {
    const res = await cuentaBancariaService.getFilterOptions()
    sedes.value       = res.data?.sedes ?? []
    poblaciones.value = res.data?.poblaciones ?? []
    bancos.value      = res.data?.bancos ?? []
    tiposCuenta.value = res.data?.tipos_cuenta ?? {}
  } catch { /* el formulario mostrará selectores vacíos */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const cuentas     = ref([])
const loading     = ref(false)
const error       = ref('')
const actionError = ref('')
const deleting    = ref({})

const stats = reactive({
  totales: null,
  con_transferencias: null,
})

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters    = reactive({ search: '', sede_id: '', status: '' })

const tableColumns = [
  { key: 'alcance',           label: 'Aplica a' },
  { key: 'banco',             label: 'Banco' },
  { key: 'tipo_cuenta_text',  label: 'Tipo' },
  { key: 'numero_cuenta',     label: 'Número' },
  { key: 'titular',           label: 'Titular' },
  { key: 'medios_pago_count', label: 'Pagos' },
  { key: 'status',            label: 'Estado' },
]

const statusOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' },
]

async function loadCuentas(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.search)         params.search  = filters.search
    if (filters.sede_id !== '') params.sede_id = filters.sede_id
    if (filters.status !== '')  params.status  = filters.status
    const res = await cuentaBancariaService.getAll(params)
    cuentas.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar las cuentas bancarias.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await cuentaBancariaService.getStatistics()
    const d   = res.data ?? {}
    stats.totales            = d.totales            ?? null
    stats.con_transferencias = d.con_transferencias ?? null
  } catch { /* no bloquea */ }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadCuentas(1), 400)
}

function onFilterChange() {
  loadCuentas(1)
}

function clearFilters() {
  filters.search  = ''
  filters.sede_id = ''
  filters.status  = ''
  loadCuentas(1)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadCuentas(page)
}

// ─── Eliminar ──────────────────────────────────────────────────────────────────
async function handleDelete(row) {
  if (!await confirm(`¿Eliminar la cuenta "${row.etiqueta ?? row.numero_cuenta}"?`)) return
  deleting.value = { ...deleting.value, [row.id]: true }
  actionError.value = ''
  try {
    await cuentaBancariaService.delete(row.id)
    notifySuccess('Cuenta bancaria eliminada correctamente.')
    loadCuentas(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar la cuenta bancaria.'
  } finally {
    const next = { ...deleting.value }
    delete next[row.id]
    deleting.value = next
  }
}

// ─── Papelera ──────────────────────────────────────────────────────────────────
const showTrashed    = ref(false)
const trashedCuentas = ref([])
const trashedLoading = ref(false)
const restoringId    = ref(null)
const forceDeleting  = ref(null)

async function openTrashed() {
  showTrashed.value    = true
  trashedLoading.value = true
  try {
    const res = await cuentaBancariaService.getTrashed()
    trashedCuentas.value = res.data ?? []
  } catch {
    trashedCuentas.value = []
  } finally {
    trashedLoading.value = false
  }
}

async function handleRestore(item) {
  restoringId.value = item.id
  try {
    await cuentaBancariaService.restore(item.id)
    notifySuccess(`Cuenta "${item.numero_cuenta}" restaurada.`)
    trashedCuentas.value = trashedCuentas.value.filter(c => c.id !== item.id)
    loadCuentas(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo restaurar la cuenta bancaria.'
  } finally {
    restoringId.value = null
  }
}

async function handleForceDelete(item) {
  if (!await confirm(`¿Eliminar permanentemente la cuenta "${item.numero_cuenta}"? Esta acción no se puede deshacer.`)) return
  forceDeleting.value = item.id
  try {
    await cuentaBancariaService.forceDelete(item.id)
    notifySuccess(`Cuenta "${item.numero_cuenta}" eliminada permanentemente.`)
    trashedCuentas.value = trashedCuentas.value.filter(c => c.id !== item.id)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar la cuenta permanentemente.'
  } finally {
    forceDeleting.value = null
  }
}

// ─── Formulario Crear / Editar ────────────────────────────────────────────────
const showForm      = ref(false)
const editingCuenta = ref(null)
const saving        = ref(false)
const formError     = ref('')
const formErrors    = ref({})

const form = reactive({
  sedes: [], poblacion_id: '', banco_id: null, tipo_cuenta: '', numero_cuenta: '', titular: '', descripcion: '', status: 1,
})

// Errores por sede (sedes.0, sedes.1…) agrupados en el campo
const sedesItemError = computed(() =>
  Object.entries(formErrors.value).find(([k]) => k.startsWith('sedes.'))?.[1]?.[0] ?? ''
)

function fillForm(row = null) {
  form.sedes         = row ? [...(row.sede_ids ?? [])] : (filters.sede_id !== '' ? [Number(filters.sede_id)] : [])
  form.poblacion_id  = row?.poblacion_id ?? ''
  form.banco_id      = row?.banco_id ?? null
  form.tipo_cuenta   = row?.tipo_cuenta ?? ''
  form.numero_cuenta = row?.numero_cuenta ?? ''
  form.titular       = row?.titular ?? ''
  form.descripcion   = row?.descripcion ?? ''
  form.status        = row?.status ?? 1
  formError.value    = ''
  formErrors.value   = {}
  showForm.value     = true
}

function openCreate() {
  editingCuenta.value = null
  fillForm()
}

function openEdit(row) {
  editingCuenta.value = row
  fillForm(row)
}

async function handleSubmit() {
  formError.value  = ''
  formErrors.value = {}
  saving.value     = true
  const payload = {
    sedes:         form.sedes.map(Number),
    poblacion_id:  form.poblacion_id !== '' && form.poblacion_id !== null ? Number(form.poblacion_id) : null,
    banco_id:      form.banco_id,
    tipo_cuenta:   form.tipo_cuenta,
    numero_cuenta: form.numero_cuenta.trim(),
    titular:       form.titular.trim() || null,
    descripcion:   form.descripcion.trim() || null,
    status:        form.status,
  }
  try {
    if (editingCuenta.value) {
      await cuentaBancariaService.update(editingCuenta.value.id, payload)
      notifySuccess('Cuenta bancaria actualizada correctamente.')
    } else {
      await cuentaBancariaService.create(payload)
      notifySuccess('Cuenta bancaria creada correctamente.')
    }
    showForm.value = false
    loadCuentas(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    if (e?.response?.status === 422) {
      formErrors.value = e.response.data?.errors  ?? {}
      formError.value  = e.response.data?.message ?? 'Verifica los datos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error. Intenta de nuevo.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadPermissions()
  loadOptions()
  loadCuentas(1)
  loadStatistics()
})
</script>
