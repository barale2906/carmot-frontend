<template>
  <div class="flex flex-col gap-2 md:col-span-2">
    <div v-if="label" class="flex flex-wrap items-center gap-1">
      <label
        :for="textareaId"
        class="text-sm font-medium text-slate-900"
      >
        {{ label }}
        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
      </label>
      <FormFieldHelp v-if="help" :text="help" />
    </div>
    <span v-if="help" :id="`${textareaId}-help`" class="sr-only">{{ help }}</span>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"
      class="w-full resize-y rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50"
      :aria-describedby="ariaDescribedBy"
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
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  help: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  rows: { type: [String, Number], default: 4 }
})

const emit = defineEmits(['update:modelValue'])

const textareaId = computed(() => `textarea-${Math.random().toString(36).slice(2, 9)}`)

const ariaDescribedBy = computed(() => {
  const ids = []
  if (props.hint) ids.push(`${textareaId.value}-hint`)
  if (props.help) ids.push(`${textareaId.value}-help`)
  return ids.length ? ids.join(' ') : undefined
})
</script>
