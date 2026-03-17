<template>
  <div class="modulo-arbol">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="text-sm text-slate-500">Cargando estructura del módulo...</span>
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
      <button
        type="button"
        class="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
        @click="loadArbol"
      >
        Reintentar
      </button>
    </div>

    <div v-else-if="modulo" class="space-y-3">
      <!-- Cabecera del módulo -->
      <div class="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <h3 class="font-semibold text-slate-900">{{ modulo.nombre }}</h3>
          <span class="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            {{ modulo.duracion != null ? `${modulo.duracion}h` : '—' }} total
          </span>
        </div>
        <p v-if="modulo.status_text" class="mt-1 text-xs text-slate-500">
          {{ modulo.status_text }}
        </p>
      </div>

      <!-- Tópicos y temas -->
      <div v-if="modulo.topicos?.length" class="space-y-2">
        <div
          v-for="topico in modulo.topicos"
          :key="topico.id"
          class="rounded-lg border border-black/10 bg-slate-50"
        >
          <!-- Tópico -->
          <div class="flex items-start justify-between gap-2 px-4 py-2.5">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-slate-900">{{ topico.nombre }}</p>
              <p v-if="topico.descripcion" class="mt-0.5 text-xs text-slate-500">
                {{ topico.descripcion }}
              </p>
            </div>
            <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {{ topico.duracion != null ? `${topico.duracion}h` : '—' }}
            </span>
          </div>

          <!-- Temas del tópico -->
          <div
            v-if="topico.temas?.length"
            class="border-t border-black/5 bg-white/50"
          >
            <div
              v-for="tema in topico.temas"
              :key="tema.id"
              class="flex items-start justify-between gap-2 border-b border-black/5 px-4 py-2 pl-6 last:border-b-0"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-slate-800">{{ tema.nombre }}</p>
                <p v-if="tema.descripcion" class="mt-0.5 text-xs text-slate-500">
                  {{ tema.descripcion }}
                </p>
              </div>
              <span class="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {{ tema.duracion != null ? `${tema.duracion}h` : '—' }}
              </span>
            </div>
          </div>
          <div v-else class="border-t border-black/5 px-4 py-2 pl-6">
            <p class="text-xs text-slate-400">Sin temas asignados</p>
          </div>
        </div>
      </div>

      <div v-else class="rounded-lg border border-black/10 bg-slate-50 px-4 py-6 text-center">
        <p class="text-sm text-slate-500">Sin tópicos asignados</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import moduloService from '@/services/moduloService.js'

const props = defineProps({
  /** ID del módulo a cargar */
  moduloId: {
    type: Number,
    required: true
  }
})

const modulo = ref(null)
const loading = ref(false)
const error = ref('')

async function loadArbol() {
  if (!props.moduloId) return
  loading.value = true
  error.value = ''
  modulo.value = null
  try {
    const res = await moduloService.getArbol(props.moduloId)
    modulo.value = res.data ?? res
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar la estructura del módulo.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.moduloId,
  (id) => {
    if (id) loadArbol()
    else {
      modulo.value = null
      error.value = ''
    }
  },
  { immediate: true }
)
</script>
