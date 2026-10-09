<template>
  <div class="flex flex-col gap-2">
    <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
      <input
        type="checkbox"
        class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        :checked="activo"
        :disabled="disabled || !puedeActivar"
        @change="toggle($event.target.checked)"
      />
      Definir el valor de cada cuota
      <FormFieldHelp
        compact
        text="Por defecto el sistema divide el total financiado en cuotas iguales (redondeadas al 100). Active esta opción para fijar un valor distinto por cuota; la suma debe ser igual al total financiado."
      />
    </label>

    <template v-if="activo">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div v-for="(valor, i) in modelValue" :key="i" class="flex flex-col gap-1">
          <span class="text-[11px] font-medium text-slate-500">Cuota {{ i + 1 }}</span>
          <FormInput
            :model-value="valor"
            label=""
            type="number"
            min="0"
            placeholder="0"
            :disabled="disabled"
            @update:model-value="setValor(i, $event)"
          />
        </div>
      </div>
      <p class="text-xs" :class="cuadra ? 'text-emerald-700' : 'text-amber-800'">
        Suma: {{ formato(suma) }} de {{ formato(total) }}
        <template v-if="!cuadra"> — diferencia {{ formato(Math.abs(totalNumero - suma)) }}</template>
      </p>
    </template>
  </div>
</template>

<script setup>
/**
 * Editor del valor individual de cada cuota (`cuotas_detalle`).
 * v-model: arreglo de textos (una entrada por cuota) o null cuando el cálculo es automático.
 * Al cambiar el número de cuotas con el editor activo, se vuelve a repartir el total.
 */
import { computed, watch } from 'vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'
import { repartirCuotas, sumaCuotas } from '@/utils/cuotasDetalle.js'

const props = defineProps({
  modelValue: { type: Array, default: null },
  total: { type: [String, Number], default: '' },
  numeroCuotas: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const activo = computed(() => Array.isArray(props.modelValue))
const totalNumero = computed(() => parseFloat(props.total) || 0)
const puedeActivar = computed(() => totalNumero.value > 0 && parseInt(props.numeroCuotas, 10) >= 1)
const suma = computed(() => sumaCuotas(props.modelValue))
const cuadra = computed(() => Math.abs(suma.value - totalNumero.value) <= 0.01)

function formato(valor) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor)
}

function toggle(checked) {
  emit('update:modelValue', checked ? repartirCuotas(props.total, props.numeroCuotas) : null)
}

function setValor(indice, valor) {
  const copia = [...props.modelValue]
  copia[indice] = valor
  emit('update:modelValue', copia)
}

watch(
  () => props.numeroCuotas,
  (n) => {
    if (!activo.value) return
    const cantidad = parseInt(n, 10)
    if (cantidad >= 1 && cantidad !== props.modelValue.length) {
      emit('update:modelValue', repartirCuotas(props.total, cantidad))
    }
  }
)
</script>
