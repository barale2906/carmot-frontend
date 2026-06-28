<template>
  <ModalBase
    :model-value="modelValue"
    title="Pago por transferencia"
    description="Ingresa los datos de la transferencia"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 text-[#213360]" aria-hidden="true">
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </span>
    </template>
    <div class="flex flex-col gap-4">
      <FormInput
        v-model="referencia"
        label="Referencia de transferencia"
        placeholder="Ej: 57456456"
        hint="Digita el serial del comprobante"
        help="Número de referencia que aparece en el comprobante de la transferencia."
        required
      />
      <FormInput
        v-model="fechaTransferencia"
        label="Fecha de transferencia"
        type="date"
        :hint="fechaAutomaticaHint"
        help="Día en que se realizó la transferencia."
        required
      />
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2950] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="onConfirmar"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        Confirmar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed } from 'vue'
import ModalBase  from '@/components/ModalBase.vue'
import FormInput  from '@/components/forms/FormInput.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const referencia          = ref('')
const fechaTransferencia  = ref('')

const fechaAutomaticaHint = computed(() => {
  const d = new Date()
  return `Fecha automática: ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
})

function onConfirmar() {
  emit('confirm', {
    referencia:         referencia.value,
    fechaTransferencia: fechaTransferencia.value,
  })
  referencia.value         = ''
  fechaTransferencia.value = ''
  emit('update:modelValue', false)
}
</script>
