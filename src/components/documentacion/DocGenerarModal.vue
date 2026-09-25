<template>
  <ModalBase
    :model-value="modelValue"
    title="Generar documento"
    description="El sistema elige la versión de plantilla que aplica y congela el contenido al emitirlo."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-4 pb-2" @submit.prevent="generar">
      <FormSelect
        v-model="tipoId"
        label="Tipo de documento"
        :options="tiposOptions"
        :disabled="cargandoTipos"
        required
        :error="errores.tipo_documento_id?.[0]"
      />

      <template v-if="tipo">
        <p class="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          <template v-if="tipo.se_ata_fecha">
            Se usará la versión vigente en la
            <strong>{{ tipo.campo_fecha_referencia ? etiquetaCampoFecha(tipo.campo_fecha_referencia).toLowerCase() : 'fecha de generación' }}</strong>
            del registro, aunque hoy haya otra versión vigente.
          </template>
          <template v-else>Se usará la versión vigente hoy.</template>
        </p>

        <DocEntidadSelector
          v-if="tipo.entidad_type"
          :key="tipo.id"
          v-model="entidadId"
          :entidad-type="tipo.entidad_type"
          :entidad-nombre="tipo.entidad_nombre"
          required
        />
        <p v-if="errores.entidad_id" class="text-xs text-red-600">{{ errores.entidad_id[0] }}</p>
      </template>

      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="!puedeGenerar || generando"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="generar"
      >
        {{ generando ? 'Generando...' : 'Generar documento' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import docDocumentoService      from '@/services/docDocumentoService.js'
import { useDocTiposDocumento } from '@/composables/useDocTiposDocumento.js'
import { etiquetaCampoFecha }   from '@/utils/documentacion.js'
import ModalBase          from '@/components/ModalBase.vue'
import FormSelect         from '@/components/forms/FormSelect.vue'
import DocEntidadSelector from './DocEntidadSelector.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'generado'])

const { tiposOptions, tipoPorId, cargandoTipos, loadTipos } = useDocTiposDocumento({ soloActivos: true })

const tipoId    = ref('')
const entidadId = ref(null)
const generando = ref(false)
const error     = ref('')
const errores   = ref({})

const tipo = computed(() => (tipoId.value ? tipoPorId(tipoId.value) : null))
const puedeGenerar = computed(() => !!tipo.value && (!tipo.value.entidad_type || !!entidadId.value))

watch(tipoId, () => { entidadId.value = null; error.value = ''; errores.value = {} })

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  tipoId.value = ''
  entidadId.value = null
  error.value = ''
  errores.value = {}
  loadTipos()
})

async function generar() {
  if (!puedeGenerar.value) return
  generando.value = true
  error.value = ''
  errores.value = {}
  try {
    const res = await docDocumentoService.generar({
      tipo_documento_id: tipo.value.id,
      entidad_id:        entidadId.value,
    })
    emit('generado', res.data)
    emit('update:modelValue', false)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    error.value   = e?.response?.data?.message ?? 'No se pudo generar el documento.'
  } finally {
    generando.value = false
  }
}
</script>
