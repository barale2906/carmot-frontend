<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Configuración
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Administra los usuarios del sistema y sus roles de acceso.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const navItems = [
  { label: 'Usuarios', to: '/configuracion/usuarios' },
  { label: 'Roles', to: '/configuracion/roles' }
]
</script>
