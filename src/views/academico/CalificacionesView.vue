<template>
  <FormTabs v-model="vista" :tabs="vistas">
    <template #registro>
      <div class="flex flex-col gap-6">

        <!-- Selección del grupo -->
        <section aria-labelledby="calif-grupo-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
          <h2 id="calif-grupo-heading" class="sr-only">Grupo</h2>
          <div class="flex flex-wrap items-end gap-4">
            <div class="w-full sm:w-[360px]">
              <FormSelect
                v-model="grupoId"
                label="Grupo:"
                placeholder="Selecciona un grupo"
                :options="opcionesGrupo"
                help="Grupos con un ciclo vigente. Cada grupo dicta un solo módulo."
                @change="onGrupoChange"
              />
            </div>
            <label class="flex h-9 items-center gap-2 text-sm text-slate-700">
              <input v-model="soloMisGrupos" type="checkbox" class="size-4 rounded border-slate-300" :disabled="esSoloProfesor" @change="loadGrupos">
              Solo mis grupos
            </label>
          </div>
          <p v-if="!cargandoGrupos && !grupos.length" class="mt-3 text-sm text-slate-500">
            No hay grupos con ciclos vigentes{{ soloMisGrupos ? ' asignados a ti' : '' }}.
          </p>
        </section>

        <FormTabs v-if="grupoSeleccionado" v-model="tab" :tabs="tabs">
          <!-- ── Planilla de notas ─────────────────────────────────────────── -->
          <template #notas>
            <div v-if="cargandoSabana" class="py-12 text-center text-sm text-slate-500">Cargando planilla...</div>

            <div v-else-if="sinEsquema" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
              <p class="text-sm text-amber-800">
                El módulo <strong>{{ grupoSeleccionado.modulo?.nombre }}</strong> no tiene un esquema de calificación activo para este grupo.
              </p>
              <button
                v-if="can('aca_esquemaCrear')"
                type="button"
                class="mt-3 rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="abrirEsquema()"
              >
                Crear esquema para este grupo
              </button>
            </div>

            <div v-else-if="sabana" class="flex flex-col gap-4">
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/10 bg-white px-6 py-4">
                <div class="text-sm text-slate-600">
                  <p>
                    Esquema: <strong class="text-slate-900">{{ sabana.esquema_calificacion.nombre_esquema }}</strong>
                    · {{ sabana.estudiantes_con_notas }} de {{ sabana.total_estudiantes }} estudiantes con todas las notas
                  </p>
                  <p v-if="!sabana.esquema_calificacion.pesos_validos" class="mt-1 text-red-700">
                    Los pesos del esquema suman {{ sabana.esquema_calificacion.suma_pesos }} %: las notas finales quedarán descuadradas.
                  </p>
                </div>
                <button
                  v-if="can('aca_notaCrear')"
                  type="button"
                  :disabled="guardando || !hayCambios || hayInvalidas"
                  class="rounded-lg bg-[#213360] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="guardarNotas"
                >
                  {{ guardando ? 'Guardando...' : 'Guardar notas' }}
                </button>
              </div>

              <p v-if="estudiantesCerrados" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {{ estudiantesCerrados === sabana.estudiantes.length ? 'Las notas del ciclo están cerradas' : `${estudiantesCerrados} estudiante(s) tienen las notas de su ciclo cerradas` }}:
                no se pueden modificar. Para corregirlas, quien tenga permiso debe reabrir el ciclo desde la pestaña «Consulta de notas».
              </p>

              <div v-if="notasInvalidas.length" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p class="font-medium">Corrige {{ notasInvalidas.length === 1 ? 'la nota fuera de rango' : `las ${notasInvalidas.length} notas fuera de rango` }} para poder guardar:</p>
                <ul class="mt-1 list-disc pl-5 text-xs">
                  <li v-for="(texto, i) in notasInvalidas.slice(0, 5)" :key="i">{{ texto }}</li>
                  <li v-if="notasInvalidas.length > 5">y {{ notasInvalidas.length - 5 }} más (celdas en rojo).</li>
                </ul>
              </div>

              <div v-if="!sabana.estudiantes.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
                El grupo no tiene estudiantes con matrícula activa.
              </div>

              <div v-else class="overflow-x-auto rounded-[14px] border border-black/10 bg-white">
                <table class="w-full text-sm" aria-label="Planilla de notas">
                  <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th class="px-4 py-3">Estudiante</th>
                      <th v-for="tipo in tiposNota" :key="tipo.id" class="px-3 py-3 text-center">
                        {{ tipo.nombre_tipo }}
                        <span class="block font-normal normal-case text-slate-400">{{ tipo.peso }} % · {{ tipo.nota_minima }}–{{ tipo.nota_maxima }}</span>
                      </th>
                      <th class="px-4 py-3 text-center">Nota final</th>
                      <th class="px-4 py-3 text-center">Recuperación</th>
                      <th class="px-4 py-3 text-center">Resultado</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="fila in sabana.estudiantes" :key="fila.estudiante.id">
                      <td class="px-4 py-2">
                        <span class="font-medium text-slate-900">{{ fila.estudiante.name }}</span>
                        <span class="block text-xs text-slate-400">{{ fila.estudiante.documento }}</span>
                      </td>
                      <td v-for="tipo in tiposNota" :key="tipo.id" class="px-3 py-2 text-center">
                        <input
                          v-model="valores[fila.estudiante.id][tipo.id]"
                          type="text"
                          inputmode="decimal"
                          :disabled="!can('aca_notaCrear') || fila.notas_cerradas"
                          :aria-label="`${tipo.nombre_tipo} de ${fila.estudiante.name}`"
                          class="h-8 w-16 rounded-lg border px-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          :class="notaValida(valores[fila.estudiante.id][tipo.id], tipo) ? 'border-slate-200' : 'border-red-400 bg-red-50 text-red-700'"
                          :aria-invalid="!notaValida(valores[fila.estudiante.id][tipo.id], tipo)"
                          :title="notaValida(valores[fila.estudiante.id][tipo.id], tipo) ? '' : `Nota fuera de rango (${tipo.nota_minima}–${tipo.nota_maxima})`"
                        >
                      </td>
                      <td class="px-4 py-2 text-center">
                        <span class="font-semibold" :class="fila.completo ? 'text-slate-900' : 'text-slate-400'">
                          {{ formatoNota(fila.nota_final) }}
                        </span>
                        <span v-if="!fila.completo" class="block text-[10px] text-slate-400">parcial</span>
                      </td>
                      <td class="px-4 py-2 text-center">
                        <button
                          v-if="fila.puede_recuperar && can(fila.recuperacion ? 'aca_notaEditar' : 'aca_notaCrear')"
                          type="button"
                          class="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          :title="fila.recuperacion ? 'Editar recuperación' : 'Registrar recuperación'"
                          @click="abrirRecuperacion(fila)"
                        >
                          {{ fila.recuperacion ? formatoNota(fila.recuperacion.nota) : 'Registrar' }}
                        </button>
                        <span v-else>{{ fila.recuperacion ? formatoNota(fila.recuperacion.nota) : '—' }}</span>
                      </td>
                      <td class="px-4 py-2 text-center">
                        <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold" :class="estadoResultado(fila.estado).claseBadge">
                          {{ estadoResultado(fila.estado).label }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-slate-400">
                La nota final es la suma de las notas ponderadas y se recalcula al guardar. Una celda vacía no borra una nota ya registrada.
                Si un estudiante reprueba, la nota de recuperación reemplaza la final y define si aprueba el módulo.
              </p>
            </div>
          </template>

          <!-- ── Esquemas del módulo ───────────────────────────────────────── -->
          <template #esquemas>
            <div class="mb-4 flex items-center justify-between gap-3">
              <SectionHeader
                title="Esquemas de calificación"
                :description="`Esquemas del módulo ${grupoSeleccionado.modulo?.nombre ?? ''}. Uno ligado al grupo prevalece sobre el general del módulo.`"
              />
              <button
                v-if="can('aca_esquemaCrear')"
                type="button"
                class="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="abrirEsquema()"
              >
                <NavIcon name="plus" class="size-4" />
                Nuevo esquema
              </button>
            </div>

            <div v-if="cargandoEsquemas" class="py-8 text-center text-sm text-slate-500">Cargando esquemas...</div>
            <div v-else-if="!esquemas.length" class="rounded-[14px] border border-black/10 bg-white py-12 text-center text-sm text-slate-400">
              El módulo no tiene esquemas de calificación.
            </div>
            <DataTable v-else :columns="columnasEsquema" :data="esquemas" row-key="id" aria-label="Esquemas de calificación" actions-first>
              <template #cell="{ column, value, row }">
                <template v-if="column.key === 'nombre_esquema'">
                  <span class="font-medium text-slate-900">{{ value }}</span>
                </template>
                <template v-else-if="column.key === 'alcance'">
                  {{ row.grupo ? `Grupo ${row.grupo.nombre}` : 'Todo el módulo' }}
                </template>
                <template v-else-if="column.key === 'tipos'">
                  {{ (row.tipos_nota ?? []).map(t => `${t.nombre_tipo} ${t.peso}%`).join(' · ') }}
                </template>
                <template v-else-if="column.key === 'status'">
                  <StatusBadge :label="row.status_text" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
                </template>
                <template v-else>
                  {{ value ?? '—' }}
                </template>
              </template>
              <template #actions="{ row }">
                <button
                  v-if="can('aca_esquemaEditar') && puedeGestionarEsquema(row)"
                  type="button"
                  class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Editar esquema"
                  @click="abrirEsquema(row)"
                >
                  <NavIcon name="pencil" class="size-4" />
                </button>
                <button
                  v-if="can('aca_esquemaInactivar') && puedeGestionarEsquema(row)"
                  type="button"
                  class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Eliminar esquema"
                  @click="eliminarEsquema(row)"
                >
                  <NavIcon name="trash" class="size-4" />
                </button>
              </template>
            </DataTable>
          </template>
        </FormTabs>

        <!-- Modal: crear / editar esquema -->
        <ModalBase
          v-model="showEsquema"
          size="xl"
          :title="editandoEsquema ? 'Editar esquema' : 'Nuevo esquema de calificación'"
          description="Define los tipos de nota y su peso. Los pesos deben sumar 100 %."
        >
          <form class="flex flex-col gap-4 pb-2" @submit.prevent="guardarEsquema">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormInput v-model="formEsquema.nombre_esquema" label="Nombre" required :error="erroresEsquema.nombre_esquema?.[0]" />
              <FormSelect
                v-model="formEsquema.grupo_id"
                label="Aplica a"
                :options="opcionesAlcance"
                :error="erroresEsquema.grupo_id?.[0]"
                :hint="esSoloProfesor ? 'El esquema de todo el módulo lo define la coordinación.' : ''"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-slate-900">Tipos de nota</p>
                <span class="text-xs font-semibold" :class="pesosValidos(formEsquema.tipos_nota) ? 'text-green-700' : 'text-red-700'">
                  Suma de pesos: {{ sumaPesos(formEsquema.tipos_nota) }} %
                </span>
              </div>
              <div v-for="(tipo, i) in formEsquema.tipos_nota" :key="i" class="grid grid-cols-12 items-end gap-2">
                <div class="col-span-5"><FormInput v-model="tipo.nombre_tipo" :label="i === 0 ? 'Nombre' : ''" placeholder="Ej: Parcial" /></div>
                <div class="col-span-2"><FormInput v-model="tipo.peso" type="number" :label="i === 0 ? 'Peso %' : ''" min="0" max="100" step="0.01" /></div>
                <div class="col-span-2"><FormInput v-model="tipo.nota_minima" type="number" :label="i === 0 ? 'Mínima' : ''" min="0" step="0.1" /></div>
                <div class="col-span-2"><FormInput v-model="tipo.nota_maxima" type="number" :label="i === 0 ? 'Máxima' : ''" min="0" step="0.1" /></div>
                <button
                  type="button"
                  class="col-span-1 mb-1 rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Quitar tipo de nota"
                  :disabled="formEsquema.tipos_nota.length === 1"
                  @click="formEsquema.tipos_nota.splice(i, 1)"
                >
                  <NavIcon name="trash" class="size-4" />
                </button>
              </div>
              <button
                type="button"
                class="self-start rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="formEsquema.tipos_nota.push(tipoNotaVacio(formEsquema.tipos_nota.length + 1))"
              >
                + Agregar tipo de nota
              </button>
            </div>

            <div v-if="errorEsquema" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p class="text-sm text-red-700">{{ errorEsquema }}</p>
              <ul v-if="erroresEsquema.tipos_nota" class="mt-1 list-disc pl-5 text-sm text-red-700">
                <li v-for="msg in erroresEsquema.tipos_nota" :key="msg">{{ msg }}</li>
              </ul>
            </div>
          </form>

          <template #footer>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="showEsquema = false"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="guardandoEsquema || !pesosValidos(formEsquema.tipos_nota)"
              class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="guardarEsquema"
            >
              {{ guardandoEsquema ? 'Guardando...' : 'Guardar esquema' }}
            </button>
          </template>
        </ModalBase>

        <RecuperacionNotaModal v-model="showRecuperacion" :fila="filaRecuperacion" @guardado="loadSabana" />
      </div>
    </template>

    <!-- Consulta por estudiante, grupo, ciclo y profesor; recuperaciones y cierre por ciclo -->
    <template #consulta>
      <ConsultaNotas v-if="vistaConsultaAbierta" />
    </template>
  </FormTabs>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { authService } from '@/services/authService.js'
import grupoService        from '@/services/grupoService.js'
import calificacionService from '@/services/calificacionService.js'
import FormSelect          from '@/components/forms/FormSelect.vue'
import FormInput           from '@/components/forms/FormInput.vue'
import FormTabs            from '@/components/forms/FormTabs.vue'
import ModalBase           from '@/components/ModalBase.vue'
import SectionHeader       from '@/components/activos/SectionHeader.vue'
import DataTable           from '@/components/activos/DataTable.vue'
import StatusBadge         from '@/components/activos/StatusBadge.vue'
import NavIcon             from '@/components/icons/NavIcon.vue'
import ConsultaNotas         from '@/components/academico/ConsultaNotas.vue'
import RecuperacionNotaModal from '@/components/academico/RecuperacionNotaModal.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'
import {
  sumaPesos, pesosValidos, tipoNotaVacio, payloadEsquema,
  planillaDesdeSabana, notaValida, cambiosPorTipo, formatoNota, estadoResultado
} from '@/utils/calificaciones.js'

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

const vistas = [
  { value: 'registro', label: 'Registro por grupo' },
  { value: 'consulta', label: 'Consulta de notas' }
]
const vista = ref('registro')
// La consulta se carga la primera vez que se abre su pestaña y luego conserva sus filtros
const vistaConsultaAbierta = ref(false)
watch(vista, v => { if (v === 'consulta') vistaConsultaAbierta.value = true })

const tabs = [
  { value: 'notas',    label: 'Registrar notas' },
  { value: 'esquemas', label: 'Esquemas' }
]
const tab = ref('notas')

// ─── Grupos ────────────────────────────────────────────────────────────────────
const grupos         = ref([])
const grupoId        = ref('')
const soloMisGrupos  = ref(false)
// Quien solo es profesor solo ve sus grupos (el backend también lo limita, F11)
const esSoloProfesor = ref(false)
const cargandoGrupos = ref(false)

const grupoSeleccionado = computed(() => grupos.value.find(g => String(g.id) === String(grupoId.value)) ?? null)
const opcionesGrupo = computed(() => grupos.value.map(g => ({
  value: g.id,
  label: [g.nombre, g.modulo?.nombre, g.sede?.nombre].filter(Boolean).join(' · ')
})))

async function loadGrupos() {
  cargandoGrupos.value = true
  try {
    const res = await grupoService.getVigentes(soloMisGrupos.value ? { mis_grupos: 1 } : {})
    grupos.value = res.data ?? []
    if (grupoId.value && !grupoSeleccionado.value) grupoId.value = ''
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudieron cargar los grupos.')
  } finally {
    cargandoGrupos.value = false
  }
}

function onGrupoChange() {
  sabana.value   = null
  esquemas.value = []
  if (!grupoSeleccionado.value) return
  loadSabana()
  loadEsquemas()
}

// ─── Planilla (sábana grupal) ─────────────────────────────────────────────────
const sabana         = ref(null)
const sinEsquema     = ref(false)
const cargandoSabana = ref(false)
const valores        = ref({})
let   originales     = {}

const tiposNota   = computed(() => sabana.value?.esquema_calificacion?.tipos_nota ?? [])
const cambios     = computed(() => cambiosPorTipo(originales, valores.value))
const hayCambios  = computed(() => cambios.value.length > 0)
const hayInvalidas = computed(() => Object.values(valores.value).some(notas =>
  tiposNota.value.some(t => !notaValida(notas[t.id], t))
))

/** Notas fuera de rango, para explicar por qué no se puede guardar (F12). */
const notasInvalidas = computed(() => (sabana.value?.estudiantes ?? []).flatMap(fila =>
  tiposNota.value
    .filter(t => !notaValida(valores.value[fila.estudiante.id]?.[t.id], t))
    .map(t => `${fila.estudiante.name} · ${t.nombre_tipo}: "${valores.value[fila.estudiante.id][t.id]}" (debe estar entre ${t.nota_minima} y ${t.nota_maxima})`)
))

async function loadSabana() {
  cargandoSabana.value = true
  sinEsquema.value     = false
  try {
    const res = await calificacionService.sabanaGrupal(grupoSeleccionado.value.id, grupoSeleccionado.value.modulo.id)
    sabana.value  = res.data
    originales    = planillaDesdeSabana(res.data)
    valores.value = planillaDesdeSabana(res.data)
  } catch (e) {
    sabana.value = null
    if (e?.response?.status === 404) sinEsquema.value = true
    else notifyError(e?.response?.data?.message ?? 'No se pudo cargar la planilla de notas.')
  } finally {
    cargandoSabana.value = false
  }
}

/** Estudiantes con las notas de su ciclo cerradas: sus celdas quedan de solo lectura. */
const estudiantesCerrados = computed(() => (sabana.value?.estudiantes ?? []).filter(f => f.notas_cerradas).length)

// ─── Recuperación ─────────────────────────────────────────────────────────────
const showRecuperacion = ref(false)
const filaRecuperacion = ref(null)

/** La fila de la sábana grupal no trae grupo ni módulo: se toman del grupo elegido. */
function abrirRecuperacion(fila) {
  filaRecuperacion.value = { ...fila, grupo: grupoSeleccionado.value, modulo: grupoSeleccionado.value.modulo }
  showRecuperacion.value = true
}

const guardando = ref(false)

async function guardarNotas() {
  guardando.value = true
  const esquema = sabana.value.esquema_calificacion
  const rechazadas = []
  try {
    for (const { tipoId, notas } of cambios.value) {
      const res = await calificacionService.registrarNotas({
        grupo_id:                grupoSeleccionado.value.id,
        modulo_id:               grupoSeleccionado.value.modulo.id,
        esquema_calificacion_id: esquema.id,
        tipo_nota_esquema_id:    tipoId,
        notas
      })
      rechazadas.push(...(res.data?.detalle_errores ?? []))
    }
    if (rechazadas.length) notifyError(`${rechazadas.length} nota(s) no se guardaron: ${rechazadas[0].error}`)
    else notifySuccess('Notas guardadas.')
    await loadSabana()
  } catch (e) {
    const errores = e?.response?.data?.errors
    notifyError(errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudieron guardar las notas.'))
  } finally {
    guardando.value = false
  }
}

// ─── Esquemas ─────────────────────────────────────────────────────────────────
const esquemas         = ref([])
const cargandoEsquemas = ref(false)

const columnasEsquema = [
  { key: 'nombre_esquema', label: 'Esquema' },
  { key: 'alcance',        label: 'Aplica a' },
  { key: 'tipos',          label: 'Tipos de nota' },
  { key: 'status',         label: 'Estado' }
]

// El esquema general del módulo lo define la coordinación; el profesor, los de sus grupos (N16)
const opcionesAlcance = computed(() => [
  ...(esSoloProfesor.value ? [] : [{ value: '', label: 'Todo el módulo' }]),
  ...(grupoSeleccionado.value ? [{ value: grupoSeleccionado.value.id, label: `Solo el grupo ${grupoSeleccionado.value.nombre}` }] : [])
])

/** El profesor solo edita o elimina esquemas de sus grupos, no el general del módulo (N16). */
const puedeGestionarEsquema = (esquema) => !esSoloProfesor.value || !!esquema.grupo_id

async function loadEsquemas() {
  cargandoEsquemas.value = true
  try {
    const res = await calificacionService.getEsquemas({
      modulo_id: grupoSeleccionado.value.modulo.id,
      with:      'grupo,tiposNota',
      per_page:  100
    })
    esquemas.value = res.data ?? []
  } catch {
    esquemas.value = []
  } finally {
    cargandoEsquemas.value = false
  }
}

const showEsquema      = ref(false)
const editandoEsquema  = ref(null)
const guardandoEsquema = ref(false)
const errorEsquema     = ref('')
const erroresEsquema   = ref({})
const formEsquema      = reactive({ modulo_id: '', grupo_id: '', nombre_esquema: '', descripcion: '', tipos_nota: [] })

function abrirEsquema(esquema = null) {
  editandoEsquema.value = esquema
  errorEsquema.value    = ''
  erroresEsquema.value  = {}
  Object.assign(formEsquema, esquema
    ? {
        modulo_id:      esquema.modulo_id,
        grupo_id:       esquema.grupo_id ?? '',
        nombre_esquema: esquema.nombre_esquema,
        descripcion:    esquema.descripcion ?? '',
        tipos_nota:     (esquema.tipos_nota ?? []).map(t => ({ ...t, descripcion: t.descripcion ?? '' }))
      }
    : {
        modulo_id:      grupoSeleccionado.value.modulo.id,
        grupo_id:       grupoSeleccionado.value.id,
        nombre_esquema: '',
        descripcion:    '',
        tipos_nota:     [tipoNotaVacio(1)]
      })
  showEsquema.value = true
}

async function guardarEsquema() {
  guardandoEsquema.value = true
  errorEsquema.value     = ''
  erroresEsquema.value   = {}
  try {
    const payload = payloadEsquema(formEsquema)
    if (editandoEsquema.value) await calificacionService.updateEsquema(editandoEsquema.value.id, payload)
    else await calificacionService.createEsquema(payload)
    notifySuccess('Esquema guardado.')
    showEsquema.value = false
    await Promise.all([loadEsquemas(), loadSabana()])
  } catch (e) {
    if (e?.response?.status === 422) erroresEsquema.value = e.response.data?.errors ?? {}
    errorEsquema.value = e?.response?.data?.message ?? 'No se pudo guardar el esquema.'
  } finally {
    guardandoEsquema.value = false
  }
}

async function eliminarEsquema(esquema) {
  if (!await confirm(`¿Eliminar el esquema "${esquema.nombre_esquema}"?`)) return
  try {
    await calificacionService.deleteEsquema(esquema.id)
    notifySuccess('Esquema eliminado.')
    await Promise.all([loadEsquemas(), loadSabana()])
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar el esquema.')
  }
}

onMounted(async () => {
  loadPermisos().catch(() => {})
  esSoloProfesor.value = await authService.esSoloProfesor().catch(() => false)
  if (esSoloProfesor.value) soloMisGrupos.value = true
  loadGrupos()
})
</script>
