<template>
  <section class="rounded-xl border border-slate-200 p-4">
    <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold text-slate-900">Documentos firmados (escaneados)</h3>
      <span v-if="puedeVer" class="text-xs text-slate-500">
        {{ cargados }} de {{ requeridos }} documentos cargados
      </span>
    </div>

    <p v-if="!puedeVer" class="text-sm text-slate-500">No tienes permiso para ver los documentos cargados.</p>
    <div v-else-if="cargando" class="py-4 text-center text-sm text-slate-500">Cargando documentos firmados...</div>

    <template v-else>
      <p v-if="error" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{{ error }}</p>

      <ul class="divide-y divide-slate-100">
        <li v-for="fila in filas" :key="fila.clave" class="flex flex-wrap items-center justify-between gap-3 py-2.5">
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-800">{{ fila.nombre }}</p>
            <p v-if="fila.escaneado" class="truncate text-xs text-slate-500">
              {{ fila.escaneado.nombre_original }} · {{ fechaHoraLocal(fila.escaneado.created_at) }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="fila.escaneado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
            >
              {{ fila.escaneado ? 'Cargado' : 'Pendiente' }}
            </span>
            <button
              v-if="fila.escaneado"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              title="Descargar escaneado"
              :disabled="descargando === fila.escaneado.id"
              @click="descargar(fila.escaneado)"
            >
              <NavIcon name="download" class="size-4" />
            </button>
            <label
              v-if="puedeSubir"
              class="cursor-pointer rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500"
              :class="{ 'pointer-events-none opacity-50': subiendo === fila.clave }"
            >
              {{ subiendo === fila.clave ? 'Cargando...' : (fila.escaneado ? 'Reemplazar' : 'Cargar') }}
              <input
                type="file"
                :accept="ACCEPT"
                class="sr-only"
                @change="(e) => onArchivo(e, fila)"
              />
            </label>
          </div>
        </li>
      </ul>

      <!-- Otro soporte firmado con descripción libre -->
      <form
        v-if="puedeSubir"
        class="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3"
        @submit.prevent="subirOtro"
      >
        <div class="min-w-[200px] flex-1">
          <label class="mb-1 block text-xs font-medium text-slate-600" for="escaneado-otro">Otro documento</label>
          <input
            id="escaneado-otro"
            v-model.trim="otroDescripcion"
            type="text"
            maxlength="150"
            placeholder="Ej. Autorización de tratamiento de datos"
            class="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <input
          ref="otroInput"
          type="file"
          :accept="ACCEPT"
          class="max-w-[240px] text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700"
          @change="(e) => { otroArchivo = e.target.files?.[0] ?? null }"
        />
        <button
          type="submit"
          :disabled="!otroDescripcion || !otroArchivo || subiendo === 'otro'"
          class="rounded-lg bg-[#213360] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50"
        >
          {{ subiendo === 'otro' ? 'Cargando...' : 'Cargar' }}
        </button>
      </form>
      <p v-if="puedeSubir" class="mt-2 text-xs text-slate-400">PDF, JPG o PNG · máx. 10 MB. Cargar de nuevo un documento reemplaza el anterior.</p>
    </template>
  </section>
</template>

<script setup>
/**
 * Documentos firmados y escaneados de una matrícula: la hoja de matrícula, cada
 * documento generado y otros soportes con descripción libre. Muestra cuáles
 * faltan, permite cargarlos o reemplazarlos y descargarlos. Los archivos quedan
 * en el servidor (privado) y se registran en la bitácora de Documentación.
 */
import { ref, computed, watch } from 'vue'

import docDocumentoService from '@/services/docDocumentoService.js'
import { checklistEscaneados, fechaHoraLocal, DOCUMENTO_ORIGEN, ENTIDAD_MATRICULA } from '@/utils/documentacion.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import NavIcon from '@/components/icons/NavIcon.vue'

const ACCEPT        = '.pdf,.jpg,.jpeg,.png'
const MAX_BYTES     = 10 * 1024 * 1024

const props = defineProps({
  matriculaId: { type: Number, required: true },
  /** Documentos generados para la matrícula (respuesta de `generarMatricula`). */
  documentos:  { type: Array, default: () => [] },
  /** Permiso aca_documentos: ver y descargar lo cargado. */
  puedeVer:    { type: Boolean, default: false },
  /** Permiso aca_documentoSubir: cargar o reemplazar. */
  puedeSubir:  { type: Boolean, default: false }
})

const subidos         = ref([])
const cargando        = ref(false)
const subiendo        = ref(null)
const descargando     = ref(null)
const error           = ref('')
const otroDescripcion = ref('')
const otroArchivo     = ref(null)
const otroInput       = ref(null)

const filas      = computed(() => checklistEscaneados(props.documentos, subidos.value))
const requeridos = computed(() => filas.value.filter(f => !f.otro).length)
const cargados   = computed(() => filas.value.filter(f => !f.otro && f.escaneado).length)

watch(() => [props.matriculaId, props.puedeVer], cargar, { immediate: true })

async function cargar() {
  if (!props.puedeVer || !props.matriculaId) return
  cargando.value = true
  error.value    = ''
  try {
    const res = await docDocumentoService.getAll({
      entidad_type: ENTIDAD_MATRICULA,
      entidad_id:   props.matriculaId,
      origen:       DOCUMENTO_ORIGEN.SUBIDO,
      per_page:     100
    })
    subidos.value = res.data ?? []
  } catch {
    error.value = 'No se pudieron consultar los documentos firmados.'
  } finally {
    cargando.value = false
  }
}

/** Valida el archivo en el navegador antes de subirlo (el backend vuelve a validar). */
function archivoValido(archivo) {
  if (!archivo) return false
  if (!/\.(pdf|jpe?g|png)$/i.test(archivo.name)) {
    error.value = 'El archivo debe ser PDF, JPG o PNG.'
    return false
  }
  if (archivo.size > MAX_BYTES) {
    error.value = 'El archivo no puede superar los 10 MB.'
    return false
  }
  return true
}

async function subir(clave, datos) {
  error.value = ''
  if (!archivoValido(datos.archivo)) return false
  subiendo.value = clave
  try {
    await docDocumentoService.subirEscaneado(props.matriculaId, datos)
    await cargar()
    return true
  } catch (e) {
    const errores = e?.response?.data?.errors
    error.value = (errores && Object.values(errores)[0]?.[0])
      ?? e?.response?.data?.message
      ?? 'No se pudo cargar el documento.'
    return false
  } finally {
    subiendo.value = null
  }
}

async function onArchivo(evento, fila) {
  const archivo = evento.target.files?.[0]
  evento.target.value = ''
  await subir(fila.clave, {
    archivo,
    tipo_documento_id: fila.tipo_documento_id,
    descripcion:       fila.descripcion
  })
}

async function subirOtro() {
  const ok = await subir('otro', { archivo: otroArchivo.value, descripcion: otroDescripcion.value })
  if (ok) {
    otroDescripcion.value = ''
    otroArchivo.value     = null
    if (otroInput.value) otroInput.value.value = ''
  }
}

async function descargar(escaneado) {
  descargando.value = escaneado.id
  error.value       = ''
  try {
    const res = await docDocumentoService.descargarArchivo(escaneado.id)
    descargarBlob(res.data, escaneado.nombre_original || `documento-${escaneado.id}`, escaneado.mime_type || 'application/octet-stream')
  } catch (e) {
    error.value = await mensajeErrorBlob(e, 'No se pudo descargar el documento.')
  } finally {
    descargando.value = null
  }
}
</script>
