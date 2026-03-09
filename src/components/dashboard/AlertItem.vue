<template>
  <article
    class="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    :aria-labelledby="alertTitleId"
  >
    <span
      class="flex size-10 shrink-0 items-center justify-center rounded-full"
      :class="iconBgClass"
      aria-hidden="true"
    >
      <component :is="iconSvg" class="size-5 text-white" />
    </span>
    <div class="min-w-0 flex-1">
      <h4 :id="alertTitleId" class="font-medium text-slate-900">
        {{ title }}
      </h4>
      <p class="mt-1 text-sm text-slate-500">
        {{ description }}
      </p>
      <div v-if="badgeLabel || count !== null" class="mt-2 flex items-center gap-2">
        <span
          v-if="badgeLabel"
          class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="badgeVariantClass"
        >
          {{ badgeLabel }}
        </span>
        <span
          v-if="count !== null"
          class="flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white"
          :class="countBgClass"
        >
          {{ count }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, h } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  badgeLabel: { type: String, default: '' },
  count: { type: Number, default: null },
  variant: {
    type: String,
    default: 'red',
    validator: (v) => ['red', 'yellow', 'orange', 'blue'].includes(v)
  }
})

const alertTitleId = computed(() => `alert-${Math.random().toString(36).slice(2, 9)}`)

const iconSvg = computed(() => {
  const path = props.variant === 'blue'
    ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  return {
    render: () => h('svg', {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'size-5'
    }, [h('path', { d: path })])
  }
})

const iconBgClass = computed(() => {
  const map = { red: 'bg-red-500', yellow: 'bg-amber-500', orange: 'bg-orange-500', blue: 'bg-blue-500' }
  return map[props.variant] ?? map.red
})

const badgeVariantClass = computed(() => {
  const map = {
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-amber-100 text-amber-800',
    orange: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800'
  }
  return map[props.variant] ?? map.red
})

const countBgClass = computed(() => {
  const map = {
    red: 'bg-red-500',
    yellow: 'bg-amber-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500'
  }
  return map[props.variant] ?? map.red
})
</script>
