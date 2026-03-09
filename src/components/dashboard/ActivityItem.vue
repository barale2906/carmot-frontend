<template>
  <li class="flex gap-4 rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50">
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-lg"
      :class="iconBgClass"
      aria-hidden="true"
    >
      <NavIcon :name="icon" class="size-5 text-white" />
    </span>
    <div class="min-w-0 flex-1">
      <h4 class="font-medium text-slate-900">
        {{ title }}
      </h4>
      <p class="mt-0.5 text-sm text-slate-500">
        {{ description }}
      </p>
    </div>
    <time class="shrink-0 text-sm text-slate-400" :datetime="datetime">
      {{ timeAgo }}
    </time>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  timeAgo: { type: String, required: true },
  datetime: { type: String, default: '' },
  icon: {
    type: String,
    default: 'formularios',
    validator: (v) => [
      'formularios', 'estudiantes', 'inventario', 'academico', 'cartera'
    ].includes(v)
  },
  iconVariant: {
    type: String,
    default: 'green',
    validator: (v) => ['green', 'blue', 'orange', 'purple'].includes(v)
  }
})

const iconBgClass = computed(() => {
  const map = {
    green: 'bg-emerald-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-violet-500'
  }
  return map[props.iconVariant] ?? map.green
})
</script>
