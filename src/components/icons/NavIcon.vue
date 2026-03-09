<template>
  <component :is="iconComponent" class="size-5 shrink-0" aria-hidden="true" />
</template>

<script setup>
import { computed, h } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const iconClass = 'size-5 shrink-0'

const iconComponent = computed(() => ({
  render: () => icons[props.name] ? icons[props.name]() : icons.menu()
}))

const svg = (children) => h('svg', { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', class: iconClass }, children)
const path = (d, extra = {}) => h('path', { d, stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra })
const circle = (cx, cy, r) => h('circle', { cx, cy, r, stroke: 'currentColor', 'stroke-width': '2' })
const rect = (attrs) => h('rect', { stroke: 'currentColor', 'stroke-width': '2', ...attrs })

const icons = {
  menu: () => svg([path('M4 6h16M4 12h16M4 18h16')]),
  // Generales UI
  close:            () => svg([path('M18 6L6 18M6 6l12 12')]),
  logout:           () => svg([path('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5m5 5H9')]),
  search:           () => svg([path('M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35')]),
  plus:             () => svg([path('M12 5v14M5 12h14')]),
  eye:              () => svg([path('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'), path('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z')]),
  pencil:           () => svg([path('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'), path('M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z')]),
  expand_more:      () => svg([path('M6 9l6 6 6-6')]),
  expand_less:      () => svg([path('M18 15l-6-6-6 6')]),
  location:         () => svg([path('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'), path('M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z')]),

  // Iconos legados (menú anterior hardcodeado)
  formularios:         () => svg([path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 2l5 5h-5V4zM8 12h8M8 16h8M8 8h4')]),
  estudiantes:         () => svg([path('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'), path('M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'), path('M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75')]),
  pendientes:          () => svg([path('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0')]),
  calendario:          () => svg([rect({ x: '3', y: '4', width: '18', height: '18', rx: '2' }), path('M16 2v4M8 2v4M3 10h18')]),
  activos:             () => svg([path('M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14')]),
  'control-estudiantes': () => svg([path('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'), path('M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75')]),
  cartera:             () => svg([path('M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6')]),

  // Material Icons usados por el backend (/api/menu)
  dashboard:        () => svg([rect({ x: '3', y: '3', width: '8', height: '10', rx: '1' }), rect({ x: '13', y: '3', width: '8', height: '6', rx: '1' }), rect({ x: '13', y: '11', width: '8', height: '10', rx: '1' }), rect({ x: '3', y: '15', width: '8', height: '6', rx: '1' })]),
  settings:         () => svg([circle('12', '12', '3'), path('M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z')]),
  people:           () => svg([path('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'), path('M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'), path('M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75')]),
  security:         () => svg([path('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z')]),
  groups:           () => svg([circle('9', '7', '3'), path('M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2'), circle('18', '7', '2'), path('M22 21v-2a3 3 0 0 0-2-2.83')]),
  location_city:    () => svg([rect({ x: '2', y: '7', width: '9', height: '14', rx: '1' }), rect({ x: '13', y: '2', width: '9', height: '19', rx: '1' }), path('M5 7V5M8 7V5M16 7V5M19 7V5M5 14h1M8 14h1M5 11h1M8 11h1M16 14h1M19 14h1M16 11h1M19 11h1')]),
  contacts:         () => svg([rect({ x: '4', y: '2', width: '16', height: '20', rx: '2' }), circle('12', '10', '3'), path('M6 21v-1a6 6 0 0 1 12 0v1'), path('M2 7h2M2 12h2M2 17h2')]),
  track_changes:    () => svg([circle('12', '12', '8'), circle('12', '12', '3'), path('M12 2v4M12 18v4M2 12h4M18 12h4')]),
  calendar_today:   () => svg([rect({ x: '3', y: '4', width: '18', height: '18', rx: '2' }), path('M16 2v4M8 2v4M3 10h18'), path('M8 14h2v2H8z', { fill: 'currentColor', stroke: 'none' })]),
  book:             () => svg([path('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20M9 6h6M9 10h4')]),
  schema:           () => svg([rect({ x: '2', y: '2', width: '7', height: '5', rx: '1' }), rect({ x: '15', y: '9', width: '7', height: '5', rx: '1' }), rect({ x: '15', y: '17', width: '7', height: '5', rx: '1' }), path('M9 4.5h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9'), path('M13 11.5h2')]),
  event_note:       () => svg([rect({ x: '3', y: '4', width: '18', height: '18', rx: '2' }), path('M16 2v4M8 2v4M3 10h18'), path('M7 14h4M7 18h8')]),
  assignment_ind:   () => svg([rect({ x: '5', y: '3', width: '14', height: '18', rx: '2' }), path('M9 3v2h6V3'), circle('12', '11', '2.5'), path('M7 19v-1a5 5 0 0 1 10 0v1')]),
  school:           () => svg([path('M22 10v6M2 10l10-5 10 5-10 5-10-5z'), path('M6 12v5c0 2 2 3 6 3s6-1 6-3v-5')]),
  account_balance:  () => svg([path('M3 21h18M3 10h18M12 3L3 10h18L12 3z'), path('M6 10v11M10 10v11M14 10v11M18 10v11')]),
  inventory_2:      () => svg([rect({ x: '2', y: '7', width: '20', height: '15', rx: '2' }), path('M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2'), path('M12 12v5M9.5 12h5')]),
  list_alt:         () => svg([rect({ x: '3', y: '3', width: '18', height: '18', rx: '2' }), path('M7 8h10M7 12h10M7 16h6')]),
  payments:         () => svg([rect({ x: '2', y: '5', width: '20', height: '14', rx: '2' }), path('M2 10h20'), path('M6 15h4')]),
  receipt:          () => svg([path('M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z'), path('M8 9h8M8 13h6')]),
  warehouse:        () => svg([path('M3 21h18M3 7l9-5 9 5v14H3V7z'), rect({ x: '9', y: '13', width: '6', height: '8' }), path('M9 13h6')]),
  construction:     () => svg([path('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z')]),
  academico:        () => svg([path('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20M9 6h6')]),
  inventario:       () => svg([path('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.04L12 12.5l8.73-6.46M12 22.08V12.5')]),
}
</script>
