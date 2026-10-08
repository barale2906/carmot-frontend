<template>
  <div
    v-if="ciclos.length"
    class="flex items-start gap-3 rounded-[14px] border border-blue-200 bg-blue-50 p-4"
    role="status"
  >
    <NavIcon name="calendario" class="mt-0.5 size-4 shrink-0 text-blue-600" />
    <div class="min-w-0 flex-1 text-sm text-blue-900">
      <p class="font-medium">
        {{ ciclos.length === 1 ? 'Se recalculó 1 ciclo' : `Se recalcularon ${ciclos.length} ciclos` }} por el cambio en el calendario
      </p>
      <ul class="mt-2 space-y-1 text-xs">
        <li v-for="ciclo in ciclos" :key="ciclo.id">
          <span class="font-medium">{{ ciclo.nombre }}</span>:
          <template v-if="ciclo.fecha_fin_anterior !== ciclo.fecha_fin">
            fecha fin {{ formatFechaCorta(ciclo.fecha_fin_anterior) }} → <strong>{{ formatFechaCorta(ciclo.fecha_fin) }}</strong>
          </template>
          <template v-else>fecha fin sin cambios ({{ formatFechaCorta(ciclo.fecha_fin) }})</template>
          <template v-if="ciclo.clases_realineadas">
            · {{ ciclo.clases_realineadas }} {{ ciclo.clases_realineadas === 1 ? 'clase realineada' : 'clases realineadas' }}
          </template>
        </li>
      </ul>
    </div>
    <button
      type="button"
      class="shrink-0 text-sm font-medium text-blue-700 underline"
      @click="emit('close')"
    >
      Cerrar
    </button>
  </div>
</template>

<script setup>
import NavIcon              from '@/components/icons/NavIcon.vue'
import { formatFechaCorta } from '@/utils/calendario.js'

/**
 * Aviso con los ciclos cuya planeación cambió tras modificar el calendario laboral
 * (`meta.ciclos_recalculados` de la API).
 */
defineProps({
  ciclos: { type: Array, default: () => [] }
})

const emit = defineEmits(['close'])
</script>
