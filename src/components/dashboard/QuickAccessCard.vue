<template>
  <RouterLink
    :to="to"
    class="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    <span
      class="flex size-11 shrink-0 items-center justify-center rounded-lg"
      :class="iconBgClass"
      aria-hidden="true"
    >
      <NavIcon :name="icon" class="size-6 text-white" />
    </span>
    <div class="min-w-0 flex-1">
      <h3 class="font-semibold text-slate-900">
        {{ title }}
      </h3>
      <p class="mt-0.5 text-sm text-slate-500">
        {{ description }}
      </p>
    </div>
    <span class="shrink-0 text-slate-400" aria-hidden="true">
      <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </span>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  to: { type: String, default: '#' },
  icon: {
    type: String,
    default: 'dashboard',
    validator: (v) => [
      'dashboard', 'formularios', 'estudiantes', 'academico', 'pendientes',
      'calendario', 'inventario', 'activos', 'control-estudiantes', 'cartera'
    ].includes(v)
  },
  iconVariant: {
    type: String,
    default: 'blue',
    validator: (v) => ['blue', 'green', 'purple', 'orange'].includes(v)
  }
})

const iconBgClass = computed(() => {
  const map = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-violet-500',
    orange: 'bg-orange-500'
  }
  return map[props.iconVariant] ?? map.blue
})
</script>
