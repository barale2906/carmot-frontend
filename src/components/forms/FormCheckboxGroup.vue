<template>
  <div class="flex flex-col gap-2" :class="fieldClass">
    <div v-if="label" class="flex flex-wrap items-center gap-1">
      <span :id="`${groupId}-label`" class="text-sm font-medium text-slate-900">
        {{ label }}
        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>
      </span>
      <FormFieldHelp v-if="help" :text="help" />
    </div>
    <span v-if="help" :id="`${groupId}-help`" class="sr-only">{{ help }}</span>

    <slot name="before-search" />

    <!-- Buscador inline -->
    <input
      v-model="filterText"
      type="text"
      :placeholder="searchPlaceholder"
      class="w-full rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    <!-- Lista de checkboxes -->
    <div class="max-h-48 divide-y divide-black/5 overflow-y-auto rounded-lg border border-black/10 bg-white">
      <p v-if="filteredOptions.length === 0" class="px-3 py-3 text-center text-sm text-slate-400">
        Sin resultados
      </p>
      <label
        v-for="opt in filteredOptions"
        :key="opt.value"
        class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
        :class="{ 'bg-blue-50': internalValue.includes(opt.value) }"
      >
        <input
          type="checkbox"
          :value="opt.value"
          :checked="internalValue.includes(opt.value)"
          class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          @change="toggle(opt.value)"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-slate-700">{{ opt.label }}</p>
          <p v-if="opt.description" class="text-xs text-slate-500">{{ opt.description }}</p>
        </div>
      </label>
    </div>

    <!-- Contador y acciones rápidas -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-slate-500">
        {{ internalValue.length }} de {{ options.length }} seleccionado{{ internalValue.length !== 1 ? 's' : '' }}
      </p>
      <div class="flex gap-3 text-xs">
        <button type="button" class="text-blue-600 hover:underline focus:outline-none" @click="selectAll">Todos</button>
        <button type="button" class="text-slate-500 hover:underline focus:outline-none" @click="clearAll">Ninguno</button>
      </div>
    </div>

    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'

const props = defineProps({
  modelValue:        { type: Array,  default: () => [] },
  label:             { type: String, default: '' },
  hint:              { type: String, default: '' },
  help:              { type: String, default: '' },
  error:             { type: String, default: '' },
  required:          { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  options: {
    type: Array,
    default: () => [],
    // [{ value: any, label: string, description?: string }]
  },
  span: { type: String, default: 'full', validator: (v) => ['half', 'full'].includes(v) }
})

const emit = defineEmits(['update:modelValue'])

const groupId = computed(() => `cbg-${Math.random().toString(36).slice(2, 9)}`)

const filterText = ref('')

const internalValue = computed(() => props.modelValue ?? [])

const filteredOptions = computed(() => {
  const q = filterText.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
  )
})

const fieldClass = computed(() => (props.span === 'half' ? '' : 'md:col-span-2'))

function toggle(value) {
  const current = [...internalValue.value]
  const idx = current.indexOf(value)
  if (idx === -1) current.push(value)
  else current.splice(idx, 1)
  emit('update:modelValue', current)
}

function selectAll() {
  emit('update:modelValue', props.options.map((o) => o.value))
}

function clearAll() {
  emit('update:modelValue', [])
}
</script>
