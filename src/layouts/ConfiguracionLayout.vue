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
import { ref, computed, onMounted } from 'vue'
import FormulariosNav from '@/components/forms/FormulariosNav.vue'
import { authService } from '@/services/authService.js'

const userPermissions = ref([])

onMounted(async () => {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos: se muestran solo items sin guard */ }
})

const navItems = computed(() => {
  const items = [
    { label: 'Usuarios', to: '/configuracion/usuarios' },
    { label: 'Roles',    to: '/configuracion/roles'    }
  ]
  if (userPermissions.value.includes('co_eps')) {
    items.push({ label: 'EPS', to: '/configuracion/eps' })
  }
  return items
})
</script>
