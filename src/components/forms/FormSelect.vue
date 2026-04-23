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
    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :required="required"
        :disabled="disabled"
        class="w-full appearance-none rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 pr-9 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 [&>option]:text-slate-500"
        :aria-describedby="ariaDescribedBy"
        v-bind="$attrs"
        @change="emit('update:modelValue', ($event.target && $event.target.value) ?? '')"
      >
        <option value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <span
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
    <p
      v-if="hint"
      :id="`${selectId}-hint`"
      class="text-xs text-slate-500"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Seleccione opción' },
  hint: { type: String, default: '' },
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

const emit = defineEmits(['update:modelValue'])

const selectId = computed(() => `select-${Math.random().toString(36).slice(2, 9)}`)

const ariaDescribedBy = computed(() => {
  const ids = []
  if (props.hint) ids.push(`${selectId.value}-hint`)
  if (props.help) ids.push(`${selectId.value}-help`)
  return ids.length ? ids.join(' ') : undefined
})

const fieldClass = computed(() =>
  props.span === 'full' ? 'md:col-span-2' : ''
)
</script>
