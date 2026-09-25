<template>
  <div
    v-if="pagination.lastPage > 1"
    class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
  >
    <p class="text-sm text-slate-500">
      Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} {{ entidad }}
    </p>
    <div class="flex gap-2">
      <button
        type="button"
        :disabled="pagination.currentPage === 1"
        class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('page', pagination.currentPage - 1)"
      >Anterior</button>
      <button
        type="button"
        :disabled="pagination.currentPage === pagination.lastPage"
        class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('page', pagination.currentPage + 1)"
      >Siguiente</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** `{ currentPage, lastPage, total, from, to }` */
  pagination: { type: Object, required: true },
  /** Sustantivo plural del listado ("documentos", "versiones"...). */
  entidad:    { type: String, default: 'registros' },
})

const emit = defineEmits(['page'])
</script>
