<template>
  <!-- Financiero: recibos académicos por defecto; el selector permite ver inventario o ambos -->
  <RecibosPagoListado origen-inicial="academico" permitir-crear />
</template>

<script setup>
import RecibosPagoListado from '@/components/financiero/RecibosPagoListado.vue'
</script>
