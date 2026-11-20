<template>
  <ModalBase
    :model-value="modelValue"
    title="Carga masiva de productos"
    description="Registre varios productos del catálogo desde un archivo Excel o CSV."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4 pb-2">
      <p class="text-sm text-slate-600">
        Descargue la plantilla y diligencie una fila por producto. Obligatorias: <strong>codigo</strong>,
        <strong>nombre</strong> y <strong>tipo</strong> (simple, kit o grupo). La categoría y la unidad de medida
        se escriben por su nombre exacto. Las filas con un código ya existente (o en la papelera) se omiten
        y se le indica el motivo.
      </p>

      <button
        type="button"
        :disabled="descargando"
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="descargarPlantilla"
      >
        <NavIcon name="download" class="size-4" />
        {{ descargando ? 'Descargando...' : 'Descargar plantilla' }}
      </button>

      <label class="flex flex-col gap-1 text-sm">
        <span class="font-medium text-slate-700">Archivo diligenciado (Excel o CSV)</span>
        <input
          :key="inputKey"
          type="file"
          accept=".xlsx,.xls,.csv,.txt"
          class="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
          @change="elegirArchivo"
        >
      </label>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
        {{ error }}
      </div>

      <div v-if="resultado" class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800" role="status">
        <p>{{ mensaje }}</p>
        <ul v-if="resultado.errores?.length" class="mt-2 max-h-60 list-disc overflow-y-auto pl-4 text-xs text-amber-800">
          <li v-for="e in resultado.errores" :key="e">{{ e }}</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        {{ resultado ? 'Cerrar' : 'Cancelar' }}
      </button>
      <button
        type="button"
        :disabled="!archivo || cargando"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="importar"
      >
        {{ cargando ? 'Cargando...' : 'Cargar productos' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import invProductoService from '@/services/invProductoService.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'

/**
 * Carga masiva del catálogo de productos (Excel o CSV): descarga de la plantilla y envío del
 * archivo. A diferencia de otras cargas, aquí las filas inválidas se omiten y el API
 * devuelve un resumen (insertadas, omitidas y el motivo de cada fila omitida).
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'importado'])

const archivo = ref(null)
const inputKey = ref(0)
const descargando = ref(false)
const cargando = ref(false)
const error = ref('')
const resultado = ref(null)
const mensaje = ref('')

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  archivo.value = null
  inputKey.value++
  limpiar()
})

function limpiar() {
  error.value = ''
  resultado.value = null
  mensaje.value = ''
}

function elegirArchivo(evento) {
  archivo.value = evento.target.files?.[0] ?? null
  limpiar()
}

async function descargarPlantilla() {
  descargando.value = true
  limpiar()
  try {
    const res = await invProductoService.getPlantilla()
    descargarBlob(res.data, 'plantilla_catalogo_inventario.csv')
  } catch (e) {
    error.value = await mensajeErrorBlob(e, 'No se pudo descargar la plantilla.')
  } finally {
    descargando.value = false
  }
}

async function importar() {
  cargando.value = true
  limpiar()
  try {
    const fd = new FormData()
    fd.append('archivo', archivo.value)
    const res = await invProductoService.importar(fd)
    resultado.value = res.data ?? {}
    mensaje.value = res.message ?? 'Carga masiva completada.'
    archivo.value = null
    inputKey.value++
    emit('importado', resultado.value.insertadas ?? 0)
  } catch (e) {
    const data = e?.response?.data ?? {}
    error.value = data.errors?.archivo?.[0] ?? data.message ?? 'No se pudo cargar el archivo.'
  } finally {
    cargando.value = false
  }
}
</script>
