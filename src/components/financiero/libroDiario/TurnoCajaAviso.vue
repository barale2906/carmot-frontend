<template>
  <div
    v-if="!cargando && !tieneTurno"
    class="flex flex-wrap items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50 p-4"
    role="alert"
  >
    <NavIcon name="pendientes" class="size-5 shrink-0 text-amber-600" />
    <p class="min-w-0 flex-1 text-sm text-amber-800">
      No tiene un turno de caja abierto. Para generar pagos debe abrir su turno registrando la base inicial.
    </p>
    <router-link
      to="/financiero/caja"
      class="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
    >
      Ir a mi caja
    </router-link>
  </div>
  <p v-else-if="tieneTurno" class="text-xs text-slate-500">
    Turno de caja abierto en <strong>{{ turno.sede?.nombre }}</strong> desde {{ turno.abierto_at }}.
  </p>
</template>

<script setup>
import { onMounted } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import { useTurnoCaja } from '@/composables/useTurnoCaja.js'

/**
 * Aviso para las pantallas que generan recibos: indica si el usuario tiene
 * un turno de caja abierto y, si no, lo lleva a abrirlo.
 */
const { turno, cargando, tieneTurno, cargarTurno } = useTurnoCaja()

onMounted(cargarTurno)
</script>
