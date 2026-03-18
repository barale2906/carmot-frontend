<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Académico · Programaciones
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Gestiona ciclos académicos y grupos para el manejo operativo de los cursos.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const navItems = [
  { label: 'Ciclos', to: '/academico/programaciones', exact: true },
  { label: 'Grupos', to: '/academico/programaciones/grupos' }
]
</script>
