<template>
  <ModalBase
    :model-value="modelValue"
    size="lg"
    title="Reposición de clase"
    description="El estudiante toma una clase de su grupo en otro grupo de su curso, la misma semana y con el mismo módulo. Al registrarla se notifica al instituto."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-5 pb-2" @submit.prevent="guardar">
      <!-- Estudiante -->
      <div v-if="!estudianteFijo">
        <div v-if="estudiante" class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
          <div>
            <p class="font-medium text-slate-900">{{ estudiante.name }}</p>
            <p class="text-xs text-slate-500">{{ estudiante.documento ?? '' }}</p>
          </div>
          <button type="button" class="text-xs font-medium text-slate-600 underline focus:outline-none focus:ring-2 focus:ring-blue-500" @click="quitarEstudiante">
            Cambiar
          </button>
        </div>
        <template v-else>
          <FormInputSearch v-model="busqueda" label="Estudiante" placeholder="Nombre o documento..." required span="full" />
          <p v-if="buscando" class="mt-2 text-xs text-slate-500">Buscando...</p>
          <ul v-else-if="resultados.length" class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200" role="list">
            <li v-for="e in resultados" :key="e.id">
              <button type="button" class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="elegirEstudiante(e)">
                <span class="font-medium text-slate-900">{{ e.name }}</span>
                <span class="text-xs text-slate-500">{{ e.documento ?? '' }}</span>
              </button>
            </li>
          </ul>
          <p v-else-if="busqueda.trim().length >= 3" class="mt-2 text-xs text-slate-500">Ningún estudiante coincide.</p>
        </template>
      </div>

      <template v-if="estudiante">
        <FormInput v-model="fecha" type="date" label="Semana de la clase" help="Elige cualquier día de la semana en la que está la clase." @change="cargarOpciones" />

        <p v-if="cargando" class="text-sm text-slate-500">Buscando clases de la semana...</p>
        <p v-else-if="!opciones.length" class="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          El estudiante no tiene clases programadas en esa semana.
        </p>

        <!-- Clase de su grupo que no tomará -->
        <fieldset v-else class="flex flex-col gap-2">
          <legend class="mb-1 text-sm font-medium text-slate-900">Clase que no tomará en su grupo</legend>
          <label
            v-for="op in opciones"
            :key="op.origen.id"
            class="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm"
            :class="[origenId === op.origen.id ? 'border-[#213360] bg-slate-50' : 'border-slate-200', op.reposicion_id ? 'cursor-not-allowed opacity-60' : '']"
          >
            <input v-model="origenId" type="radio" name="clase-origen" class="mt-0.5" :value="op.origen.id" :disabled="!!op.reposicion_id" @change="destinoId = ''">
            <span>
              {{ etiquetaClaseReposicion(op.origen) }}
              <span v-if="op.reposicion_id" class="ml-1 text-xs text-amber-700">· ya tiene una reposición</span>
              <span v-else-if="!op.destinos.length" class="ml-1 text-xs text-slate-500">· no hay clases equivalentes en otros grupos</span>
            </span>
          </label>
        </fieldset>

        <!-- Clase de otro grupo en la que la tomará -->
        <FormSelect
          v-if="origenSeleccionado?.destinos.length"
          v-model="destinoId"
          label="Clase en la que la tomará"
          placeholder="Selecciona la clase"
          required
          :options="opcionesDestino"
          :error="errores.clase_destino_id?.[0]"
        />
        <FormTextarea v-if="origenSeleccionado?.destinos.length" v-model="motivo" label="Motivo (opcional)" :rows="2" />
      </template>

      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando || !origenId || !destinoId"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Registrando...' : 'Registrar reposición' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
