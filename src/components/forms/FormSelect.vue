<template>
  <div class="flex flex-col gap-2" :class="fieldClass">
    <div v-if="label" class="flex flex-wrap items-center gap-1">
      <label
        :for="selectId"
        class="text-sm font-medium text-slate-900"
      >
        {{ label }}
        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
      </label>
      <FormFieldHelp v-if="help" :text="help" />
    </div>
    <span v-if="help" :id="`${selectId}-help`" class="sr-only">{{ help }}</span>
    <SearchableSelect
      :id="selectId"
      :model-value="modelValue"
      :options="options"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :invalid="!!error"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="ariaDescribedBy"
      v-bind="$attrs"
      @change="onChange"
    />
    <p
      v-if="error"
      :id="`${selectId}-error`"
      role="alert"
      class="text-xs text-red-600"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${selectId}-hint`"
      class="text-xs text-slate-500"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FormFieldHelp    from '@/components/forms/FormFieldHelp.vue'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Seleccione opción' },
  hint: { type: String, default: '' },
  /** Texto de error de validación. Reemplaza al hint cuando está presente. */
  error: { type: String, default: '' },
  help: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  options: {
    type: Array,
    default: () => [],
    validator: (v) => v.every((o) => o && typeof o.label !== 'undefined' && typeof o.value !== 'undefined')
  },
  span: { type: String, default: 'half', validator: (v) => ['half', 'full'].includes(v) }
})

// 'change' se declara como emit propio (no solo v-model) para que Vue lo saque de $attrs
// y el @change del padre se dispare siempre DESPUÉS de update:modelValue, con el valor nuevo.
const emit = defineEmits(['update:modelValue', 'change'])

// Se emite el valor como texto, igual que el <select> nativo al que reemplaza este
// componente: los usos existentes (filtros, payloads) cuentan con recibir strings.
function onChange(value) {
  const texto = value == null ? '' : String(value)
  emit('update:modelValue', texto)
  emit('change', texto)
}

const selectId = computed(() => `select-${Math.random().toString(36).slice(2, 9)}`)

const ariaDescribedBy = computed(() => {
  const ids = []
  if (props.error) ids.push(`${selectId.value}-error`)
  else if (props.hint) ids.push(`${selectId.value}-hint`)
  if (props.help) ids.push(`${selectId.value}-help`)
  return ids.length ? ids.join(' ') : undefined
})

const fieldClass = computed(() =>
  props.span === 'full' ? 'md:col-span-2' : ''
)
</script>
