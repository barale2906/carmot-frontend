<template>
  <section
    class="flex flex-col gap-4 border-b border-black/10 pb-6 last:border-b-0"
    :aria-labelledby="titleId"
  >
    <h2 :id="titleId" class="text-lg font-medium text-[#213360]">
      {{ title }}
    </h2>
    <div
      v-if="layout !== 'custom'"
      class="grid gap-x-4 gap-y-4 grid-cols-1 md:grid-cols-2"
      :class="gridClass"
    >
      <slot />
    </div>
    <slot v-else />
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  /** 'default' = 2 cols on md, 'single' = 1 col, 'custom' = no grid wrapper class */
  layout: { type: String, default: 'default', validator: (v) => ['default', 'single', 'custom'].includes(v) }
})

const titleId = computed(() => `section-${Math.random().toString(36).slice(2, 9)}`)

const gridClass = computed(() => {
  if (props.layout === 'custom') return ''
  if (props.layout === 'single') return 'md:grid-cols-1'
  return 'md:grid-cols-2'
})
</script>
