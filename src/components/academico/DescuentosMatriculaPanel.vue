<template>
  <div class="rounded-lg border border-slate-200 bg-white text-sm">
    <div class="border-b border-slate-100 px-4 py-2.5">
      <h4 class="text-sm font-semibold text-slate-800">Descuentos aplicables</h4>
      <p class="text-xs text-slate-500">Se activan automáticamente según la sede, el curso y la jornada elegidos.</p>
    </div>

    <p v-if="loading" class="px-4 py-3 text-slate-500">Consultando descuentos...</p>

    <p v-else-if="!preview" class="px-4 py-3 text-slate-400">
      Elige el curso, el ciclo y el precio para ver los descuentos que aplican.
    </p>

    <div v-else class="space-y-3 px-4 py-3">
      <!-- Total del curso -->
      <div class="flex items-center justify-between">
        <span class="text-slate-600">Total del curso</span>
        <span class="font-semibold text-slate-900">$ {{ formatMoney(preview.total_curso) }}</span>
      </div>

      <!-- Detalle de cada descuento de matrícula -->
      <ul v-if="preview.descuentos.length" class="space-y-2">
        <li
          v-for="d in preview.descuentos"
          :key="d.id"
          class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-emerald-800">{{ d.nombre }}</p>
              <p class="text-xs text-emerald-700">
                {{ d.tipo === 'porcentual' ? `${d.valor} %` : `$ ${formatMoney(d.valor)}` }}
                sobre la matrícula
                · {{ d.permite_acumulacion ? 'acumulable' : 'no acumulable' }}
              </p>
              <p v-if="d.descripcion" class="mt-0.5 text-xs text-emerald-700">{{ d.descripcion }}</p>
            </div>
            <span class="shrink-0 font-semibold text-emerald-800">− $ {{ formatMoney(d.valor_descuento) }}</span>
          </div>
        </li>
      </ul>
      <p v-else class="rounded-md bg-slate-50 px-3 py-2 text-slate-500">
        No hay descuentos de matrícula que apliquen a esta sede, curso y jornada.
      </p>

      <!-- Totales con descuento -->
      <dl v-if="preview.descuentos.length" class="space-y-1 border-t border-slate-100 pt-3">
        <div class="flex items-center justify-between">
          <dt class="text-slate-600">Valor de la matrícula</dt>
          <dd class="text-slate-900">
            <span class="mr-2 text-slate-400 line-through">$ {{ formatMoney(preview.valor_matricula) }}</span>
            $ {{ formatMoney(preview.valor_matricula_con_descuento) }}
          </dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-slate-600">Total del descuento</dt>
          <dd class="font-medium text-emerald-700">− $ {{ formatMoney(preview.total_descuento) }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="font-medium text-slate-800">Total del curso con descuento</dt>
          <dd class="font-semibold text-slate-900">$ {{ formatMoney(preview.total_curso_con_descuento) }}</dd>
        </div>
      </dl>

      <!-- Pronto pago: se aplica después, al pagar las cuotas -->
      <div
        v-if="preview.descuentos_pago_anticipado.length"
        class="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800"
      >
        <p class="font-medium">Por pronto pago (se aplican al pagar las cuotas)</p>
        <ul class="mt-1 list-inside list-disc">
          <li v-for="d in preview.descuentos_pago_anticipado" :key="d.id">
            {{ d.nombre }}:
            {{ d.tipo === 'porcentual' ? `${d.valor} %` : `$ ${formatMoney(d.valor)}` }}
            <template v-if="d.dias_anticipacion"> pagando con {{ d.dias_anticipacion }} días de anticipación</template>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatMoney } from '@/utils/formatters.js'

defineProps({
  /** Respuesta de `POST /academico/matriculas/precalcular-descuentos` (data); null si aún no hay consulta. */
  preview: { type: Object,  default: null },
  loading: { type: Boolean, default: false }
})
</script>
