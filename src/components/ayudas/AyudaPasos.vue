<template>
  <ol class="space-y-3">
    <li v-for="(paso, idx) in pasos" :key="idx" class="flex gap-3">
      <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
        {{ idx + 1 }}
      </span>
      <div class="pt-0.5">
        <p class="font-medium text-slate-900">{{ paso.titulo }}</p>
        <p v-if="paso.texto" class="text-slate-600">{{ paso.texto }}</p>
      </div>
    </li>
  </ol>
</template>

<script setup>
defineProps({
  /** Lista de pasos: [{ titulo, texto? }] */
  pasos: { type: Array, required: true }
})
</script>
