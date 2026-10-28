<template>
  <ModalBase
    :model-value="modelValue"
    size="xl"
    :title="referido ? (referido.nombre || 'Lead sin nombre') : 'Lead'"
    :description="referido ? `${referido.celular} · ${referido.ciudad}` : ''"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="referido" class="flex flex-col gap-6 pb-2">
      <!-- Resumen del lead -->
      <section class="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <p class="text-xs text-slate-400">Estado</p>
          <span class="mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoReferido(lead.status)">
            {{ lead.status_text }}
          </span>
        </div>
        <div>
          <p class="text-xs text-slate-400">Curso de interés</p>
          <p class="font-medium text-slate-800">{{ referido.curso?.nombre ?? '—' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">Asesor</p>
          <p class="font-medium text-slate-800">{{ referido.gestor?.name ?? '—' }}</p>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Bitácora de seguimientos -->
        <section aria-labelledby="ficha-bitacora-heading" class="flex flex-col gap-3">
          <h3 id="ficha-bitacora-heading" class="text-sm font-semibold text-slate-900">Bitácora de seguimiento</h3>

          <form v-if="canSeguimiento" class="flex flex-col gap-2" @submit.prevent="guardarSeguimiento">
            <SeguimientoForm
              v-model:texto="nuevoSeguimiento"
              v-model:estado="estadoSeguimiento"
              v-model:proxima="proximaAccion"
              label="Nuevo seguimiento"
              texto-requerido
              :permitir-matricular="canConvertir && puedeConvertirse(lead)"
              :permitir-agendar="canAgendar"
              :errores="erroresSeguimiento"
            />
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="!nuevoSeguimiento.trim() || guardandoSeguimiento"
                class="rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {{ guardandoSeguimiento ? 'Guardando...' : 'Registrar seguimiento' }}
              </button>
            </div>
          </form>

          <p v-if="cargandoBitacora" class="text-sm text-slate-500">Cargando bitácora...</p>
          <p v-else-if="!seguimientos.length" class="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
            Sin seguimientos registrados.
          </p>
          <ol v-else class="max-h-80 space-y-2 overflow-y-auto pr-1">
            <li v-for="item in seguimientos" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-3">
              <div class="flex items-start justify-between gap-2">
                <p class="text-xs text-slate-400">
                  {{ fechaCorta(item.fecha) }} · {{ nombreCompleto(item.seguidor) || '—' }}
                </p>
                <span
                  v-if="item.estado_referido_text"
                  class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="claseEstadoReferido(item.estado_referido)"
                >
                  {{ item.estado_referido_text }}
                </span>
              </div>
              <p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ item.seguimiento }}</p>
            </li>
          </ol>
        </section>

        <!-- Agenda: acciones programadas desde los seguimientos -->
        <section aria-labelledby="ficha-agenda-heading" class="flex flex-col gap-3">
          <h3 id="ficha-agenda-heading" class="text-sm font-semibold text-slate-900">Agenda</h3>

          <p v-if="!agenda.length" class="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
            Nada programado. Usa «Próxima acción» al registrar el seguimiento.
          </p>
          <ul v-else class="max-h-96 space-y-2 overflow-y-auto pr-1">
            <li v-for="item in agenda" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-slate-700">
                  <strong class="font-medium text-slate-900">{{ item.tipo_text }}</strong>
                  · {{ fechaCorta(item.fecha) }} · {{ horaCorta(item.hora) }}
                </span>
                <span class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoAgenda(item.status)">
                  {{ item.status_text }}
                </span>
              </div>
              <p v-if="item.nota" class="mt-1 text-slate-500">{{ item.nota }}</p>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cerrar
      </button>
      <button
        v-if="canConvertir && puedeConvertirse(lead)"
        type="button"
        class="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
        @click="emit('convertir', referido)"
      >
        Convertir en matrícula
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import ModalBase          from '@/components/ModalBase.vue'
import SeguimientoForm    from '@/components/crm/SeguimientoForm.vue'
import referidoService    from '@/services/referidoService.js'
import seguimientoService from '@/services/seguimientoService.js'
import { authService }    from '@/services/authService.js'
import { nombreCompleto } from '@/utils/formatters.js'
import { useNotification } from '@/composables/useNotification'
import {
  claseEstadoReferido, claseEstadoAgenda, puedeConvertirse, resolverEstadoSeguimiento,
  proximaAccionVacia, proximaAccionPayload, horaCorta, fechaISO, fechaCorta
} from '@/utils/crm.js'

