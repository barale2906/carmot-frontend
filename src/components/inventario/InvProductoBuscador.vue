<template>
  <div ref="containerRef" class="flex flex-col gap-2">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-slate-900">{{ label }}</label>

    <!-- Chip de selección (modo filtro: reemplaza al input cuando hay producto elegido) -->
    <div
      v-if="seleccionado && !clearOnSelect"
      class="flex h-9 items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm"
    >
      <span class="flex-1 truncate font-medium text-blue-900">{{ seleccionado.nombre }}</span>
      <button
        type="button"
        class="shrink-0 rounded p-0.5 text-blue-500 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :disabled="disabled"
        aria-label="Quitar selección"
        @click="limpiar"
      >
        <NavIcon name="close" class="size-3.5" />
      </button>
    </div>

    <!-- Input de búsqueda (siempre visible en modo carrito; oculto cuando hay selección en modo filtro) -->
    <div v-else class="relative">
      <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
        <NavIcon name="search" class="size-4" />
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        @input="onInput"
        @keydown.escape="cerrar"
        @keydown.down.prevent="moverFoco(1)"
        @keydown.up.prevent="moverFoco(-1)"
        @keydown.enter.prevent="seleccionarFocused"
      />
      <button
        v-if="query"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600 focus:outline-none"
        tabindex="-1"
        aria-label="Limpiar texto"
        @click="limpiar"
      >
        <NavIcon name="close" class="size-3.5" />
      </button>
    </div>

    <!-- Dropdown de resultados -->
    <Teleport to="body">
      <ul
        v-if="abierto && (resultados.length || buscando || mensajeVacio)"
        :style="dropdownStyle"
        class="fixed z-[2000] max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        role="listbox"
      >
        <li v-if="buscando" class="px-4 py-3 text-sm text-slate-500">Buscando...</li>
        <template v-else-if="resultados.length">
          <li
            v-for="(p, i) in resultados"
            :key="p.id"
            :class="[
              'flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-sm transition-colors',
              i === focusedIndex ? 'bg-blue-50' : 'hover:bg-slate-50',
            ]"
            role="option"
            :aria-selected="i === focusedIndex"
            @mousedown.prevent="seleccionar(p)"
            @mouseenter="focusedIndex = i"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-slate-900">{{ p.nombre }}</p>
              <p v-if="p.codigo" class="text-xs text-slate-400">{{ p.codigo }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {{ tipoLabel(p.tipo) }}
            </span>
          </li>
        </template>
        <li v-else-if="mensajeVacio" class="px-4 py-3 text-sm text-slate-400">{{ mensajeVacio }}</li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * Buscador de productos de inventario usando GET /inventarios/productos/buscar.
 * Mínimo 3 caracteres para disparar la búsqueda (con debounce de 350ms).
 *
 * Modos:
 *   - Filtro (clearOnSelect=false): chip reemplaza al input tras seleccionar. Emite clear al quitarlo.
 *   - Carrito (clearOnSelect=true): el input se limpia tras seleccionar, listo para el siguiente.
 *
 * @emits select  { id, nombre, tipo, codigo, ... } — producto elegido
 * @emits clear   — cuando se elimina la selección (solo modo filtro)
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import invProductoService from '@/services/invProductoService.js'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  label:           { type: String,  default: 'Producto' },
  placeholder:     { type: String,  default: 'Buscar por nombre o código (mín. 3 letras)...' },
  tipo:            { type: String,  default: null },
  almacenId:       { type: [String, Number], default: null }, // filtra por stock en ese almacén
  disabled:        { type: Boolean, default: false },
  clearOnSelect:   { type: Boolean, default: false },
  selectedProduct: { type: Object,  default: null }, // { id, nombre, tipo? } — pre-popula al editar
})

const emit = defineEmits(['select', 'clear'])

const inputId      = `inv-buscador-${Math.random().toString(36).slice(2, 7)}`
const containerRef = ref(null)
const inputRef     = ref(null)
const query        = ref('')
const resultados   = ref([])
const seleccionado = ref(null)
const buscando     = ref(false)
const abierto      = ref(false)
const focusedIndex = ref(-1)
const dropdownStyle = ref({})

// Pre-poblar selección al editar (modo formulario)
watch(() => props.selectedProduct, (val) => {
  if (!props.clearOnSelect) seleccionado.value = val ?? null
}, { immediate: true })

let debounceTimer = null

function tipoLabel(tipo) {
  return { simple: 'Simple', kit: 'Kit', grupo: 'Grupo' }[tipo] ?? tipo ?? ''
}

function actualizarPosicion() {
  const el = inputRef.value ?? containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < 260 && rect.top > 260
  dropdownStyle.value = {
    width: `${rect.width}px`,
    left:  `${rect.left + window.scrollX}px`,
    ...(openUp
      ? { bottom: `${window.innerHeight - rect.top - window.scrollY}px`, top: 'auto' }
      : { top: `${rect.bottom + window.scrollY + 4}px`,                 bottom: 'auto' }),
  }
}

function onInput() {
  focusedIndex.value = -1
  clearTimeout(debounceTimer)
  if (query.value.length < 3) {
    resultados.value = []
    abierto.value = false
    return
  }
  debounceTimer = setTimeout(buscar, 350)
}

async function buscar() {
  buscando.value = true
  abierto.value  = true
  actualizarPosicion()
  try {
    const res = await invProductoService.buscar(query.value, props.tipo, props.almacenId)
    resultados.value = res.data ?? res ?? []
  } catch {
    resultados.value = []
  } finally {
    buscando.value = false
  }
}

const mensajeVacio = computed(() => {
  if (buscando.value || !abierto.value) return ''
  if (query.value.length >= 3 && !resultados.value.length) return 'Sin resultados para esta búsqueda.'
  return ''
})

function seleccionar(producto) {
  query.value        = ''
  resultados.value   = []
  abierto.value      = false
  focusedIndex.value = -1
  if (!props.clearOnSelect) seleccionado.value = producto
  emit('select', producto)
}

function limpiar() {
  query.value        = ''
  seleccionado.value = null
  resultados.value   = []
  abierto.value      = false
  focusedIndex.value = -1
  emit('clear')
}

function cerrar() {
  abierto.value      = false
  focusedIndex.value = -1
}

function moverFoco(delta) {
  if (!abierto.value || !resultados.value.length) return
  focusedIndex.value = Math.max(0, Math.min(resultados.value.length - 1, focusedIndex.value + delta))
}

function seleccionarFocused() {
  if (focusedIndex.value >= 0 && resultados.value[focusedIndex.value]) {
    seleccionar(resultados.value[focusedIndex.value])
  }
}

function onClickOutside(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) cerrar()
}

document.addEventListener('mousedown', onClickOutside)
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>
