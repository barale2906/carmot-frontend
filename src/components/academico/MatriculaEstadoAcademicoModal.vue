<template>
  <ModalBase
    :model-value="modelValue"
    size="lg"
    title="Estado académico"
    :description="matricula ? `${matricula.estudiante?.name ?? 'Estudiante'} · ${matricula.curso?.nombre ?? ''}` : ''"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="matricula" class="flex flex-col gap-5 pb-2">
      <p class="text-sm text-slate-600">
        Estado actual:
        <span class="ml-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium" :class="claseEstadoAcademico(matricula.estado_academico)">
          {{ matricula.estado_academico_texto ?? '—' }}
        </span>
        <span v-if="matricula.fecha_estado_academico" class="ml-1 text-xs text-slate-400">desde {{ fechaCorta(matricula.fecha_estado_academico) }}</span>
      </p>

      <!-- Cambio de estado -->
      <form v-if="puedeCambiar" class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="guardar">
        <FormSelect
          v-model="form.estado_academico"
          label="Nuevo estado"
          required
          :options="opcionesDisponibles"
          :error="errores.estado_academico?.[0]"
        />
        <FormInput v-model="form.fecha" type="date" label="Rige desde" required :max="hoy" :error="errores.fecha?.[0]" />
        <div class="md:col-span-2">
          <FormTextarea v-model="form.motivo" label="Motivo" required :rows="3" placeholder="Ej: Retiro voluntario por cambio de ciudad." />
          <p v-if="errores.motivo" class="mt-1 text-xs text-red-600">{{ errores.motivo[0] }}</p>
        </div>
        <p v-if="efecto" class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 md:col-span-2">{{ efecto }}</p>
        <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{{ error }}</p>
      </form>
      <p v-else-if="matricula.status === 2" class="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
        La matrícula está anulada: su estado académico no se puede cambiar.
      </p>

      <!-- Historial -->
      <section aria-labelledby="historial-estados-heading">
        <h3 id="historial-estados-heading" class="mb-2 text-sm font-semibold text-slate-900">Historial</h3>
        <p v-if="cargandoHistorial" class="text-sm text-slate-500">Cargando historial...</p>
        <p v-else-if="!historial.length" class="text-sm text-slate-400">Sin cambios registrados.</p>
        <ol v-else class="space-y-2">
          <li v-for="item in historial" :key="item.id" class="rounded-lg border border-slate-200 p-3 text-sm">
            <p class="text-slate-800">
              {{ item.estado_anterior_texto }} → <strong>{{ item.estado_nuevo_texto }}</strong>
              <span class="text-xs text-slate-400">· {{ fechaCorta(item.fecha) }} · {{ item.usuario?.name ?? '—' }}</span>
            </p>
            <p class="mt-1 whitespace-pre-line text-slate-600">{{ item.motivo }}</p>
          </li>
        </ol>
      </section>
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
        v-if="puedeCambiar"
        type="button"
        :disabled="guardando || !form.estado_academico || !form.motivo.trim()"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : 'Cambiar estado' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import ModalBase        from '@/components/ModalBase.vue'
import FormSelect       from '@/components/forms/FormSelect.vue'
import FormInput        from '@/components/forms/FormInput.vue'
import FormTextarea     from '@/components/forms/FormTextarea.vue'
import matriculaService from '@/services/matriculaService.js'
import { useNotification } from '@/composables/useNotification'
import { fechaISO, fechaCorta } from '@/utils/crm.js'
import { OPCIONES_ESTADO_ACADEMICO, claseEstadoAcademico, efectoDelCambio } from '@/utils/estadoAcademico.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Matrícula del listado (MatriculaResource). */
  matricula:  { type: Object,  default: null },
  canCambiar: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'changed'])

const { success: notifySuccess } = useNotification()
const hoy = fechaISO()

const puedeCambiar = computed(() => props.canCambiar && props.matricula?.status !== 2)
const opcionesDisponibles = computed(() =>
  OPCIONES_ESTADO_ACADEMICO.filter(o => o.value !== props.matricula?.estado_academico)
)

const form      = reactive({ estado_academico: '', fecha: hoy, motivo: '' })
const errores   = ref({})
const error     = ref('')
const guardando = ref(false)
const efecto    = computed(() => efectoDelCambio(props.matricula?.estado_academico, form.estado_academico))

const historial         = ref([])
const cargandoHistorial = ref(false)

async function cargarHistorial() {
  cargandoHistorial.value = true
  try {
    const res = await matriculaService.historialEstados(props.matricula.id)
    historial.value = res.data ?? []
  } catch {
    historial.value = []
  } finally {
    cargandoHistorial.value = false
  }
}

watch(() => [props.modelValue, props.matricula?.id], ([abierto]) => {
  if (!abierto || !props.matricula) return
  Object.assign(form, { estado_academico: '', fecha: hoy, motivo: '' })
  errores.value = {}
  error.value   = ''
  cargarHistorial()
})

async function guardar() {
  guardando.value = true
  errores.value   = {}
  error.value     = ''
  try {
    const res = await matriculaService.cambiarEstadoAcademico(props.matricula.id, {
      estado_academico: Number(form.estado_academico),
      fecha:            form.fecha,
      motivo:           form.motivo.trim()
    })
    notifySuccess(res.message ?? 'Estado académico actualizado.')
    emit('changed', res.data)
    emit('update:modelValue', false)
  } catch (e) {
    if (e?.response?.status === 422) errores.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo cambiar el estado académico.'
  } finally {
    guardando.value = false
  }
}
</script>
