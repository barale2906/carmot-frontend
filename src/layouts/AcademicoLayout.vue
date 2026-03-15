<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Académico · Cursos
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Gestiona los cursos, módulos, tópicos y temas del plan académico.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const navItems = [
  { label: 'Curso',   to: '/academico/cursos',          exact: true },
  { label: 'Módulo',  to: '/academico/cursos/modulos' },
  { label: 'Tópico',  to: '/academico/cursos/topicos' },
  { label: 'Tema',    to: '/academico/cursos/temas' }
]
</script>
