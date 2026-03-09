<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Formularios
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Registra matrículas, pagos y asistencias de los estudiantes.
      </p>
      <FormulariosNav class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'
</script>
