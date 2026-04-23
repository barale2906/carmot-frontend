<template>
  <div class="flex flex-col gap-2" :class="fieldClass">
    <div v-if="label" class="flex flex-wrap items-center gap-1">
      <span class="text-sm font-medium text-slate-900">
        {{ label }}
        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
      </span>
      <FormFieldHelp v-if="help" :text="help" />
    </div>
    <span v-if="help" :id="`${inputId}-help`" class="sr-only">{{ help }}</span>
    <div
      class="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 transition-colors hover:border-slate-300 hover:bg-slate-50"
      :class="{ 'border-blue-300 bg-blue-50/50': hasFile }"
    >
      <slot name="icon">
        <span class="flex size-10 items-center justify-center rounded-full bg-slate-200 text-slate-500" aria-hidden="true">
          <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        </span>
      </slot>
      <p class="text-center text-sm text-slate-600">
        {{ description }}
      </p>
      <input
        :id="inputId"
        type="file"
        class="sr-only"
        :accept="accept"
        :disabled="disabled"
        :aria-describedby="ariaDescribedBy"
        v-bind="$attrs"
        @change="handleChange"
      />
      <button
        type="button"
        class="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        @click="triggerFileInput"
      >
        {{ uploadLabel }}
      </button>
    </div>
    <p v-if="hint" :id="`${inputId}-hint`" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Object, File], default: null },
  label: { type: String, default: '' },
  description: { type: String, default: 'Captura o sube el archivo' },
  uploadLabel: { type: String, default: 'Subir archivo' },
  hint: { type: String, default: '' },
  help: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  accept: { type: String, default: 'image/*' },
  span: { type: String, default: 'half', validator: (v) => ['half', 'full'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])

const inputId = computed(() => `file-${Math.random().toString(36).slice(2, 9)}`)
const fieldClass = computed(() => (props.span === 'full' ? 'md:col-span-2' : ''))

const ariaDescribedBy = computed(() => {
  const ids = []
  if (props.hint) ids.push(`${inputId.value}-hint`)
  if (props.help) ids.push(`${inputId.value}-help`)
  return ids.length ? ids.join(' ') : undefined
})
const hasFile = computed(() => !!props.modelValue)

function triggerFileInput() {
  if (props.disabled) return
  document.getElementById(inputId.value)?.click()
}

function handleChange(e) {
  const file = e.target?.files?.[0]
  emit('update:modelValue', file ?? null)
}
</script>
