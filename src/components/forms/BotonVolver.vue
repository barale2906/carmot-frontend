<template>
  <!-- Enlace de regreso estándar en la cabecera de pantallas-formulario (ver useVolver) -->
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    @click="emit('click')"
  >
    <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
    {{ label }}
  </button>
</template>

<script setup>
defineProps({
  label: { type: String, default: 'Volver' }
})

const emit = defineEmits(['click'])
</script>
