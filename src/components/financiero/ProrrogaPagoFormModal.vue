<template>
  <ModalBase
    :model-value="modelValue"
    size="md"
    title="Plazo nuevo de pago"
    :description="`Acuerdo verbal para que ${estudiante?.name ?? 'el estudiante'} entre a clase hasta pagar. No cambia la cartera. Máximo ${PLAZO_MAXIMO_PRORROGA} días.`"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-5 pb-2" @submit.prevent="guardar">
      <p v-if="estudiante?.saldo_vencido" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        Saldo vencido: <strong>$ {{ formatMoney(estudiante.saldo_vencido) }}</strong>
      </p>
      <FormInput
        v-model="fecha"
        type="date"
        label="Nueva fecha de pago"
        required
        :min="minimo"
        :max="maximo"
        :error="errores.fecha_compromiso?.[0]"
        :help="`Desde mañana hasta ${PLAZO_MAXIMO_PRORROGA} días.`"
      />
      <FormTextarea v-model="observacion" label="Observación (opcional)" :rows="2" />
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
        :disabled="guardando || !fecha"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Registrando...' : 'Registrar plazo' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
/**
 * Registro de un plazo nuevo de pago para un estudiante en mora. Recibe `estudiante`
 * (`{ id, name, saldo_vencido }`); emite `guardada` tras registrarlo. El backend valida que esté en
 * mora, que no tenga otro plazo vigente y que la fecha no pase de 15 días.
 */
import { ref, computed, watch } from 'vue'
import ModalBase    from '@/components/ModalBase.vue'
import FormInput    from '@/components/forms/FormInput.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import prorrogaPagoService from '@/services/prorrogaPagoService.js'
import { useNotification } from '@/composables/useNotification'
import { fechaISO } from '@/utils/crm.js'
import { formatMoney } from '@/utils/formatters.js'
import { PLAZO_MAXIMO_PRORROGA, sumarDias } from '@/utils/asistencia.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  estudiante: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'guardada'])

const { success: notifySuccess } = useNotification()

const fecha       = ref('')
const observacion = ref('')
const guardando   = ref(false)
const error       = ref('')
const errores     = ref({})

const minimo = computed(() => sumarDias(fechaISO(), 1))
const maximo = computed(() => sumarDias(fechaISO(), PLAZO_MAXIMO_PRORROGA))

watch(() => props.modelValue, abierto => {
  if (!abierto) return
  fecha.value = ''
  observacion.value = ''
  error.value = ''
  errores.value = {}
})

async function guardar() {
  if (!fecha.value || !props.estudiante) return
  guardando.value = true
  error.value = ''
  errores.value = {}
  try {
    const res = await prorrogaPagoService.crear({
      estudiante_id:    props.estudiante.id,
      fecha_compromiso: fecha.value,
      observacion:      observacion.value.trim() || null
    })
    notifySuccess(res.message ?? 'Plazo nuevo registrado.')
    emit('guardada')
    emit('update:modelValue', false)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    error.value = Object.values(errores.value).flat()[0] ?? e?.response?.data?.message ?? 'No se pudo registrar el plazo nuevo.'
  } finally {
    guardando.value = false
  }
}
</script>
