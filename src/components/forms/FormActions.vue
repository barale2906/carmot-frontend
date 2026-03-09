<template>
  <div class="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 pt-6">
    <button
      type="button"
      class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      @click="emit('cancel')"
    >
      {{ cancelLabel }}
    </button>
    <button
      type="submit"
      class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#1a2950] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      :disabled="loading"
      @click="emit('submit')"
    >
      {{ submitLabel }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  cancelLabel: { type: String, default: 'Cancelar' },
  submitLabel: { type: String, default: 'Guardar' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['cancel', 'submit'])
</script>
