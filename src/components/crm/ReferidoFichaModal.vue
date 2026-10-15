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
      <section class="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-4">
        <div>
          <p class="text-xs text-slate-400">Estado</p>
          <span class="mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoReferido(referido.status)">
            {{ referido.status_text }}
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
        <div>
          <p class="text-xs text-slate-400">Tallas (overol / botas)</p>
          <p class="font-medium text-slate-800">{{ referido.talla_overol || '—' }} / {{ referido.talla_botas || '—' }}</p>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Bitácora de seguimientos -->
        <section aria-labelledby="ficha-bitacora-heading" class="flex flex-col gap-3">
          <h3 id="ficha-bitacora-heading" class="text-sm font-semibold text-slate-900">Bitácora de seguimiento</h3>

          <form v-if="canSeguimiento" class="flex flex-col gap-2" @submit.prevent="guardarSeguimiento">
            <FormTextarea
              v-model="nuevoSeguimiento"
              label="Nuevo seguimiento"
              placeholder="Ej: Llamada — quiere jornada sábado, pide información de financiación."
              :rows="3"
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
              <p class="text-xs text-slate-400">
                {{ fechaCorta(item.fecha) }} · {{ nombreCompleto(item.seguidor) || '—' }}
              </p>
              <p class="mt-1 whitespace-pre-line text-sm text-slate-700">{{ item.seguimiento }}</p>
            </li>
          </ol>
        </section>

        <!-- Citas -->
        <section aria-labelledby="ficha-citas-heading" class="flex flex-col gap-3">
          <h3 id="ficha-citas-heading" class="text-sm font-semibold text-slate-900">Citas</h3>

          <form v-if="canAgendar" class="grid grid-cols-2 gap-2" @submit.prevent="agendarCita">
            <FormInput v-model="cita.fecha" type="date" label="Fecha" :min="hoy" :error="erroresCita.fecha?.[0]" />
            <FormInput v-model="cita.hora" type="time" label="Hora" :error="erroresCita.hora?.[0]" />
            <div class="col-span-2 flex justify-end">
              <button
                type="submit"
                :disabled="!cita.fecha || !cita.hora || agendando"
                class="rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {{ agendando ? 'Agendando...' : 'Agendar cita' }}
              </button>
            </div>
          </form>

          <p v-if="!citas.length" class="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
            Sin citas agendadas.
          </p>
          <ul v-else class="max-h-80 space-y-2 overflow-y-auto pr-1">
            <li
              v-for="item in citas"
              :key="item.id"
              class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm"
            >
              <span class="text-slate-700">{{ fechaCorta(item.fecha) }} · {{ horaCorta(item.hora) }}</span>
              <span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoAgenda(item.status)">
                {{ item.status_text }}
              </span>
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
        v-if="canConvertir && puedeConvertirse(referido)"
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
import FormInput          from '@/components/forms/FormInput.vue'
import FormTextarea       from '@/components/forms/FormTextarea.vue'
import referidoService    from '@/services/referidoService.js'
import seguimientoService from '@/services/seguimientoService.js'
import agendaService      from '@/services/agendaService.js'
import { authService }    from '@/services/authService.js'
import { nombreCompleto } from '@/utils/formatters.js'
import { useNotification } from '@/composables/useNotification'
import {
  claseEstadoReferido, claseEstadoAgenda, puedeConvertirse,
  jornadaDeHora, horaCorta, fechaISO, fechaCorta
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

const hoy = fechaISO()
const seguimientos     = ref([])
const citas            = ref([])
const cargandoBitacora = ref(false)
const error            = ref('')

async function cargar() {
  if (!props.referido) return
  cargandoBitacora.value = true
  error.value            = ''
  try {
    const [bitacora, detalle] = await Promise.all([
      seguimientoService.getByReferido(props.referido.id, { per_page: 50 }),
      referidoService.getById(props.referido.id, { with: 'agendamientos' })
    ])
    seguimientos.value = bitacora.data ?? []
    citas.value        = [...(detalle.data?.agendamientos ?? [])].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar la ficha del lead.'
  } finally {
    cargandoBitacora.value = false
  }
}

watch(() => [props.modelValue, props.referido?.id], ([abierto]) => {
  if (!abierto) return
  nuevoSeguimiento.value = ''
  Object.assign(cita, { fecha: '', hora: '' })
  erroresCita.value = {}
  cargar()
})

// ─── Nuevo seguimiento ──────────────────────────────────────────────────────
const nuevoSeguimiento     = ref('')
const guardandoSeguimiento = ref(false)

async function usuarioActualId() {
  const user = await authService.getUser()
  return user?.id
}

async function guardarSeguimiento() {
  guardandoSeguimiento.value = true
  error.value = ''
  try {
    await seguimientoService.create({
      referido_id: props.referido.id,
      seguidor_id: await usuarioActualId(),
      fecha:       fechaISO(),
      seguimiento: nuevoSeguimiento.value.trim()
    })
    nuevoSeguimiento.value = ''
    notifySuccess('Seguimiento registrado.')
    await cargar()
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo registrar el seguimiento.'
  } finally {
    guardandoSeguimiento.value = false
  }
}

// ─── Agendar cita ───────────────────────────────────────────────────────────
const cita        = reactive({ fecha: '', hora: '' })
const erroresCita = ref({})
const agendando   = ref(false)

async function agendarCita() {
  agendando.value   = true
  erroresCita.value = {}
  error.value       = ''
  try {
    await agendaService.create({
      referido_id: props.referido.id,
      fecha:       cita.fecha,
      hora:        cita.hora,
      jornada:     jornadaDeHora(cita.hora)
    })
    Object.assign(cita, { fecha: '', hora: '' })
    notifySuccess('Cita agendada.')
    await cargar()
    emit('changed')
  } catch (e) {
    if (e?.response?.status === 422) erroresCita.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo agendar la cita.'
  } finally {
    agendando.value = false
  }
}
</script>
