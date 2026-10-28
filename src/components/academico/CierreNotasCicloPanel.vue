<template>
  <section aria-labelledby="cierre-notas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="cierre-notas-heading" class="text-sm font-semibold text-slate-900">Registro de notas del ciclo</h2>
        <p v-if="cargando" class="mt-1 text-sm text-slate-500">Consultando estado...</p>
        <p v-else-if="estado?.notas_cerradas" class="mt-1 text-sm text-slate-600">
          <span class="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Cerrado</span>
          el {{ formatFechaHora(estado.notas_cerradas_at) }}{{ estado.cerradas_por ? ` por ${estado.cerradas_por.name}` : '' }}.
          No se pueden registrar ni cambiar notas ni recuperaciones.
        </p>
        <p v-else-if="estado" class="mt-1 text-sm text-slate-600">
          <span class="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Abierto</span>
          Al cerrarlo, las notas y recuperaciones del ciclo quedan bloqueadas.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="estado && !estado.notas_cerradas && can('aca_notaCerrar')"
          type="button"
          :disabled="procesando"
          class="rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="cerrar"
        >
          Cerrar notas del ciclo
        </button>
        <button
          v-if="estado?.notas_cerradas && can('aca_notaReabrir')"
          type="button"
          :disabled="procesando"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="abrirReapertura"
        >
          Reabrir notas
        </button>
      </div>
    </div>

    <details v-if="estado?.historial?.length" class="mt-3 text-sm">
      <summary class="cursor-pointer text-slate-500 hover:text-slate-700">Historial ({{ estado.historial.length }})</summary>
      <ul class="mt-2 flex flex-col gap-1 text-slate-600">
        <li v-for="evento in estado.historial" :key="evento.id">
          <strong>{{ evento.accion === 'cierre' ? 'Cierre' : 'Reapertura' }}</strong>
          · {{ formatFechaHora(evento.created_at) }} · {{ evento.usuario?.name ?? '—' }}
          <span v-if="evento.motivo" class="block pl-3 text-xs text-slate-500">Motivo: {{ evento.motivo }}</span>
        </li>
      </ul>
    </details>

    <ModalBase v-model="showReabrir" size="md" title="Reabrir notas del ciclo" description="El motivo queda en el historial del ciclo.">
      <form class="flex flex-col gap-3 pb-2" @submit.prevent="reabrir">
        <FormTextarea v-model="motivo" label="Motivo" :rows="3" required placeholder="Ej: corrección de la nota del examen final de un estudiante" />
        <p v-if="errorReabrir" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ errorReabrir }}</p>
      </form>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showReabrir = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="procesando || motivo.trim().length < 5"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="reabrir"
        >
          {{ procesando ? 'Reabriendo...' : 'Reabrir notas' }}
        </button>
      </template>
    </ModalBase>
  </section>
</template>

<script setup>
/**
 * Estado del registro de notas de un ciclo con las acciones de cerrar (aca_notaCerrar)
 * y reabrir con motivo (aca_notaReabrir). `pendientes` son los módulos sin nota completa
 * del ciclo: se advierten antes de cerrar. Emite `cambio` tras cerrar o reabrir.
 */
import { ref, watch, onMounted } from 'vue'
import calificacionService from '@/services/calificacionService.js'
import ModalBase    from '@/components/ModalBase.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import { usePermisos }     from '@/composables/usePermisos.js'
import { useConfirm }      from '@/composables/useConfirm.js'
import { useNotification } from '@/composables/useNotification'

const props = defineProps({
  cicloId:    { type: [Number, String], required: true },
  pendientes: { type: Number, default: 0 }
})
const emit = defineEmits(['cambio'])

const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()
const { success: notifySuccess, error: notifyError } = useNotification()

const estado     = ref(null)
const cargando   = ref(false)
const procesando = ref(false)

/** 'YYYY-MM-DD HH:mm:ss' → '16/11/2026 14:30'. */
function formatFechaHora(valor) {
  if (!valor) return '—'
  const [fecha, hora = ''] = String(valor).split(' ')
  return `${fecha.split('-').reverse().join('/')} ${hora.slice(0, 5)}`.trim()
}

async function cargar() {
  cargando.value = true
  try {
    estado.value = (await calificacionService.estadoCierre(props.cicloId)).data
  } catch (e) {
    estado.value = null
    notifyError(e?.response?.data?.message ?? 'No se pudo consultar el cierre de notas del ciclo.')
  } finally {
    cargando.value = false
  }
}

async function cerrar() {
  const aviso = props.pendientes
    ? `Hay ${props.pendientes} módulo(s) con notas pendientes. `
    : ''
  if (!await confirm(`${aviso}¿Cerrar las notas del ciclo? Después solo se podrán cambiar si alguien con permiso las reabre.`, {
    title: 'Cerrar notas del ciclo', confirmLabel: 'Cerrar notas'
  })) return

  procesando.value = true
  try {
    estado.value = (await calificacionService.cerrarCiclo(props.cicloId)).data
    notifySuccess('Notas del ciclo cerradas.')
    emit('cambio')
  } catch (e) {
    const errores = e?.response?.data?.errors
    notifyError(errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudieron cerrar las notas.'))
  } finally {
    procesando.value = false
  }
}

const showReabrir  = ref(false)
const motivo       = ref('')
const errorReabrir = ref('')

function abrirReapertura() {
  motivo.value       = ''
  errorReabrir.value = ''
  showReabrir.value  = true
}

async function reabrir() {
  procesando.value   = true
  errorReabrir.value = ''
  try {
    estado.value = (await calificacionService.reabrirCiclo(props.cicloId, motivo.value.trim())).data
    showReabrir.value = false
    notifySuccess('Notas del ciclo reabiertas.')
    emit('cambio')
  } catch (e) {
    const errores = e?.response?.data?.errors
    errorReabrir.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudieron reabrir las notas.')
  } finally {
    procesando.value = false
  }
}

watch(() => props.cicloId, cargar, { immediate: true })
onMounted(() => loadPermisos().catch(() => {}))
</script>
