<template>
  <ModalBase
    :model-value="modelValue"
    size="lg"
    :title="esMovimiento ? 'Detalle del movimiento' : 'Detalle de la consignación'"
    :description="registro ? `${registro.fecha} · ${registro.sede?.nombre ?? ''}` : ''"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="cargando" class="py-8 text-center text-sm text-slate-500">Cargando...</div>
    <div v-else-if="registro" class="flex flex-col gap-5 pb-2">
      <div
        v-if="registro.status === STATUS_ANULADO"
        class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      >
        Anulado por {{ registro.anulado_por?.name ?? '—' }} el {{ registro.anulado_at }}: {{ registro.motivo_anulacion }}
      </div>

      <dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <template v-if="esMovimiento">
          <div><dt class="text-xs text-slate-500">Tipo</dt><dd>{{ registro.tipo_movimiento?.nombre }} ({{ registro.clase_text }})</dd></div>
          <div><dt class="text-xs text-slate-500">Tercero</dt><dd>{{ registro.tercero_nombre }} — {{ registro.tercero_tipo_identificacion }} {{ registro.tercero_identificacion }}</dd></div>
          <div><dt class="text-xs text-slate-500">Documento</dt><dd>{{ registro.documento_tipo_text }} {{ registro.documento_numero ?? '' }}</dd></div>
          <div><dt class="text-xs text-slate-500">Medio de pago</dt><dd>{{ registro.medio_pago_text }}<template v-if="registro.banco"> · {{ registro.banco.nombre }}</template></dd></div>
          <div><dt class="text-xs text-slate-500">Subtotal</dt><dd>{{ formatCOP(registro.subtotal) }}</dd></div>
          <div><dt class="text-xs text-slate-500">Impuestos / Retenciones</dt><dd>{{ formatCOP(registro.total_impuestos) }} / {{ formatCOP(registro.total_retenciones) }}</dd></div>
        </template>
        <template v-else>
          <div><dt class="text-xs text-slate-500">Banco</dt><dd>{{ registro.banco?.nombre }}</dd></div>
          <div><dt class="text-xs text-slate-500">A nombre de</dt><dd>{{ registro.titular }}</dd></div>
          <div><dt class="text-xs text-slate-500">Cuenta</dt><dd>{{ registro.numero_cuenta ?? '—' }}</dd></div>
          <div><dt class="text-xs text-slate-500">Comprobante</dt><dd>{{ registro.numero_comprobante ?? '—' }}</dd></div>
        </template>
        <div><dt class="text-xs text-slate-500">Registrado por</dt><dd>{{ registro.usuario?.name }}</dd></div>
        <div>
          <dt class="text-xs text-slate-500">Valor</dt>
          <dd class="text-base font-semibold text-slate-900">{{ formatCOP(esMovimiento ? registro.valor_total : registro.valor) }}</dd>
        </div>
      </dl>

      <ul v-if="esMovimiento && registro.impuestos?.length" class="flex flex-col gap-1 text-sm">
        <li v-for="imp in registro.impuestos" :key="imp.impuesto_id" class="flex justify-between border-b border-slate-100 py-1">
          <span>{{ imp.nombre }} ({{ imp.porcentaje }} %)</span>
          <span :class="imp.efecto === EFECTO_RESTA ? 'text-amber-700' : ''">{{ imp.efecto === EFECTO_RESTA ? '−' : '+' }} {{ formatCOP(imp.valor) }}</span>
        </li>
      </ul>

      <p v-if="registro.observaciones" class="text-sm text-slate-700"><strong>Observaciones:</strong> {{ registro.observaciones }}</p>

      <SoportesPanel
        :soportable-tipo="tipo"
        :soportable-id="registro.id"
        :soportes="registro.soportes ?? []"
        :tipos="tiposSoporte"
        :puede-subir="puedeSubirSoportes && registro.status !== STATUS_ANULADO"
        :puede-eliminar="puedeEditar && registro.turno_abierto && registro.status !== STATUS_ANULADO"
        @cambio="cargar"
      />

      <form
        v-if="puedeAnularEste"
        class="flex flex-col gap-2 rounded-lg border border-red-200 p-3"
        @submit.prevent="anular"
      >
        <p class="text-sm font-medium text-red-800">
          Anular {{ esMovimiento ? 'movimiento' : 'consignación' }}
          <span v-if="!registro.turno_abierto" class="font-normal">(el turno ya está cerrado: el cierre quedará ajustado)</span>
        </p>
        <FormTextarea v-model="motivo" label="Motivo (mínimo 5 caracteres)" :rows="2" />
        <button
          type="submit"
          :disabled="anulando"
          class="self-end rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {{ anulando ? 'Anulando...' : 'Anular' }}
        </button>
      </form>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    </div>

    <template #footer>
      <button
        v-if="registro && puedeEditar && registro.turno_abierto && registro.status !== STATUS_ANULADO"
        type="button"
        class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('editar', registro)"
      >
        Editar
      </button>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cerrar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import SoportesPanel from './SoportesPanel.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { EFECTO_RESTA, formatCOP, validarMotivo } from '@/utils/libroDiario.js'

/** Estado anulado de movimientos y consignaciones (coincide con el backend). */
const STATUS_ANULADO = 2

/**
 * Detalle de un movimiento o una consignación: datos, impuestos, soportes y anulación.
 * Emite `editar` con el registro y `cambio` cuando se anula.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tipo: { type: String, required: true, validator: (v) => ['movimiento', 'consignacion'].includes(v) },
  registroId: { type: Number, default: null },
  tiposSoporte: { type: Object, default: () => ({}) },
  puedeEditar: { type: Boolean, default: false },
  puedeSubirSoportes: { type: Boolean, default: false },
  puedeAnular: { type: Boolean, default: false },
  /** Permiso para anular registros de un turno ya cerrado */
  puedeAnularCerrado: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'editar', 'cambio'])

const registro = ref(null)
const cargando = ref(false)
const motivo = ref('')
const anulando = ref(false)
const error = ref('')

const esMovimiento = computed(() => props.tipo === 'movimiento')
const puedeAnularEste = computed(() => registro.value
  && registro.value.status !== STATUS_ANULADO
  && props.puedeAnular
  && (registro.value.turno_abierto || props.puedeAnularCerrado))

async function cargar() {
  if (!props.registroId) return
  cargando.value = !registro.value
  error.value = ''
  try {
    const res = esMovimiento.value
      ? await libroDiarioService.getMovimiento(props.registroId)
      : await libroDiarioService.getConsignacion(props.registroId)
    registro.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar el registro.'
  } finally {
    cargando.value = false
  }
}

watch(() => [props.modelValue, props.registroId], ([abierto]) => {
  if (!abierto) return
  registro.value = null
  motivo.value = ''
  cargar()
})

async function anular() {
  error.value = validarMotivo(motivo.value) ?? ''
  if (error.value) return
  anulando.value = true
  try {
    const res = esMovimiento.value
      ? await libroDiarioService.anularMovimiento(registro.value.id, motivo.value)
      : await libroDiarioService.anularConsignacion(registro.value.id, motivo.value)
    registro.value = res.data
    motivo.value = ''
    emit('cambio')
  } catch (e) {
    error.value = e?.response?.data?.errors?.motivo?.[0] ?? e?.response?.data?.message ?? 'No se pudo anular el registro.'
  } finally {
    anulando.value = false
  }
}

defineExpose({ cargar })
</script>
