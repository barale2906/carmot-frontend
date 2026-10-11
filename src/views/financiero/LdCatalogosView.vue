<template>
  <div class="flex flex-col gap-6">
    <section class="rounded-[14px] border border-black/10 bg-white p-6">
      <FormTabs v-model="catalogo" :tabs="pestanas" @update:model-value="cargar(1)" />
      <div class="mt-4 flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch v-model="search" label="Buscar:" placeholder="Nombre..." @input="onBuscar" />
        </div>
        <button
          v-if="can('fin_ldCatalogoCrear')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 text-sm font-medium text-white hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="abrirForm(null)"
        >
          <NavIcon name="plus" class="size-4" />
          {{ esImpuesto ? 'Nuevo impuesto' : 'Nuevo tipo' }}
        </button>
        <button
          v-if="can('fin_ldCatalogoInactivar')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="abrirPapelera"
        >
          <NavIcon name="trash" class="size-4" />
          Papelera
        </button>
      </div>
    </section>

    <section>
      <SectionHeader
        :title="esImpuesto ? 'Impuestos y retenciones' : 'Tipos de movimiento'"
        :description="esImpuesto
          ? 'Los impuestos suman al total (IVA); las retenciones lo restan. El porcentaje es una sugerencia editable en cada movimiento.'
          : 'Clasifican los movimientos manuales del libro diario como egresos u otros ingresos.'"
        class="mb-4"
      />
      <div v-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-16 text-center text-sm text-slate-500">Cargando...</div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{{ error }}</div>
      <DataTable v-else :columns="columnas" :data="items" row-key="id" aria-label="Catálogo del libro diario" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status'">
            <StatusBadge :label="row.status_text" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
          </template>
          <template v-else-if="column.key === 'porcentaje'">{{ value }} %</template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button v-if="can('fin_ldCatalogoEditar')" type="button" class="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Editar" @click="abrirForm(row)">
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button v-if="can('fin_ldCatalogoInactivar')" type="button" class="rounded p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700" title="Eliminar" @click="eliminar(row)">
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>
      <div v-if="paginacion.lastPage > 1" class="mt-4 flex items-center justify-end gap-2">
        <button type="button" :disabled="paginacion.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-40" @click="cargar(paginacion.currentPage - 1)">Anterior</button>
        <button type="button" :disabled="paginacion.currentPage === paginacion.lastPage" class="rounded-lg px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-40" @click="cargar(paginacion.currentPage + 1)">Siguiente</button>
      </div>
    </section>

    <ModalBase v-model="mostrarForm" :title="editando ? 'Editar' : 'Nuevo'" :description="esImpuesto ? 'Impuesto o retención' : 'Tipo de movimiento'">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="guardar">
        <FormInput v-model="form.nombre" label="Nombre" required :error="errores.nombre?.[0]" />
        <template v-if="esImpuesto">
          <FormInput v-model="form.porcentaje" type="number" step="0.001" min="0" max="100" label="Porcentaje" required :error="errores.porcentaje?.[0]" />
          <FormSelect v-model="form.efecto" label="Efecto" required :options="opcionesEfecto" :error="errores.efecto?.[0]" />
        </template>
        <template v-else>
          <FormSelect v-model="form.clase" label="Clase" required :options="opcionesClase" :error="errores.clase?.[0]" />
          <FormInput v-model="form.descripcion" label="Descripción" :error="errores.descripcion?.[0]" />
        </template>
        <FormSelect v-model="form.status" label="Estado" :options="[{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }]" />
        <p v-if="errorForm" class="text-sm text-red-600">{{ errorForm }}</p>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200" @click="mostrarForm = false">Cancelar</button>
        <button type="button" :disabled="guardando" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50" @click="guardar">
          {{ guardando ? 'Guardando...' : 'Guardar' }}
        </button>
      </template>
    </ModalBase>

    <ModalBase v-model="mostrarPapelera" title="Papelera" description="Registros eliminados que puede restaurar.">
      <p v-if="!papelera.length" class="py-6 text-center text-sm text-slate-400">No hay registros eliminados.</p>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="item in papelera" :key="item.id" class="flex items-center justify-between py-3">
          <span class="text-sm font-medium text-slate-900">{{ item.nombre }}</span>
          <button type="button" class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200" @click="restaurar(item)">Restaurar</button>
        </li>
      </ul>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200" @click="mostrarPapelera = false">Cerrar</button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import DataTable from '@/components/activos/DataTable.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import FormTabs from '@/components/forms/FormTabs.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { usePermisos } from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification.js'
import { useConfirm } from '@/composables/useConfirm.js'
import { CLASE_EGRESO, CLASE_INGRESO, EFECTO_SUMA, EFECTO_RESTA } from '@/utils/libroDiario.js'

