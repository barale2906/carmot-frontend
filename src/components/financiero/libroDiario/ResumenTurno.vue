<template>
  <div class="flex flex-col gap-4">
    <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div
        v-for="fila in filas"
        :key="fila.clave"
        class="rounded-lg border border-black/10 bg-slate-50 px-3 py-2"
      >
        <dt class="text-xs text-slate-500">{{ fila.label }}</dt>
        <dd class="text-sm font-semibold text-slate-900">{{ formatCOP(fila.valor) }}</dd>
      </div>
    </dl>

    <div v-if="medios.length" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
            <th class="py-1.5 pr-3 font-semibold">Medio de pago</th>
            <template v-if="porOrigen">
              <th class="py-1.5 pr-3 text-right font-semibold">Académico</th>
              <th class="py-1.5 pr-3 text-right font-semibold">Inventario</th>
              <th class="py-1.5 pr-3 text-right font-semibold">Otros ingresos</th>
            </template>
            <th class="py-1.5 pr-3 text-right font-semibold">Total ingresos</th>
            <th class="py-1.5 text-right font-semibold">Egresos</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="m in medios"
            :key="m.medio"
            class="border-b border-slate-100"
            :class="m.ingresos || m.egresos ? 'text-slate-900' : 'text-slate-400'"
          >
            <td class="py-1.5 pr-3">{{ m.label }}</td>
            <template v-if="porOrigen">
              <td class="py-1.5 pr-3 text-right">{{ formatCOP(m.academico) }}</td>
              <td class="py-1.5 pr-3 text-right">{{ formatCOP(m.inventario) }}</td>
              <td class="py-1.5 pr-3 text-right">{{ formatCOP(m.otros) }}</td>
            </template>
            <td class="py-1.5 pr-3 text-right font-medium">{{ formatCOP(m.ingresos) }}</td>
            <td class="py-1.5 text-right">{{ formatCOP(m.egresos) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-semibold text-slate-900">
            <td class="py-1.5 pr-3">Total</td>
            <template v-if="porOrigen">
              <td class="py-1.5 pr-3 text-right">{{ formatCOP(totales.academico) }}</td>
              <td class="py-1.5 pr-3 text-right">{{ formatCOP(totales.inventario) }}</td>
              <td class="py-1.5 pr-3 text-right">{{ formatCOP(totales.otros) }}</td>
            </template>
            <td class="py-1.5 pr-3 text-right">{{ formatCOP(totales.ingresos) }}</td>
            <td class="py-1.5 text-right">{{ formatCOP(totales.egresos) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div
      v-if="resumen?.efectivo_esperado != null"
      class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <span class="text-sm font-medium text-blue-900">Efectivo esperado en caja</span>
      <span class="text-lg font-semibold text-blue-900">{{ formatCOP(resumen?.efectivo_esperado) }}</span>
    </div>

    <p v-if="resumen?.transferencias_pendientes?.cantidad" class="text-xs text-slate-500">
      {{ resumen.transferencias_pendientes.cantidad }} transferencia(s) por aprobar
      ({{ formatCOP(resumen.transferencias_pendientes.valor) }}) no se incluyen hasta su aprobación.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { filasResumenTurno, filasMediosPago, formatCOP } from '@/utils/libroDiario.js'

/**
 * Resumen (arqueo) de un turno de caja: totales por origen, desglose de todos los
 * medios de pago con los ingresos separados en académico, inventario y otros, y,
 * solo para quien supervisa cajas, el efectivo esperado (el backend no lo envía
 * al cajero, que cierra con conteo ciego).
 */
const props = defineProps({
  resumen: { type: Object, default: null },
  /** Etiquetas de medios de pago { efectivo: 'Efectivo', ... } */
  medios: { type: Object, default: () => ({}) },
})

const filas = computed(() => filasResumenTurno(props.resumen))
const desglose = computed(() => filasMediosPago(props.resumen, props.medios))
const medios = computed(() => desglose.value.filas)
const totales = computed(() => desglose.value.totales)
const porOrigen = computed(() => desglose.value.porOrigen)
</script>
