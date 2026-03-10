<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Sedes
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Gestiona las sedes, áreas y horarios de atención de la organización.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const navItems = [
  { label: 'Sedes', to: '/configuracion/sedes', exact: true },
  { label: 'Áreas', to: '/configuracion/sedes/areas' },
  { label: 'Horarios', to: '/configuracion/sedes/horarios' }
]
</script>
