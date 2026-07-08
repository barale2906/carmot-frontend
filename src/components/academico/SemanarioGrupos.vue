<template>
  <div class="rounded-xl border border-black/10 bg-white overflow-hidden">
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="text-sm text-slate-500">Cargando disponibilidad...</span>
    </div>

    <div v-else-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-else-if="semanarioData" class="overflow-x-auto">
      <div class="px-4 py-3 border-b border-black/10 bg-slate-50">
        <p class="text-sm font-medium text-slate-900">
          {{ semanarioData.sede?.nombre }} · {{ semanarioData.area?.nombre }}
        </p>
        <p class="text-xs text-slate-500 mt-0.5">
          Horario de atención: {{ formatHora(semanarioData.sede?.hora_inicio) }} – {{ formatHora(semanarioData.sede?.hora_fin) }}
        </p>
      </div>

      <div class="min-w-[700px]">
        <!-- Leyenda -->
        <div class="flex flex-wrap gap-4 px-4 py-2 border-b border-slate-100 text-xs">
          <span class="flex items-center gap-1.5">
            <span class="inline-block size-4 rounded bg-emerald-200 border border-emerald-400" />
            Disponible
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block size-4 rounded bg-amber-100 border border-amber-400" />
            Con grupos asignados
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block size-4 rounded bg-blue-200 border-2 border-blue-500 ring-1 ring-blue-300" />
            Seleccionado
          </span>
        </div>

        <!-- Tabla semanario -->
        <table class="w-full text-sm" aria-label="Semanario de disponibilidad">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/80">
              <th class="w-16 px-2 py-2 text-left font-medium text-slate-700">Hora</th>
              <th
                v-for="dia in diasOrden"
                :key="dia"
                class="min-w-[80px] px-2 py-2 text-center font-medium text-slate-700 capitalize"
              >
                {{ capitalizar(dia) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="slot in timeSlots"
              :key="slot"
              class="border-b border-slate-100 last:border-b-0"
            >
              <td class="px-2 py-1.5 text-slate-600 font-medium whitespace-nowrap">
                {{ formatHora(slot) }}
              </td>
              <td
                v-for="dia in diasOrden"
                :key="`${dia}-${slot}`"
                class="px-1 py-0.5"
              >
                <button
                  v-if="isWithinHours(dia, slot)"
                  type="button"
                  :class="getSlotClasses(dia, slot)"
                  :title="getSlotTitle(dia, slot)"
                  @click="onSlotClick(dia, slot)"
                >
                  <span
                    v-if="getOccupiedGroups(dia, slot).length"
                    class="block truncate px-0.5 text-[10px] leading-tight"
                  >
                    {{ getOccupiedGroups(dia, slot).map((g) => truncate(g.grupo_nombre, 9)).join(', ') }}
                  </span>
                  <span v-else class="sr-only">{{ capitalizar(dia) }} {{ formatHora(slot) }}</span>
                </button>
                <div v-else class="block min-h-[32px] rounded" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  semanarioData: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  /** Horarios ya seleccionados para este área (para marcar como "seleccionado") */
  selectedHorarios: {
    type: Array,
    default: () => []
  },
  /** Modo solo lectura: muestra el calendario sin permitir seleccionar/deseleccionar */
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['select-slot', 'remove-slot'])

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

const diasOrden = DIAS

/** Genera slots de 1 hora desde hora_inicio hasta hora_fin */
const timeSlots = computed(() => {
  const data = props.semanarioData
  if (!data?.sede?.hora_inicio || !data?.sede?.hora_fin) return []

  const inicio = timeToMinutes(data.sede.hora_inicio)
  const fin = timeToMinutes(data.sede.hora_fin)
  const slots = []

  for (let m = inicio; m < fin; m += 60) {
    slots.push(minutesToTime(m))
  }
  return slots
})

function timeToMinutes(t) {
  if (!t) return 0
  const s = String(t).slice(0, 5)
  const [h, m] = s.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Verifica si un slot cae dentro del horario de atención de la sede */
function isWithinHours(dia, slot) {
  const porDia = props.semanarioData?.por_dia?.[dia]
  if (!porDia) return false

  const disp = porDia.disponible
  if (!disp) return true

  const slotStart = timeToMinutes(slot)
  const slotEnd = slotStart + 60
  const dInicio = timeToMinutes(disp.inicio)
  const dFin = timeToMinutes(disp.fin)
  return slotStart >= dInicio && slotEnd <= dFin
}

/** Retorna los grupos que ya ocupan un slot (puede haber varios) */
function getOccupiedGroups(dia, slot) {
  const porDia = props.semanarioData?.por_dia?.[dia]
  const ocupados = porDia?.ocupados ?? []
  const slotStart = timeToMinutes(slot)
  const slotEnd = slotStart + 60

  return ocupados.filter((o) => {
    const oInicio = timeToMinutes(o.hora_inicio)
    const oFin = o.hora_fin ? timeToMinutes(o.hora_fin) : oInicio + (o.duracion_horas ?? 1) * 60
    return slotStart < oFin && slotEnd > oInicio
  })
}

/** Verifica si el slot está en los horarios seleccionados por el usuario */
function isSelected(dia, slot) {
  return props.selectedHorarios.some((h) => {
    const hDia = h.dia?.toLowerCase?.()
    const hHora = String(h.hora || '').slice(0, 5)
    return hDia === dia && hHora === slot
  })
}

function getSlotClasses(dia, slot) {
  const cursor = props.readonly ? 'cursor-default' : 'cursor-pointer'
  const base = `block w-full min-h-[32px] rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${cursor}`
  const occupied = getOccupiedGroups(dia, slot).length > 0
  const selected = isSelected(dia, slot)

  if (selected && occupied) {
    return `${base} bg-blue-200 border-blue-500 hover:bg-blue-300 ring-1 ring-amber-400`
  }
  if (selected) {
    return `${base} bg-blue-200 border-blue-500 hover:bg-blue-300`
  }
  if (occupied) {
    return `${base} bg-amber-100 border-amber-400 hover:bg-amber-200 text-amber-900`
  }
  return `${base} bg-emerald-100 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400`
}

function getSlotTitle(dia, slot) {
  const groups = getOccupiedGroups(dia, slot)
  const selected = isSelected(dia, slot)
  const hora = formatHora(slot)
  const diaLabel = capitalizar(dia)

  if (groups.length && selected) {
    const nombres = groups.map((g) => g.grupo_nombre || 'Grupo').join(', ')
    return `${diaLabel} ${hora} – Seleccionado. También asignado a: ${nombres}`
  }
  if (groups.length) {
    const nombres = groups.map((g) => g.grupo_nombre || 'Grupo').join(', ')
    return `${diaLabel} ${hora} – Grupos asignados: ${nombres}. Haz clic para agregar este grupo.`
  }
  if (selected) {
    return `${diaLabel} ${hora} – Seleccionado`
  }
  return `${diaLabel} ${hora} – Disponible`
}

function truncate(str, len) {
  if (!str) return ''
  return str.length <= len ? str : str.slice(0, len - 1) + '…'
}

function onSlotClick(dia, slot) {
  if (props.readonly) return
  if (isSelected(dia, slot)) {
    emit('remove-slot', { dia, hora: slot })
  } else {
    emit('select-slot', { dia, hora: slot, duracion_horas: 1 })
  }
}

function formatHora(t) {
  if (!t) return '—'
  return String(t).slice(0, 5)
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>
