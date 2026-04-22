<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">
        Financiero
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Gestiona conceptos de pago, recibos, listas de precio y descuentos del área financiera.
      </p>
      <FormulariosNav :items="navItems" class="mt-4" />
    </header>
    <router-view />
  </div>
</template>

<script setup>
import FormulariosNav from '@/components/forms/FormulariosNav.vue'

const navItems = [
  { label: 'Tipos de producto', to: '/financiero/tipos-producto',  exact: true },
  { label: 'Productos',         to: '/financiero/productos' },
  { label: 'Listas de precios', to: '/financiero/listas-precios' },
  { label: 'Conceptos de pago', to: '/financiero/conceptos-pago' },
  { label: 'Recibos de pago',   to: '/financiero/recibos-pago' },
]
</script>
