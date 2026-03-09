<template>
  <div class="flex flex-col" role="tablist" aria-label="Tipo de formulario">
    <div class="flex gap-2 rounded-lg bg-slate-100 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.value"
        :aria-controls="`panel-${tab.value}`"
        :id="`tab-${tab.value}`"
        class="min-w-[120px] rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        :class="modelValue === tab.value
          ? 'bg-white text-[#213360] shadow-sm'
          : 'text-slate-600 hover:text-slate-900'"
        @click="emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      v-for="tab in tabs"
      :key="`panel-${tab.value}`"
      :id="`panel-${tab.value}`"
      role="tabpanel"
      :aria-labelledby="`tab-${tab.value}`"
      :hidden="modelValue !== tab.value"
      class="mt-6"
    >
      <slot :name="tab.value" :tab="tab" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], required: true },
  tabs: {
    type: Array,
    required: true,
    validator: (v) => v.every((t) => t && typeof t.label !== 'undefined' && typeof t.value !== 'undefined')
  }
})

const emit = defineEmits(['update:modelValue'])
</script>
