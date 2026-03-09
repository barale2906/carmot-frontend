<template>
  <article
    class="flex items-center justify-between rounded-[10px] border border-black/10 bg-white p-4 transition-shadow hover:shadow-sm"
    :aria-labelledby="titleId"
  >
    <div class="flex flex-col gap-0">
      <p :id="titleId" class="text-sm font-normal text-[#717182]">
        {{ areaName }}
      </p>
      <p class="text-2xl font-bold text-[#213360]">
        {{ count }}
      </p>
    </div>
    <span
      class="flex size-8 shrink-0 items-center justify-center text-[#213360]"
      aria-hidden="true"
    >
      <NavIcon name="location" class="size-5" />
    </span>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  areaName: { type: String, required: true },
  count: { type: Number, required: true }
})

const titleId = computed(() => `area-${props.areaName.replace(/\s+/g, '-').toLowerCase()}`)
</script>
