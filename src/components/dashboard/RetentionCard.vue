<template>
  <article
    class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    :aria-labelledby="titleId"
  >
    <h3 :id="titleId" class="text-sm font-medium text-slate-600">
      {{ title }}
    </h3>
    <p class="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
      {{ value }}
    </p>
    <p class="mt-1 text-sm text-slate-500">
      {{ description }}
    </p>
    <div class="mt-4 flex justify-end">
      <span
        class="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600"
        aria-hidden="true"
      >
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </span>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: String, required: true },
  description: { type: String, default: '' }
})

const titleId = computed(() => `retention-${Math.random().toString(36).slice(2, 9)}`)
</script>
