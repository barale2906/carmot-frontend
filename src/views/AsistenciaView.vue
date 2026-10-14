<template>
  <div class="flex flex-col gap-6">

    <!-- Selección de grupo y clase -->
    <section aria-labelledby="asistencia-seleccion-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="asistencia-seleccion-heading" class="sr-only">Grupo y clase</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[320px]">
          <FormSelect
            v-model="grupoId"
            label="Grupo:"
            placeholder="Selecciona un grupo"
            :options="opcionesGrupo"
            help="Grupos con un ciclo vigente."
            @change="onGrupoChange"
          />
        </div>
        <label class="flex h-9 items-center gap-2 text-sm text-slate-700">
          <input v-model="soloMisGrupos" type="checkbox" class="size-4 rounded border-slate-300" @change="loadGrupos">
          Solo mis grupos
        </label>
        <div v-if="lista?.clases_programadas?.length" class="w-full sm:w-[340px]">
          <FormSelect
            v-model="claseId"
            label="Clase:"
            placeholder="Selecciona la clase"
            :options="opcionesClase"
            @change="onClaseChange"
          />
        </div>
      </div>

      <p v-if="errorGrupos" class="mt-3 text-sm text-red-700">{{ errorGrupos }}</p>
      <p v-else-if="!cargandoGrupos && !grupos.length" class="mt-3 text-sm text-slate-500">
        No hay grupos con ciclos vigentes{{ soloMisGrupos ? ' asignados a ti' : '' }}.
      </p>
    </section>

    <div v-if="cargandoLista" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
      <span class="text-sm text-slate-500">Cargando lista del grupo...</span>
    </div>

    <template v-else-if="lista">
      <!-- Grupo sin clases programadas -->
      <div v-if="!lista.clases_programadas?.length" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
        <p class="text-sm text-amber-800">
          Este grupo todavía no tiene clases programadas en sus ciclos vigentes.
        </p>
        <div v-if="can('aca_claseProgramar')" class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="ciclo in lista.ciclos"
            :key="ciclo.id"
            type="button"
            :disabled="generando"
            class="rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="generarClases(ciclo)"
          >
            {{ generando ? 'Generando...' : `Generar clases de ${ciclo.nombre}` }}
          </button>
        </div>
        <p v-else class="mt-2 text-xs text-amber-700">Pide a coordinación académica que genere el calendario de clases.</p>
      </div>

      <FormTabs v-else v-model="tab" :tabs="tabs">
        <!-- Toma de asistencia -->
        <template #toma>
          <div v-if="!lista.estudiantes?.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
            El grupo no tiene estudiantes con matrícula activa.
          </div>

          <div v-else class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/10 bg-white px-6 py-4">
              <ul class="flex flex-wrap gap-3 text-sm" role="list">
                <li v-for="estado in ESTADOS_ASISTENCIA" :key="estado.value" class="flex items-center gap-1.5">
                  <span class="inline-flex size-6 items-center justify-center rounded text-xs font-semibold" :class="estado.clase">{{ estado.corto }}</span>
                  <span class="text-slate-600">{{ estado.label }}: <strong>{{ resumen[estado.value] }}</strong></span>
                </li>
              </ul>
              <div v-if="puedeRegistrar && !claseFutura" class="flex gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="marcarTodos('presente')"
                >
                  Todos presentes
                </button>
                <button
                  type="button"
                  :disabled="guardando || !planilla.length"
                  class="rounded-lg bg-[#213360] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="guardar"
                >
                  {{ guardando ? 'Guardando...' : (yaRegistrada ? 'Guardar corrección' : 'Guardar asistencia') }}
                </button>
              </div>
            </div>

            <p v-if="claseFutura" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Esta clase aún no ocurre: la asistencia se podrá registrar desde el día de la clase.
            </p>

            <p v-if="yaRegistrada" class="text-xs text-slate-500">
              Esta clase ya tiene asistencia registrada; al guardar se corrige el registro existente.
            </p>

            <div class="overflow-x-auto rounded-[14px] border border-black/10 bg-white">
              <table class="w-full text-sm" aria-label="Planilla de asistencia">
                <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Asistencia</th>
                    <th class="px-4 py-3">Estudiante</th>
                    <th class="px-4 py-3">Documento</th>
                    <th class="px-4 py-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="fila in planilla" :key="fila.estudiante_id">
                    <td class="px-4 py-2">
                      <div class="flex gap-1" role="radiogroup" :aria-label="`Asistencia de ${estudiantesMap[fila.estudiante_id]?.name}`">
                        <button
                          v-for="estado in ESTADOS_ASISTENCIA"
                          :key="estado.value"
                          type="button"
                          role="radio"
                          :aria-checked="fila.estado === estado.value"
                          :title="estado.label"
                          :disabled="!puedeRegistrar || claseFutura"
                          class="inline-flex size-8 items-center justify-center rounded border border-slate-200 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                          :class="fila.estado === estado.value ? estado.clase : estado.claseInactiva"
                          @click="fila.estado = estado.value"
                        >
                          {{ estado.corto }}
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-2">
                      <span class="font-medium text-slate-900">{{ estudiantesMap[fila.estudiante_id]?.name }}</span>
                      <span v-if="!fila.guardada" class="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">sin registrar</span>
                    </td>
                    <td class="px-4 py-2 text-slate-600">{{ estudiantesMap[fila.estudiante_id]?.documento ?? '—' }}</td>
                    <td class="px-4 py-2">
                      <input
                        v-model="fila.observaciones"
                        type="text"
                        :disabled="!puedeRegistrar || claseFutura"
                        placeholder="Opcional (ej. motivo de la justificación)"
                        class="h-8 w-full min-w-[200px] rounded-lg border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Reporte del grupo -->
        <template #reporte>
          <SectionHeader
            title="Asistencia acumulada del grupo"
            :description="`Porcentaje por horas asistidas (presente, tardanza y justificado cuentan). Mínimo de referencia: ${PORCENTAJE_MINIMO_DEFECTO} %.`"
            class="mb-4"
          />
          <div v-if="cargandoReporte" class="py-8 text-center text-sm text-slate-500">Cargando reporte...</div>
          <div v-else-if="!reporte.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
            Aún no hay asistencias registradas en este grupo.
          </div>
          <DataTable v-else :columns="columnasReporte" :data="reporte" row-key="id" aria-label="Reporte de asistencia del grupo">
            <template #cell="{ column, value, row }">
              <template v-if="column.key === 'porcentaje_asistencia'">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                  :class="value < PORCENTAJE_MINIMO_DEFECTO ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'"
                >
                  {{ value }} %
                </span>
              </template>
              <template v-else-if="column.key === 'horas'">
                {{ row.horas_asistidas }} / {{ row.horas_totales }} h
              </template>
              <template v-else>
                {{ value ?? '—' }}
              </template>
            </template>
          </DataTable>
        </template>
      </FormTabs>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import asistenciaService from '@/services/asistenciaService.js'
