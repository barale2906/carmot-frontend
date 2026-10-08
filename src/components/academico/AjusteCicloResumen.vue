<template>
  <div class="flex flex-col gap-2">
    <dl class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
      <div class="rounded-lg bg-slate-50 px-3 py-2">
        <dt class="text-slate-500">Fecha fin {{ fija ? 'fijada' : 'calculada' }}</dt>
        <dd class="mt-0.5 font-medium text-slate-900">{{ formatFechaCorta(fechaFin) }}</dd>
      </div>
      <div class="rounded-lg bg-slate-50 px-3 py-2">
        <dt class="text-slate-500" title="Fecha en que terminaría dictando el 100 % de las horas">Fin al 100 %</dt>
        <dd class="mt-0.5 font-medium text-slate-900">{{ formatFechaCorta(fechaFinTeorica) }}</dd>
      </div>
      <div class="rounded-lg px-3 py-2" :class="porcentajeClase">
        <dt class="opacity-80">Horas dictadas</dt>
        <dd class="mt-0.5 font-medium">{{ porcentaje !== null ? `${formatNumero(porcentaje)} %` : '—' }}</dd>
      </div>
      <div v-if="horasSemanaSugeridas" class="rounded-lg bg-slate-50 px-3 py-2">
        <dt class="text-slate-500" title="Intensidad semanal aproximada para dictar el 100 % en el mismo tiempo">Para el 100 %</dt>
        <dd class="mt-0.5 font-medium text-slate-900">{{ formatNumero(horasSemanaSugeridas) }} h/semana</dd>
      </div>
    </dl>

    <p
      v-if="advertencia"
      class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
      role="alert"
    >
      <NavIcon name="pendientes" class="mt-0.5 size-3.5 shrink-0" />
      {{ advertencia }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon              from '@/components/icons/NavIcon.vue'
import { formatFechaCorta } from '@/utils/calendario.js'

/**
 * Resumen del ajuste de horas de un ciclo con fecha fin fija: fecha fijada frente a la
 * fecha teórica al 100 %, porcentaje de horas que se dictarán y advertencia del backend.
 * `factor` en 0–1 (null = la fecha no alcanza ni para una sesión por módulo).
 */
const props = defineProps({
  fija:                 { type: Boolean, default: true },
  fechaFin:             { type: String, default: null },
  fechaFinTeorica:      { type: String, default: null },
  factor:               { type: Number, default: null },
  horasSemanaSugeridas: { type: Number, default: null },
  advertencia:          { type: String, default: null }
})

const porcentaje = computed(() => (props.factor === null ? null : Math.round(props.factor * 10000) / 100))

const porcentajeClase = computed(() => {
  if (porcentaje.value === null) return 'bg-amber-50 text-amber-800'
  if (porcentaje.value >= 100)   return 'bg-emerald-50 text-emerald-800'
  return props.advertencia ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
})

function formatNumero(valor) {
  return Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })
}
</script>
