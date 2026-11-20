<template>
  <!-- Contenedor de un campo de filtro: evita que el control se encoja en pantallas medianas/pequeñas -->
  <div :class="sizeClass">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Envoltorio responsive para campos dentro de una barra de filtros
 * (`flex flex-wrap items-end gap-4`).
 *
 * @prop {'search'|'select'|'date'} size - search: buscador con ancho mínimo (16rem) y máximo (xs);
 *   select: ancho fijo 180px; date: ancho fijo 170px. En móvil siempre ocupa todo el ancho.
 */
const props = defineProps({
  size: { type: String, default: 'search', validator: (v) => ['search', 'select', 'date'].includes(v) }
})

const SIZE_CLASSES = {
  search: 'min-w-0 flex-1 sm:min-w-[16rem] sm:max-w-xs',
  select: 'w-full sm:w-[180px]',
  date: 'w-full sm:w-[170px]'
}

const sizeClass = computed(() => SIZE_CLASSES[props.size])
</script>