import cicloService      from '@/services/cicloService.js'
import grupoService      from '@/services/grupoService.js'
import FormSelect        from '@/components/forms/FormSelect.vue'
import FormTabs          from '@/components/forms/FormTabs.vue'
import SectionHeader     from '@/components/activos/SectionHeader.vue'
import DataTable         from '@/components/activos/DataTable.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification'
import { fechaISO } from '@/utils/crm.js'
import {
  ESTADOS_ASISTENCIA, PORCENTAJE_MINIMO_DEFECTO,
  claseSugerida, esClaseFutura, construirPlanilla, resumenPlanilla, payloadPlanilla, etiquetaClase
} from '@/utils/asistencia.js'

const { can, loadPermisos } = usePermisos()
const { success: notifySuccess, error: notifyError } = useNotification()

const puedeRegistrar = computed(() => can('aca_asistenciaCrear'))

const tabs = [
  { value: 'toma',    label: 'Tomar asistencia' },
  { value: 'reporte', label: 'Reporte del grupo' }
]
const tab = ref('toma')

// ─── Grupos ────────────────────────────────────────────────────────────────────
const grupos         = ref([])
const grupoId        = ref('')
const soloMisGrupos  = ref(false)
const cargandoGrupos = ref(false)
const errorGrupos    = ref('')

const opcionesGrupo = computed(() => grupos.value.map(g => ({
  value: g.id,
  label: [g.nombre, g.modulo?.nombre, g.sede?.nombre].filter(Boolean).join(' · ')
})))

