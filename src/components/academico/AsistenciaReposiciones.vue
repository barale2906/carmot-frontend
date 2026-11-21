<template>
  <div class="flex flex-col gap-6">
    <!-- Filtros y acción principal -->
    <section aria-labelledby="filtros-reposicion-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-reposicion-heading" class="sr-only">Filtros de reposiciones</h2>
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="grid flex-1 gap-4 sm:grid-cols-3">
          <FormSelect v-model="filtros.grupo_id" label="Grupo:" placeholder="Todos" :options="opcionesGrupo" clearable @change="cargar(1)" />
          <FormInput v-model="filtros.fecha_desde" type="date" label="Clase de destino desde:" @change="cargar(1)" />
          <FormInput v-model="filtros.fecha_hasta" type="date" label="Hasta:" @change="cargar(1)" />
        </div>
        <button
          v-if="puedeCrear"
          type="button"
          class="h-9 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="modalAbierto = true"
        >
          Nueva reposición
        </button>
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-reposicion-heading">
      <h2 id="listado-reposicion-heading" class="sr-only">Reposiciones</h2>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div v-else-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-500">
        Cargando reposiciones...
      </div>
      <div v-else-if="!reposiciones.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay reposiciones con los filtros aplicados.
      </div>
      <DataTable v-else :columns="columnas" :data="reposiciones" row-key="id" actions-first aria-label="Listado de reposiciones">
        <template #actions="{ row }">
          <button
            v-if="puedeCancelar"
            type="button"
            class="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="cancelar(row)"
          >
            Cancelar
          </button>
        </template>
        <template #cell="{ column, row }">
          <template v-if="column.key === 'estudiante'">
            <span class="font-medium text-slate-900">{{ row.estudiante?.name }}</span>
            <span class="block text-xs text-slate-500">{{ row.estudiante?.documento ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'origen'">
            {{ etiquetaClaseReposicion(row.clase_origen) }}
          </template>
          <template v-else-if="column.key === 'destino'">
            {{ etiquetaClaseReposicion(row.clase_destino) }}
          </template>
          <template v-else-if="column.key === 'motivo'">
            {{ row.motivo || '—' }}
          </template>
          <template v-else-if="column.key === 'registrada_por'">
            {{ row.registrada_por?.name ?? '—' }}
            <span class="block text-xs text-slate-500">{{ row.created_at?.slice(0, 10) }}</span>
          </template>
        </template>
      </DataTable>

      <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} reposiciones</p>
        <div class="flex gap-2">
          <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="cargar(pagination.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="cargar(pagination.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>

    <ReposicionFormModal v-model="modalAbierto" @guardada="cargar(1)" />
  </div>
</template>

<script setup>
/**
 * Reposiciones de clase: listado (por grupo y fechas de la clase de destino) y registro de una nueva.
 * Cancelar una reposición exige el permiso `aca_reposicionInactivar`; registrarla, `aca_reposicionCrear`.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import reposicionService from '@/services/reposicionService.js'
import asistenciaService from '@/services/asistenciaService.js'
import FormSelect  from '@/components/forms/FormSelect.vue'
import FormInput   from '@/components/forms/FormInput.vue'
import DataTable   from '@/components/activos/DataTable.vue'
import ReposicionFormModal from '@/components/academico/ReposicionFormModal.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification'
import { useConfirm }      from '@/composables/useConfirm.js'
import { etiquetaClaseReposicion } from '@/utils/asistencia.js'

const { can, loadPermisos } = usePermisos()
const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()

const puedeCrear    = computed(() => can('aca_reposicionCrear'))
const puedeCancelar = computed(() => can('aca_reposicionInactivar'))

const filtros      = reactive({ grupo_id: '', fecha_desde: '', fecha_hasta: '' })
const grupos       = ref([])
const reposiciones = ref([])
const cargando     = ref(false)
const error        = ref('')
const modalAbierto = ref(false)
const pagination   = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

const columnas = [
  { key: 'estudiante',     label: 'Estudiante' },
  { key: 'origen',         label: 'Clase que no toma' },
  { key: 'destino',        label: 'Clase en la que la toma' },
  { key: 'motivo',         label: 'Motivo' },
  { key: 'registrada_por', label: 'Registrada por' }
]

const opcionesGrupo = computed(() => grupos.value.map(g => ({ value: g.id, label: [g.nombre, g.modulo].filter(Boolean).join(' · ') })))

function paramsListado(pagina) {
  const params = { page: pagina, per_page: 25 }
  for (const [clave, valor] of Object.entries(filtros)) if (valor) params[clave] = valor
  return params
}

async function cargar(pagina = 1) {
  cargando.value = true
  error.value = ''
  try {
    const res = await reposicionService.listar(paramsListado(pagina))
    reposiciones.value = res.data ?? []
    Object.assign(pagination, {
      currentPage: res.meta.current_page, lastPage: res.meta.last_page,
      total: res.meta.total, from: res.meta.from ?? 0, to: res.meta.to ?? 0
    })
  } catch (e) {
    const errores = e?.response?.data?.errors
    error.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo cargar el listado de reposiciones.')
  } finally {
    cargando.value = false
  }
}

async function cancelar(reposicion) {
  const nombre = reposicion.estudiante?.name ?? 'el estudiante'
  if (!await confirm(`¿Cancelar la reposición de ${nombre}? La clase de su grupo volverá a contar como falla si no asistió.`, { danger: true, confirmLabel: 'Cancelar reposición' })) return
  try {
    const res = await reposicionService.cancelar(reposicion.id)
    notifySuccess(res.message ?? 'Reposición cancelada.')
    await cargar(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo cancelar la reposición.')
  }
}

onMounted(async () => {
  loadPermisos().catch(() => {})
  try {
    const res = await asistenciaService.getFiltros()
    grupos.value = res.data?.grupos ?? []
  } catch {
    // Sin la lista de grupos se puede filtrar solo por fechas
  }
  cargar(1)
})
</script>
