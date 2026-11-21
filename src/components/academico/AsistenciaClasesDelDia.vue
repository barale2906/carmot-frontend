<template>
  <section aria-labelledby="clases-dia-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="clases-dia-heading" class="text-base font-semibold text-slate-900">
          Hoy {{ nombreSedes ? `en ${nombreSedes}` : '' }}
        </h2>
        <p class="text-sm text-slate-500">{{ fechaLarga }} · {{ clases.length }} {{ clases.length === 1 ? 'clase' : 'clases' }} con asistencia por tomar</p>
      </div>
      <div v-if="sedes.length > 1" class="flex flex-wrap gap-2" role="group" aria-label="Sede">
        <button
          v-for="opcion in [{ id: '', nombre: 'Todas mis sedes' }, ...sedes]"
          :key="opcion.id"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          :class="String(sedeId) === String(opcion.id) ? 'border-[#213360] bg-[#213360] text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
          @click="cambiarSede(opcion.id)"
        >
          {{ opcion.nombre }}
        </button>
      </div>
    </div>

    <p v-if="error" class="mt-3 text-sm text-red-700">{{ error }}</p>
    <p v-else-if="cargando" class="mt-4 text-sm text-slate-500">Cargando clases de hoy...</p>
    <p v-else-if="!clases.length" class="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
      No hay clases con asistencia por tomar hoy. Usa «Otros grupos o fechas» para elegir un grupo manualmente.
    </p>

    <template v-else>
      <!-- Clase en la que se está registrando varios estudiantes seguidos -->
      <div v-if="claseFija" class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">
        <span>Registrando en: <strong>{{ etiquetaCorta(claseFija) }}</strong></span>
        <button type="button" class="text-xs font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500" @click="claseFijaId = null">
          Buscar en todas las clases
        </button>
      </div>

      <!-- Buscador de estudiante -->
      <div class="mt-4">
        <label for="buscar-estudiante" class="mb-1 block text-sm font-medium text-slate-700">Buscar estudiante</label>
        <input
          id="buscar-estudiante"
          ref="inputBusqueda"
          v-model="consulta"
          type="search"
          autocomplete="off"
          placeholder="Nombre o documento"
          class="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-md"
        >
        <ul v-if="consulta.trim() && coincidencias.length" class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 sm:max-w-2xl" role="list">
          <li v-for="item in coincidencias" :key="item.estudiante.id" class="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <div>
              <span class="font-medium text-slate-900">{{ item.estudiante.name }}</span>
              <span class="ml-2 text-xs text-slate-500">{{ item.estudiante.documento ?? '' }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="clase in item.clases"
                :key="clase.id"
                type="button"
                class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="seleccionar(item.estudiante, clase)"
              >
                {{ etiquetaCorta(clase) }}
              </button>
            </div>
          </li>
        </ul>
        <p v-else-if="consulta.trim()" class="mt-2 text-sm text-slate-500">
          Ningún estudiante con clase hoy coincide con «{{ consulta }}».
        </p>
      </div>

      <!-- Registro rápido del estudiante elegido -->
      <div v-if="seleccion" class="mt-4 rounded-lg border border-[#213360]/30 bg-slate-50 p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-semibold text-slate-900">{{ seleccion.estudiante.name }}</p>
            <p class="text-xs text-slate-500">{{ seleccion.estudiante.documento ?? '' }} · {{ etiquetaCorta(seleccion.clase) }}</p>
            <p v-if="esInvitado" class="mt-1 text-xs font-semibold text-blue-800">Es de otro grupo y toma esta clase por una reposición.</p>
          </div>
          <CarteraEstado :estudiante="datosCartera" />
        </div>

        <p v-if="registroPrevio" class="mt-2 text-xs text-amber-700">
          Ya tiene asistencia registrada en esta clase ({{ registroPrevio.estado }}); al guardar se corrige.
        </p>

        <div class="mt-3 flex flex-wrap items-center gap-3">
          <div class="flex gap-1" role="radiogroup" aria-label="Asistencia">
            <button
              v-for="estado in ESTADOS_ASISTENCIA"
              :key="estado.value"
              type="button"
              role="radio"
              :aria-checked="form.estado === estado.value"
              :title="estado.label"
              class="inline-flex h-9 items-center justify-center gap-1 rounded border border-slate-200 px-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="form.estado === estado.value ? estado.clase : estado.claseInactiva"
              @click="form.estado = estado.value"
            >
              {{ estado.label }}
            </button>
          </div>
          <label v-if="admiteJustificacion(form.estado)" class="flex items-center gap-1.5 text-sm text-slate-700">
            <input v-model="form.justificada" type="checkbox" class="size-4 rounded border-slate-300">
            Justificada
          </label>
          <input
            v-if="form.justificada && admiteJustificacion(form.estado)"
            v-model="form.justificacion"
            type="text"
            maxlength="500"
            placeholder="Motivo (obligatorio)"
            aria-label="Motivo de la justificación"
            class="h-9 min-w-[220px] flex-1 rounded-lg border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
          <input
            v-model="form.observaciones"
            type="text"
            placeholder="Observaciones (opcional)"
            aria-label="Observaciones"
            class="h-9 min-w-[200px] flex-1 rounded-lg border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>

        <div class="mt-3 flex gap-2">
          <button
            type="button"
            :disabled="guardando || !puedeRegistrar"
            class="rounded-lg bg-[#213360] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="guardar"
          >
            {{ guardando ? 'Guardando...' : 'Registrar asistencia' }}
          </button>
          <button type="button" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="cancelarSeleccion">
            Cancelar
          </button>
        </div>
      </div>

      <!-- Historial: última clase en la que se registró, para seguir con otros estudiantes -->
      <div v-if="historial.length" class="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-green-800">Última clase registrada</p>
            <p class="text-sm font-medium text-green-900">{{ etiquetaCorta(historial[0].clase) }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            @click="registrarOtroEn(historial[0].clase)"
          >
            Registrar a otro estudiante en esta clase
          </button>
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-green-900" role="list">
          <li v-for="(registro, i) in historial.slice(0, 5)" :key="i">
            {{ registro.hora }} · {{ registro.estudiante.name }} ·
            <span class="font-semibold">{{ registro.estadoLabel }}</span>
          </li>
        </ul>
      </div>

      <!-- Clases de hoy -->
      <ul class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
        <li v-for="clase in clases" :key="clase.id">
          <article
            class="flex h-full flex-col justify-between gap-3 rounded-xl border p-4 transition-colors"
            :class="claseFijaId === clase.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'"
          >
            <div>
              <p class="text-sm font-semibold text-[#213360]">{{ rangoHoras(clase) }}</p>
              <p class="mt-0.5 font-medium text-slate-900">{{ clase.curso?.nombre ?? clase.grupo.nombre }}</p>
              <p class="text-sm text-slate-600">{{ [clase.grupo.nombre, clase.modulo?.nombre].filter(Boolean).join(' · ') }}</p>
              <p v-if="clase.sede && sedes.length !== 1" class="text-xs text-slate-500">{{ clase.sede.nombre }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-slate-500">
                {{ clase.asistencias_registradas }} / {{ clase.estudiantes.length }} registrados
              </span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="registrarOtroEn(clase)"
                >
                  Buscar en esta clase
                </button>
                <button
                  type="button"
                  class="rounded-lg bg-[#213360] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="emit('abrir-planilla', clase)"
                >
                  Planilla completa
                </button>
              </div>
            </div>
          </article>
        </li>
      </ul>
    </template>
  </section>
</template>

<script setup>
/**
 * Entrada rápida de la toma de asistencia: las clases de hoy en la(s) sede(s) del usuario como tarjetas,
 * un buscador de estudiante (nombre o documento) para registrarle la asistencia sin buscar el grupo,
 * y el historial de la última clase registrada para seguir con otros estudiantes de la misma clase.
 *
 * Emite `abrir-planilla` con la clase elegida (el padre muestra la planilla completa del grupo) y
 * `registrada` tras guardar, por si el padre debe refrescar algo.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import asistenciaService from '@/services/asistenciaService.js'
import CarteraEstado     from '@/components/academico/CarteraEstado.vue'
import { useNotification } from '@/composables/useNotification'
import { fechaISO } from '@/utils/crm.js'
import {
  ESTADOS_ASISTENCIA, admiteJustificacion, rangoHoras, buscarEstudiantesEnClases, estudiantesConInvitados
} from '@/utils/asistencia.js'

defineProps({
  puedeRegistrar: { type: Boolean, default: false }
})
const emit = defineEmits(['abrir-planilla', 'registrada'])

const { success: notifySuccess, error: notifyError } = useNotification()

const MAX_COINCIDENCIAS = 8

const clases   = ref([])
const sedes    = ref([])
const sedeId   = ref('')
const cargando = ref(false)
const error    = ref('')

const nombreSedes = computed(() => {
  if (sedeId.value) return sedes.value.find(s => String(s.id) === String(sedeId.value))?.nombre ?? ''
  if (sedes.value.length) return sedes.value.map(s => s.nombre).join(', ')
  // Un profesor no tiene sedes asignadas: se toma la de sus clases
  return [...new Set(clases.value.map(c => c.sede?.nombre).filter(Boolean))].join(', ')
})

const fechaLarga = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function etiquetaCorta(clase) {
  return `${rangoHoras(clase)} · ${clase.curso?.nombre ?? clase.grupo.nombre} (${clase.grupo.nombre})`
}

async function cargar() {
  cargando.value = true
  error.value    = ''
  try {
    const res = await asistenciaService.clasesDelDia({ fecha: fechaISO(), ...(sedeId.value ? { sede_id: sedeId.value } : {}) })
    // Los invitados por reposición se buscan y se registran como cualquier estudiante de la clase
    clases.value = (res.data?.clases ?? []).map(c => ({ ...c, estudiantes: estudiantesConInvitados(c.estudiantes, c.invitados) }))
    sedes.value  = res.data?.sedes ?? []
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudieron cargar las clases de hoy.'
  } finally {
    cargando.value = false
  }
}

function cambiarSede(id) {
  sedeId.value = id
  claseFijaId.value = null
  cancelarSeleccion()
  cargar()
}

// ─── Búsqueda ─────────────────────────────────────────────────────────────────
const consulta     = ref('')
const inputBusqueda = ref(null)
const claseFijaId  = ref(null)
const claseFija    = computed(() => clases.value.find(c => c.id === claseFijaId.value) ?? null)

const coincidencias = computed(() =>
  buscarEstudiantesEnClases(claseFija.value ? [claseFija.value] : clases.value, consulta.value).slice(0, MAX_COINCIDENCIAS)
)

function registrarOtroEn(clase) {
  claseFijaId.value = clase.id
  cancelarSeleccion()
  consulta.value = ''
  inputBusqueda.value?.focus()
}

// ─── Registro del estudiante elegido ──────────────────────────────────────────
const seleccion     = ref(null)
const registroPrevio = ref(null)
const datosCartera  = ref(null)
const guardando     = ref(false)
const form = reactive({ estado: 'presente', justificada: false, justificacion: '', observaciones: '' })

// Mora y transferencias salen de la lista del grupo; se piden una vez por grupo.
const listasPorGrupo = new Map()

async function datosDeGrupo(grupoId) {
  if (!listasPorGrupo.has(grupoId)) {
    const res = await asistenciaService.listaAsistencia(grupoId)
    listasPorGrupo.set(grupoId, res.data ?? null)
  }
  return listasPorGrupo.get(grupoId)
}

function reiniciarFormulario() {
  Object.assign(form, { estado: 'presente', justificada: false, justificacion: '', observaciones: '' })
}

async function seleccionar(estudiante, clase) {
  seleccion.value      = { estudiante, clase }
  registroPrevio.value = null
  datosCartera.value   = null
  reiniciarFormulario()
  try {
    const [previas, lista] = await Promise.all([
      asistenciaService.getByClase(clase.id),
      datosDeGrupo(clase.grupo.id)
    ])
    registroPrevio.value = (previas.data ?? []).find(a => a.estudiante_id === estudiante.id) ?? null
    datosCartera.value   = lista?.estudiantes?.find(e => e.id === estudiante.id) ?? null
    if (registroPrevio.value) {
      Object.assign(form, {
        estado:        registroPrevio.value.estado,
        justificada:   !!registroPrevio.value.justificada,
        justificacion: registroPrevio.value.justificacion ?? '',
        observaciones: registroPrevio.value.observaciones ?? ''
      })
    }
  } catch {
    // La mora y el registro previo son informativos: no se bloquea el registro
  }
}

function cancelarSeleccion() {
  seleccion.value = null
  registroPrevio.value = null
  datosCartera.value = null
}

// Una persona puede ser de un grupo y estar invitada a la clase de otro: se mira la clase elegida
const esInvitado = computed(() => !!seleccion.value?.clase.invitados?.some(i => i.id === seleccion.value.estudiante.id))

const historial = ref([])

async function guardar() {
  const { estudiante, clase } = seleccion.value
  const justificada = form.justificada && admiteJustificacion(form.estado)
  if (justificada && !form.justificacion.trim()) {
    notifyError('Indica el motivo de la justificación.')
    return
  }
  guardando.value = true
  try {
    const res = await asistenciaService.registrarClase(clase.id, [{
      estudiante_id: estudiante.id,
      estado:        form.estado,
      justificada,
      justificacion: justificada ? form.justificacion.trim() : null,
      observaciones: form.observaciones.trim() || null
    }])
    notifySuccess(res.message ?? 'Asistencia registrada.')
    historial.value.unshift({
      estudiante,
      clase,
      estadoLabel: ESTADOS_ASISTENCIA.find(e => e.value === form.estado)?.label,
      hora:        new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    })
    historial.value = historial.value.slice(0, 20)
    cancelarSeleccion()
    consulta.value = ''
    inputBusqueda.value?.focus()
    emit('registrada', clase)
    await cargar()
  } catch (e) {
    const errores = e?.response?.data?.errors
    notifyError(errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo guardar la asistencia.'))
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>
