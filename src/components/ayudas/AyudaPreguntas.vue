<template>
  <div class="divide-y divide-slate-200 rounded-xl border border-slate-200">
    <details v-for="(item, idx) in preguntas" :key="idx" class="group px-4 py-3">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-slate-900">
        {{ item.pregunta }}
        <svg viewBox="0 0 24 24" class="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </summary>
      <p class="mt-2 text-slate-600">{{ item.respuesta }}</p>
    </details>
  </div>
</template>

<script setup>
defineProps({
  /** [{ pregunta, respuesta }] */
  preguntas: { type: Array, required: true }
})
</script>
