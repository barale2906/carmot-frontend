<template>
  <!-- Hoja tipo carta: aproxima el PDF final generado con dompdf -->
  <div class="rounded-[14px] border border-black/10 bg-slate-100 p-4 sm:p-6">
    <article class="mx-auto max-w-[816px] bg-white px-8 py-10 shadow-sm sm:px-12">
      <div
        v-if="anulado"
        class="mb-4 border-2 border-red-700 p-2 text-center text-sm font-bold uppercase text-red-700"
      >
        Documento anulado
        <small v-if="motivoAnulacion" class="block text-xs font-normal normal-case">{{ motivoAnulacion }}</small>
      </div>
      <p v-if="!html" class="py-12 text-center text-sm text-slate-400">{{ vacio }}</p>
      <!-- HTML producido por el backend a partir de plantillas redactadas por administradores -->
      <div
        v-else
        class="doc-contenido"
        :class="{ 'doc-contenido--anulado': anulado }"
        v-html="html"
      />
    </article>
  </div>
</template>

<script setup>
import '@/assets/styles/documentacion.css'

defineProps({
  html:            { type: String, default: '' },
  anulado:         { type: Boolean, default: false },
  motivoAnulacion: { type: String, default: '' },
  vacio:           { type: String, default: 'Sin contenido.' },
})
</script>
