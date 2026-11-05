<template>
  <div class="min-w-[200px]">
    <template v-if="estudiante?.en_mora">
      <span class="inline-flex whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
        En mora · $ {{ formatMoney(estudiante.saldo_vencido) }}
      </span>
      <button
        v-if="cuotas.length"
        type="button"
        class="mt-1 flex items-center gap-1 text-xs text-red-700 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400"
        :aria-expanded="abierto"
        @click="abierto = !abierto"
      >
        {{ resumen }}
        <span aria-hidden="true">{{ abierto ? '▴' : '▾' }}</span>
      </button>
      <ul v-if="abierto" class="mt-1 space-y-1 rounded border border-red-200 bg-red-50 p-2 text-xs text-slate-700">
        <li v-for="cuota in cuotas" :key="cuota.cartera_id" data-test="mora-cuota">
          <div class="font-medium text-slate-900">
            {{ etiquetaCuota(cuota) }} · $ {{ formatMoney(cuota.saldo) }}
          </div>
          <div class="text-slate-600">
            <span v-if="cuota.curso">{{ cuota.curso }} · </span>
            Venció {{ formatFechaCorta(cuota.fecha_vencimiento) }} · {{ textoDias(cuota.dias_mora) }}
          </div>
        </li>
      </ul>
    </template>
    <span v-else class="text-xs text-slate-500">Al día</span>

    <span
      v-if="estudiante?.transferencias_pendientes > 0"
      class="mt-1 flex w-fit whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-300"
      :title="`${estudiante.transferencias_pendientes} transferencia(s) pendiente(s) de aprobación`"
    >
      Transferencia por aprobar · $ {{ formatMoney(estudiante.valor_transferencias_pendientes) }}
    </span>
  </div>
</template>

<script setup>
/**
 * Estado de cartera de un estudiante en las listas de asistencia: mora (saldo vencido,
 * cuotas vencidas y días de mora, con detalle desplegable por cuota) y transferencias
 * pendientes de aprobación.
 *
 * Espera los campos que devuelve la API de asistencia: en_mora, saldo_vencido, dias_mora,
 * mora_detalle[] (cartera_id, concepto, numero_cuota, curso, fecha_vencimiento, dias_mora,
 * saldo), transferencias_pendientes y valor_transferencias_pendientes.
 */
import { ref, computed } from 'vue'
import { formatMoney } from '@/utils/formatters.js'
import { formatFechaCorta } from '@/utils/calendario.js'

const props = defineProps({
  /** Estudiante (lista de asistencia) o registro de asistencia con los campos de mora. */
  estudiante: { type: Object, default: null },
})

const abierto = ref(false)

const cuotas = computed(() => props.estudiante?.mora_detalle ?? [])

const resumen = computed(() => {
  const n = cuotas.value.length
  return `${n} ${n === 1 ? 'cuota vencida' : 'cuotas vencidas'} · ${textoDias(props.estudiante?.dias_mora ?? 0)}`
})

/** "Matrícula" para la cuota 0; "<concepto> · cuota N" para las demás. */
function etiquetaCuota(cuota) {
  return cuota.numero_cuota > 0 ? `${cuota.concepto} · cuota ${cuota.numero_cuota}` : cuota.concepto
}

function textoDias(dias) {
  return `${dias} ${dias === 1 ? 'día' : 'días'} de mora`
}
</script>
