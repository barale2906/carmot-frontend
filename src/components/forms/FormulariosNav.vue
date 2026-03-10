<template>
  <nav class="flex gap-1 rounded-[14px] bg-slate-200 p-1" aria-label="Tipo de formulario">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="min-w-[120px] rounded-[14px] px-4 py-2 text-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      :class="isActive(item.to, item.exact)
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  items: {
    type: Array,
    default: () => [
      { label: 'Matrícula', to: '/academico' },
      { label: 'Recibos de pago', to: '/academico/recibo-pago' },
      { label: 'Asistencia', to: '/academico/asistencia' }
    ],
    validator: (v) => v.every((i) => i && typeof i.label !== 'undefined' && typeof i.to !== 'undefined')
  }
})

const route = useRoute()

function isActive(to, exact = false) {
  if (exact) return route.path === to
  if (to === '/academico') return route.path === '/academico'
  return route.path.startsWith(to)
}
</script>
