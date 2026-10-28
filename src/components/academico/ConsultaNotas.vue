<template>
  <div class="flex flex-col gap-6">

    <!-- Filtros -->
    <section aria-labelledby="filtros-notas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-notas-heading" class="sr-only">Filtros de la consulta de notas</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormSelect v-model="filtros.ciclo_id" label="Ciclo:" placeholder="Todos" :options="opcionesCiclo" clearable @change="cargar(1)" />
        <FormSelect v-model="filtros.grupo_id" label="Grupo:" placeholder="Todos" :options="opcionesGrupo" clearable @change="cargar(1)" />
        <FormSelect
          v-model="filtros.profesor_id"
          label="Profesor:"
          placeholder="Todos"
          :options="opcionesProfesor"
          :disabled="esSoloProfesor"
          clearable
          @change="onProfesorChange"
        />
        <FormInputSearch
          v-model="filtros.buscar"
          label="Estudiante:"
          placeholder="Nombre o documento (mín. 3 letras)..."
          @input="onBusquedaInput"
        />
        <FormSelect v-model="filtros.estado" label="Resultado:" placeholder="Todos" :options="opcionesEstado" clearable @change="cargar(1)" />
        <label class="flex h-9 items-center gap-2 self-end text-sm text-slate-700">
          <input v-model="filtros.por_recuperar" type="checkbox" class="size-4 rounded border-slate-300" @change="cargar(1)">
          Solo pendientes de recuperación
        </label>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p v-if="estudianteFijo" class="flex items-center gap-2 text-sm text-slate-700">
          Sábana de <strong>{{ estudianteFijo.name }}</strong>
          <button
            type="button"
            class="rounded px-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Quitar filtro de estudiante"
            @click="quitarEstudiante"
          >
            ×
          </button>
        </p>
        <span v-else />
        <button
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </button>
      </div>
    </section>

    <!-- Cierre de notas del ciclo filtrado -->
    <CierreNotasCicloPanel
      v-if="filtros.ciclo_id"
      :ciclo-id="filtros.ciclo_id"
      :pendientes="resumen?.pendientes ?? 0"
      @cambio="onCierreCambio"
    />

    <!-- Resumen -->
    <section v-if="resumen && resultados.length" aria-label="Resumen de resultados" class="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div v-for="item in tarjetasResumen" :key="item.label" class="rounded-[14px] border border-black/10 bg-white px-4 py-3">
        <p class="text-xs text-slate-500">{{ item.label }}</p>
        <p class="text-xl font-semibold" :class="item.clase">{{ item.valor }}</p>
      </div>
    </section>

    <!-- Resultados -->
    <section aria-labelledby="resultados-notas-heading">
      <h2 id="resultados-notas-heading" class="sr-only">Resultados por módulo</h2>
      <p v-if="!tieneAlcance(filtros)" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        Elige un ciclo, grupo, profesor o busca un estudiante para consultar sus notas.
      </p>
      <p v-else-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
      <div v-else-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-500">
        Cargando notas...
      </div>
      <div v-else-if="!resultados.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
        No hay resultados con los filtros aplicados.
      </div>
      <DataTable v-else :columns="columnas" :data="resultados" row-key="clave" aria-label="Resultados por módulo" actions-first>
        <template #cell="{ column, row }">
          <template v-if="column.key === 'estudiante'">
            <span class="font-medium text-slate-900">{{ row.estudiante.name }}</span>
            <span class="block text-xs text-slate-500">{{ row.estudiante.documento ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'modulo'">
            {{ row.modulo.nombre }}
            <span class="block text-xs text-slate-500">
              Grupo {{ row.grupo.nombre }} · {{ row.ciclo.nombre }}<span v-if="row.notas_cerradas"> · notas cerradas</span>
            </span>
          </template>
          <template v-else-if="column.key === 'profesor'">
            {{ row.profesor?.name ?? '—' }}
          </template>
          <template v-else-if="column.key === 'nota_final'">
            <span :class="row.completo ? 'text-slate-900' : 'text-slate-400'">{{ formatoNota(row.nota_final) }}</span>
            <span v-if="!row.completo" class="block text-[10px] text-slate-400">parcial</span>
          </template>
          <template v-else-if="column.key === 'recuperacion'">
            {{ row.recuperacion ? formatoNota(row.recuperacion.nota) : '—' }}
          </template>
          <template v-else-if="column.key === 'nota_definitiva'">
            <span class="font-semibold">{{ formatoNota(row.nota_definitiva) }}</span>
          </template>
          <template v-else-if="column.key === 'estado'">
            <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="estadoResultado(row.estado).claseBadge">
              {{ estadoResultado(row.estado).label }}
            </span>
            <span v-if="requiereRecuperacion(row)" class="block text-xs text-amber-700">Puede recuperar</span>
          </template>
        </template>
        <template #actions="{ row }">
          <button
            v-if="row.puede_recuperar && can(row.recuperacion ? 'aca_notaEditar' : 'aca_notaCrear')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :title="row.recuperacion ? 'Editar recuperación' : 'Registrar recuperación'"
            @click="abrirRecuperacion(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="row.recuperacion && !row.notas_cerradas && can('aca_notaInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar recuperación"
            @click="eliminarRecuperacion(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
          <button
            v-if="!estudianteFijo"
            type="button"
            class="rounded px-1.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ver todos los módulos del estudiante"
            @click="verSabana(row.estudiante)"
          >
            Sábana
          </button>
        </template>
      </DataTable>

      <p v-if="sinEsquema.length" class="mt-3 text-xs text-amber-700">
        Sin esquema de calificación activo (no aparecen en la consulta):
        {{ sinEsquema.map(s => `${s.modulo.nombre} · Grupo ${s.grupo.nombre}`).join('; ') }}.
      </p>

      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} resultados
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="cargar(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="cargar(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <RecuperacionNotaModal v-model="showRecuperacion" :fila="filaRecuperacion" @guardado="cargar(pagination.currentPage)" />
  </div>
</template>

<script setup>
/**
 * Consulta de notas: resultados por módulo filtrables por ciclo, grupo, profesor y
 * estudiante (la sábana del estudiante es el filtro por estudiante). Desde aquí se
 * registran las recuperaciones y, con un ciclo elegido, se cierran o reabren sus notas.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { authService } from '@/services/authService.js'
import calificacionService   from '@/services/calificacionService.js'
import FormSelect            from '@/components/forms/FormSelect.vue'
import FormInputSearch       from '@/components/forms/FormInputSearch.vue'
import DataTable             from '@/components/activos/DataTable.vue'
import NavIcon               from '@/components/icons/NavIcon.vue'
import CierreNotasCicloPanel from '@/components/academico/CierreNotasCicloPanel.vue'
import RecuperacionNotaModal from '@/components/academico/RecuperacionNotaModal.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'
import {
  formatoNota, estadoResultado, requiereRecuperacion, paramsConsolidado, tieneAlcance
} from '@/utils/calificaciones.js'

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

const FILTROS_VACIOS = { ciclo_id: '', grupo_id: '', profesor_id: '', estudiante_id: '', buscar: '', estado: '', por_recuperar: false }

const filtros        = reactive({ ...FILTROS_VACIOS })
const opciones       = reactive({ ciclos: [], grupos: [], profesores: [], estados: [] })
const esSoloProfesor = ref(false)
// Quien solo es profesor queda fijo en sus grupos: limpiar los filtros no lo suelta
const profesorPropio = ref('')
const estudianteFijo = ref(null)
const resultados     = ref([])
const resumen        = ref(null)
const sinEsquema     = ref([])
const cargando       = ref(false)
const error          = ref('')
const pagination     = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

const columnas = [
  { key: 'estudiante',      label: 'Estudiante' },
  { key: 'modulo',          label: 'Módulo' },
  { key: 'profesor',        label: 'Profesor' },
  { key: 'nota_final',      label: 'Nota final' },
  { key: 'recuperacion',    label: 'Recuperación' },
  { key: 'nota_definitiva', label: 'Definitiva' },
  { key: 'estado',          label: 'Resultado' }
]

const opcionesCiclo = computed(() => opciones.ciclos.map(c => ({
  value: c.id,
  label: `${c.nombre}${c.notas_cerradas ? ' (cerrado)' : ''}`
})))
// Los grupos se acotan al profesor elegido
const opcionesGrupo = computed(() => opciones.grupos
  .filter(g => !filtros.profesor_id || String(g.profesor_id) === String(filtros.profesor_id))
  .map(g => ({ value: g.id, label: `${g.nombre} · ${g.modulo.nombre}` })))
const opcionesProfesor = computed(() => opciones.profesores.map(p => ({ value: p.id, label: p.name })))
const opcionesEstado   = computed(() => opciones.estados)

const tarjetasResumen = computed(() => [
  { label: 'Resultados',    valor: resumen.value.total,                  clase: 'text-slate-900' },
  { label: 'Aprobados',     valor: resumen.value.aprobados,              clase: 'text-green-700' },
  { label: 'Reprobados',    valor: resumen.value.reprobados,             clase: 'text-red-700' },
  { label: 'Por recuperar', valor: resumen.value.por_recuperar,          clase: 'text-amber-700' },
  { label: 'Promedio',      valor: formatoNota(resumen.value.promedio), clase: 'text-slate-900' }
])

async function cargar(pagina = 1) {
  error.value = ''
  if (!tieneAlcance(filtros)) {
    resultados.value = []
    resumen.value    = null
    return
  }
  cargando.value = true
  try {
    const res = await calificacionService.consolidado({ ...paramsConsolidado(filtros), page: pagina, per_page: 50 })
    resultados.value = (res.data ?? []).map(f => ({ ...f, clave: `${f.estudiante.id}-${f.grupo.id}` }))
    resumen.value    = res.meta.resumen
    sinEsquema.value = res.meta.sin_esquema ?? []
    pagination.currentPage = res.meta.current_page
    pagination.lastPage    = res.meta.last_page
    pagination.total       = res.meta.total
    pagination.from        = res.meta.from ?? 0
    pagination.to          = res.meta.to ?? 0
  } catch (e) {
    const errores = e?.response?.data?.errors
    error.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo consultar las notas.')
  } finally {
    cargando.value = false
  }
}

function onProfesorChange() {
  if (filtros.grupo_id && !opcionesGrupo.value.some(g => String(g.value) === String(filtros.grupo_id))) {
    filtros.grupo_id = ''
  }
  cargar(1)
}

let busquedaTimer = null
function onBusquedaInput() {
  clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(() => cargar(1), 400)
}

/** Sábana del estudiante: todos sus módulos, en cualquier ciclo, grupo o profesor. */
function verSabana(estudiante) {
  Object.assign(filtros, { ...FILTROS_VACIOS, profesor_id: profesorPropio.value, estudiante_id: estudiante.id })
  estudianteFijo.value = estudiante
  cargar(1)
}

function quitarEstudiante() {
  filtros.estudiante_id = ''
  estudianteFijo.value  = null
  cargar(1)
}

function limpiarFiltros() {
  Object.assign(filtros, { ...FILTROS_VACIOS, profesor_id: profesorPropio.value })
  estudianteFijo.value = null
  cargar(1)
}

function onCierreCambio() {
  cargarFiltros()
  cargar(pagination.currentPage)
}

const showRecuperacion = ref(false)
const filaRecuperacion = ref(null)

function abrirRecuperacion(fila) {
  filaRecuperacion.value = fila
  showRecuperacion.value = true
}

async function eliminarRecuperacion(fila) {
  if (!await confirm(`¿Eliminar la recuperación de ${fila.estudiante.name} en ${fila.modulo.nombre}? El módulo vuelve a quedar con su nota final.`)) return
  try {
    await calificacionService.eliminarRecuperacion(fila.recuperacion.id)
    notifySuccess('Recuperación eliminada.')
    cargar(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar la recuperación.')
  }
}

async function cargarFiltros() {
  try {
    const res = await calificacionService.getFiltros()
    Object.assign(opciones, {
      ciclos:     res.data?.ciclos ?? [],
      grupos:     res.data?.grupos ?? [],
      profesores: res.data?.profesores ?? [],
      estados:    res.data?.estados ?? []
    })
  } catch {
    // Sin opciones se puede seguir buscando por estudiante
  }
}

onMounted(async () => {
  loadPermisos().catch(() => {})
  esSoloProfesor.value = await authService.esSoloProfesor().catch(() => false)
  await cargarFiltros()
  // El profesor solo consulta sus grupos (el backend también lo limita)
  if (esSoloProfesor.value && opciones.profesores.length === 1) {
    profesorPropio.value = opciones.profesores[0].id
    filtros.profesor_id  = profesorPropio.value
  }
  cargar(1)
})
</script>
