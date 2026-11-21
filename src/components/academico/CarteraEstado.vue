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

    <!-- Plazo nuevo de pago acordado: permite el ingreso a clase hasta su fecha compromiso -->
    <div
      v-if="estudiante?.prorroga_pago"
      class="mt-1 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900"
      data-test="prorroga"
    >
      <span class="font-semibold">Plazo acordado hasta {{ formatFechaCorta(estudiante.prorroga_pago.fecha_compromiso) }}</span>
      · {{ textoDiasRestantes(estudiante.prorroga_pago.dias_restantes) }}
      <span class="block text-emerald-800">Puede entrar a clase. Acordó: {{ estudiante.prorroga_pago.registrada_por ?? '—' }}</span>
      <span v-if="estudiante.prorroga_pago.observacion" class="block text-emerald-800">{{ estudiante.prorroga_pago.observacion }}</span>
    </div>
    <button
      v-else-if="estudiante?.en_mora && permitirAcordar"
      type="button"
      class="mt-1 rounded-lg border border-emerald-300 px-2 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      data-test="acordar"
      @click="emit('acordar', estudiante)"
    >
      Acordar plazo de pago
    </button>

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
 * saldo), transferencias_pendientes, valor_transferencias_pendientes y prorroga_pago (plazo
 * nuevo vigente: fecha_compromiso, dias_restantes, registrada_por, observacion).
 *
 * Si está en mora, sin plazo vigente y `permitirAcordar` es true, ofrece
 * "Acordar plazo de pago": emite `acordar` con el estudiante para que la vista abra el modal.
 */
import { ref, computed } from 'vue'
import { formatMoney } from '@/utils/formatters.js'
import { formatFechaCorta } from '@/utils/calendario.js'
import { textoDiasRestantes } from '@/utils/asistencia.js'

const props = defineProps({
  /** Ofrece "Acordar plazo de pago" (la vista lo activa si el usuario tiene `fin_prorrogaPagoCrear`); no aplica al listado histórico. */
  permitirAcordar: { type: Boolean, default: false },
  /** Estudiante (lista de asistencia) o registro de asistencia con los campos de mora. */
  estudiante: { type: Object, default: null },
})

const emit = defineEmits(['acordar'])

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
