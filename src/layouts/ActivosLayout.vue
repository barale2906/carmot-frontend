<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Gestión de activos
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Control de elementos, herramientas y equipos por sede y área, con traslados que se confirman al recibirlos en el destino.
      </p>
      <FormulariosNav v-if="navItems.length > 1" :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import FormulariosNav  from '@/components/forms/FormulariosNav.vue'
import { usePermisos } from '@/composables/usePermisos.js'

const { can, loadPermisos } = usePermisos()

onMounted(() => loadPermisos().catch(() => {}))

const navItems = computed(() => [
  can('act_activos')    && { label: 'Inventario', to: '/activos', exact: true },
  (can('act_activos') || can('act_activoRecibir')) && { label: 'Traslados', to: '/activos/traslados' },
  can('act_categorias') && { label: 'Categorías', to: '/activos/categorias' }
].filter(Boolean))
</script>
