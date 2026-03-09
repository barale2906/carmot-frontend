<template>
  <ModalBase
    :model-value="modelValue"
    title="Pago por consignación"
    description="Ingresa los datos de la consignación bancaria"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 text-[#213360]" aria-hidden="true">
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </span>
    </template>
    <div class="flex flex-col gap-4">
      <FormInput
        v-model="referencia"
        label="Referencia de consignación"
        placeholder="Ej: 57456456"
        hint="Digita la referencia de la consignación"
        required
      />
      <FormInput
        v-model="fechaConsignacion"
        label="Fecha de consignación"
        type="date"
        :hint="fechaAutomaticaHint"
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Confirmar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import FormInput from '@/components/forms/FormInput.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const referencia = ref('')
const fechaConsignacion = ref('')

const fechaAutomaticaHint = computed(() => {
  const d = new Date()
  return `Fecha automática: ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
})

watch(() => props.modelValue, (open) => {
  if (open) {
    referencia.value = ''
    fechaConsignacion.value = ''
  }
})

function onConfirmar() {
  emit('confirm', {
    referencia: referencia.value,
    fechaConsignacion: fechaConsignacion.value
  })
  emit('update:modelValue', false)
}
</script>
