<template>
  <ModalBase
    v-model="visible"
    :title="ciclo ? `Planeación: ${ciclo.nombre}` : 'Planeación del ciclo'"
    description="Horas por tema según el ajuste del ciclo. El currículo no se modifica; las fechas de cada tema son estimadas."
    size="xl"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="list_alt" class="size-5" />
      </span>
    </template>

    <div class="max-h-[72vh] overflow-y-auto pb-2 pr-1">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <span class="text-sm text-slate-500">Cargando planeación...</span>
      </div>

      <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {{ error }}
        <button type="button" class="ml-2 underline" @click="load">Reintentar</button>
      </div>

      <div v-else-if="planeacion" class="flex flex-col gap-4">
        <AjusteCicloResumen
          v-if="planeacion.ciclo.fecha_fin_automatica === false"
          :fecha-fin="planeacion.ciclo.fecha_fin"
          :fecha-fin-teorica="planeacion.ciclo.fecha_fin_teorica"
          :factor="planeacion.ciclo.factor_ajuste"
          :advertencia="planeacion.ciclo.advertencia"
        />

        <p v-if="!planeacion.grupos.length" class="py-6 text-center text-sm text-slate-400">
          El ciclo no tiene grupos asignados.
        </p>

        <!-- Un bloque por grupo (módulo) en orden de dictado -->
        <section
          v-for="grupo in planeacion.grupos"
          :key="grupo.grupo_id"
          class="rounded-lg border border-black/10"
        >
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            :aria-expanded="abiertos.includes(grupo.grupo_id)"
            @click="toggleGrupo(grupo.grupo_id)"
          >
            <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#213360] text-xs font-bold text-white">
              {{ grupo.orden }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-slate-900">{{ grupo.modulo?.nombre ?? grupo.grupo_nombre }}</p>
              <p class="text-xs text-slate-500">
                {{ grupo.grupo_nombre }} ·
                {{ formatFechaCorta(grupo.fecha_inicio_grupo) }} – {{ formatFechaCorta(grupo.fecha_fin_grupo) }} ·
                {{ grupo.sesiones }} sesiones
              </p>
            </div>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="grupo.factor < 1 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'"
              :title="`${formatHoras(grupo.horas_planeadas)} de ${formatHoras(grupo.horas_modulo)}`"
            >
              {{ formatHoras(grupo.horas_planeadas) }} / {{ formatHoras(grupo.horas_modulo) }}
            </span>
            <span v-if="grupo.ciclo_origen_id" class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              Compartido
            </span>
            <NavIcon :name="abiertos.includes(grupo.grupo_id) ? 'expand_less' : 'expand_more'" class="size-4 shrink-0 text-slate-400" />
          </button>

          <div v-if="abiertos.includes(grupo.grupo_id)" class="border-t border-black/5 px-4 py-3">
            <p v-if="!grupo.topicos.length" class="text-xs italic text-slate-400">El módulo no tiene tópicos asociados.</p>

            <div v-for="topico in grupo.topicos" :key="topico.topico_id" class="mb-4 last:mb-0">
              <div class="mb-1 flex items-center justify-between text-xs">
                <p class="font-medium text-slate-800">{{ topico.nombre }}</p>
                <p class="text-slate-500">{{ formatHoras(topico.horas_ajustadas) }} de {{ formatHoras(topico.horas_originales) }}</p>
              </div>
              <table class="w-full text-xs">
                <thead class="text-left text-slate-400">
                  <tr>
                    <th class="py-1 font-medium">Tema</th>
                    <th class="py-1 text-right font-medium">Original</th>
                    <th class="py-1 text-right font-medium">Ajustado</th>
                    <th class="py-1 pl-3 text-right font-medium">Fechas estimadas</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="tema in topico.temas" :key="tema.tema_id">
                    <td class="py-1.5 pr-2 text-slate-700">{{ tema.nombre }}</td>
                    <td class="py-1.5 text-right text-slate-500">{{ formatHoras(tema.horas_originales) }}</td>
                    <td
                      class="py-1.5 text-right font-medium"
                      :class="tema.horas_ajustadas < tema.horas_originales ? 'text-amber-700' : 'text-slate-900'"
                    >
                      {{ tema.tiempo_ajustado }}
                    </td>
                    <td class="whitespace-nowrap py-1.5 pl-3 text-right text-slate-500">
                      {{ formatFechaCorta(tema.fecha_inicio) }}<template v-if="tema.fecha_fin && tema.fecha_fin !== tema.fecha_inicio"> – {{ formatFechaCorta(tema.fecha_fin) }}</template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="visible = false"
      >
        Cerrar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase            from '@/components/ModalBase.vue'
import NavIcon              from '@/components/icons/NavIcon.vue'
import AjusteCicloResumen   from '@/components/academico/AjusteCicloResumen.vue'
import cicloService         from '@/services/cicloService.js'
import { formatFechaCorta } from '@/utils/calendario.js'

/**
 * Planeación de solo lectura de un ciclo: grupo → tópico → tema, con las horas
 * originales del currículo y las ajustadas al factor del ciclo (modo fecha fin fija).
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ciclo:      { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const planeacion = ref(null)
const loading    = ref(false)
const error      = ref('')
const abiertos   = ref([])

async function load() {
  if (!props.ciclo?.id) return
  loading.value    = true
  error.value      = ''
  planeacion.value = null
  try {
    const res = await cicloService.planeacion(props.ciclo.id)
    planeacion.value = res.data
    abiertos.value   = res.data?.grupos?.length ? [res.data.grupos[0].grupo_id] : []
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar la planeación del ciclo.'
  } finally {
    loading.value = false
  }
}

function toggleGrupo(grupoId) {
  abiertos.value = abiertos.value.includes(grupoId)
    ? abiertos.value.filter((id) => id !== grupoId)
    : [...abiertos.value, grupoId]
}

function formatHoras(valor) {
  if (valor === null || valor === undefined) return '—'
  return `${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })} h`
}

watch(() => props.modelValue, (abierto) => { if (abierto) load() })
</script>
