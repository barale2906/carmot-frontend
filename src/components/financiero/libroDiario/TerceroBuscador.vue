<template>
  <div class="flex flex-col gap-3 md:col-span-2">
    <!-- Búsqueda: visible mientras no se ha elegido ni iniciado un tercero nuevo -->
    <div v-if="estado === 'idle'" class="flex flex-col gap-1.5">
      <label :for="idBusqueda" class="text-sm font-medium text-slate-900">
        Buscar tercero
        <span class="ml-1 text-xs font-normal text-slate-500">— por nombre o número de identificación</span>
      </label>
      <div class="relative" @focusout="alSalirDeBusqueda">
        <div class="relative flex items-center">
          <NavIcon name="search" class="pointer-events-none absolute left-3 size-4 text-slate-400" />
          <input
            :id="idBusqueda"
            v-model="busqueda"
            type="text"
            placeholder="Ej: Inmobiliaria Central o 900123456"
            autocomplete="off"
            class="w-full rounded-lg border-0 bg-[#f3f3f5] py-2 pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="buscarConPausa"
            @keydown.enter.prevent="buscar"
          >
          <span
            v-if="buscando"
            class="absolute right-2.5 size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
            aria-label="Buscando"
          />
        </div>

        <!-- Resultados -->
        <div
          v-if="resultados.length"
          class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
        >
          <button
            v-for="t in resultados"
            :key="t.id"
            type="button"
            class="flex w-full items-center gap-3 border-b border-black/5 px-4 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            @mousedown.prevent
            @click="seleccionar(t)"
          >
            <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#213360]/10 text-xs font-semibold text-[#213360]">
              {{ (t.nombre || '?')[0].toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-slate-900">{{ t.nombre }}</p>
              <p class="truncate text-xs text-slate-500">
                {{ t.tipo_identificacion }} {{ t.identificacion }}<template v-if="t.telefono"> · {{ t.telefono }}</template>
              </p>
            </div>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 border-t border-black/5 bg-slate-50 px-4 py-2.5 text-left text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-700 focus:outline-none"
            @mousedown.prevent
            @click="registrarNuevo"
          >
            <NavIcon name="plus" class="size-4 shrink-0" />
            Registrar como nuevo tercero
          </button>
        </div>
      </div>

      <!-- Sin resultados -->
      <div
        v-if="!buscando && buscado && !resultados.length"
        class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3"
      >
        <p class="text-sm text-amber-700">
          No se encontró ningún tercero con "<strong>{{ busqueda }}</strong>".
        </p>
        <button
          type="button"
          class="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @click="registrarNuevo"
        >
          <NavIcon name="plus" class="size-3.5" />
          Registrar como nuevo tercero
        </button>
      </div>

      <p v-if="errorTercero" class="text-xs text-red-600">{{ errorTercero }}</p>
    </div>

    <!-- Tercero seleccionado -->
    <div v-else-if="estado === 'found'" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Tercero seleccionado</p>
          <p class="text-sm font-medium text-emerald-800">{{ modelValue.nombre }}</p>
          <p class="text-xs text-emerald-700">
            {{ modelValue.tipo_identificacion }} {{ modelValue.identificacion }}<template v-if="modelValue.telefono"> · {{ modelValue.telefono }}</template>
          </p>
        </div>
        <button type="button" class="text-xs text-emerald-700 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500" @click="cambiar">
          Cambiar
        </button>
      </div>
      <p v-if="errorTercero" class="mt-1 text-xs text-red-600">{{ errorTercero }}</p>
    </div>

    <!-- Tercero nuevo: se crea al guardar el movimiento -->
    <template v-else>
      <div class="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Nuevo tercero</p>
          <p class="text-xs text-amber-700">Se registrará junto con el movimiento.</p>
        </div>
        <button type="button" class="text-xs text-amber-700 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500" @click="cambiar">
          Buscar otro
        </button>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelect
          :model-value="modelValue.tipo_identificacion"
          label="Tipo de identificación"
          required
          :options="opcionesTipo"
          :error="errores.tercero_tipo_identificacion?.[0]"
          @update:model-value="actualizar('tipo_identificacion', $event)"
        />
        <FormInput
          :model-value="modelValue.identificacion"
          label="Número de identificación"
          required
          :error="errores.tercero_identificacion?.[0]"
          @update:model-value="actualizar('identificacion', $event)"
        />
        <FormInput
          :model-value="modelValue.nombre"
          label="Nombre o razón social"
          required
          span="full"
          :error="errores.tercero_nombre?.[0]"
          @update:model-value="actualizar('nombre', $event)"
        />
        <FormInput
          :model-value="modelValue.telefono"
          label="Teléfono"
          :error="errores.tercero_telefono?.[0]"
          @update:model-value="actualizar('telefono', $event)"
        />
        <FormInput
          :model-value="modelValue.email"
          type="email"
          label="Correo electrónico"
          :error="errores.tercero_email?.[0]"
          @update:model-value="actualizar('email', $event)"
        />
        <FormInput
          :model-value="modelValue.direccion"
          label="Dirección"
          span="full"
          :error="errores.tercero_direccion?.[0]"
          @update:model-value="actualizar('direccion', $event)"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { documentoDesdeBusqueda } from '@/composables/useMatriculaWizard.js'
import { terceroNuevo } from '@/utils/libroDiario.js'

/**
 * Selector del tercero de un movimiento, con el mismo flujo que la búsqueda del
 * estudiante en la matrícula: se busca por nombre o identificación y se elige un
 * resultado, o se registra como nuevo (con la identificación buscada precargada) y
 * se crea en el backend al guardar el movimiento.
 *
 * v-model: null (sin elegir), un tercero del catálogo (con `id`) o un tercero nuevo
 * (`id: null`). Ver `payloadTercero` en utils/libroDiario.js.
 */
const props = defineProps({
  modelValue: { type: Object, default: null },
  /** Mapa código → etiqueta de /libro-diario/filters (tipos_identificacion) */
  tiposIdentificacion: { type: Object, default: () => ({}) },
  /** Errores de validación del movimiento (claves tercero_*) */
  errores: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

const idBusqueda = `tercero-busqueda-${Math.random().toString(36).slice(2, 9)}`
const busqueda = ref('')
const resultados = ref([])
const buscando = ref(false)
const buscado = ref(false)
let temporizador = null
let secuencia = 0

const estado = computed(() => {
  if (!props.modelValue) return 'idle'
  return props.modelValue.id ? 'found' : 'not_found'
})
const opcionesTipo = computed(() => Object.entries(props.tiposIdentificacion).map(([value, label]) => ({ value, label })))
const errorTercero = computed(() => props.errores.tercero_id?.[0]
  ?? (estado.value === 'idle' ? props.errores.tercero_identificacion?.[0] ?? props.errores.tercero_nombre?.[0] : null))

watch(() => props.modelValue, (valor) => {
  if (!valor) limpiarBusqueda()
})

function limpiarBusqueda() {
  clearTimeout(temporizador)
  secuencia++
  busqueda.value = ''
  resultados.value = []
  buscando.value = false
  buscado.value = false
}

/** Busca con pausa mientras se escribe (mínimo 2 caracteres). */
function buscarConPausa() {
  clearTimeout(temporizador)
  buscado.value = false
  if (busqueda.value.trim().length < 2) {
    resultados.value = []
    return
  }
  temporizador = setTimeout(buscar, 350)
}

/** Busca de inmediato; descarta respuestas de búsquedas anteriores. */
async function buscar() {
  const texto = busqueda.value.trim()
  if (!texto) return
  clearTimeout(temporizador)
  const actual = ++secuencia
  buscando.value = true
  try {
    const res = await libroDiarioService.buscarTerceros({ search: texto, status: 1, per_page: 10 }, { _silent: true })
    if (actual !== secuencia) return
    resultados.value = res.data ?? []
  } catch {
    if (actual !== secuencia) return
    resultados.value = []
  } finally {
    if (actual === secuencia) {
      buscando.value = false
      buscado.value = true
    }
  }
}

function seleccionar(tercero) {
  resultados.value = []
  emit('update:modelValue', { ...tercero })
}

/** Nuevo tercero: la búsqueda se usa como identificación solo si es un número. */
function registrarNuevo() {
  resultados.value = []
  const identificacion = documentoDesdeBusqueda(busqueda.value)
  emit('update:modelValue', {
    ...terceroNuevo(),
    identificacion,
    nombre: identificacion ? '' : busqueda.value.trim(),
  })
}

function actualizar(campo, valor) {
  emit('update:modelValue', { ...props.modelValue, [campo]: valor })
}

function cambiar() {
  emit('update:modelValue', null)
}

function alSalirDeBusqueda(evento) {
  if (!evento.currentTarget.contains(evento.relatedTarget)) resultados.value = []
}

onBeforeUnmount(() => clearTimeout(temporizador))
</script>
