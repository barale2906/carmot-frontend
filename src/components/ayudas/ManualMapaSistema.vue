<template>
  <div class="space-y-6">
    <section class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 class="text-lg font-semibold text-slate-900">Mapa del sistema</h2>
      <p class="mt-1 text-sm leading-relaxed text-slate-600">
        Este árbol muestra cómo se conectan los módulos y en qué orden se ponen en marcha: cada rama depende de las
        anteriores. Dentro de cada rama, las flechas indican qué se crea primero. Cuando una etapa tiene manual, use
        <strong>Ver manual</strong> para abrirlo.
      </p>
    </section>

    <!-- Árbol: raíz y un tronco del que salen las etapas en orden -->
    <div class="rounded-[14px] border border-black/10 bg-white p-4 sm:p-6">
      <div class="flex items-center gap-3 rounded-xl border-2 border-[#213360] bg-[#213360] p-3 text-white">
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
          <NavIcon name="security" class="!size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold">Ingreso al sistema</p>
          <p class="text-xs text-white/80">Toda etapa empieza iniciando sesión con un usuario que tenga el permiso de la pantalla.</p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
          @click="emit('abrir-manual', 'ingreso')"
        >
          Ver manual
        </button>
      </div>

      <ol class="ml-4 mt-0 border-l-2 border-slate-200 pl-0 sm:ml-6">
        <li v-for="(etapa, idx) in ETAPAS_SISTEMA" :id="etapa.id" :key="etapa.id" class="relative scroll-mt-24 pl-6 pt-5 sm:pl-8">
          <!-- Rama horizontal desde el tronco -->
          <span class="absolute left-0 top-10 h-0.5 w-5 bg-slate-200 sm:w-7" aria-hidden="true" />

          <article class="rounded-xl border p-4" :class="[tono(etapa.tono).caja]">
            <header class="flex flex-wrap items-start gap-3">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full" :class="tono(etapa.tono).marca">
                <NavIcon :name="etapa.icono" class="!size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold" :class="tono(etapa.tono).texto">{{ idx + 1 }}. {{ etapa.titulo }}</p>
                <p class="text-xs text-slate-600">{{ etapa.descripcion }}</p>
                <p class="mt-1 text-xs text-slate-500">Menú: <span class="font-medium text-slate-700">{{ etapa.menu }}</span></p>
              </div>
              <button
                v-if="etapa.manual"
                type="button"
                class="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="emit('abrir-manual', etapa.manual)"
              >
                Ver manual
              </button>
            </header>

            <p v-if="etapa.requiere?.length" class="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span>Requiere:</span>
              <span v-for="req in etapa.requiere" :key="req" class="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-slate-700">{{ req }}</span>
            </p>

            <!-- Flujos de la etapa: cada uno es una cadena de pasos -->
            <ul class="mt-3 space-y-2">
              <li v-for="flujo in etapa.flujos" :key="flujo.nombre" class="rounded-lg border border-black/5 bg-white p-2.5">
                <p class="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ flujo.nombre }}</p>
                <ol class="flex flex-wrap items-center gap-1.5" :aria-label="`Flujo ${flujo.nombre}`">
                  <template v-for="(paso, p) in flujo.pasos" :key="paso">
                    <li class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800">{{ paso }}</li>
                    <li v-if="p < flujo.pasos.length - 1" class="text-slate-400" aria-hidden="true">
                      <svg viewBox="0 0 24 24" class="size-4" fill="none">
                        <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </li>
                  </template>
                </ol>
              </li>
            </ul>
          </article>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import NavIcon            from '@/components/icons/NavIcon.vue'
import { tono }           from './ayudaTonos.js'
import { ETAPAS_SISTEMA } from './mapaSistema.js'

/**
 * Inicio de Ayudas: un solo árbol con las etapas del sistema en el orden en que se
 * ponen en marcha y los flujos de cada módulo. Desde cada etapa se abre su manual.
 */
const emit = defineEmits(['abrir-manual'])
</script>
