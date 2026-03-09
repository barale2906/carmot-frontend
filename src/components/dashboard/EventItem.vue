<template>
  <article class="flex gap-4 rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50">
    <div
      class="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-800 px-2 py-2 text-white"
      aria-hidden="true"
    >
      <span class="text-xs font-semibold uppercase tracking-wider">
        {{ month }}
      </span>
      <span class="text-xl font-bold leading-tight">
        {{ day }}
      </span>
    </div>
    <div class="min-w-0 flex-1">
      <h4 class="font-medium text-slate-900">
        {{ title }}
      </h4>
      <p class="mt-0.5 text-sm text-slate-500">
        {{ subtitle }}
      </p>
    </div>
  </article>
</template>

<script setup>
defineProps({
  month: { type: String, required: true },
  day: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' }
})
</script>
