<template>
  <ModalBase
    v-model="visible"
    :title="ciclo ? `Clonar ciclo: ${ciclo.nombre}` : 'Clonar ciclo'"
    description="Crea una nueva cohorte con los mismos grupos. Las fechas se recalculan desde la fecha de inicio elegida."
    size="lg"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="copy" class="size-5" />
      </span>
    </template>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="text-sm text-slate-500">Cargando sugerencia...</span>
    </div>

    <div v-else-if="loadError" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ loadError }}
    </div>

    <form v-else-if="sugerencia" id="form-clonar-ciclo" class="space-y-4 pb-4" @submit.prevent="submit">
      <p class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        El ciclo original termina el <strong>{{ formatFechaCorta(sugerencia.fecha_terminacion_origen) }}</strong>.
        Se dicta los <strong>{{ sugerencia.dias_clase.join(', ') }}</strong>.
      </p>

      <FormInput
        v-model="form.fecha_inicio"
        type="date"
        label="Fecha de inicio"
        required
        :min="sugerencia.fecha_minima"
        :error="errorFecha"
        hint="Debe ser un día de clase laborable posterior a la finalización del ciclo original."
        @update:model-value="onFechaInicio"
      />

      <FormInput
        v-model="form.nombre"
        label="Nombre"
        :placeholder="`${ciclo?.nombre ?? ''} (copia)`"
        :error="firstError('nombre')"
        hint="Opcional. Si se deja vacío se genera automáticamente."
      />

      <FormInput
        v-if="esFechaFinFija"
        v-model="form.fecha_fin"
        type="date"
        label="Fecha de fin"
        :min="form.fecha_inicio"
        :error="firstError('fecha_fin')"
        hint="Por defecto se conserva la duración del ciclo original."
        @update:model-value="finEditada = true"
      />

      <!-- Errores de la fecha de inicio: puede haber varios solapamientos -->
      <div v-if="erroresFecha.length > 1" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <ul class="list-inside list-disc space-y-0.5">
          <li v-for="msg in erroresFecha" :key="msg">{{ msg }}</li>
        </ul>
        <p class="mt-2 text-xs">Elige una fecha posterior a la última mostrada o revisa el ciclo con el que se cruza.</p>
      </div>
      <p v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ formError }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="visible = false"
      >
        Cancelar
      </button>
      <button
        v-if="sugerencia"
        type="submit"
        form="form-clonar-ciclo"
        :disabled="submitting"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2a4180] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {{ submitting ? 'Clonando...' : 'Clonar ciclo' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import ModalBase  from '@/components/ModalBase.vue'
import NavIcon    from '@/components/icons/NavIcon.vue'
import FormInput  from '@/components/forms/FormInput.vue'
import cicloService from '@/services/cicloService.js'
import { useNotification } from '@/composables/useNotification'
import { esDiaDeClase, sumarDias, diferenciaDias, formatFechaCorta } from '@/utils/calendario.js'

/**
 * Clona un ciclo para una nueva cohorte. Precarga la fecha sugerida por el backend,
 * valida en cliente la fecha mínima y los días de clase, y muestra los 422 del backend.
 * Emite `cloned` con el ciclo nuevo (`data` de la respuesta).
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ciclo:      { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'cloned'])

const { success: notifySuccess, warning: notifyWarning } = useNotification()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const sugerencia  = ref(null)
const loading     = ref(false)
const loadError   = ref('')
const submitting  = ref(false)
const formError   = ref('')
const fieldErrors = ref({})
const finEditada  = ref(false)
const form = reactive({ fecha_inicio: '', nombre: '', fecha_fin: '' })

const esFechaFinFija = computed(() => props.ciclo?.fecha_fin_automatica === false)

const erroresFecha = computed(() => fieldErrors.value.fecha_inicio ?? [])

/** Error mostrado bajo el campo: validación local primero, luego el primero del backend. */
const errorFecha = computed(() => errorLocalFecha.value || erroresFecha.value[0] || '')

const errorLocalFecha = computed(() => {
  const s = sugerencia.value
  if (!s || !form.fecha_inicio) return ''
  if (form.fecha_inicio < s.fecha_minima) {
    return `La fecha debe ser igual o posterior al ${formatFechaCorta(s.fecha_minima)}.`
  }
  if (!esDiaDeClase(form.fecha_inicio, s.dias_clase)) {
    return `La fecha debe caer en un día de clase (${s.dias_clase.join(', ')}).`
  }
  return ''
})

function firstError(campo) {
  return fieldErrors.value[campo]?.[0] ?? ''
}

/** Mantiene la duración del origen en la fecha fin sugerida mientras el usuario no la edite. */
function sugerirFechaFin() {
  const { fecha_inicio: ini, fecha_fin: fin } = props.ciclo ?? {}
  if (!esFechaFinFija.value || !ini || !fin || !form.fecha_inicio) return
  form.fecha_fin = sumarDias(form.fecha_inicio, diferenciaDias(ini, fin))
}

function onFechaInicio() {
  fieldErrors.value = {}
  if (!finEditada.value) sugerirFechaFin()
}

async function load() {
  if (!props.ciclo?.id) return
  loading.value     = true
  loadError.value   = ''
  formError.value   = ''
  fieldErrors.value = {}
  sugerencia.value  = null
  finEditada.value  = false
  form.nombre       = ''
  form.fecha_fin    = ''
  try {
    const res = await cicloService.sugerenciaClonar(props.ciclo.id, { _silent: true })
    sugerencia.value  = res.data
    form.fecha_inicio = res.data.fecha_inicio_sugerida
    sugerirFechaFin()
  } catch (e) {
    loadError.value = e?.response?.data?.message ?? 'No se pudo obtener la sugerencia para clonar el ciclo.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (errorLocalFecha.value) return
  submitting.value  = true
  formError.value   = ''
  fieldErrors.value = {}
  const payload = { fecha_inicio: form.fecha_inicio }
  if (form.nombre.trim()) payload.nombre = form.nombre.trim()
  if (esFechaFinFija.value && form.fecha_fin) payload.fecha_fin = form.fecha_fin
  try {
    const res = await cicloService.clonar(props.ciclo.id, payload, { _silent: true })
    notifySuccess(res.message ?? 'Ciclo clonado exitosamente.')
    if (res.data?.ajuste?.advertencia) notifyWarning(res.data.ajuste.advertencia)
    emit('cloned', res.data)
    visible.value = false
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      if (!Object.keys(fieldErrors.value).length) formError.value = e.response.data?.message ?? 'Verifica los datos ingresados.'
    } else {
      formError.value = e?.response?.data?.message ?? 'No se pudo clonar el ciclo.'
    }
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, (abierto) => { if (abierto) load() })
</script>
