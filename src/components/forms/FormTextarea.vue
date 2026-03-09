<template>
  <div class="flex flex-col gap-2 md:col-span-2">
    <label
      v-if="label"
      :for="textareaId"
      class="text-sm font-medium text-slate-900"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      class="w-full resize-y rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
      :aria-describedby="hint ? `${textareaId}-hint` : undefined"
      v-bind="$attrs"
      @input="emit('update:modelValue', ($event.target && $event.target.value) ?? '')"
    />
    <p
      v-if="hint"
      :id="`${textareaId}-hint`"
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
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  rows: { type: [String, Number], default: 4 }
})

const emit = defineEmits(['update:modelValue'])

const textareaId = computed(() => `textarea-${Math.random().toString(36).slice(2, 9)}`)
</script>
