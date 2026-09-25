<template>
  <figure class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <!-- Cajas unidas por flechas: horizontales en escritorio, verticales en móvil -->
    <ol class="flex flex-col items-stretch gap-2 md:flex-row md:items-stretch">
      <template v-for="(paso, idx) in pasos" :key="idx">
        <li class="flex flex-1 flex-col rounded-xl border p-3" :class="[tono(paso.tono).caja, tono(paso.tono).texto]">
          <div class="flex items-center gap-2">
            <span class="flex size-7 shrink-0 items-center justify-center rounded-full" :class="tono(paso.tono).marca">
              <NavIcon v-if="paso.icono" :name="paso.icono" class="!size-4" />
              <span v-else class="text-xs font-semibold">{{ idx + 1 }}</span>
            </span>
            <p class="text-sm font-semibold leading-tight">{{ paso.titulo }}</p>
          </div>
          <p v-if="paso.texto" class="mt-2 text-xs leading-snug opacity-80">{{ paso.texto }}</p>
        </li>
        <li v-if="idx < pasos.length - 1" class="flex items-center justify-center text-slate-400" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-5 rotate-90 md:rotate-0" fill="none">
            <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </li>
      </template>
    </ol>
    <figcaption v-if="leyenda" class="mt-3 text-center text-xs text-slate-500">{{ leyenda }}</figcaption>
  </figure>
</template>

<script setup>
import NavIcon  from '@/components/icons/NavIcon.vue'
import { tono } from './ayudaTonos.js'

defineProps({
  /** Cajas del diagrama: [{ titulo, texto?, tono?, icono? }] — `icono` es un nombre de NavIcon */
  pasos:   { type: Array, required: true },
  leyenda: { type: String, default: '' }
})
</script>