/**
 * Catálogos del libro diario: tipos de movimiento (egreso / otro ingreso) e
 * impuestos y retenciones, con creación, edición, eliminación y papelera.
 */
const { can, loadPermisos } = usePermisos()
const notify = useNotification()
const { confirm } = useConfirm()

const pestanas = [
  { value: 'tipos-movimiento', label: 'Tipos de movimiento' },
  { value: 'impuestos', label: 'Impuestos y retenciones' },
]
const opcionesClase = [{ value: CLASE_EGRESO, label: 'Egreso' }, { value: CLASE_INGRESO, label: 'Otro ingreso' }]
const opcionesEfecto = [{ value: EFECTO_SUMA, label: 'Suma (impuesto)' }, { value: EFECTO_RESTA, label: 'Resta (retención)' }]

const catalogo = ref('tipos-movimiento')
const esImpuesto = computed(() => catalogo.value === 'impuestos')
const columnas = computed(() => (esImpuesto.value
  ? [{ key: 'nombre', label: 'Nombre' }, { key: 'porcentaje', label: 'Porcentaje' }, { key: 'efecto_text', label: 'Efecto' }, { key: 'status', label: 'Estado' }]
  : [{ key: 'nombre', label: 'Nombre' }, { key: 'clase_text', label: 'Clase' }, { key: 'descripcion', label: 'Descripción' }, { key: 'status', label: 'Estado' }]))

const items = ref([])
const search = ref('')
const cargando = ref(false)
const error = ref('')
const paginacion = reactive({ currentPage: 1, lastPage: 1 })

async function cargar(page = 1) {
  cargando.value = true
  error.value = ''
  try {
    const res = await libroDiarioService.getCatalogo(catalogo.value, { page, search: search.value || undefined })
    items.value = res.data ?? []
    paginacion.currentPage = res.meta?.current_page ?? 1
    paginacion.lastPage = res.meta?.last_page ?? 1
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar el catálogo.'
  } finally {
    cargando.value = false
  }
}

let temporizador = null
function onBuscar() {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => cargar(1), 400)
}

// ─── Formulario ───────────────────────────────────────────────────────────────
const mostrarForm = ref(false)
const editando = ref(null)
const form = reactive({})
const errores = ref({})
const errorForm = ref('')
const guardando = ref(false)

function abrirForm(row) {
  editando.value = row
  Object.keys(form).forEach((k) => delete form[k])
  Object.assign(form, esImpuesto.value
    ? { nombre: row?.nombre ?? '', porcentaje: row?.porcentaje ?? '', efecto: row?.efecto ?? EFECTO_SUMA, status: row?.status ?? 1 }
    : { nombre: row?.nombre ?? '', clase: row?.clase ?? CLASE_EGRESO, descripcion: row?.descripcion ?? '', status: row?.status ?? 1 })
  errores.value = {}
  errorForm.value = ''
  mostrarForm.value = true
}

async function guardar() {
  guardando.value = true
  errores.value = {}
  errorForm.value = ''
  try {
    if (editando.value) await libroDiarioService.actualizarCatalogo(catalogo.value, editando.value.id, { ...form })
    else await libroDiarioService.crearCatalogo(catalogo.value, { ...form })
    notify.success('Guardado correctamente.')
    mostrarForm.value = false
    cargar(paginacion.currentPage)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    errorForm.value = e?.response?.data?.message ?? 'No se pudo guardar.'
  } finally {
    guardando.value = false
  }
}

async function eliminar(row) {
  if (!await confirm(`¿Eliminar "${row.nombre}"? Podrá restaurarlo desde la papelera.`)) return
  try {
    await libroDiarioService.eliminarCatalogo(catalogo.value, row.id)
    notify.success('Eliminado correctamente.')
    cargar(paginacion.currentPage)
  } catch (e) {
    notify.error(e?.response?.data?.message ?? 'No se pudo eliminar.')
  }
}

// ─── Papelera ─────────────────────────────────────────────────────────────────
const mostrarPapelera = ref(false)
const papelera = ref([])

async function abrirPapelera() {
  mostrarPapelera.value = true
  try {
    papelera.value = (await libroDiarioService.getCatalogoTrashed(catalogo.value)).data ?? []
  } catch {
    papelera.value = []
  }
}

async function restaurar(item) {
  try {
    await libroDiarioService.restaurarCatalogo(catalogo.value, item.id)
    papelera.value = papelera.value.filter((p) => p.id !== item.id)
    notify.success(`"${item.nombre}" restaurado.`)
    cargar(paginacion.currentPage)
  } catch (e) {
    notify.error(e?.response?.data?.message ?? 'No se pudo restaurar.')
  }
}

onMounted(async () => {
  await loadPermisos()
  cargar(1)
})
</script>
