<template>
  <ModalBase
    :model-value="modelValue"
    title="Imprimir documento"
    description="El documento se arma en este momento con los datos del registro; no se almacena."
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4 pb-4">
      <!-- Reimpresión desde la bitácora: tipo y registro ya definidos -->
      <p v-if="fijo" class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <span class="font-medium">{{ tipo?.nombre ?? 'Tipo de documento' }}</span>
        <span v-if="entidadId" class="text-slate-500"> · {{ tipo?.entidad_nombre ?? 'Registro' }} #{{ entidadId }}</span>
      </p>

      <form v-else class="flex flex-col gap-4" @submit.prevent="verDocumento">
        <FormSelect
          v-model="tipoId"
          label="Tipo de documento"
          :options="tiposOptions"
          :disabled="cargandoTipos"
          required
          :error="errores.tipo_documento_id?.[0]"
        />

        <DocEntidadSelector
          v-if="tipo?.entidad_type"
          :key="tipo.id"
          v-model="entidadId"
          :entidad-type="tipo.entidad_type"
          :entidad-nombre="tipo.entidad_nombre"
          required
        />
        <p v-if="errores.entidad_id" class="text-xs text-red-600">{{ errores.entidad_id[0] }}</p>
      </form>

      <p v-if="tipo && !resultado" class="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
        <template v-if="tipo.conforma_matricula">
          Conforma la matrícula: se usará la versión vigente en la
          <strong>{{ tipo.campo_fecha_referencia ? etiquetaCampoFecha(tipo.campo_fecha_referencia).toLowerCase() : 'fecha de impresión' }}</strong>
          del registro, aunque hoy haya otra versión vigente.
        </template>
        <template v-else>Se usará la versión vigente hoy.</template>
      </p>

      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

      <div v-if="cargando" class="py-12 text-center text-sm text-slate-500">Armando documento...</div>
      <template v-else-if="resultado">
        <p class="text-xs text-slate-500">
          Versión v{{ resultado.version }}
          <template v-if="resultado.fecha_referencia">· condiciones vigentes al {{ resultado.fecha_referencia }}</template>
        </p>
        <DocHtmlPreview :html="resultado.contenido ?? ''" />
      </template>
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
        v-if="!fijo"
        type="button"
        :disabled="!puedeImprimir || cargando"
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="verDocumento"
      >
        <NavIcon name="eye" class="size-4" /> Ver documento
      </button>
      <button
        type="button"
        :disabled="!puedeImprimir || descargando"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="descargarPdf"
      >
        <NavIcon name="download" class="size-4" />
        {{ descargando ? 'Descargando...' : 'Descargar PDF' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import docDocumentoService      from '@/services/docDocumentoService.js'
import { useDocTiposDocumento } from '@/composables/useDocTiposDocumento.js'
import { etiquetaCampoFecha, nombreArchivoDocumento } from '@/utils/documentacion.js'
import { descargarBlob, mensajeErrorBlob }            from '@/utils/descargas.js'
import ModalBase          from '@/components/ModalBase.vue'
import FormSelect         from '@/components/forms/FormSelect.vue'
import NavIcon            from '@/components/icons/NavIcon.vue'
import DocEntidadSelector from './DocEntidadSelector.vue'
import DocHtmlPreview     from './DocHtmlPreview.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /**
   * Reimpresión de un registro ya conocido (p. ej. desde la bitácora):
   * `{ tipo_documento_id, entidad_id }`. Si llega, no se piden selectores y se
   * muestra el documento al abrir.
   */
  inicial:    { type: Object, default: null },
})

// `impreso` se emite en cada render/pdf exitoso: ambos dejan una entrada en la bitácora.
const emit = defineEmits(['update:modelValue', 'impreso'])

const { tiposOptions, tipoPorId, cargandoTipos, loadTipos } = useDocTiposDocumento({ soloActivos: true })

const tipoId      = ref('')
const entidadId   = ref(null)
const resultado   = ref(null)
const cargando    = ref(false)
const descargando = ref(false)
const error       = ref('')
const errores     = ref({})

const fijo = computed(() => !!props.inicial)
const tipo = computed(() => (tipoId.value ? tipoPorId(tipoId.value) : null))
const puedeImprimir = computed(() => !!tipoId.value && (!tipo.value?.entidad_type || !!entidadId.value))

const parametros = () => ({
  tipo_documento_id: Number(tipoId.value),
  ...(entidadId.value ? { entidad_id: entidadId.value } : {}),
})

function limpiarResultado() {
  resultado.value = null
  error.value     = ''
  errores.value   = {}
}

watch(tipoId, () => {
  if (fijo.value) return
  entidadId.value = null
  limpiarResultado()
})
watch(entidadId, () => { if (!fijo.value) limpiarResultado() })

watch(() => props.modelValue, async (abierto) => {
  if (!abierto) return
  tipoId.value    = props.inicial?.tipo_documento_id ? String(props.inicial.tipo_documento_id) : ''
  entidadId.value = props.inicial?.entidad_id ?? null
  limpiarResultado()
  await loadTipos()
  if (fijo.value) verDocumento()
})

async function verDocumento() {
  if (!puedeImprimir.value) return
  cargando.value = true
  limpiarResultado()
  try {
    const res = await docDocumentoService.render(parametros())
    resultado.value = res.data
    emit('impreso')
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    error.value   = e?.response?.data?.message ?? 'No se pudo armar el documento.'
  } finally {
    cargando.value = false
  }
}

async function descargarPdf() {
  if (!puedeImprimir.value) return
  descargando.value = true
  error.value = ''
  try {
    const res = await docDocumentoService.pdf(parametros())
    descargarBlob(res.data, nombreArchivoDocumento(tipo.value?.codigo, entidadId.value), 'application/pdf')
    emit('impreso')
  } catch (e) {
    error.value = await mensajeErrorBlob(e, 'No se pudo descargar el PDF.')
  } finally {
    descargando.value = false
  }
}
</script>
