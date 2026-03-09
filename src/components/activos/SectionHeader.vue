<template>
  <header class="flex flex-col gap-1">
    <h2 :id="headerId" class="text-base font-medium text-slate-900">
      {{ title }}
    </h2>
    <p v-if="description" class="text-base text-[#717182]">
      {{ description }}
    </p>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' }
})

const titleId = computed(() => `section-${props.title.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`)
const headerId = computed(() => props.id || titleId.value)
</script>
