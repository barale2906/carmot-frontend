<template>
  <section :id="id" class="scroll-mt-24 rounded-[14px] border border-black/10 bg-white p-6">
    <header class="mb-4 flex items-start gap-3">
      <span
        v-if="numero"
        class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#213360] text-sm font-semibold text-white"
      >
        {{ numero }}
      </span>
      <div>
        <h2 class="text-lg font-semibold text-slate-900">{{ titulo }}</h2>
        <p v-if="descripcion" class="mt-0.5 text-sm text-slate-500">{{ descripcion }}</p>
      </div>
    </header>
    <div class="space-y-4 text-sm leading-relaxed text-slate-700">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  id:          { type: String, required: true },
  titulo:      { type: String, required: true },
  descripcion: { type: String, default: '' },
  numero:      { type: [String, Number], default: '' }
})
</script>
