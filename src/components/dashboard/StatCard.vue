<template>
  <article
    class="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    :aria-labelledby="titleId"
  >
    <div class="flex items-start justify-between gap-3">
      <h3 :id="titleId" class="text-sm font-medium text-slate-600">
        {{ title }}
      </h3>
      <span
        class="flex size-9 shrink-0 items-center justify-center rounded-lg"
        :class="iconBgClass"
        aria-hidden="true"
      >
        <NavIcon :name="icon" class="size-5 text-white" />
      </span>
    </div>
    <p class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
      {{ value }}
    </p>
    <p class="mt-1 text-sm text-slate-500">
      {{ description }}
    </p>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  description: { type: String, default: '' },
  icon: {
    type: String,
    default: 'dashboard',
    validator: (v) => [
      'dashboard', 'formularios', 'estudiantes', 'academico', 'pendientes',
      'calendario', 'inventario', 'activos', 'control-estudiantes', 'cartera', 'location'
    ].includes(v)
  },
  iconVariant: {
    type: String,
    default: 'slate',
    validator: (v) => ['slate', 'blue', 'amber', 'red', 'orange'].includes(v)
  }
})

const titleId = computed(() => `stat-${Math.random().toString(36).slice(2, 9)}`)

const iconBgClass = computed(() => {
  const map = {
    slate: 'bg-slate-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500'
  }
  return map[props.iconVariant] ?? map.slate
})
</script>
