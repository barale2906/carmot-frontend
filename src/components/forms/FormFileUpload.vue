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

    <!-- Estado: archivo seleccionado -->
    <div
      v-if="hasFile"
      class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Vista previa del archivo"
        class="size-12 shrink-0 rounded-lg border border-blue-200 object-cover"
      />
      <span v-else class="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600" aria-hidden="true">
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-slate-800">{{ modelValue.name }}</p>
        <p class="text-xs text-slate-500">{{ humanSize(modelValue.size) }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-blue-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Quitar archivo"
        :disabled="disabled"
        @click="clearFile"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Estado: sin archivo -->
    <div
      v-else
      class="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors"
      :class="error
        ? 'border-red-300 bg-red-50/50'
        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'"
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
      <button
        type="button"
        class="rounded text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :disabled="disabled"
        @click="triggerFileInput"
      >
        {{ uploadLabel }}
      </button>
    </div>

    <input
      :id="inputId"
      type="file"
      class="sr-only"
      :accept="accept"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="ariaDescribedBy"
      v-bind="$attrs"
      @change="handleChange"
    />

    <p v-if="error" :id="`${inputId}-error`" role="alert" class="text-xs text-red-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${inputId}-hint`" class="text-xs text-slate-500">
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Object, File], default: null },
  label: { type: String, default: '' },
  description: { type: String, default: 'Captura o sube el archivo' },
  uploadLabel: { type: String, default: 'Subir archivo' },
  hint: { type: String, default: '' },
  /** Texto de error de validación. Reemplaza al hint cuando está presente. */
  error: { type: String, default: '' },
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
  if (props.error) ids.push(`${inputId.value}-error`)
  else if (props.hint) ids.push(`${inputId.value}-hint`)
  if (props.help) ids.push(`${inputId.value}-help`)
  return ids.length ? ids.join(' ') : undefined
})
const hasFile = computed(() => !!props.modelValue)

const previewUrl = ref('')

watch(
  () => props.modelValue,
  (file) => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = file instanceof File && file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : ''
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function triggerFileInput() {
  if (props.disabled) return
  document.getElementById(inputId.value)?.click()
}

function handleChange(e) {
  const file = e.target?.files?.[0]
  emit('update:modelValue', file ?? null)
}

function clearFile() {
  emit('update:modelValue', null)
  const input = document.getElementById(inputId.value)
  if (input) input.value = ''
}

function humanSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
