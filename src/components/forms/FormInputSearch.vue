<template>
  <div class="flex flex-col gap-2" :class="fieldClass">
    <label
      v-if="label"
      :for="inputId"
      class="text-sm font-medium text-slate-900"
    >
      {{ label }}
    </label>
    <div class="relative">
      <span
        class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      >
        <NavIcon name="search" class="size-4" />
      </span>
      <input
        :id="inputId"
        type="search"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        class="w-full rounded-lg border-0 bg-[#f3f3f5] py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
        :aria-describedby="hint ? `${inputId}-hint` : undefined"
        v-bind="$attrs"
        @input="emit('update:modelValue', ($event.target && $event.target.value) ?? '')"
      />
    </div>
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
import NavIcon from '@/components/icons/NavIcon.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Buscar...' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  span: { type: String, default: 'half', validator: (v) => ['half', 'full'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => `search-${Math.random().toString(36).slice(2, 9)}`)

const fieldClass = computed(() =>
  props.span === 'full' ? 'md:col-span-2' : ''
)
</script>
