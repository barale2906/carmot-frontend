<template>
  <div class="overflow-hidden rounded-xl border border-black/10 bg-white">
    <div class="flex items-center justify-between border-b border-black/10 bg-slate-50 px-4 py-3">
      <div>
        <p class="text-sm font-medium text-slate-900">{{ areaNombre || 'Área' }}</p>
        <p class="mt-0.5 text-xs text-slate-500">
          Horario de atención: {{ formatHora(horaInicio) }} – {{ formatHora(horaFin) }}
        </p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="aplicarHorarioGeneral"
      >
        Aplicar horario general a todos
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm" aria-label="Semanario de horarios por día">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50/80">
            <th class="w-28 px-3 py-2 text-left font-medium text-slate-700">Día</th>
            <th class="min-w-[100px] px-3 py-2 text-left font-medium text-slate-700">Hora inicio</th>
            <th class="min-w-[100px] px-3 py-2 text-left font-medium text-slate-700">Hora fin</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="dia in DIAS"
            :key="dia.value"
            class="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50/50"
          >
            <td class="px-3 py-2 font-medium text-slate-700 capitalize">
              {{ dia.label }}
            </td>
            <td class="px-3 py-1.5">
              <input
                :value="getHora(dia.value, 'inicio')"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 ring-1 ring-black/5 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :title="`Hora inicio ${dia.label}`"
                @input="(e) => setHora(dia.value, 'inicio', e.target.value)"
              />
            </td>
            <td class="px-3 py-1.5">
              <input
                :value="getHora(dia.value, 'fin')"
                type="time"
                class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 ring-1 ring-black/5 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                :title="`Hora fin ${dia.label}`"
                @input="(e) => setHora(dia.value, 'fin', e.target.value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  areaId: { type: [Number, String], default: null },
  areaNombre: { type: String, default: '' },
  horaInicio: { type: String, default: '08:00' },
  horaFin: { type: String, default: '18:00' },
  horarios: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:horarios'])

const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miércoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sábado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
]

const porDia = reactive({
  lunes: { inicio: '', fin: '' },
  martes: { inicio: '', fin: '' },
  miércoles: { inicio: '', fin: '' },
  jueves: { inicio: '', fin: '' },
  viernes: { inicio: '', fin: '' },
  sábado: { inicio: '', fin: '' },
  domingo: { inicio: '', fin: '' }
})

function syncFromHorarios() {
  DIAS.forEach((d) => {
    porDia[d.value] = { inicio: '', fin: '' }
  })
  const horarios = Array.isArray(props.horarios) ? props.horarios : []
  for (const h of horarios) {
    const dia = h.dia?.toLowerCase?.()
    if (!dia || !porDia[dia]) continue
    const hora = formatHora(h.hora)
    if (h.periodo === true || h.periodo === 'inicio') {
      porDia[dia].inicio = hora
    } else {
      porDia[dia].fin = hora
    }
  }
}

watch(
  () => [props.horarios, props.areaId, props.horaInicio, props.horaFin],
  () => syncFromHorarios(),
  { immediate: true }
)

function getHora(dia, tipo) {
  return porDia[dia]?.[tipo] ?? ''
}

function setHora(dia, tipo, valor) {
  porDia[dia][tipo] = valor || ''
  emitHorarios()
}

function emitHorarios() {
  const areaId = props.areaId
  if (!areaId) return

  const lista = []
  for (const d of DIAS) {
    const inicio = porDia[d.value]?.inicio?.trim()
    const fin = porDia[d.value]?.fin?.trim()
    if (inicio) {
      lista.push({
        area_id: Number(areaId),
        dia: d.value,
        hora: inicio.length === 5 ? `${inicio}:00` : inicio,
        tipo: true,
        periodo: true
      })
    }
    if (fin) {
      lista.push({
        area_id: Number(areaId),
        dia: d.value,
        hora: fin.length === 5 ? `${fin}:00` : fin,
        tipo: true,
        periodo: false
      })
    }
  }
  emit('update:horarios', lista)
}

function formatHora(t) {
  if (!t) return ''
  return String(t).slice(0, 5)
}

function aplicarHorarioGeneral() {
  const inicio = formatHora(props.horaInicio) || '08:00'
  const fin = formatHora(props.horaFin) || '18:00'
  DIAS.forEach((d) => {
    porDia[d.value].inicio = inicio
    porDia[d.value].fin = fin
  })
  emitHorarios()
}
</script>
