<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Académico · Documentación
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Redacta y versiona las plantillas de los documentos del instituto y emite documentos con datos del sistema.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const navItems = [
  { label: 'Documentos',         to: '/academico/documentacion', exact: true },
  { label: 'Plantillas',         to: '/academico/documentacion/plantillas' },
  { label: 'Tipos de documento', to: '/academico/documentacion/tipos' }
]
</script>
