<template>
  <ModalBase
    :model-value="open"
    title="Documentos de la matrícula"
    :description="data?.codigo ? `Documentos vigentes que conforman la matrícula ${data.codigo}.` : 'Documentos vigentes que conforman la matrícula.'"
    size="xl"
    @update:model-value="(v) => { if (!v) emit('close') }"
  >
    <div class="flex flex-col gap-4 pb-4">
      <div v-if="cargando" class="py-12 text-center text-sm text-slate-500">Generando documentos...</div>

      <template v-else>
        <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
          <template v-if="!documentos.length">Puedes continuar al recibo de pago e imprimirlos después desde Documentación.</template>
        </p>

        <p
          v-if="sinPlantilla.length"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Sin versión vigente a la fecha de la matrícula (no se generaron):
          <strong>{{ sinPlantilla.map(t => t.nombre).join(', ') }}</strong>.
        </p>

        <p
          v-if="!error && !documentos.length"
          class="rounded-lg bg-slate-50 p-3 text-sm text-slate-600"
        >
          No hay documentos vigentes configurados que conformen la matrícula.
        </p>

        <template v-if="documentos.length">
          <!-- Un documento por pestaña -->
          <div class="flex flex-wrap gap-2 border-b border-black/5 pb-2" role="tablist">
            <button
              v-for="(doc, i) in documentos"
              :key="doc.emision_id"
              type="button"
              role="tab"
              :aria-selected="i === activo"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="i === activo ? 'bg-[#213360] text-white' : 'text-slate-600 hover:bg-slate-100'"
              @click="activo = i"
            >
              {{ doc.tipo_documento }}
            </button>
          </div>

          <p class="text-xs text-slate-500">
            Versión v{{ documentoActivo.version }}
            <template v-if="documentoActivo.fecha_referencia">· condiciones vigentes al {{ formatDate(documentoActivo.fecha_referencia) }}</template>
          </p>
          <DocHtmlPreview :html="documentoActivo.contenido ?? ''" />
        </template>

        <MatriculaEscaneados
          v-if="data?.matriculaId"
          :matricula-id="data.matriculaId"
          :documentos="documentos"
          :puede-ver="can('aca_documentos')"
          :puede-subir="can('aca_documentoSubir')"
        />
      </template>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('close')"
      >
        Cerrar
      </button>
      <button
        v-if="!reimpresion"
        type="button"
        :disabled="cargando"
        class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="emit('hoja')"
      >
        <NavIcon name="formularios" class="size-4" /> Hoja de matrícula
      </button>
      <button
        v-if="data?.matriculaId"
        type="button"
        :disabled="cargando || descargandoTodos"
        title="Hoja de matrícula y todos los documentos en un solo PDF"
        class="flex items-center gap-2 rounded-lg border border-[#213360] px-4 py-2 text-sm font-medium text-[#213360] transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="descargarTodos"
      >
        <NavIcon name="download" class="size-4" />
        {{ descargandoTodos ? 'Descargando...' : 'Descargar todos' }}
      </button>
      <button
        v-if="documentoActivo"
        type="button"
        :disabled="descargando"
        class="flex items-center gap-2 rounded-lg border border-[#213360] px-4 py-2 text-sm font-medium text-[#213360] transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="descargarPdf"
      >
        <NavIcon name="download" class="size-4" />
        {{ descargando ? 'Descargando...' : 'Descargar PDF' }}
      </button>
      <button
        v-if="!reimpresion && data?.matriculaId && data?.estudianteId"
        type="button"
        :disabled="cargando"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="irARecibo"
      >
        <NavIcon name="receipt" class="size-4" />
        Continuar al recibo de pago
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
/**
 * Paso posterior al wizard de matrícula (y reimpresión desde el listado):
 * genera los documentos vigentes que la conforman (contrato, pagaré, etc.) y los
 * muestra antes de pasar al recibo de pago. El backend elige la versión vigente a la fecha de la matrícula y deja
 * cada generación en la bitácora; los documentos no se almacenan, así que
 * pueden reimprimirse después desde Documentación con el mismo resultado.
 *
 * Incluye la descarga de todo en un solo PDF (con la hoja de matrícula) y la
 * carga de los documentos firmados escaneados (ver MatriculaEscaneados).
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import docDocumentoService from '@/services/docDocumentoService.js'
import { formatDate } from '@/composables/useMatriculaWizard.js'
import { nombreArchivoDocumento } from '@/utils/documentacion.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import { usePermisos } from '@/composables/usePermisos.js'
import ModalBase      from '@/components/ModalBase.vue'
import NavIcon        from '@/components/icons/NavIcon.vue'
import DocHtmlPreview from '@/components/documentacion/DocHtmlPreview.vue'
import MatriculaEscaneados from './MatriculaEscaneados.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** Snapshot de la matrícula (ver `buildPrintData` / `buildPrintDataFromRecord`): usa matriculaId, estudianteId y codigo. */
  data: { type: Object, default: null },
  /**
   * Abierto desde el listado para reimprimir los documentos de una matrícula ya
   * existente: oculta la hoja de matrícula y el paso al recibo de pago, que solo
   * aplican al terminar el wizard.
   */
  reimpresion: { type: Boolean, default: false }
})
// `hoja` pide abrir la hoja de matrícula imprimible.
const emit = defineEmits(['close', 'hoja'])

