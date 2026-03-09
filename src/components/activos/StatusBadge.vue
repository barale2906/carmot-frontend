<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="badgeClass"
    :aria-label="`Estado: ${label}`"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  variant: {
    type: String,
    default: 'operativo',
    validator: (v) => ['operativo', 'mantenimiento', 'baja', 'disponible'].includes(v)
  }
})

const badgeClass = computed(() => {
  const map = {
    operativo: 'bg-green-100 text-green-800',
    mantenimiento: 'bg-amber-100 text-amber-800',
    baja: 'bg-slate-100 text-slate-600',
    disponible: 'bg-blue-100 text-blue-800'
  }
  return map[props.variant] ?? map.operativo
})
</script>
