<template>
  <div ref="rootRef" class="relative" :class="rootAttrs.class" :style="rootAttrs.style">
    <button
      :id="triggerId"
      ref="triggerRef"
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="abierto ? 'true' : 'false'"
      :aria-controls="abierto ? listboxId : undefined"
      :disabled="disabled"
      class="flex w-full items-center text-left focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      :class="triggerClass"
      v-bind="triggerAttrs"
      @click="alternar"
      @keydown="onTriggerKeydown"
    >
      <span class="truncate" :class="seleccionada ? 'text-slate-900' : 'text-slate-500'">
        {{ seleccionada ? seleccionada.label : placeholder }}
      </span>
    </button>
    <span
      class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-500"
      :class="size === 'sm' ? 'right-2' : 'right-3'"
      aria-hidden="true"
    >
      <svg :class="size === 'sm' ? 'size-3.5' : 'size-4'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </span>

    <!-- Espejo invisible del valor: conserva la validación nativa `required` del formulario -->
    <input
      v-if="required"
      tabindex="-1"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full opacity-0"
      :required="required"
      :value="valorValidacion"
      @focus="triggerRef?.focus()"
    />

    <!-- Panel en body: así no lo recortan los modales con overflow -->
    <Teleport to="body">
      <div
        v-if="abierto"
        ref="panelRef"
        :style="panelStyle"
        class="fixed z-[2000] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
      >
        <div class="border-b border-slate-100 p-2">
          <input
            ref="searchRef"
            v-model="consulta"
            type="text"
            autocomplete="off"
            :placeholder="searchPlaceholder"
            :aria-controls="listboxId"
            :aria-activedescendant="indiceActivo >= 0 ? `${listboxId}-${indiceActivo}` : undefined"
            class="w-full rounded-md border-0 bg-[#f3f3f5] px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keydown="onSearchKeydown"
          />
        </div>
        <ul :id="listboxId" ref="listRef" role="listbox" class="max-h-60 overflow-y-auto py-1">
          <li
            v-for="(opcion, i) in opcionesFiltradas"
            :id="`${listboxId}-${i}`"
            :key="i"
            role="option"
            :aria-selected="esSeleccionada(opcion) ? 'true' : 'false'"
            :aria-disabled="opcion.disabled ? 'true' : undefined"
            class="flex items-start gap-2 px-3 py-2 text-sm"
            :class="[
              opcion.disabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700',
              i === indiceActivo && !opcion.disabled ? 'bg-blue-50' : '',
              esSeleccionada(opcion) ? 'font-medium text-blue-700' : ''
            ]"
            @mousedown.prevent="seleccionar(opcion)"
            @mouseenter="indiceActivo = i"
          >
            <span class="min-w-0 flex-1">
              <span class="block break-words">{{ opcion.label }}</span>
              <span v-if="opcion.description" class="block text-xs font-normal text-slate-500">{{ opcion.description }}</span>
            </span>
            <svg
              v-if="esSeleccionada(opcion)"
              class="mt-0.5 size-4 shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </li>
          <li v-if="!opcionesFiltradas.length" class="px-3 py-3 text-center text-sm text-slate-400">
            {{ emptyText }}
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * Select con buscador: reemplazo de <select> nativo que permite filtrar las opciones
 * escribiendo (sin distinguir tildes ni mayúsculas). Base de `FormSelect` y de los
 * selects compactos sin etiqueta (tablas, toolbars).
 *
 * A diferencia de FormSelect, emite el `value` original de la opción (número, null,
 * objeto...), igual que `v-model` sobre un <select> nativo.
 *
 * @prop {*}      modelValue
 * @prop {Array}  options    [{ value, label, description?, disabled? }]
 * @prop {String} size       'md' (formularios) | 'sm' (tablas/toolbars)
 * @prop {String} variant    'filled' (estilo FormSelect) | 'outline' (borde, fondo blanco)
 * @emits update:modelValue, change — solo cuando el valor cambia, como el nativo
 */
