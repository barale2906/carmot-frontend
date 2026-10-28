<template>
  <ModalBase
    :model-value="modelValue"
    :title="modo === 'recibir' ? `Recibir ${etiquetaActivo(traslado?.activo)}` : `Cancelar traslado de ${etiquetaActivo(traslado?.activo)}`"
    :description="traslado ? `${traslado.origen} → ${traslado.destino} · enviado el ${fechaCorta(traslado.fecha)}` : ''"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-4 pb-2" @submit.prevent="guardar">
      <template v-if="modo === 'recibir'">
        <img
          v-if="traslado?.activo?.imagen_url"
          :src="traslado.activo.imagen_url"
          :alt="`Imagen de ${traslado.activo.nombre}`"
          class="max-h-40 self-start rounded-lg border border-slate-200 object-contain"
        />
        <p class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Confirma que el activo llegó a <strong>{{ traslado?.destino }}</strong>. Al registrar la recepción
          queda ubicado allí. Si llegó con alguna novedad, anótala en las observaciones.
        </p>
        <FormInput v-model="form.fecha_recepcion" type="date" label="Fecha de recepción" required :min="traslado?.fecha" :max="hoy" :error="errores.fecha_recepcion?.[0]" />
        <FormSelect
          v-if="opcionesResponsable.length > 1"
          v-model="form.responsable_id"
          label="Responsable en el destino"
          :options="opcionesResponsable"
          :error="errores.responsable_id?.[0]"
        />
        <FormTextarea v-model="form.observaciones_recepcion" label="Observaciones de la recepción" :rows="3" placeholder="Ej: llegó completo y funcionando" />
      </template>
      <template v-else>
        <p class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          El activo seguirá en {{ traslado?.origen }}. El traslado queda en el historial como cancelado.
        </p>
        <FormTextarea v-model="form.motivo" label="Motivo de la cancelación" required :rows="3" />
        <p v-if="errores.motivo" class="-mt-3 text-xs text-red-600">{{ errores.motivo[0] }}</p>
      </template>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando || (modo === 'cancelar' && !form.motivo.trim())"
        class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="modo === 'cancelar' ? 'bg-red-700 hover:bg-red-800' : 'bg-[#213360] hover:bg-[#1a294d]'"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : (modo === 'recibir' ? 'Registrar recepción' : 'Cancelar traslado') }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import ModalBase     from '@/components/ModalBase.vue'
import FormInput     from '@/components/forms/FormInput.vue'
import FormSelect    from '@/components/forms/FormSelect.vue'
import FormTextarea  from '@/components/forms/FormTextarea.vue'
import activoService from '@/services/activoService.js'
import { useNotification } from '@/composables/useNotification'
import { fechaISO, fechaCorta } from '@/utils/crm.js'
import { etiquetaActivo } from '@/utils/activos.js'

const props = defineProps({
  modelValue:   { type: Boolean, default: false },
  traslado:     { type: Object,  default: null },
  /** 'recibir' (destino) o 'cancelar' (origen). */
  modo:         { type: String,  default: 'recibir', validator: (v) => ['recibir', 'cancelar'].includes(v) },
  /** Posibles responsables del catálogo de activos (`[{ id, name }]`). */
  responsables: { type: Array,   default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { success: notifySuccess } = useNotification()
const hoy = fechaISO()

// Vacío = el propuesto al enviar (o el que ya tenía el activo); el backend lo resuelve.
const opcionesResponsable = computed(() => [
  { value: '', label: props.traslado?.responsable_destino?.name ? `${props.traslado.responsable_destino.name} (propuesto)` : 'Conservar el actual' },
  ...props.responsables.map(u => ({ value: u.id, label: u.name }))
])

const form      = reactive({ fecha_recepcion: hoy, responsable_id: '', observaciones_recepcion: '', motivo: '' })
const errores   = ref({})
const error     = ref('')
const guardando = ref(false)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  errores.value = {}
  error.value   = ''
  Object.assign(form, { fecha_recepcion: hoy, responsable_id: '', observaciones_recepcion: '', motivo: '' })
})

async function guardar() {
  guardando.value = true
  errores.value   = {}
  error.value     = ''
  try {
    let res
    if (props.modo === 'recibir') {
      const payload = { fecha_recepcion: form.fecha_recepcion, observaciones_recepcion: form.observaciones_recepcion.trim() || null }
      if (form.responsable_id) payload.responsable_id = Number(form.responsable_id)
      res = await activoService.recibirTraslado(props.traslado.id, payload)
    } else {
      res = await activoService.cancelarTraslado(props.traslado.id, { motivo: form.motivo.trim() })
    }
    notifySuccess(res.message ?? 'Traslado actualizado.')
    emit('saved', res.data)
    emit('update:modelValue', false)
  } catch (e) {
    if (e?.response?.status === 422) errores.value = e.response.data?.errors ?? {}
    error.value = errores.value.traslado?.[0] ?? e?.response?.data?.message ?? 'No se pudo registrar la acción.'
  } finally {
    guardando.value = false
  }
}
</script>
