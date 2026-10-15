<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-seguimientos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-seguimientos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Texto del seguimiento..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[260px]">
          <FormSelect v-model="filters.referido_id" label="Lead:" :options="opcionesFiltroReferido" @change="loadSeguimientos(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_desde" type="date" label="Desde:" @change="onRangoChange" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filters.fecha_hasta" type="date" label="Hasta:" @change="onRangoChange" />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="can('crm_seguimientoCrear')"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo seguimiento
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
      <p class="mt-2 text-xs text-slate-400">El rango de fechas se aplica cuando se indican ambas fechas.</p>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-seguimientos-heading">
      <SectionHeader
        id="listado-seguimientos-heading"
        title="Bitácora de seguimientos"
        description="Llamadas, mensajes y visitas registradas por los asesores. Las citas y las matrículas dejan su propia entrada automática."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando seguimientos...</span>
      </div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
      <div v-else-if="!seguimientos.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay seguimientos con los filtros seleccionados.
      </div>

      <DataTable v-else :columns="tableColumns" :data="seguimientos" row-key="id" aria-label="Bitácora de seguimientos" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'fecha'">
            {{ fechaCorta(value) }}
          </template>
          <template v-else-if="column.key === 'referido'">
            <span class="text-slate-900">{{ row.referido?.nombre || 'Sin nombre' }}</span>
            <span class="block text-xs text-slate-400">{{ row.referido?.celular }}</span>
          </template>
          <template v-else-if="column.key === 'seguidor'">
            {{ nombreCompleto(row.seguidor) || '—' }}
          </template>
          <template v-else-if="column.key === 'seguimiento'">
            <p class="max-w-xl whitespace-pre-line text-sm text-slate-700">{{ value }}</p>
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            v-if="can('crm_seguimientoEditar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar seguimiento"
            @click="openEdit(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="can('crm_seguimientoInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar seguimiento"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} seguimientos
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadSeguimientos(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadSeguimientos(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- Modal: nuevo / editar -->
    <ModalBase
      v-model="showForm"
      :title="editing ? 'Editar seguimiento' : 'Nuevo seguimiento'"
      description="Registro de una interacción con el aspirante"
    >
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormSelect
          v-if="!editing"
          v-model="form.referido_id"
          label="Lead"
          required
          :options="opcionesReferido"
          :error="formErrors.referido_id?.[0]"
        />
        <FormInput v-model="form.fecha" type="date" label="Fecha" required :max="hoy" :error="formErrors.fecha?.[0]" />
        <FormTextarea v-model="form.seguimiento" label="Seguimiento" required :rows="4" />
        <p v-if="formErrors.seguimiento" class="-mt-3 text-xs text-red-600">{{ formErrors.seguimiento[0] }}</p>
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
          {{ saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Registrar') }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import seguimientoService from '@/services/seguimientoService.js'
import referidoService    from '@/services/referidoService.js'
import { authService }    from '@/services/authService.js'
import SectionHeader      from '@/components/activos/SectionHeader.vue'
import DataTable          from '@/components/activos/DataTable.vue'
import NavIcon            from '@/components/icons/NavIcon.vue'
import FormInputSearch    from '@/components/forms/FormInputSearch.vue'
import FormInput          from '@/components/forms/FormInput.vue'
import FormSelect         from '@/components/forms/FormSelect.vue'
import FormTextarea       from '@/components/forms/FormTextarea.vue'
import ModalBase          from '@/components/ModalBase.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'
import { nombreCompleto }  from '@/utils/formatters.js'
import { fechaISO, fechaCorta } from '@/utils/crm.js'

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

const hoy = fechaISO()

// ─── Leads para el selector ───────────────────────────────────────────────────
const referidos = ref([])
const opcionesReferido = computed(() => referidos.value.map(r => ({
  value: r.id,
  label: `${r.nombre || 'Sin nombre'} — ${r.celular}`
})))
const opcionesFiltroReferido = computed(() => [{ value: '', label: 'Todos los leads' }, ...opcionesReferido.value])

async function loadReferidos() {
  try {
    const res = await referidoService.getAll({ per_page: 500, sort_by: 'nombre', sort_direction: 'asc' })
    referidos.value = res.data ?? []
  } catch { /* sin permiso de leads: el selector queda vacío */ }
}

// ─── Listado ──────────────────────────────────────────────────────────────────
const seguimientos = ref([])
const loading      = ref(false)
const error        = ref('')
const pagination   = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters      = reactive({ search: '', referido_id: '', fecha_desde: '', fecha_hasta: '' })

const tableColumns = [
  { key: 'fecha',       label: 'Fecha' },
  { key: 'referido',    label: 'Lead' },
  { key: 'seguidor',    label: 'Registró' },
  { key: 'seguimiento', label: 'Seguimiento' }
]

async function loadSeguimientos(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 20 }
    for (const [clave, valor] of Object.entries(filters)) {
      if (valor !== '' && valor !== null) params[clave] = valor
    }
    const res = await seguimientoService.getAll(params)
    seguimientos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los seguimientos.'
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadSeguimientos(1), 400)
}

/** El backend solo filtra por rango cuando llegan ambas fechas. */
function onRangoChange() {
  const ambas   = filters.fecha_desde && filters.fecha_hasta
  const ninguna = !filters.fecha_desde && !filters.fecha_hasta
  if (ambas || ninguna) loadSeguimientos(1)
}

function clearFilters() {
  Object.assign(filters, { search: '', referido_id: '', fecha_desde: '', fecha_hasta: '' })
  loadSeguimientos(1)
}

async function handleDelete(row) {
  if (!await confirm('¿Eliminar este seguimiento de la bitácora?')) return
  try {
    await seguimientoService.delete(row.id)
    notifySuccess('Seguimiento eliminado.')
    loadSeguimientos(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar el seguimiento.')
  }
}

// ─── Formulario ───────────────────────────────────────────────────────────────
const showForm   = ref(false)
const editing    = ref(null)
const saving     = ref(false)
const formError  = ref('')
const formErrors = ref({})
const form       = reactive({ referido_id: '', fecha: hoy, seguimiento: '' })

function openCreate() {
  editing.value    = null
  formError.value  = ''
  formErrors.value = {}
  Object.assign(form, { referido_id: filters.referido_id || '', fecha: hoy, seguimiento: '' })
  showForm.value = true
}

function openEdit(row) {
  editing.value    = row
  formError.value  = ''
  formErrors.value = {}
  Object.assign(form, { referido_id: row.referido_id, fecha: String(row.fecha).slice(0, 10), seguimiento: row.seguimiento })
  showForm.value = true
}

async function handleSubmit() {
  saving.value     = true
  formError.value  = ''
  formErrors.value = {}
  try {
    if (editing.value) {
      await seguimientoService.update(editing.value.id, { fecha: form.fecha, seguimiento: form.seguimiento.trim() })
      notifySuccess('Seguimiento actualizado.')
    } else {
      const user = await authService.getUser()
      await seguimientoService.create({
        referido_id: Number(form.referido_id),
        seguidor_id: user?.id,
        fecha:       form.fecha,
        seguimiento: form.seguimiento.trim()
      })
      notifySuccess('Seguimiento registrado.')
    }
    showForm.value = false
    loadSeguimientos(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) formErrors.value = e.response.data?.errors ?? {}
    formError.value = e?.response?.data?.message ?? 'No se pudo guardar el seguimiento.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadReferidos()
  loadSeguimientos(1)
})
</script>
