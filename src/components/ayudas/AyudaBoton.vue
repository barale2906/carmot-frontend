<template>
  <!-- Réplica visual (no interactiva) de un botón de la aplicación, para que el lector lo reconozca -->
  <span
    class="mx-0.5 inline-flex select-none items-center gap-1.5 whitespace-nowrap rounded-lg align-middle text-xs font-medium"
    :class="clases"
  >
    <NavIcon v-if="icono" :name="icono" class="!size-3.5" />
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  icono:    { type: String, default: '' },
  variante: { type: String, default: 'primario', validator: (v) => ['primario', 'secundario', 'icono'].includes(v) }
})

const clases = computed(() => ({
  primario:   'bg-[#213360] px-2.5 py-1 text-white',
  secundario: 'border border-slate-200 bg-white px-2.5 py-1 text-slate-700',
  icono:      'border border-slate-200 bg-white p-1 text-slate-600'
}[props.variante]))
</script>
