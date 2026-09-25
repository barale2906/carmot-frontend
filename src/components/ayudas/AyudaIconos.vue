<template>
  <!-- Leyenda de los íconos de acción que aparecen en la primera columna de las tablas -->
  <dl class="grid gap-2 sm:grid-cols-2">
    <div v-for="item in items" :key="item.icono + item.nombre" class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <dt class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200" :class="item.clase ?? 'text-slate-600'">
        <NavIcon :name="item.icono" class="!size-4" />
      </dt>
      <dd>
        <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
        <p class="text-xs text-slate-500">{{ item.texto }}</p>
      </dd>
    </div>
  </dl>
</template>

<script setup>
import NavIcon from '@/components/icons/NavIcon.vue'

defineProps({
  /** [{ icono, nombre, texto, clase? }] — `icono` es un nombre de NavIcon */
  items: { type: Array, required: true }
})
</script>