import { ref, computed, watch, nextTick, useAttrs, onBeforeUnmount } from 'vue'
import { filtrarOpciones, mismoValor }                                 from '@/utils/busqueda.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue:        { type: null, default: '' },
  options:           { type: Array, default: () => [] },
  placeholder:       { type: String, default: 'Seleccione opción' },
  searchPlaceholder: { type: String, default: 'Buscar...' },
  emptyText:         { type: String, default: 'Sin resultados' },
  id:                { type: String, default: '' },
  required:          { type: Boolean, default: false },
  disabled:          { type: Boolean, default: false },
  invalid:           { type: Boolean, default: false },
  size:              { type: String, default: 'md', validator: (v) => ['md', 'sm'].includes(v) },
  variant:           { type: String, default: 'filled', validator: (v) => ['filled', 'outline'].includes(v) }
})

const emit = defineEmits(['update:modelValue', 'change'])

// class/style van al contenedor (ancho, márgenes); el resto (aria-*, title...) al botón
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const triggerAttrs = computed(() => {
  const { class: _class, style: _style, ...resto } = attrs
  return resto
})

const uid       = Math.random().toString(36).slice(2, 9)
const triggerId = computed(() => props.id || `ssel-${uid}`)
const listboxId = `ssel-${uid}-listbox`

const rootRef    = ref(null)
const triggerRef = ref(null)
const panelRef   = ref(null)
const searchRef  = ref(null)
const listRef    = ref(null)

const abierto      = ref(false)
const consulta     = ref('')
const indiceActivo = ref(-1)
const panelStyle   = ref({})

const seleccionada      = computed(() => props.options.find((o) => mismoValor(o.value, props.modelValue)) ?? null)
const opcionesFiltradas = computed(() => filtrarOpciones(props.options, consulta.value))

const valorValidacion = computed(() => {
  if (!seleccionada.value) return ''
  const { value } = seleccionada.value
  return typeof value === 'object' ? 'objeto' : String(value)
})

const SIZE_CLASSES = {
  md: 'rounded-lg px-3 py-2 pr-9 text-sm',
  sm: 'rounded px-2 py-1 pr-7 text-xs'
}

const triggerClass = computed(() => {
  const estilo = props.variant === 'outline'
    ? (props.invalid
      ? 'border border-red-300 bg-white focus:ring-1 focus:ring-red-500'
      : 'border border-slate-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500')
    : (props.invalid
      ? 'border-0 bg-red-50 ring-1 ring-red-300 focus:ring-2 focus:ring-red-500'
      : 'border-0 bg-[#f3f3f5] focus:ring-2 focus:ring-blue-500')
  return [SIZE_CLASSES[props.size], estilo]
})

function esSeleccionada(opcion) {
  return mismoValor(opcion.value, props.modelValue)
}

// ── Apertura / cierre ────────────────────────────────────────────────────────

const PANEL_MIN_WIDTH = 224
const PANEL_ALTURA_ESTIMADA = 300

function actualizarPosicion() {
  const rect = triggerRef.value?.getBoundingClientRect()
  if (!rect) return
  const width = Math.max(rect.width, PANEL_MIN_WIDTH)
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
  const espacioAbajo = window.innerHeight - rect.bottom
  const abrirArriba = espacioAbajo < PANEL_ALTURA_ESTIMADA && rect.top > espacioAbajo
  panelStyle.value = {
    width: `${width}px`,
    left: `${left}px`,
    ...(abrirArriba
      ? { bottom: `${window.innerHeight - rect.top + 4}px` }
      : { top: `${rect.bottom + 4}px` })
  }
}

