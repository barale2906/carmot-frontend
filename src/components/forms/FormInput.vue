<template>
  <div class="flex flex-col gap-2" :class="fieldClass">
    <label
      v-if="label"
      :for="inputId"
      class="text-sm font-medium text-slate-900"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="w-full rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
      :aria-describedby="hint ? `${inputId}-hint` : undefined"
      v-bind="$attrs"
      @input="emit('update:modelValue', ($event.target && $event.target.value) ?? '')"
    />
    <p
      v-if="hint"
      :id="`${inputId}-hint`"
      class="text-xs text-slate-500"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'email', 'number', 'tel', 'date', 'time', 'password'].includes(v)
  },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
  step: { type: [String, Number], default: undefined },
  /** 'full' = col-span-2 on md, 'half' = one column */
  span: { type: String, default: 'half', validator: (v) => ['half', 'full'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => `input-${Math.random().toString(36).slice(2, 9)}`)

const fieldClass = computed(() =>
  props.span === 'full' ? 'md:col-span-2' : ''
)
</script>
