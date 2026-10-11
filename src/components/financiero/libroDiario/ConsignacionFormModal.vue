<template>
  <ModalBase
    :model-value="modelValue"
    :title="consignacion ? 'Editar consignación' : 'Registrar consignación'"
    description="Efectivo de la caja consignado en una cuenta bancaria. No puede superar el efectivo en caja."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-4 pb-2" @submit.prevent="guardar">
      <FormSelect
        v-model="form.banco_id"
        label="Banco"
        required
        :options="opcionesBanco(bancos)"
        :error="errores.banco_id?.[0]"
      />
      <FormInput
        v-model="form.valor"
        type="number"
        min="0"
        label="Valor consignado"
        required
        :error="errores.valor?.[0]"
      />
      <FormInput
        v-model="form.titular"
        label="A nombre de"
        placeholder="Titular de la cuenta"
        required
        :error="errores.titular?.[0]"
      />
      <FormInput v-model="form.numero_cuenta" label="Número de cuenta" :error="errores.numero_cuenta?.[0]" />
      <FormInput v-model="form.numero_comprobante" label="Número de comprobante" :error="errores.numero_comprobante?.[0]" />
      <FormTextarea v-model="form.observaciones" label="Observaciones" :rows="2" />

      <label v-if="!consignacion" class="flex flex-col gap-1 text-sm">
        <span class="font-medium text-slate-700">Comprobante (PDF o imagen)</span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          class="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
          @change="elegirComprobante"
        >
        <span v-if="errorComprobante" class="text-xs text-red-600">{{ errorComprobante }}</span>
      </label>

      <div v-if="errorGeneral" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-700">{{ errorGeneral }}</p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : (consignacion ? 'Guardar cambios' : 'Registrar') }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { opcionesBanco } from '@/utils/formatters.js'
import { validarArchivoSoporte } from '@/utils/libroDiario.js'

/**
 * Formulario para registrar o editar una consignación de efectivo: valor,
 * banco, a nombre de quién y comprobante.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  consignacion: { type: Object, default: null },
  bancos: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'guardado'])

const vacio = () => ({ banco_id: '', valor: '', titular: '', numero_cuenta: '', numero_comprobante: '', observaciones: '' })
const form = reactive(vacio())
const comprobante = ref(null)
const errorComprobante = ref('')
const errores = ref({})
const errorGeneral = ref('')
const guardando = ref(false)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  Object.assign(form, vacio())
  if (props.consignacion) {
    const c = props.consignacion
    Object.assign(form, {
      banco_id: c.banco_id,
      valor: c.valor,
      titular: c.titular,
      numero_cuenta: c.numero_cuenta ?? '',
      numero_comprobante: c.numero_comprobante ?? '',
      observaciones: c.observaciones ?? '',
    })
  }
  comprobante.value = null
  errorComprobante.value = ''
  errores.value = {}
  errorGeneral.value = ''
})

function elegirComprobante(evento) {
  const elegido = evento.target.files?.[0] ?? null
  errorComprobante.value = elegido ? (validarArchivoSoporte(elegido) ?? '') : ''
  comprobante.value = errorComprobante.value ? null : elegido
}

async function guardar() {
  guardando.value = true
  errores.value = {}
  errorGeneral.value = ''
  try {
    const res = props.consignacion
      ? await libroDiarioService.actualizarConsignacion(props.consignacion.id, { ...form })
      : await libroDiarioService.crearConsignacion({ ...form })

    let comprobanteFallido = false
    if (comprobante.value) {
      try {
        await libroDiarioService.subirSoporte('consignacion', res.data.id, 'comprobante', comprobante.value)
      } catch {
        comprobanteFallido = true
      }
    }

    emit('guardado', { consignacion: res.data, comprobanteFallido })
    emit('update:modelValue', false)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    errorGeneral.value = errores.value.turno?.[0] ?? e?.response?.data?.message ?? 'No se pudo guardar la consignación.'
  } finally {
    guardando.value = false
  }
}
</script>
