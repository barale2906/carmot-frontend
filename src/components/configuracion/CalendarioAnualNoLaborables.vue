<template>
  <div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <section
        v-for="mes in meses"
        :key="mes.indice"
        class="rounded-[14px] border border-black/10 bg-white p-4"
        :aria-label="`${mes.nombre} ${anio}`"
      >
        <header class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-medium text-slate-900">{{ mes.nombre }}</h3>
          <span v-if="mes.total" class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {{ mes.total }} {{ mes.total === 1 ? 'día' : 'días' }}
          </span>
        </header>

        <div class="grid grid-cols-7 gap-0.5 text-center text-[11px]">
          <span v-for="d in DIAS_SEMANA" :key="d" class="py-1 font-medium text-slate-400">{{ d }}</span>

          <template v-for="(celda, i) in mes.celdas" :key="celda?.fecha ?? `vacio-${i}`">
            <span v-if="!celda" />
            <button
              v-else
              type="button"
              class="relative flex aspect-square items-center justify-center rounded-md text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default"
              :class="claseCelda(celda)"
              :title="tituloCelda(celda)"
              :disabled="!esInteractiva(celda)"
              @click="onClickCelda(celda)"
            >
              {{ celda.dia }}
              <!-- Varias sedes con un día distinto en la misma fecha -->
              <span
                v-if="(diasPorFecha[celda.fecha]?.length ?? 0) > 1"
                class="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-white"
              />
            </button>
          </template>
        </div>
      </section>
    </div>

    <!-- Leyenda -->
    <ul class="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600" aria-label="Leyenda">
      <li v-for="(label, tipo) in tipos" :key="tipo" class="flex items-center gap-1.5">
        <span class="size-3 rounded" :class="ESTILOS_TIPO_DIA[tipo]?.punto ?? 'bg-slate-500'" />
        {{ label }}
      </li>
      <li class="flex items-center gap-1.5">
        <span class="size-3 rounded ring-2 ring-inset ring-blue-500" />
        Hoy
      </li>
      <li class="flex items-center gap-1.5">
        <span class="text-red-400">D</span>
        Domingo
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  NOMBRES_MES,
  DIAS_SEMANA,
  ESTILOS_TIPO_DIA,
  buildMonthGrid,
  toIsoDate
} from '@/utils/calendario.js'

/**
 * Vista anual de los días no laborables: 12 meses con los días marcados por tipo.
 * Emite `select-dia` al pulsar un día registrado y `select-fecha` al pulsar uno libre.
 */
const props = defineProps({
  anio:        { type: Number, required: true },
  dias:        { type: Array, default: () => [] },
  tipos:       { type: Object, default: () => ({}) },
  canCreate:   { type: Boolean, default: false },
  canEdit:     { type: Boolean, default: false }
})

const emit = defineEmits(['select-dia', 'select-fecha'])

const hoy = (() => {
  const d = new Date()
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate())
})()

const diasPorFecha = computed(() => {
  const mapa = {}
  for (const dia of props.dias) {
    const fecha = String(dia.fecha).slice(0, 10)
    ;(mapa[fecha] ??= []).push(dia)
  }
  return mapa
})

const meses = computed(() =>
  NOMBRES_MES.map((nombre, indice) => {
    const celdas = buildMonthGrid(props.anio, indice)
    const total  = celdas.filter((c) => c && diasPorFecha.value[c.fecha]).length
    return { indice, nombre, celdas, total }
  })
)

function claseCelda(celda) {
  const dias = diasPorFecha.value[celda.fecha]
  const base = celda.fecha === hoy ? 'ring-2 ring-inset ring-blue-500 ' : ''
  if (dias?.length) {
    return base + (ESTILOS_TIPO_DIA[dias[0].tipo]?.celda ?? ESTILOS_TIPO_DIA.otro.celda) + ' font-medium hover:opacity-80'
  }
  const color = celda.domingo ? 'text-red-400' : 'text-slate-700'
  return `${base}${color} ${props.canCreate ? 'hover:bg-slate-100' : ''}`
}

function tituloCelda(celda) {
  const dias = diasPorFecha.value[celda.fecha]
  if (!dias?.length) return props.canCreate ? 'Registrar día no laborable' : ''
  return dias
    .map((d) => `${d.nombre} · ${d.tipo_text ?? d.tipo} · ${d.sede?.nombre ?? 'Todas las sedes'}`)
    .join('\n')
}

function esInteractiva(celda) {
  return diasPorFecha.value[celda.fecha]?.length ? props.canEdit : props.canCreate
}

function onClickCelda(celda) {
  const dias = diasPorFecha.value[celda.fecha]
  if (dias?.length) emit('select-dia', dias[0])
  else emit('select-fecha', celda.fecha)
}
</script>
