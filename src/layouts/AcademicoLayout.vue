<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Académico · Cursos
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Cursos, módulos, tópicos, temas y material de la biblioteca.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import FormulariosNav from '@/components/forms/FormulariosNav.vue'
import { usePermisos } from '@/composables/usePermisos.js'

const { can, permisos, loadPermisos } = usePermisos()

// Mismos permisos que exige cada ruta (main.js): quien solo consulta la biblioteca
// (p. ej. el profesor) solo ve esa pestaña.
const todos = [
  { label: 'Curso',      to: '/academico/cursos',             exact: true, permiso: 'aca_cursos' },
  { label: 'Módulo',     to: '/academico/cursos/modulos',     permiso: 'aca_modulos' },
  { label: 'Tópico',     to: '/academico/cursos/topicos',     permiso: 'aca_topicos' },
  { label: 'Tema',       to: '/academico/cursos/temas',       permiso: 'aca_temas' },
  { label: 'Biblioteca', to: '/academico/cursos/biblioteca',  permiso: 'ac_biblioteca' }
]

const navItems = computed(() => (permisos.value.length ? todos.filter((item) => can(item.permiso)) : todos))

onMounted(() => loadPermisos().catch(() => {}))
</script>
