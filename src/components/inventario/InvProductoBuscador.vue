<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-slate-900">{{ label }}</label>
    <SearchableSelect
      :id="inputId"
      :model-value="clearOnSelect ? null : (seleccionado?.id ?? null)"
      :options="opciones"
      :selected-option="opcionSeleccionada"
      :disabled="disabled"
      :loading="buscando"
      :clearable="!clearOnSelect"
      remote
      :min-chars="3"
      :placeholder="placeholder"
      search-placeholder="Buscar por nombre o código (mín. 3 letras)..."
      empty-text="Sin resultados para esta búsqueda."
      variant="outline"
      @search="buscar"
      @select="seleccionar($event.raw)"
      @clear="limpiar"
    />
  </div>
</template>

<script setup>
/**
 * Buscador de productos de inventario (GET /inventarios/productos/buscar) sobre el
 * componente universal `SearchableSelect` en modo remoto: mínimo 3 letras, con debounce,
 * navegación con flechas/Tab, Enter o clic para elegir.
 *
 * Modos:
 *   - Filtro (clearOnSelect=false): el producto elegido queda en el campo con ✕ para quitarlo.
 *   - Carrito (clearOnSelect=true): no conserva selección, queda listo para el siguiente.
 *
 * @emits select  { id, nombre, tipo, codigo, ... } — producto elegido
 * @emits clear   — cuando se elimina la selección (solo modo filtro)
 */
import { ref, computed, watch } from 'vue'
import invProductoService from '@/services/invProductoService.js'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'

const props = defineProps({
  label:           { type: String,  default: 'Producto' },
  placeholder:     { type: String,  default: 'Buscar producto' },
  tipo:            { type: String,  default: null },
  almacenId:       { type: [String, Number], default: null }, // filtra por stock en ese almacén
  disabled:        { type: Boolean, default: false },
  clearOnSelect:   { type: Boolean, default: false },
  selectedProduct: { type: Object,  default: null }, // { id, nombre, tipo? } — pre-popula al editar
})

const emit = defineEmits(['select', 'clear'])

const inputId      = `inv-buscador-${Math.random().toString(36).slice(2, 7)}`
const resultados   = ref([])
const seleccionado = ref(null)
const buscando     = ref(false)

// Pre-poblar selección al editar (modo formulario)
watch(() => props.selectedProduct, (val) => {
  if (!props.clearOnSelect) seleccionado.value = val ?? null
}, { immediate: true })

function tipoLabel(tipo) {
  return { simple: 'Simple', kit: 'Kit', grupo: 'Grupo' }[tipo] ?? tipo ?? ''
}

function aOpcion(producto) {
  const detalle = [producto.codigo, tipoLabel(producto.tipo)].filter(Boolean).join(' · ')
  return { value: producto.id, label: producto.nombre, description: detalle || undefined, raw: producto }
}

const opciones = computed(() => resultados.value.map(aOpcion))
const opcionSeleccionada = computed(() => (seleccionado.value ? aOpcion(seleccionado.value) : null))

async function buscar(texto) {
  buscando.value = true
  try {
    const res = await invProductoService.buscar(texto, props.tipo, props.almacenId)
    resultados.value = res.data ?? res ?? []
  } catch {
    resultados.value = []
  } finally {
    buscando.value = false
  }
}

function seleccionar(producto) {
  resultados.value = []
  if (!props.clearOnSelect) seleccionado.value = producto
  emit('select', producto)
}

function limpiar() {
  seleccionado.value = null
  resultados.value = []
  emit('clear')
}
</script>