/**
 * Registro de una reposición: se elige el estudiante, la clase de su grupo que no tomará (de la semana
 * elegida) y la clase equivalente de otro grupo. Las opciones válidas las arma el backend
 * (misma semana, mismo curso y mismo módulo). Emite `guardada` tras registrarla.
 *
 * `estudianteFijo` (`{ id, name }`) salta la búsqueda: es el caso de un alumno que pide la suya.
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import ModalBase        from '@/components/ModalBase.vue'
import FormInput        from '@/components/forms/FormInput.vue'
import FormInputSearch  from '@/components/forms/FormInputSearch.vue'
import FormSelect       from '@/components/forms/FormSelect.vue'
import FormTextarea     from '@/components/forms/FormTextarea.vue'
import reposicionService from '@/services/reposicionService.js'
import estudianteService from '@/services/estudianteService.js'
import { useNotification } from '@/composables/useNotification'
import { fechaISO } from '@/utils/crm.js'
import { etiquetaClaseReposicion } from '@/utils/asistencia.js'

const props = defineProps({
  modelValue:     { type: Boolean, default: false },
  estudianteFijo: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'guardada'])

const { success: notifySuccess } = useNotification()

const busqueda   = ref('')
const resultados = ref([])
const buscando   = ref(false)
const estudiante = ref(null)
const fecha      = ref(fechaISO())
const opciones   = ref([])
const cargando   = ref(false)
const origenId   = ref('')
const destinoId  = ref('')
const motivo     = ref('')
const guardando  = ref(false)
const error      = ref('')
const errores    = ref({})

const origenSeleccionado = computed(() => opciones.value.find(o => o.origen.id === origenId.value) ?? null)
const opcionesDestino    = computed(() => (origenSeleccionado.value?.destinos ?? []).map(d => ({ value: d.id, label: etiquetaClaseReposicion(d) })))

function reiniciar() {
  busqueda.value = ''
  resultados.value = []
  estudiante.value = props.estudianteFijo
  fecha.value = fechaISO()
  opciones.value = []
  origenId.value = ''
  destinoId.value = ''
  motivo.value = ''
  error.value = ''
  errores.value = {}
  if (estudiante.value) cargarOpciones()
}

watch(() => props.modelValue, abierto => { if (abierto) reiniciar() })

let timer = null
watch(busqueda, () => {
  clearTimeout(timer)
  if (busqueda.value.trim().length < 3) { resultados.value = []; return }
  timer = setTimeout(async () => {
    buscando.value = true
    try {
      const res = await estudianteService.buscar({ search: busqueda.value.trim(), per_page: 8 })
      resultados.value = res.data ?? []
    } catch {
      resultados.value = []
    } finally {
      buscando.value = false
    }
  }, 350)
})
onBeforeUnmount(() => clearTimeout(timer))

function elegirEstudiante(e) {
  estudiante.value = e
  resultados.value = []
  cargarOpciones()
}

function quitarEstudiante() {
  estudiante.value = null
  opciones.value = []
  origenId.value = ''
  destinoId.value = ''
}

async function cargarOpciones() {
  if (!estudiante.value || !fecha.value) return
  cargando.value = true
  error.value = ''
  origenId.value = ''
  destinoId.value = ''
  try {
    const res = await reposicionService.opciones(estudiante.value.id, fecha.value)
    opciones.value = res.data ?? []
  } catch (e) {
    opciones.value = []
    error.value = e?.response?.data?.message ?? 'No se pudieron cargar las clases de la semana.'
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  if (!origenId.value || !destinoId.value) return
  guardando.value = true
  error.value = ''
  errores.value = {}
  try {
    const res = await reposicionService.crear({
      estudiante_id:    estudiante.value.id,
      clase_origen_id:  origenId.value,
      clase_destino_id: destinoId.value,
      motivo:           motivo.value.trim() || null
    })
    notifySuccess(res.message ?? 'Reposición registrada.')
    emit('guardada')
    emit('update:modelValue', false)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    error.value = Object.values(errores.value).flat()[0] ?? e?.response?.data?.message ?? 'No se pudo registrar la reposición.'
  } finally {
    guardando.value = false
  }
}
</script>