const props = defineProps({
  modelValue:     { type: Boolean, default: false },
  /** Lead seleccionado en el listado (ReferidoResource). */
  referido:       { type: Object,  default: null },
  canSeguimiento: { type: Boolean, default: false },
  canAgendar:     { type: Boolean, default: false },
  canConvertir:   { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'changed', 'convertir'])

const { success: notifySuccess } = useNotification()

// Estado vigente del lead: arranca con la fila del listado y se refresca con el detalle,
// porque un seguimiento puede cambiarlo sin cerrar la ficha.
const lead             = ref({})
const seguimientos     = ref([])
const agenda           = ref([])
const cargandoBitacora = ref(false)
const error            = ref('')

async function cargar() {
  if (!props.referido) return
  cargandoBitacora.value = true
  error.value            = ''
  try {
    const [bitacora, detalle] = await Promise.all([
      seguimientoService.getByReferido(props.referido.id, { per_page: 50, sort_by: 'created_at', sort_direction: 'desc' }),
      referidoService.getById(props.referido.id, { with: 'agendamientos' })
    ])
    seguimientos.value = bitacora.data ?? []
    lead.value         = detalle.data ?? lead.value
    estadoSeguimiento.value = String(lead.value.status ?? '')
    agenda.value       = [...(detalle.data?.agendamientos ?? [])].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar la ficha del lead.'
  } finally {
    cargandoBitacora.value = false
  }
}

watch(() => [props.modelValue, props.referido?.id], ([abierto]) => {
  if (!abierto) return
  lead.value             = { ...props.referido }
  nuevoSeguimiento.value = ''
  estadoSeguimiento.value  = String(props.referido.status)
  erroresSeguimiento.value = {}
  proximaAccion.value      = proximaAccionVacia()
  cargar()
})

// ─── Nuevo seguimiento ──────────────────────────────────────────────────────
const nuevoSeguimiento     = ref('')
const estadoSeguimiento    = ref('')
const proximaAccion        = ref(proximaAccionVacia())
const erroresSeguimiento   = ref({})
const guardandoSeguimiento = ref(false)

async function usuarioActualId() {
  const user = await authService.getUser()
  return user?.id
}

/**
 * Registra el seguimiento con el estado elegido y la próxima acción. Si el estado es
 * Matriculado, el seguimiento se guarda sin cambiar el estado y se abre el asistente de
 * matrícula (convertir).
 */
async function guardarSeguimiento() {
  guardandoSeguimiento.value = true
  erroresSeguimiento.value   = {}
  error.value = ''
  const { estado, convertir } = resolverEstadoSeguimiento(estadoSeguimiento.value, lead.value.status)
  try {
    await seguimientoService.create({
      referido_id:     props.referido.id,
      seguidor_id:     await usuarioActualId(),
      fecha:           fechaISO(),
      seguimiento:     nuevoSeguimiento.value.trim(),
      estado_referido: estado,
      proxima_accion:  proximaAccionPayload(proximaAccion.value)
    })
    nuevoSeguimiento.value = ''
    proximaAccion.value    = proximaAccionVacia()
    notifySuccess('Seguimiento registrado.')
    if (convertir) {
      emit('convertir', lead.value)
      return
    }
    await cargar()
    emit('changed')
  } catch (e) {
    if (e?.response?.status === 422) erroresSeguimiento.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo registrar el seguimiento.'
  } finally {
    guardandoSeguimiento.value = false
  }
}
</script>
