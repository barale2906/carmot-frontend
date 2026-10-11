<template>
  <section class="flex flex-col gap-3" aria-label="Soportes">
    <h3 class="text-sm font-semibold text-slate-900">Soportes</h3>

    <p v-if="!soportes.length" class="text-sm text-slate-400">Sin archivos de soporte.</p>
    <ul v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <li v-for="s in soportes" :key="s.id" class="flex flex-col overflow-hidden rounded-lg border border-black/10">
        <!-- Vista previa -->
        <button
          v-if="tipoVistaPrevia(s.mime_type) === 'imagen'"
          type="button"
          class="flex h-40 items-center justify-center bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :title="`Ampliar ${s.nombre_original}`"
          @click="ampliado = s"
        >
          <img v-if="urls[s.id]" :src="urls[s.id]" :alt="s.nombre_original" class="max-h-40 max-w-full object-contain">
          <span v-else class="text-xs text-slate-400">Cargando vista previa...</span>
        </button>
        <div v-else-if="tipoVistaPrevia(s.mime_type) === 'pdf'" class="relative h-40 bg-slate-50">
          <iframe
            v-if="urls[s.id]"
            :src="`${urls[s.id]}#toolbar=0&navpanes=0&view=FitH`"
            :title="`Vista previa de ${s.nombre_original}`"
            class="pointer-events-none h-full w-full"
          />
          <span v-else class="flex h-full items-center justify-center text-xs text-slate-400">Cargando vista previa...</span>
          <span class="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
        </div>

        <div class="flex items-center gap-2 px-3 py-2">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-900" :title="s.nombre_original">{{ s.nombre_original }}</p>
            <p class="text-xs text-slate-500">
              {{ s.tipo_text }}<template v-if="tipoVistaPrevia(s.mime_type) === 'pdf'"> · Documento PDF</template> · {{ s.created_at }}
            </p>
          </div>
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Descargar"
            @click="descargar(s)"
          >
            <NavIcon name="download" class="size-4" />
          </button>
          <button
            v-if="puedeEliminar"
            type="button"
            class="rounded p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar"
            @click="eliminar(s)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </div>
      </li>
    </ul>

    <form v-if="puedeSubir" class="flex flex-wrap items-end gap-2" @submit.prevent="subir">
      <div class="w-40">
        <FormSelect v-model="tipo" label="Tipo" :options="opcionesTipo" />
      </div>
      <label class="flex min-w-0 flex-1 flex-col gap-1 text-sm">
        <span class="font-medium text-slate-700">Archivo (PDF o imagen, máx. 10 MB)</span>
        <input
          ref="inputArchivo"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          class="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          @change="elegirArchivo"
        >
      </label>
      <button
        type="submit"
        :disabled="!archivo || subiendo"
        class="h-9 rounded-lg bg-[#213360] px-3 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {{ subiendo ? 'Cargando...' : 'Cargar soporte' }}
      </button>
    </form>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

    <!-- Imagen ampliada -->
    <ModalBase v-if="ampliado" :model-value="!!ampliado" size="xl" :title="ampliado.nombre_original" @update:model-value="ampliado = null">
      <img :src="urls[ampliado.id]" :alt="ampliado.nombre_original" class="mx-auto max-h-[70vh] object-contain pb-4">
    </ModalBase>
  </section>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import { tipoVistaPrevia, validarArchivoSoporte } from '@/utils/libroDiario.js'
import { useConfirm } from '@/composables/useConfirm.js'

/**
 * Lista, carga, descarga y elimina los archivos que soportan un movimiento o una
 * consignación. Las imágenes se muestran en miniatura (ampliables) y los PDF con
 * su primera página. Emite `cambio` tras cargar o eliminar.
 */
const props = defineProps({
  soportableTipo: { type: String, required: true, validator: (v) => ['movimiento', 'consignacion'].includes(v) },
  soportableId: { type: Number, required: true },
  soportes: { type: Array, default: () => [] },
  /** Etiquetas de tipos de soporte { factura: 'Factura', ... } */
  tipos: { type: Object, default: () => ({}) },
  puedeSubir: { type: Boolean, default: false },
  puedeEliminar: { type: Boolean, default: false },
})

const emit = defineEmits(['cambio'])
const { confirm } = useConfirm()

const tipo = ref('factura')
const archivo = ref(null)
const inputArchivo = ref(null)
const subiendo = ref(false)
const error = ref('')
const ampliado = ref(null)

const opcionesTipo = computed(() => Object.entries(props.tipos).map(([value, label]) => ({ value, label })))

// ─── Vistas previas (blob URLs del archivo protegido) ─────────────────────────
const urls = ref({})

async function cargarVistasPrevias() {
  for (const s of props.soportes) {
    if (urls.value[s.id] || !tipoVistaPrevia(s.mime_type)) continue
    try {
      const res = await libroDiarioService.descargarSoporte(s.id)
      urls.value = { ...urls.value, [s.id]: URL.createObjectURL(new Blob([res.data], { type: s.mime_type })) }
    } catch {
      // Sin vista previa: el soporte se puede descargar igual
    }
  }
}

function liberarVistasPrevias(conservar = []) {
  const siguientes = {}
  for (const [id, url] of Object.entries(urls.value)) {
    if (conservar.includes(Number(id))) siguientes[id] = url
    else URL.revokeObjectURL(url)
  }
  urls.value = siguientes
}

watch(() => props.soportes, (lista) => {
  liberarVistasPrevias(lista.map((s) => s.id))
  cargarVistasPrevias()
}, { immediate: true })

onBeforeUnmount(() => liberarVistasPrevias())

// ─── Acciones ─────────────────────────────────────────────────────────────────
function elegirArchivo(evento) {
  const elegido = evento.target.files?.[0] ?? null
  error.value = elegido ? (validarArchivoSoporte(elegido) ?? '') : ''
  archivo.value = error.value ? null : elegido
  if (error.value && inputArchivo.value) inputArchivo.value.value = ''
}

async function subir() {
  subiendo.value = true
  error.value = ''
  try {
    await libroDiarioService.subirSoporte(props.soportableTipo, props.soportableId, tipo.value, archivo.value)
    archivo.value = null
    if (inputArchivo.value) inputArchivo.value.value = ''
    emit('cambio')
  } catch (e) {
    const errores = e?.response?.data?.errors
    error.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo cargar el soporte.')
  } finally {
    subiendo.value = false
  }
}

async function descargar(soporte) {
  try {
    const res = await libroDiarioService.descargarSoporte(soporte.id)
    descargarBlob(res.data, soporte.nombre_original, soporte.mime_type ?? undefined)
  } catch (e) {
    error.value = await mensajeErrorBlob(e, 'No se pudo descargar el soporte.')
  }
}

async function eliminar(soporte) {
  if (!await confirm(`¿Eliminar el soporte "${soporte.nombre_original}"?`)) return
  try {
    await libroDiarioService.eliminarSoporte(soporte.id)
    emit('cambio')
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo eliminar el soporte.'
  }
}
</script>