function abrir(textoInicial = '') {
  if (props.disabled || abierto.value) return
  consulta.value = textoInicial
  actualizarPosicion()
  abierto.value = true
  indiceActivo.value = textoInicial ? primerHabilitado(0, 1) : indiceInicial()
  window.addEventListener('scroll', actualizarPosicion, true)
  window.addEventListener('resize', actualizarPosicion)
  document.addEventListener('mousedown', onClickFuera)
  nextTick(() => {
    searchRef.value?.focus()
    scrollAlActivo()
  })
}

function cerrar({ devolverFoco = false } = {}) {
  if (!abierto.value) return
  abierto.value = false
  consulta.value = ''
  indiceActivo.value = -1
  quitarListeners()
  if (devolverFoco) triggerRef.value?.focus()
}

function alternar() {
  if (abierto.value) cerrar()
  else abrir()
}

function quitarListeners() {
  window.removeEventListener('scroll', actualizarPosicion, true)
  window.removeEventListener('resize', actualizarPosicion)
  document.removeEventListener('mousedown', onClickFuera)
}

function onClickFuera(event) {
  if (rootRef.value?.contains(event.target) || panelRef.value?.contains(event.target)) return
  cerrar()
}

watch(() => props.disabled, (deshabilitado) => { if (deshabilitado) cerrar() })
onBeforeUnmount(quitarListeners)

// ── Selección ────────────────────────────────────────────────────────────────

function seleccionar(opcion) {
  if (!opcion || opcion.disabled) return
  const cambio = !mismoValor(opcion.value, props.modelValue)
  cerrar({ devolverFoco: true })
  if (!cambio) return
  emit('update:modelValue', opcion.value)
  emit('change', opcion.value)
}

// ── Navegación con teclado ───────────────────────────────────────────────────

function indiceInicial() {
  const idx = opcionesFiltradas.value.findIndex(esSeleccionada)
  return idx >= 0 ? idx : primerHabilitado(0, 1)
}

/** Primer índice habilitado desde `desde` avanzando en `paso`; -1 si no hay. */
function primerHabilitado(desde, paso) {
  const lista = opcionesFiltradas.value
  for (let i = desde; i >= 0 && i < lista.length; i += paso) {
    if (!lista[i].disabled) return i
  }
  return -1
}

function mover(paso) {
  const siguiente = primerHabilitado(indiceActivo.value + paso, paso)
  if (siguiente >= 0) indiceActivo.value = siguiente
  scrollAlActivo()
}

function scrollAlActivo() {
  nextTick(() => {
    if (indiceActivo.value < 0) return
    document.getElementById(`${listboxId}-${indiceActivo.value}`)?.scrollIntoView({ block: 'nearest' })
  })
}

watch(consulta, () => {
  if (!abierto.value) return
  indiceActivo.value = primerHabilitado(0, 1)
  if (listRef.value) listRef.value.scrollTop = 0
})

function onTriggerKeydown(event) {
  // Con el panel abierto (foco devuelto al botón por un clic), el teclado sigue en el buscador
  if (abierto.value && event.key !== ' ') {
    searchRef.value?.focus()
    onSearchKeydown(event)
    return
  }
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    abrir()
    return
  }
  // Escribir sobre el select cerrado abre el buscador con esa letra ya digitada
  const esCaracter = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  if (esCaracter) {
    event.preventDefault()
    abrir(event.key)
  }
}

function onSearchKeydown(event) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      mover(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      mover(-1)
      break
    case 'Enter':
      // Evita que el Enter envíe el formulario contenedor
      event.preventDefault()
      seleccionar(opcionesFiltradas.value[indiceActivo.value])
      break
    case 'Escape':
      // stopPropagation: que el Escape no cierre también el modal contenedor
      event.preventDefault()
      event.stopPropagation()
      cerrar({ devolverFoco: true })
      break
    case 'Tab':
      // El panel vive al final del body: sin devolver el foco, el Tab saltaría fuera del formulario
      event.preventDefault()
      cerrar({ devolverFoco: true })
      break
  }
}
</script>