const router = useRouter()
const { can, loadPermisos } = usePermisos()

const documentos   = ref([])
const sinPlantilla = ref([])
const activo       = ref(0)
const cargando     = ref(false)
const descargando  = ref(false)
const descargandoTodos = ref(false)
const error        = ref('')

const documentoActivo = computed(() => documentos.value[activo.value] ?? null)

// Los documentos se generan una sola vez por matrícula: volver desde la hoja de
// matrícula reabre el modal sin duplicar las entradas de la bitácora.
let generadosPara = null

watch(() => props.open, (abierto) => {
  if (!abierto) return
  loadPermisos()
  if (props.data?.matriculaId && generadosPara !== props.data.matriculaId) {
    generar(props.data.matriculaId)
  }
})

async function generar(matriculaId) {
  generadosPara      = matriculaId
  cargando.value     = true
  error.value        = ''
  documentos.value   = []
  sinPlantilla.value = []
  activo.value       = 0
  try {
    const res = await docDocumentoService.generarMatricula(matriculaId, { _silent: true })
    documentos.value   = res.data?.documentos ?? []
    sinPlantilla.value = res.data?.sin_plantilla ?? []
  } catch (e) {
    error.value = e?.response?.status === 403
      ? 'No tienes permiso para generar documentos.'
      : (e?.response?.data?.message ?? 'No se pudieron generar los documentos de la matrícula.')
  } finally {
    cargando.value = false
  }
}

async function descargarPdf() {
  const doc = documentoActivo.value
  if (!doc) return
  descargando.value = true
  try {
    const res = await docDocumentoService.pdf({
      tipo_documento_id: doc.tipo_documento_id,
      entidad_id:        props.data.matriculaId
    })
    descargarBlob(res.data, nombreArchivoDocumento(doc.codigo, props.data.matriculaId), 'application/pdf')
  } catch (e) {
    error.value = await mensajeErrorBlob(e, 'No se pudo descargar el PDF.')
  } finally {
    descargando.value = false
  }
}

/** Un solo PDF: hoja de matrícula + documentos vigentes, cada uno en página nueva. */
async function descargarTodos() {
  descargandoTodos.value = true
  try {
    const res = await docDocumentoService.pdfMatricula(props.data.matriculaId)
    descargarBlob(res.data, `DOCUMENTOS-${props.data.codigo || props.data.matriculaId}.pdf`, 'application/pdf')
  } catch (e) {
    error.value = await mensajeErrorBlob(e, 'No se pudo descargar el PDF de la matrícula.')
  } finally {
    descargandoTodos.value = false
  }
}

function irARecibo() {
  emit('close')
  router.push({
    path: '/academico/recibo-pago',
    query: {
      matricula_id:  props.data?.matriculaId,
      estudiante_id: props.data?.estudianteId
    }
  })
}
</script>
