<template>
  <aside class="flex gap-3 rounded-xl border p-4" :class="[estilo.caja, estilo.texto]" :role="tipo === 'atencion' ? 'alert' : 'note'">
    <span class="text-lg leading-none" aria-hidden="true">{{ estilo.emoji }}</span>
    <div class="text-sm">
      <p class="font-semibold">{{ titulo || estilo.titulo }}</p>
      <div class="mt-0.5 opacity-90"><slot /></div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { tono } from './ayudaTonos.js'

const props = defineProps({
  tipo:   { type: String, default: 'consejo', validator: (v) => ['consejo', 'atencion', 'info'].includes(v) },
  titulo: { type: String, default: '' }
})

const TIPOS = {
  consejo:  { tono: 'verde', emoji: '💡', titulo: 'Consejo' },
  atencion: { tono: 'ambar', emoji: '⚠️', titulo: 'Atención' },
  info:     { tono: 'azul',  emoji: 'ℹ️', titulo: 'Para tener en cuenta' }
}

const estilo = computed(() => {
  const tipo = TIPOS[props.tipo]
  return { ...tono(tipo.tono), emoji: tipo.emoji, titulo: tipo.titulo }
})
</script>
