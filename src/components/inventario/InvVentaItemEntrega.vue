<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <!-- Semáforo de disponibilidad (informativo: nunca bloquea la venta) -->
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="TONOS[estado.tono]"
      >
        <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {{ estado.texto }}
      </span>

      <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600" title="El estudiante paga hoy y recoge el producto otro día">
        <input
          type="checkbox"
          class="rounded"
          :checked="!entregar"
          @change="emit('update:entregar', !$event.target.checked)"
        />
        No entregar ahora
      </label>

      <label class="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600" title="El estudiante no quiere recibir el producto por partes: se entrega todo junto o nada">
        <input
          type="checkbox"
          class="rounded"
          :checked="entregaCompleta"
          @change="emit('update:entregaCompleta', $event.target.checked)"
        />
        Solo entrega completa
      </label>

      <button
        v-if="componentes.length"
        type="button"
        class="ml-auto flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
        :aria-expanded="expandido"
        @click="expandido = !expandido"
      >
        {{ expandido ? 'Ocultar componentes' : `Ver componentes (${componentes.length})` }}
      </button>
    </div>

    <!-- Detalle por componente del kit -->
    <ul v-if="expandido && componentes.length" class="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      <li
        v-for="comp in componentes"
        :key="comp.kit_componente_id"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs"
      >
        <span class="min-w-[8rem] flex-1 font-medium text-slate-800">
          {{ comp.componente_nombre }}
          <span class="font-normal text-slate-400">× {{ comp.cantidad_requerida }}</span>
        </span>

        <select
          v-if="comp.componente_tipo === 'grupo'"
          :value="variantes[comp.kit_componente_id] ?? ''"
          class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :aria-label="`Variante de ${comp.componente_nombre}`"
          @change="seleccionarVariante(comp.kit_componente_id, $event.target.value)"
        >
          <option value="">Elige variante...</option>
          <option v-for="v in comp.variantes" :key="v.id" :value="v.id">
            {{ v.nombre }} (stock: {{ v.stock_disponible }})
          </option>
        </select>
        <span v-else-if="comp.stock_disponible != null" class="text-slate-500">Stock: {{ comp.stock_disponible }}</span>

        <span class="rounded-full px-2 py-0.5 font-medium" :class="TONOS[estadoEntregaComponente(comp).tono]">
          {{ estadoEntregaComponente(comp).texto }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * Controles de entrega de una línea del carrito de venta de inventario:
 * semáforo de stock, checks "No entregar ahora" / "Solo entrega completa" y,
 * para kits, el detalle por componente con selector de variante.
 */
import { ref, computed, watch } from 'vue'
import { estadoEntregaItem, estadoEntregaComponente } from '@/composables/useDisponibilidadVenta.js'

const props = defineProps({
  disponibilidad:  { type: Object,  default: null },
  entregar:        { type: Boolean, default: true },
  entregaCompleta: { type: Boolean, default: false },
  variantes:       { type: Object,  default: () => ({}) }, // { [kit_componente_id]: producto_id }
})

const emit = defineEmits(['update:entregar', 'update:entregaCompleta', 'update:variantes'])

const TONOS = {
  ok:        'bg-green-100 text-green-800',
  parcial:   'bg-amber-100 text-amber-800',
  pendiente: 'bg-slate-200 text-slate-700',
  variante:  'bg-blue-100 text-blue-800',
  diferido:  'bg-slate-100 text-slate-600',
  cargando:  'bg-slate-100 text-slate-400',
}

const componentes = computed(() => props.disponibilidad?.componentes ?? [])

const estado = computed(() => estadoEntregaItem(
  { entregar: props.entregar, entrega_completa: props.entregaCompleta },
  props.disponibilidad,
))

// Se despliega solo cuando hay que elegir variante; si no, queda plegado para no alargar el carrito
const expandido = ref(false)
const pideVariante = computed(() => componentes.value.some(c => c.componente_tipo === 'grupo' && !props.variantes[c.kit_componente_id]))
watch(pideVariante, (pide) => { if (pide) expandido.value = true }, { immediate: true })

function seleccionarVariante(kitComponenteId, productoId) {
  emit('update:variantes', { ...props.variantes, [kitComponenteId]: productoId ? Number(productoId) : null })
}
</script>
