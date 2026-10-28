<template>
  <ModalBase
    :model-value="modelValue"
    size="md"
    :title="fila?.recuperacion ? 'Editar recuperación' : 'Registrar recuperación'"
    description="La nota de recuperación reemplaza la nota final y define si el estudiante aprueba el módulo."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form v-if="fila" class="flex flex-col gap-4 pb-2" @submit.prevent="guardar">
      <div class="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <p class="font-medium text-slate-900">{{ fila.estudiante.name }}</p>
        <p>{{ fila.modulo?.nombre }} · Grupo {{ fila.grupo?.nombre }}</p>
        <p>Nota final del esquema: <strong>{{ formatoNota(fila.nota_final) }}</strong></p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          v-model="form.nota"
          type="number"
          label="Nota de recuperación"
          step="0.1"
          min="0"
          required
          :error="errores.nota?.[0]"
        />
        <FormInput v-model="form.fecha_registro" type="date" label="Fecha" required :error="errores.fecha_registro?.[0]" />
      </div>
      <FormTextarea v-model="form.observaciones" label="Observaciones" :rows="3" />

      <div v-if="error" role="alert" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <ul v-if="erroresGenerales.length" class="list-disc pl-5">
          <li v-for="msg in erroresGenerales" :key="msg">{{ msg }}</li>
        </ul>
        <p v-else>{{ error }}</p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando || form.nota === ''"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : 'Guardar recuperación' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
/**
 * Registro o edición de la recuperación de un módulo reprobado. `fila` es un resultado
 * de módulo de la sábana grupal o del consolidado (estudiante, grupo, modulo,
 * nota_final y recuperacion). Emite `guardado` al registrar.
 */
import { reactive, ref, computed, watch } from 'vue'
import calificacionService from '@/services/calificacionService.js'
import ModalBase    from '@/components/ModalBase.vue'
import FormInput    from '@/components/forms/FormInput.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import { useNotification } from '@/composables/useNotification'
import { fechaISO } from '@/utils/crm.js'
import { formatoNota } from '@/utils/calificaciones.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  fila:       { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'guardado'])

const { success: notifySuccess } = useNotification()

const form      = reactive({ nota: '', fecha_registro: '', observaciones: '' })
const guardando = ref(false)
const error     = ref('')
const errores   = ref({})

// Errores que no son de un campo del formulario (estudiante o grupo): ciclo cerrado, ya aprobó...
const erroresGenerales = computed(() => [...(errores.value.estudiante_id ?? []), ...(errores.value.grupo_id ?? [])])

watch(() => props.modelValue, abierto => {
  if (!abierto) return
  const rec = props.fila?.recuperacion
  Object.assign(form, {
    nota:           rec ? String(rec.nota) : '',
    fecha_registro: rec?.fecha_registro ?? fechaISO(),
    observaciones:  rec?.observaciones ?? ''
  })
  error.value   = ''
  errores.value = {}
})

async function guardar() {
  guardando.value = true
  error.value     = ''
  errores.value   = {}
  const datos = {
    nota:           Number(String(form.nota).replace(',', '.')),
    fecha_registro: form.fecha_registro,
    observaciones:  form.observaciones.trim() || null
  }
  try {
    const rec = props.fila.recuperacion
    if (rec) await calificacionService.actualizarRecuperacion(rec.id, datos)
    else await calificacionService.registrarRecuperacion({ ...datos, estudiante_id: props.fila.estudiante.id, grupo_id: props.fila.grupo.id })
    notifySuccess('Recuperación guardada.')
    emit('update:modelValue', false)
    emit('guardado')
  } catch (e) {
    if (e?.response?.status === 422) errores.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo guardar la recuperación.'
  } finally {
    guardando.value = false
  }
}
</script>
