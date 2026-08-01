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
      '/inventario/categorias',
      '/inventario/unidades-medida',
      '/inventario/productos',
      '/inventario/almacenes',
      '/inventario/proveedores',
    ],
    title: 'Catálogos de inventario',
    description: 'Gestiona categorías, unidades de medida, productos, almacenes y proveedores.',
    items: [
      { label: 'Categorías',       to: '/inventario/categorias' },
      { label: 'Unidades medida',  to: '/inventario/unidades-medida' },
      { label: 'Productos',        to: '/inventario/productos' },
      { label: 'Almacenes',        to: '/inventario/almacenes' },
      { label: 'Proveedores',      to: '/inventario/proveedores' },
    ],
  },
  {
    routes: [
      '/inventario/stock',
      '/inventario/movimientos',
      '/inventario/precios',
    ],
    title: 'Stock y movimientos',
    description: 'Consulta el stock disponible, registra movimientos y gestiona precios de venta.',
    items: [
      { label: 'Stock',       to: '/inventario/stock' },
      { label: 'Movimientos', to: '/inventario/movimientos' },
      { label: 'Precios',     to: '/inventario/precios' },
    ],
  },
  {
    routes: [
      '/inventario/ventas',
      '/inventario/entregas',
    ],
    title: 'Ventas y entregas',
    description: 'Registra nuevas ventas, gestiona pedidos activos y despacha entregas pendientes.',
    items: [
      { label: 'Caja / Ventas', to: '/inventario/ventas' },
      { label: 'Entregas',      to: '/inventario/entregas' },
    ],
  },
  {
    routes: ['/inventario/ordenes-compra'],
    title: 'Órdenes de compra',
    description: 'Crea y gestiona órdenes de compra a proveedores para reabastecer el inventario.',
    items: [
      { label: 'Órdenes de compra', to: '/inventario/ordenes-compra' },
    ],
  },
]

const fallback = {
  title: 'Inventario',
  description: 'Gestiona el módulo de inventario.',
  items: [],
}

const currentGroup = computed(() =>
  groups.find((g) => g.routes.includes(route.path)) ?? fallback
)
</script>
