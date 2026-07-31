<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        {{ currentGroup.title }}
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        {{ currentGroup.description }}
      </p>
      <FormulariosNav :items="currentGroup.items" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const route = useRoute()

const groups = [
  {
    routes: [
      '/financiero/tipos-producto',
      '/financiero/productos',
      '/financiero/listas-precios',
      '/financiero/conceptos-pago',
      '/financiero/descuentos',
    ],
    title: 'Listas de precios',
    description: 'Gestiona tipos de producto, productos, listas de precios, conceptos de pago y descuentos.',
    items: [
      { label: 'Tipos de producto', to: '/financiero/tipos-producto' },
      { label: 'Productos',         to: '/financiero/productos' },
      { label: 'Listas de precios', to: '/financiero/listas-precios' },
      { label: 'Conceptos de pago', to: '/financiero/conceptos-pago' },
      { label: 'Descuentos',        to: '/financiero/descuentos' },
    ],
  },
  {
    routes: [
      '/financiero/recibos-pago',
      '/financiero/transferencias-pendientes',
    ],
    title: 'Recibos de pago',
    description: 'Gestiona los recibos de pago y las transferencias bancarias pendientes de aprobación.',
    items: [
      { label: 'Listado de recibos',        to: '/financiero/recibos-pago' },
      { label: 'Transferencias pendientes', to: '/financiero/transferencias-pendientes' },
    ],
  },
  {
    routes: ['/financiero/cartera'],
    title: 'Cartera',
    description: 'Consulta y gestiona la cartera de estudiantes.',
    items: [
      { label: 'Listado de cartera', to: '/financiero/cartera' },
    ],
  },
]

const fallback = {
  title: 'Financiero',
  description: 'Gestiona el módulo financiero.',
  items: [],
}

const currentGroup = computed(() =>
  groups.find((g) => g.routes.includes(route.path)) ?? fallback
)
</script>
