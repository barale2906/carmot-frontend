<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        CRM
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Gestiona los aspirantes (leads), su bitácora de seguimiento y las citas agendadas hasta convertirlos en matrícula.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
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
  can('crm_referidos')    && { label: 'Leads',        to: '/crm/referidos' },
  can('crm_seguimientos') && { label: 'Seguimientos', to: '/crm/seguimientos' },
  can('crm_agendas')      && { label: 'Agenda',       to: '/crm/agendas' }
].filter(Boolean))
</script>
