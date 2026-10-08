<template>
  <div class="rounded-lg border border-black/10">
    <div class="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-2">
      <p class="text-sm font-medium text-slate-800">Diagrama de Gantt</p>
      <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
        <input v-model="mostrarTemas" type="checkbox" class="rounded border-slate-300" />
        Mostrar temas
      </label>
    </div>

    <p v-if="!filas.length" class="py-6 text-center text-sm text-slate-400">
      No hay fechas planeadas para mostrar.
    </p>

    <div v-else class="overflow-x-auto">
      <div :style="{ width: `${anchoEtiqueta + anchoLineaTiempo}px` }">
        <!-- Cabecera: meses -->
        <div class="flex border-b border-black/10 bg-slate-50 text-xs font-medium text-slate-600">
          <div class="sticky left-0 z-10 shrink-0 bg-slate-50 px-3 py-2" :style="{ width: `${anchoEtiqueta}px` }">
            Grupo / tema
          </div>
          <div class="relative h-8" :style="{ width: `${anchoLineaTiempo}px` }">
            <span
              v-for="mes in meses"
              :key="mes.clave"
              class="absolute top-0 flex h-full items-center border-l border-black/10 px-2"
              :style="{ left: `${mes.inicio * PX_POR_DIA}px`, width: `${mes.dias * PX_POR_DIA}px` }"
            >
              {{ mes.nombre }}
            </span>
          </div>
        </div>

        <!-- Filas -->
        <div
          v-for="fila in filas"
          :key="fila.clave"
          class="flex border-b border-black/5 text-xs last:border-b-0"
          :class="fila.esGrupo ? 'bg-white' : 'bg-slate-50/50'"
        >
          <div
            class="sticky left-0 z-10 shrink-0 truncate px-3 py-1.5"
            :class="fila.esGrupo ? 'bg-white font-medium text-slate-900' : 'bg-slate-50 pl-8 text-slate-600'"
            :style="{ width: `${anchoEtiqueta}px` }"
            :title="fila.etiqueta"
          >
            {{ fila.etiqueta }}
          </div>
          <div class="relative h-8" :style="{ width: `${anchoLineaTiempo}px` }">
            <span
              v-for="mes in meses"
              :key="mes.clave"
              class="absolute top-0 h-full border-l border-black/5"
              :style="{ left: `${mes.inicio * PX_POR_DIA}px` }"
            />
            <div
              v-if="fila.inicio"
              class="absolute top-1.5 h-5 rounded"
              :class="fila.esGrupo ? 'bg-[#213360]' : 'bg-blue-400'"
              :style="estiloBarra(fila)"
              :title="`${fila.etiqueta}: ${formatFechaCorta(fila.inicio)} – ${formatFechaCorta(fila.fin)}`"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { NOMBRES_MES, formatFechaCorta, sumarDias, diferenciaDias } from '@/utils/calendario.js'

/**
 * Diagrama de Gantt de la planeación de un ciclo: una barra por grupo y,
 * opcionalmente, una por tema, sobre una línea de tiempo en días.
 */
const props = defineProps({
  grupos: { type: Array, default: () => [] }
})

const PX_POR_DIA = 6

const anchoEtiqueta = 280
const mostrarTemas  = ref(true)

const filas = computed(() => {
  const resultado = []
  for (const grupo of props.grupos) {
    resultado.push({
      clave:    `g-${grupo.grupo_id}`,
      esGrupo:  true,
      etiqueta: `${grupo.orden}. ${grupo.modulo?.nombre ?? grupo.grupo_nombre}`,
      inicio:   grupo.fecha_inicio_grupo?.slice(0, 10) ?? null,
      fin:      grupo.fecha_fin_grupo?.slice(0, 10) ?? null
    })
    if (!mostrarTemas.value) continue
    for (const topico of grupo.topicos) {
      for (const tema of topico.temas) {
        resultado.push({
          clave:    `t-${grupo.grupo_id}-${tema.tema_id}`,
          esGrupo:  false,
          etiqueta: tema.nombre,
          inicio:   tema.fecha_inicio?.slice(0, 10) ?? null,
          fin:      (tema.fecha_fin ?? tema.fecha_inicio)?.slice(0, 10) ?? null
        })
      }
    }
  }
  return resultado
})

const rango = computed(() => {
  const fechas = props.grupos.flatMap((g) => [
    g.fecha_inicio_grupo?.slice(0, 10),
    g.fecha_fin_grupo?.slice(0, 10),
    ...g.topicos.flatMap((tp) => tp.temas.flatMap((t) => [t.fecha_inicio?.slice(0, 10), t.fecha_fin?.slice(0, 10)]))
  ]).filter(Boolean).sort()
  if (!fechas.length) return null
  return { inicio: `${fechas[0].slice(0, 7)}-01`, fin: fechas[fechas.length - 1] }
})

const totalDias = computed(() => (rango.value ? diferenciaDias(rango.value.inicio, rango.value.fin) + 1 : 0))
const anchoLineaTiempo = computed(() => totalDias.value * PX_POR_DIA)

const meses = computed(() => {
  if (!rango.value) return []
  const lista = []
  let cursor = rango.value.inicio
  while (diferenciaDias(cursor, rango.value.fin) >= 0) {
    const [anio, mes] = cursor.split('-').map(Number)
    const diasMes = new Date(anio, mes, 0).getDate()
    lista.push({
      clave:  cursor,
      nombre: `${NOMBRES_MES[mes - 1]} ${anio}`,
      inicio: diferenciaDias(rango.value.inicio, cursor),
      dias:   diasMes
    })
    cursor = sumarDias(cursor, diasMes)
  }
  return lista
})

function estiloBarra(fila) {
  const desde = diferenciaDias(rango.value.inicio, fila.inicio)
  const dias  = Math.max(diferenciaDias(fila.inicio, fila.fin ?? fila.inicio) + 1, 1)
  return { left: `${desde * PX_POR_DIA}px`, width: `${dias * PX_POR_DIA}px` }
}
</script>
