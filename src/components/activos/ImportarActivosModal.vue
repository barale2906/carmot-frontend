<template>
  <ModalBase
    :model-value="modelValue"
    title="Carga masiva de activos"
    description="Registre varios activos fijos desde la plantilla de Excel."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4 pb-2">
      <p class="text-sm text-slate-600">
        Descargue la plantilla, diligencie una fila por activo usando las listas desplegables
        (categoría, sede y estado) y súbala. Cada activo queda en la sede y el área indicadas, con su
        ingreso en el historial; la imagen se agrega luego desde la ficha. Si alguna fila tiene
        errores no se registra ninguna: corríjalas y vuelva a cargar.
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
          accept=".xlsx,.xls,.csv"
          class="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
          @change="elegirArchivo"
        >
      </label>

      <div v-if="errorGeneral || erroresFila.length" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
        <p>{{ errorGeneral }}</p>
        <ul v-if="erroresFila.length" class="mt-2 max-h-60 list-disc overflow-y-auto pl-4 text-xs">
          <li v-for="e in erroresFila" :key="e.fila">
            <strong>Fila {{ e.fila }}:</strong> {{ e.mensajes.join(' ') }}
          </li>
        </ul>
      </div>
    </div>

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
        :disabled="!archivo || cargando"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="importar"
      >
        {{ cargando ? 'Cargando...' : 'Cargar activos' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import activoService from '@/services/activoService.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'

/**
 * Carga masiva de activos fijos: descarga de la plantilla Excel y
 * envío del archivo diligenciado. Muestra los errores por fila que devuelve el API.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'importado'])

const archivo = ref(null)
const inputKey = ref(0)
const descargando = ref(false)
const cargando = ref(false)
const errorGeneral = ref('')
const erroresFila = ref([])

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  archivo.value = null
  inputKey.value++
  limpiarErrores()
})

function limpiarErrores() {
  errorGeneral.value = ''
  erroresFila.value = []
}

function elegirArchivo(evento) {
  archivo.value = evento.target.files?.[0] ?? null
  limpiarErrores()
}

async function descargarPlantilla() {
  descargando.value = true
  limpiarErrores()
  try {
    const res = await activoService.descargarPlantilla()
    descargarBlob(res.data, 'plantilla-activos.xlsx')
  } catch (e) {
    errorGeneral.value = await mensajeErrorBlob(e, 'No se pudo descargar la plantilla.')
  } finally {
    descargando.value = false
  }
}

async function importar() {
  cargando.value = true
  limpiarErrores()
  try {
    const res = await activoService.importar(archivo.value)
    emit('importado', res.meta?.total ?? res.data?.length ?? 0)
    emit('update:modelValue', false)
  } catch (e) {
    const data = e?.response?.data ?? {}
    errorGeneral.value = data.errors?.archivo?.[0] ?? data.message ?? 'No se pudo cargar el archivo.'
    erroresFila.value = data.errores ?? []
  } finally {
    cargando.value = false
  }
}
</script>
