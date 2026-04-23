<template>
  <span class="inline-flex shrink-0 items-center" :class="wrapperClass">
    <button
      type="button"
      class="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
      :title="text"
      :aria-label="'Ayuda: ' + text"
      @click.prevent
    >
      <NavIcon name="help" :class="iconClass" />
    </button>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  /** Texto breve mostrado al pasar el cursor (atributo title). */
  text: { type: String, required: true },
  /** Icono más pequeño para cabeceras de tabla u otros espacios reducidos. */
  compact: { type: Boolean, default: false }
})

const wrapperClass = 'align-middle'
const iconClass = computed(() =>
  props.compact ? 'size-3 shrink-0' : 'size-3.5 shrink-0 sm:size-4'
)
</script>
