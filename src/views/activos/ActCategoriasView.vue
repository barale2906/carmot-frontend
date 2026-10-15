<template>
  <div class="flex flex-col gap-6">
    <section aria-labelledby="filtros-act-categorias" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-act-categorias" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre de la categoría..." @input="onSearchInput" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filters.status" label="Estado:" :options="opcionesFiltroEstado" @change="loadCategorias(1)" />
        </div>
        <button
          v-if="can('act_categoriaCrear')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openForm(null)"
        >
          <NavIcon name="plus" class="size-4" />
          Nueva categoría
        </button>
      </div>
    </section>

    <section aria-labelledby="listado-act-categorias">
      <SectionHeader
        id="listado-act-categorias"
        title="Categorías de activos"
        description="Agrupan los activos para filtrarlos y reportarlos. Una categoría con activos no se elimina: se inactiva."
        class="mb-4"
      />

      <div v-if="loading" class="py-12 text-center text-sm text-slate-500">Cargando categorías...</div>
      <div v-else-if="!categorias.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay categorías con los filtros seleccionados.
      </div>
      <DataTable v-else :columns="columnas" :data="categorias" row-key="id" aria-label="Categorías de activos" actions-first>
        <template #cell="{ column, value, row }">
          <span v-if="column.key === 'nombre'" class="font-medium text-slate-900">{{ value }}</span>
          <StatusBadge v-else-if="column.key === 'status'" :label="row.status_text" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
          <span v-else>{{ value ?? '—' }}</span>
        </template>
        <template #actions="{ row }">
          <button
            v-if="can('act_categoriaEditar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar categoría"
            @click="openForm(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="can('act_categoriaInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500"
            :title="row.activos_count ? 'Tiene activos: inactívala en lugar de eliminarla' : 'Eliminar categoría'"
            :disabled="row.activos_count > 0"
            @click="eliminar(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">Página {{ pagination.currentPage }} de {{ pagination.lastPage }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadCategorias(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadCategorias(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <ModalBase v-model="showForm" :title="editando ? 'Editar categoría' : 'Nueva categoría'" description="Categoría de activos fijos">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="guardar">
        <FormInput v-model="form.nombre" label="Nombre" required placeholder="Ej: Equipo de cómputo" :error="errores.nombre?.[0]" />
        <FormTextarea v-model="form.descripcion" label="Descripción" :rows="2" />
        <FormSelect v-if="editando" v-model="form.status" label="Estado" :options="opcionesEstado" />
        <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
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
          :disabled="guardando"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="guardar"
        >
          {{ guardando ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import activoService   from '@/services/activoService.js'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import StatusBadge     from '@/components/activos/StatusBadge.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import FormTextarea    from '@/components/forms/FormTextarea.vue'
import ModalBase       from '@/components/ModalBase.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

const opcionesEstado       = [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }]
const opcionesFiltroEstado = [{ value: '', label: 'Todos' }, { value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]
const columnas = [
  { key: 'nombre',        label: 'Nombre' },
  { key: 'descripcion',   label: 'Descripción' },
  { key: 'activos_count', label: 'Activos' },
  { key: 'status',        label: 'Estado' }
]

const categorias = ref([])
const loading    = ref(false)
const filters    = reactive({ search: '', status: '' })
const pagination = reactive({ currentPage: 1, lastPage: 1 })

async function loadCategorias(page = 1) {
  loading.value = true
  try {
    const params = { page, per_page: 20 }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status
    const res = await activoService.getCategorias(params)
    categorias.value       = res.data ?? []
    pagination.currentPage = res.meta?.current_page ?? 1
    pagination.lastPage    = res.meta?.last_page ?? 1
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudieron cargar las categorías.')
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadCategorias(1), 400)
}

const showForm  = ref(false)
const editando  = ref(null)
const guardando = ref(false)
const error     = ref('')
const errores   = ref({})
const form      = reactive({ nombre: '', descripcion: '', status: 1 })

function openForm(row) {
  editando.value = row
  error.value    = ''
  errores.value  = {}
  Object.assign(form, { nombre: row?.nombre ?? '', descripcion: row?.descripcion ?? '', status: row?.status ?? 1 })
  showForm.value = true
}

async function guardar() {
  guardando.value = true
  error.value     = ''
  errores.value   = {}
  const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion?.trim() || null }
  try {
    if (editando.value) await activoService.updateCategoria(editando.value.id, { ...payload, status: Number(form.status) })
    else await activoService.createCategoria(payload)
    notifySuccess('Categoría guardada.')
    showForm.value = false
    loadCategorias(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) errores.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo guardar la categoría.'
  } finally {
    guardando.value = false
  }
}

async function eliminar(row) {
  if (!await confirm(`¿Eliminar la categoría "${row.nombre}"?`)) return
  try {
    await activoService.deleteCategoria(row.id)
    notifySuccess('Categoría eliminada.')
    loadCategorias(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar la categoría.')
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadCategorias(1)
})
</script>
