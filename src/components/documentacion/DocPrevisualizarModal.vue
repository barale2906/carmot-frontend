<template>
  <ModalBase
    :model-value="modelValue"
    title="Previsualizar con datos reales"
    description="Resuelve variables y tablas contra un registro del sistema sin emitir ningún documento."
    size="xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex flex-col gap-4 pb-4">
      <div v-if="requiereEntidad" class="flex flex-wrap items-end gap-3">
        <div class="min-w-0 flex-1">
          <DocEntidadSelector
            v-model="entidadId"
            :entidad-type="tipoDocumento.entidad_type"
            :entidad-nombre="tipoDocumento.entidad_nombre"
            required
          />
        </div>
        <button
          type="button"
          :disabled="!entidadId || cargando"
          class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="ejecutar"
        >
          <NavIcon name="eye" class="size-4" />
          {{ cargando ? 'Generando...' : 'Previsualizar' }}
        </button>
      </div>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div v-if="cargando && !html" class="py-12 text-center text-sm text-slate-500">Generando previsualización...</div>
      <DocHtmlPreview
        v-else-if="html || !requiereEntidad"
        :html="html"
        vacio="La versión no tiene contenido."
      />
      <p v-else class="py-8 text-center text-sm text-slate-400">
        Elige un registro para ver cómo quedaría el documento.
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cerrar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase          from '@/components/ModalBase.vue'
import NavIcon            from '@/components/icons/NavIcon.vue'
import DocEntidadSelector from './DocEntidadSelector.vue'
import DocHtmlPreview     from './DocHtmlPreview.vue'

const props = defineProps({
  modelValue:    { type: Boolean, default: false },
  /** Tipo de la plantilla: `{ entidad_type, entidad_nombre }`. */
  tipoDocumento: { type: Object, default: () => ({}) },
  /** `(entidadId|null) => Promise<string>` que devuelve el HTML resuelto. */
  previsualizar: { type: Function, required: true },
})

const emit = defineEmits(['update:modelValue'])

const entidadId = ref(null)
const html      = ref('')
const cargando  = ref(false)
const error     = ref('')

const requiereEntidad = computed(() => !!props.tipoDocumento?.entidad_type)

async function ejecutar() {
  cargando.value = true
  error.value    = ''
  try {
    html.value = await props.previsualizar(entidadId.value)
  } catch (e) {
    html.value  = ''
    error.value = e?.response?.data?.message ?? 'No se pudo generar la previsualización.'
  } finally {
    cargando.value = false
  }
}

// Sin entidad asociada no hay nada que elegir: se previsualiza al abrir.
watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  html.value  = ''
  error.value = ''
  if (!requiereEntidad.value) ejecutar()
})
</script>
