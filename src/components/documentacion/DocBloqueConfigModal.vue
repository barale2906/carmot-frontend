<template>
  <ModalBase
    :model-value="modelValue"
    :title="bloque ? `Columnas: ${bloque.label}` : 'Columnas'"
    description="Elige qué columnas imprime la tabla, en qué orden y con qué título."
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="bloque" class="flex flex-col gap-4 pb-2">
      <p v-if="!editable" class="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        Esta versión no está en proceso. Para cambiar las columnas, clona la versión y edita el borrador.
      </p>

      <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200" aria-label="Columnas del bloque">
        <li
          v-for="(columna, index) in columnas"
          :key="columna.clave"
          class="flex flex-wrap items-center gap-3 px-3 py-2"
          :class="columna.activa ? '' : 'bg-slate-50'"
        >
          <input
            :id="`col-${columna.clave}`"
            v-model="columna.activa"
            type="checkbox"
            :disabled="!editable"
            class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label :for="`col-${columna.clave}`" class="w-40 text-sm text-slate-700">{{ columna.label }}</label>
          <input
            v-model="columna.titulo"
            type="text"
            :placeholder="columna.label"
            :disabled="!editable || !columna.activa"
            :aria-label="`Título de la columna ${columna.label}`"
            class="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <div v-if="editable" class="flex gap-1">
            <button
              type="button"
              title="Subir columna"
              :disabled="index === 0"
              class="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="mover(index, index - 1)"
            >
              <NavIcon name="arrow_up" class="size-4" />
            </button>
            <button
              type="button"
              title="Bajar columna"
              :disabled="index === columnas.length - 1"
              class="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="mover(index, index + 1)"
            >
              <NavIcon name="arrow_down" class="size-4" />
            </button>
          </div>
        </li>
      </ul>

      <label class="flex items-center gap-2 text-sm text-slate-700">
        <input
          v-model="mostrarResumen"
          type="checkbox"
          :disabled="!editable"
          class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Imprimir fila de resumen (totales o promedio general)
      </label>

      <p v-if="editable && sinColumnas" class="text-xs text-red-600">Selecciona al menos una columna.</p>

      <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <template #footer>
      <button
        v-if="editable && bloque?.configurado"
        type="button"
        :disabled="guardando"
        class="mr-auto rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        title="Volver a imprimir todas las columnas con sus títulos por defecto"
        @click="emit('restablecer')"
      >
        Restablecer
      </button>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        {{ editable ? 'Cancelar' : 'Cerrar' }}
      </button>
      <button
        v-if="editable"
        type="button"
        :disabled="guardando || sinColumnas"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : 'Guardar columnas' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { moverElemento } from '@/utils/documentacion.js'
import ModalBase from '@/components/ModalBase.vue'
import NavIcon   from '@/components/icons/NavIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Bloque del catálogo con su configuración: `{ clave, label, columnas, columnas_activas, titulos, mostrar_resumen, configurado }`. */
  bloque:     { type: Object, default: null },
  editable:   { type: Boolean, default: true },
  guardando:  { type: Boolean, default: false },
  error:      { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'guardar', 'restablecer'])

const columnas       = ref([])
const mostrarResumen = ref(true)

// Activas primero en su orden guardado; luego las inactivas en el orden del catálogo.
function inicializar(bloque) {
  if (!bloque) return
  const activas = bloque.columnas_activas ?? []
  const porClave = Object.fromEntries(bloque.columnas.map((c) => [c.clave, c]))
  const ordenadas = [
    ...activas.filter((clave) => porClave[clave]).map((clave) => porClave[clave]),
    ...bloque.columnas.filter((c) => !activas.includes(c.clave)),
  ]
  columnas.value = ordenadas.map((c) => ({
    clave:  c.clave,
    label:  c.label,
    activa: activas.includes(c.clave),
    titulo: bloque.titulos?.[c.clave] ?? '',
  }))
  mostrarResumen.value = bloque.mostrar_resumen ?? true
}

watch(() => [props.modelValue, props.bloque], ([abierto]) => abierto && inicializar(props.bloque), { immediate: true })

const sinColumnas = computed(() => !columnas.value.some((c) => c.activa))

function mover(desde, hacia) {
  columnas.value = moverElemento(columnas.value, desde, hacia)
}

function guardar() {
  const activas = columnas.value.filter((c) => c.activa)
  emit('guardar', {
    columnas_activas: activas.map((c) => c.clave),
    titulos:          Object.fromEntries(activas.map((c) => [c.clave, c.titulo])),
    mostrar_resumen:  mostrarResumen.value,
  })
}
</script>
