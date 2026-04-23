<template>
  <ModalBase
    :model-value="modelValue"
    title="Pago con tarjeta - Recargo adicional"
    description="Configura el porcentaje de recargo que se aplicará por pago con tarjeta"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 text-[#213360]" aria-hidden="true">
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </span>
    </template>
    <div class="flex flex-col gap-4">
      <FormSelect
        v-model="porcentajeRecargo"
        label="Porcentaje de recargo (%)"
        placeholder="Selecciona porcentaje"
        help="Recargo que suma el procesador por pago con tarjeta."
        :options="opcionesPorcentaje"
        required
      />
      <div class="rounded-[10px] border border-black/10 bg-slate-50 px-4 py-4">
        <div class="flex justify-between text-sm">
          <span class="text-slate-900">Valor base:</span>
          <span class="font-semibold text-slate-900">{{ valorBaseFormateado }}</span>
        </div>
        <div class="mt-2 flex justify-between text-sm">
          <span class="text-slate-900">Recargo {{ porcentajeRecargo || 0 }}%:</span>
          <span class="font-semibold text-orange-600">{{ recargoFormateado }}</span>
        </div>
        <div class="mt-2 flex justify-between border-t border-black/10 pt-2 text-base">
          <span class="font-bold text-slate-900">Total a pagar:</span>
          <span class="font-bold text-[#213360]">{{ totalFormateado }}</span>
        </div>
      </div>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Confirmar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import FormSelect from '@/components/forms/FormSelect.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  valorBase: { type: [Number, String], default: 0 }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const porcentajeRecargo = ref('5')

const opcionesPorcentaje = [
  { value: '3', label: '3%' },
  { value: '5', label: '5%' },
  { value: '7', label: '7%' },
  { value: '10', label: '10%' }
]

const valorNumerico = computed(() => {
  const v = typeof props.valorBase === 'string' ? props.valorBase.replace(/\D/g, '') : props.valorBase
  return Number(v) || 0
})

const porcentajeNumerico = computed(() => Number(porcentajeRecargo.value) || 0)

const recargo = computed(() => Math.round((valorNumerico.value * porcentajeNumerico.value) / 100))
const total = computed(() => valorNumerico.value + recargo.value)

const valorBaseFormateado = computed(() => `$${valorNumerico.value.toLocaleString('es-CO')}`)
const recargoFormateado = computed(() => `$${recargo.value.toLocaleString('es-CO')}`)
const totalFormateado = computed(() => `$${total.value.toLocaleString('es-CO')}`)

watch(() => props.modelValue, (open) => {
  if (open) porcentajeRecargo.value = '5'
})

function onConfirmar() {
  emit('confirm', {
    porcentajeRecargo: porcentajeNumerico.value,
    recargo: recargo.value,
    total: total.value
  })
  emit('update:modelValue', false)
}
</script>