async function loadGrupos() {
  cargandoGrupos.value = true
  errorGrupos.value    = ''
  try {
    const res = await grupoService.getVigentes(soloMisGrupos.value ? { mis_grupos: 1 } : {})
    grupos.value = res.data ?? []
    if (grupoId.value && !grupos.value.some(g => String(g.id) === String(grupoId.value))) {
      grupoId.value = ''
      lista.value   = null
    }
  } catch (e) {
    errorGrupos.value = e?.response?.data?.message ?? 'No se pudieron cargar los grupos.'
  } finally {
    cargandoGrupos.value = false
  }
}

// ─── Lista del grupo y clase ──────────────────────────────────────────────────
const lista         = ref(null)
const cargandoLista = ref(false)
const claseId       = ref('')
const planilla      = ref([])
const generando     = ref(false)

const estudiantesMap = computed(() => Object.fromEntries((lista.value?.estudiantes ?? []).map(e => [e.id, e])))
const opcionesClase  = computed(() => (lista.value?.clases_programadas ?? []).map(c => ({ value: c.id, label: etiquetaClase(c) })))
const claseActual    = computed(() => lista.value?.clases_programadas?.find(c => String(c.id) === String(claseId.value)) ?? null)
const claseFutura    = computed(() => esClaseFutura(claseActual.value, fechaISO()))
const resumen        = computed(() => resumenPlanilla(planilla.value))
const yaRegistrada   = computed(() => planilla.value.some(f => f.guardada))

async function onGrupoChange() {
  lista.value    = null
  claseId.value  = ''
  planilla.value = []
  reporte.value  = []
  if (!grupoId.value) return
  cargandoLista.value = true
  try {
    const res = await asistenciaService.listaAsistencia(grupoId.value)
    lista.value = res.data ?? null
    const sugerida = claseSugerida(lista.value?.clases_programadas, fechaISO())
    claseId.value = sugerida ? sugerida.id : ''
    await Promise.all([onClaseChange(), loadReporte()])
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo cargar la lista del grupo.')
  } finally {
    cargandoLista.value = false
  }
}

async function onClaseChange() {
  planilla.value = []
  if (!claseId.value) return
  try {
    const res = await asistenciaService.getByClase(claseId.value)
    planilla.value = construirPlanilla(lista.value?.estudiantes, res.data)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo cargar la asistencia de la clase.')
  }
}

function marcarTodos(estado) {
  planilla.value.forEach(f => { f.estado = estado })
}

const guardando = ref(false)

async function guardar() {
  guardando.value = true
  try {
    const res = await asistenciaService.registrarClase(Number(claseId.value), payloadPlanilla(planilla.value))
    notifySuccess(res.message ?? 'Asistencia registrada.')
    planilla.value.forEach(f => { f.guardada = true })
    // La clase pasa a "dictada": se refresca la lista para reflejar su estado y el reporte.
    const actualizada = await asistenciaService.listaAsistencia(grupoId.value)
    lista.value = actualizada.data ?? lista.value
    loadReporte()
  } catch (e) {
    const errores = e?.response?.data?.errors
    notifyError(errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo guardar la asistencia.'))
  } finally {
    guardando.value = false
  }
}

async function generarClases(ciclo) {
  generando.value = true
  try {
    const res = await cicloService.generarClasesProgramadas(Number(grupoId.value), ciclo.id)
    notifySuccess(res.message ?? 'Clases generadas.')
    await onGrupoChange()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudieron generar las clases.')
  } finally {
    generando.value = false
  }
}

// ─── Reporte ──────────────────────────────────────────────────────────────────
const reporte         = ref([])
const cargandoReporte = ref(false)

const columnasReporte = [
  { key: 'nombre',                label: 'Estudiante' },
  { key: 'total_clases',          label: 'Clases registradas' },
  { key: 'presentes',             label: 'Presente' },
  { key: 'horas',                 label: 'Horas asistidas' },
  { key: 'porcentaje_asistencia', label: 'Asistencia' }
]

async function loadReporte() {
  if (!grupoId.value) return
  cargandoReporte.value = true
  try {
    const res = await asistenciaService.reporteGrupo(grupoId.value)
    reporte.value = (res.data?.estudiantes ?? []).map(e => ({ ...e, id: e.estudiante.id, nombre: e.estudiante.name }))
  } catch {
    reporte.value = []
  } finally {
    cargandoReporte.value = false
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  loadGrupos()
})
</script>
