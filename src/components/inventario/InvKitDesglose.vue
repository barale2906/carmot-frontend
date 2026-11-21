<template>
  <div class="rounded-lg border border-purple-200 bg-purple-50 p-3">
    <p class="text-xs font-medium text-purple-800">Componentes del kit — precio unitario × cantidad según los precios ya guardados en esta lista</p>

    <p v-if="cargando" class="mt-1.5 text-xs text-purple-600">Calculando desglose...</p>
    <p v-else-if="!desglose?.componentes?.length" class="mt-1.5 text-xs text-purple-600">Este kit no tiene componentes definidos.</p>

    <template v-else>
      <table class="mt-2 w-full text-xs">
        <thead>
          <tr class="text-left text-purple-700">
            <th class="py-1 font-medium">Componente</th>
            <th class="py-1 text-center font-medium">Cant.</th>
            <th class="py-1 text-right font-medium">P. unitario</th>
            <th class="py-1 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-purple-100">
          <tr v-for="c in desglose.componentes" :key="c.kit_componente_id" class="align-top text-slate-700">
            <td class="py-1.5">
              <span class="font-medium">{{ c.nombre }}</span>
              <span v-if="c.tipo === 'grupo'" class="ml-1 text-[10px] uppercase text-purple-500">grupo</span>
              <!-- Detalle de variantes solo cuando aporta: precios distintos o faltantes -->
              <div v-if="c.variantes.length && (!c.completo || c.precio_unitario_min !== c.precio_unitario_max)" class="mt-0.5 flex flex-wrap gap-1">
                <span
                  v-for="v in c.variantes"
                  :key="v.id"
                  :class="v.precio == null ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600'"
                  class="rounded px-1.5 py-0.5 text-[10px]"
                >{{ v.nombre }}: {{ v.precio == null ? 'sin precio' : formatCurrency(v.precio) }}</span>
              </div>
            </td>
            <td class="py-1.5 text-center">{{ c.cantidad }}</td>
            <td class="py-1.5 text-right font-mono">{{ formatRango(c.precio_unitario_min, c.precio_unitario_max) }}</td>
            <td class="py-1.5 text-right font-mono" :class="c.completo ? '' : 'text-red-600'">{{ formatRango(c.subtotal_min, c.subtotal_max) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t border-purple-200 text-purple-900">
            <td colspan="3" class="pt-1.5 font-semibold">Suma de componentes</td>
            <td class="pt-1.5 text-right font-mono font-semibold">{{ formatRango(desglose.total_min, desglose.total_max) }}</td>
          </tr>
        </tfoot>
      </table>

      <p v-if="!desglose.completo" class="mt-2 text-xs text-red-600">
        Hay componentes o variantes sin precio en esta lista; la suma no los incluye. Guarda el avance tras fijar sus precios y vuelve a abrir el desglose.
      </p>
      <p v-if="desglose.total_min !== desglose.total_max" class="mt-1 text-xs text-purple-600">
        El total es un rango porque las variantes de algún grupo tienen precios distintos.
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <span v-if="diferencia" class="text-xs" :class="diferencia.clase">{{ diferencia.texto }}</span>
        <span class="flex-1" />
        <button
          v-for="total in totalesSugeridos"
          :key="total"
          type="button"
          class="rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          @click="emit('usar-precio', total)"
        >Usar {{ formatCurrency(total) }}</button>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * Desglose de un kit en una lista de precios: precio unitario × cantidad de cada componente,
 * con rango min/max cuando un grupo tiene variantes con precios distintos. Sugiere la suma
 * como precio del kit y compara contra el precio digitado.
 *
 * @prop {number} listaId  Lista ya guardada de la que se toman los precios de los componentes
 * @prop {number} kitId
 * @prop {number|string} precio  Precio digitado para el kit (para comparar con la suma)
 * @emits usar-precio  Total sugerido elegido por el usuario
 */
import { ref, computed, onMounted } from 'vue'
import invPrecioService from '@/services/invPrecioService.js'

const props = defineProps({
  listaId: { type: Number, required: true },
  kitId:   { type: Number, required: true },
  precio:  { type: [Number, String], default: '' },
})
const emit = defineEmits(['usar-precio'])

const desglose = ref(null)
const cargando = ref(false)

const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

const formatRango = (min, max) => {
  if (min == null) return '—'
  return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`
}

const totalesSugeridos = computed(() => {
  const d = desglose.value
  if (!d?.componentes?.length || !d.total_max) return []
  return d.total_min === d.total_max ? [d.total_min] : [d.total_min, d.total_max]
})

const diferencia = computed(() => {
  const d = desglose.value
  const precio = Number(props.precio)
  if (!d?.total_max || !props.precio || Number.isNaN(precio)) return null
  if (precio >= d.total_min && precio <= d.total_max) return { texto: 'Igual a la suma de componentes', clase: 'text-slate-500' }
  const base = precio < d.total_min ? d.total_min : d.total_max
  const pct  = Math.round(((precio - base) / base) * 100)
  return precio < base
    ? { texto: `Descuento de ${formatCurrency(base - precio)} (${Math.abs(pct)}%) vs. componentes`, clase: 'text-green-700' }
    : { texto: `${formatCurrency(precio - base)} (${pct}%) por encima de los componentes`, clase: 'text-amber-700' }
})

onMounted(async () => {
  cargando.value = true
  try {
    const res = await invPrecioService.getDesgloseKit(props.listaId, props.kitId)
    desglose.value = res.data ?? null
  } catch {
    desglose.value = null
  } finally {
    cargando.value = false
  }
})
</script>
