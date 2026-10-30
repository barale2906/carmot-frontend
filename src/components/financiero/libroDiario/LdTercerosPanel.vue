<template>
  <div class="flex flex-col gap-6">
    <section class="rounded-[14px] border border-black/10 bg-white p-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="filtros.search" label="Buscar:" placeholder="Nombre o identificación..." @input="onBuscar" />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filtros.tipo_identificacion" label="Tipo de identificación:" placeholder="Todos" :options="opcionesTipo" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filtros.status" label="Estado:" placeholder="Todos" :options="OPCIONES_ESTADO" />
        </div>
      </div>
    </section>

    <section>
      <SectionHeader
        title="Terceros"
        description="Personas y empresas de los movimientos del libro diario. Se crean desde el registro del movimiento; aquí se corrigen sus datos o se inactivan."
        class="mb-4"
      />
      <div v-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-16 text-center text-sm text-slate-500">Cargando...</div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{{ error }}</div>
      <DataTable v-else :columns="COLUMNAS" :data="items" row-key="id" aria-label="Terceros del libro diario" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'identificacion'">{{ row.tipo_identificacion }} {{ row.identificacion }}</template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge :label="row.status_text" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
          </template>
          <template v-else>{{ value || value === 0 ? value : '—' }}</template>
        </template>
        <template #actions="{ row }">
          <template v-if="puedeEditar">
            <button type="button" class="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Editar" @click="abrirForm(row)">
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500"
              :class="row.status === 1 ? 'hover:bg-red-100 hover:text-red-700' : 'hover:bg-green-100 hover:text-green-700'"
              :title="row.status === 1 ? 'Inactivar' : 'Activar'"
              @click="cambiarEstado(row)"
            >
              <NavIcon :name="row.status === 1 ? 'ban' : 'check'" class="size-4" />
            </button>
          </template>
        </template>
      </DataTable>
      <div v-if="paginacion.lastPage > 1" class="mt-4 flex items-center justify-end gap-2">
        <button type="button" :disabled="paginacion.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-40" @click="cargar(paginacion.currentPage - 1)">Anterior</button>
        <button type="button" :disabled="paginacion.currentPage === paginacion.lastPage" class="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-40" @click="cargar(paginacion.currentPage + 1)">Siguiente</button>
      </div>
    </section>

    <ModalBase v-model="mostrarForm" title="Editar tercero" description="Los movimientos ya registrados conservan el nombre e identificación con que se registraron.">
      <form class="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2" @submit.prevent="guardar">
        <FormSelect v-model="form.tipo_identificacion" label="Tipo de identificación" required :options="opcionesTipo" :error="errores.tipo_identificacion?.[0]" />
        <FormInput v-model="form.identificacion" label="Número de identificación" required :error="errores.identificacion?.[0]" />
        <FormInput v-model="form.nombre" label="Nombre o razón social" required span="full" :error="errores.nombre?.[0]" />
        <FormInput v-model="form.telefono" label="Teléfono" :error="errores.telefono?.[0]" />
        <FormInput v-model="form.email" type="email" label="Correo electrónico" :error="errores.email?.[0]" />
        <FormInput v-model="form.direccion" label="Dirección" span="full" :error="errores.direccion?.[0]" />
        <FormSelect v-model="form.status" label="Estado" :options="OPCIONES_ESTADO" :error="errores.status?.[0]" />
        <p v-if="errorForm" class="text-sm text-red-600 md:col-span-2">{{ errorForm }}</p>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="mostrarForm = false">Cancelar</button>
        <button type="button" :disabled="guardando" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="guardar">
          {{ guardando ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import DataTable from '@/components/activos/DataTable.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { useNotification } from '@/composables/useNotification.js'
import { useConfirm } from '@/composables/useConfirm.js'

/**
 * Administración de los terceros del libro diario: búsqueda con filtros, corrección
 * de datos e inactivación. No se crean aquí (se crean al registrar el movimiento) ni
 * se eliminan, porque quedan referenciados en los movimientos.
 */
const props = defineProps({
  /** Mapa código → etiqueta de /libro-diario/filters (tipos_identificacion) */
  tiposIdentificacion: { type: Object, default: () => ({}) },
  /** Permite corregir e inactivar (permiso fin_ldCatalogoEditar) */
  puedeEditar: { type: Boolean, default: false },
})

const COLUMNAS = [
  { key: 'identificacion', label: 'Identificación' },
  { key: 'nombre', label: 'Nombre o razón social' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Correo' },
  { key: 'movimientos_count', label: 'Movimientos' },
  { key: 'status', label: 'Estado' },
]
const OPCIONES_ESTADO = [{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }]

const notify = useNotification()
const { confirm } = useConfirm()

const opcionesTipo = computed(() => Object.entries(props.tiposIdentificacion).map(([value, label]) => ({ value, label })))

const filtros = reactive({ search: '', tipo_identificacion: '', status: '' })
const items = ref([])
const cargando = ref(false)
const error = ref('')
const paginacion = reactive({ currentPage: 1, lastPage: 1 })

async function cargar(page = 1) {
  cargando.value = true
  error.value = ''
  const params = Object.fromEntries(Object.entries({ ...filtros, page }).filter(([, v]) => v !== '' && v !== null))
  try {
    const res = await libroDiarioService.getCatalogo('terceros', params)
    items.value = res.data ?? []
    paginacion.currentPage = res.meta?.current_page ?? 1
    paginacion.lastPage = res.meta?.last_page ?? 1
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los terceros.'
  } finally {
    cargando.value = false
  }
}

let temporizador = null
function onBuscar() {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => cargar(1), 400)
}

watch(() => [filtros.tipo_identificacion, filtros.status], () => cargar(1))

// ─── Edición ──────────────────────────────────────────────────────────────────
const mostrarForm = ref(false)
const editando = ref(null)
const form = reactive({})
const errores = ref({})
const errorForm = ref('')
const guardando = ref(false)

function abrirForm(row) {
  editando.value = row
  Object.assign(form, {
    tipo_identificacion: row.tipo_identificacion,
    identificacion: row.identificacion,
    nombre: row.nombre,
    telefono: row.telefono ?? '',
    email: row.email ?? '',
    direccion: row.direccion ?? '',
    status: row.status,
  })
  errores.value = {}
  errorForm.value = ''
  mostrarForm.value = true
}

async function guardar() {
  guardando.value = true
  errores.value = {}
  errorForm.value = ''
  const payload = { ...form, telefono: form.telefono || null, email: form.email || null, direccion: form.direccion || null }
  try {
    await libroDiarioService.actualizarCatalogo('terceros', editando.value.id, payload)
    notify.success('Tercero actualizado.')
    mostrarForm.value = false
    cargar(paginacion.currentPage)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    errorForm.value = e?.response?.data?.message ?? 'No se pudo guardar.'
  } finally {
    guardando.value = false
  }
}

async function cambiarEstado(row) {
  const activar = row.status !== 1
  const pregunta = activar
    ? `¿Activar a "${row.nombre}"? Volverá a estar disponible al registrar movimientos.`
    : `¿Inactivar a "${row.nombre}"? No se podrán registrar movimientos nuevos a su nombre; los ya registrados no cambian.`
  if (!await confirm(pregunta)) return
  try {
    await libroDiarioService.actualizarCatalogo('terceros', row.id, { status: activar ? 1 : 0 })
    notify.success(activar ? 'Tercero activado.' : 'Tercero inactivado.')
    cargar(paginacion.currentPage)
  } catch (e) {
    notify.error(e?.response?.data?.message ?? 'No se pudo cambiar el estado.')
  }
}

onMounted(() => cargar(1))
onBeforeUnmount(() => clearTimeout(temporizador))
</script>
