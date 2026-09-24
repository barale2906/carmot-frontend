<template>
  <div class="py-4">
    <!-- Encabezado del ítem -->
    <div class="flex flex-wrap items-center gap-2">
      <p class="text-sm font-medium text-slate-900">
        {{ item.producto?.nombre ?? '—' }}
        <span class="font-normal text-slate-400">× {{ item.cantidad }}</span>
      </p>
      <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="BADGE_ESTADO[estado] ?? BADGE_ESTADO.pendiente">
        {{ ESTADO_ENTREGA_LABEL[estado] ?? estado }}
      </span>
      <span v-if="item.entrega_completa" class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800" title="El estudiante pidió recibir este producto completo, no por partes">
        Entrega completa
      </span>
    </div>

    <!-- ─── Producto simple ─────────────────────────────────────────────── -->
    <div v-if="esSimple" class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
      <span>Entregado: <strong class="text-slate-700">{{ item.entrega_simple?.cantidad_entregada ?? 0 }}/{{ item.cantidad }}</strong></span>
      <span>Stock en almacén: <strong :class="stockSimple > 0 ? 'text-slate-700' : 'text-red-600'">{{ stockSimple }}</strong></span>

      <template v-if="canCompletar && !entregado">
        <label v-if="pendienteSimple(item) > 1" class="flex items-center gap-1.5">
          Cantidad
          <input
            v-model.number="cantidadSimple"
            type="number"
            min="1"
            :max="pendienteSimple(item)"
            :disabled="item.entrega_completa"
            :title="item.entrega_completa ? 'Este ítem exige entrega completa' : 'Unidades a entregar ahora'"
            class="w-16 rounded border border-slate-200 px-2 py-1 text-center text-xs disabled:bg-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <button
          type="button"
          :disabled="procesando || stockSimple <= 0"
          :title="stockSimple <= 0 ? 'Sin stock en el almacén' : 'Entregar al estudiante'"
          class="ml-auto flex h-8 items-center rounded-lg bg-green-600 px-3 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          @click="entregarSimple()"
        >
          {{ procesando ? 'Entregando...' : 'Entregar' }}
        </button>
      </template>
    </div>

    <!-- ─── Kit: entrega por componentes ────────────────────────────────── -->
    <div v-else-if="esKit" class="mt-3 flex flex-col gap-3">
      <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
        <li
          v-for="comp in componentes"
          :key="comp.id"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 text-xs"
          :class="comp.status === 'entregado' ? 'bg-slate-50' : ''"
        >
          <input
            v-if="canCompletar"
            v-model="seleccion[comp.id].marcado"
            type="checkbox"
            class="rounded"
            :disabled="!componenteEntregable(comp)"
            :aria-label="`Entregar ${comp.componente_nombre}`"
            :title="motivoNoEntregable(comp)"
          />

          <span class="min-w-[9rem] flex-1">
            <span class="font-medium text-slate-800">{{ comp.componente_nombre ?? comp.producto_entregado?.nombre ?? '—' }}</span>
            <span v-if="comp.componente_tipo === 'grupo' && comp.producto_entregado" class="text-slate-500"> · {{ comp.producto_entregado.nombre }}</span>
          </span>

          <!-- Variante: solo en componentes grupo que aún no la tienen asignada -->
          <select
            v-if="comp.componente_tipo === 'grupo' && !comp.producto_entregado && comp.status !== 'entregado'"
            v-model="seleccion[comp.id].variante"
            class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :aria-label="`Variante de ${comp.componente_nombre}`"
            @change="onVarianteChange(comp)"
          >
            <option value="">Elige variante...</option>
            <option v-for="v in comp.variantes ?? []" :key="v.id" :value="v.id">{{ v.nombre }} (stock: {{ v.stock_disponible }})</option>
          </select>

          <span class="text-slate-500">{{ comp.cantidad_entregada }}/{{ comp.cantidad_solicitada }}</span>

          <span v-if="comp.status !== 'entregado'" class="text-slate-500">
            <template v-if="comp.componente_tipo === 'grupo' && !comp.producto_entregado && !seleccion[comp.id].variante">Falta elegir variante</template>
            <template v-else>Stock: <strong :class="stockDe(comp) > 0 ? 'text-slate-700' : 'text-red-600'">{{ stockDe(comp) }}</strong></template>
          </span>

          <input
            v-if="canCompletar && comp.cantidad_pendiente > 1 && comp.status !== 'entregado'"
            v-model.number="seleccion[comp.id].cantidad"
            type="number"
            min="1"
            :max="comp.cantidad_pendiente"
            :disabled="item.entrega_completa || !componenteEntregable(comp)"
            :title="item.entrega_completa ? 'Este kit exige entrega completa' : 'Unidades a entregar ahora'"
            :aria-label="`Cantidad de ${comp.componente_nombre}`"
            class="w-14 rounded border border-slate-200 px-2 py-1 text-center text-xs disabled:bg-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <span class="rounded-full px-2 py-0.5 font-medium" :class="BADGE_ESTADO[comp.status] ?? BADGE_ESTADO.pendiente">
            {{ ESTADO_ENTREGA_LABEL[comp.status] ?? comp.status }}
          </span>
        </li>
      </ul>

      <div v-if="canCompletar && !entregado" class="flex flex-wrap items-center justify-end gap-2">
        <p v-if="item.entrega_completa" class="mr-auto text-xs text-indigo-700">Este kit exige entrega completa: solo se descarga si hay stock de todos los componentes.</p>
        <button
          type="button"
          :disabled="procesando"
          title="Recorre todo el kit y entrega lo que el stock permita"
          class="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="entregarTodoKit"
        >
          Entregar todo lo disponible
        </button>
        <button
          type="button"
          :disabled="procesando || !componentesMarcados.length"
          class="flex h-8 items-center rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="entregarSeleccionados()"
        >
          {{ procesando ? 'Entregando...' : `Entregar seleccionados (${componentesMarcados.length})` }}
        </button>
      </div>
    </div>

    <!-- Entrega bloqueada por la marca "entrega completa": el 200 no implica que se entregó -->
    <div v-if="bloqueo" class="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
      <p class="flex-1 text-xs text-indigo-800">{{ bloqueo }}</p>
      <button
        type="button"
        :disabled="procesando"
        class="rounded-lg border border-indigo-300 bg-white px-3 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        @click="reintentarForzado"
      >
        Entregar de todos modos
      </button>
      <button type="button" class="text-xs text-indigo-700 underline" @click="bloqueo = ''">Descartar</button>
    </div>
  </div>
</template>

<script setup>
/**
 * Un ítem de pedido en la bandeja de entregas: permite entregar productos simples
 * por cantidad y kits componente por componente, respetando la marca
 * `entrega_completa` (con opción de forzar la entrega parcial).
 *
 * @emits actualizado — tras una entrega que modificó el pedido; el padre recarga la bandeja
 */
import { ref, reactive, computed, watch } from 'vue'
import invEntregaService   from '@/services/invEntregaService.js'
import { useNotification } from '@/composables/useNotification'
import {
  ESTADO_ENTREGA_LABEL,
  pendienteSimple,
  itemEntregado,
  stockComponente,
  cantidadSugerida,
  payloadComponentes,
  interpretarResultadoEntrega,
} from '@/utils/invEntregas.js'

const props = defineProps({
  item:         { type: Object,  required: true },
  canCompletar: { type: Boolean, default: false },
})

const emit = defineEmits(['actualizado'])

const { success: notifySuccess, warning: notifyWarning, error: notifyError } = useNotification()

const BADGE_ESTADO = {
  pendiente: 'bg-slate-200 text-slate-700',
  parcial:   'bg-amber-100 text-amber-800',
  entregado: 'bg-green-100 text-green-800',
  completo:  'bg-green-100 text-green-800',
}

const esKit    = computed(() => !!props.item.entrega_kit)
const esSimple = computed(() => !esKit.value && !!props.item.entrega_simple)
const estado   = computed(() => props.item.entrega_kit?.status ?? props.item.entrega_simple?.status ?? 'pendiente')
const entregado = computed(() => itemEntregado(props.item))

const procesando = ref(false)
const bloqueo    = ref('')
let reintento    = null

// ─── Simple ──────────────────────────────────────────────────────────────────
const stockSimple    = computed(() => props.item.entrega_simple?.stock_disponible ?? 0)
const cantidadSimple = ref(1)

watch(() => props.item, () => {
  cantidadSimple.value = cantidadSugerida(pendienteSimple(props.item), stockSimple.value) || 1
}, { immediate: true })

function entregarSimple(forzar = false) {
  const opciones = {}
  // Con entrega completa no se envía cantidad: el backend entrega todo o nada
  if (!props.item.entrega_completa && cantidadSimple.value < pendienteSimple(props.item)) opciones.cantidad = cantidadSimple.value
  if (forzar) opciones.forzar_parcial = true
  return ejecutar(
    () => invEntregaService.completarSimple(props.item.entrega_simple.id, opciones),
    () => entregarSimple(true),
  )
}

// ─── Kit ─────────────────────────────────────────────────────────────────────
const componentes = computed(() => props.item.entrega_kit?.componentes ?? [])
const seleccion   = reactive({})

watch(componentes, (lista) => {
  Object.keys(seleccion).forEach(k => delete seleccion[k])
  lista.forEach((comp) => {
    seleccion[comp.id] = {
      marcado:  false,
      variante: '',
      cantidad: cantidadSugerida(comp.cantidad_pendiente, stockComponente(comp)) || comp.cantidad_pendiente,
    }
  })
}, { immediate: true })

function stockDe(comp) {
  return stockComponente(comp, seleccion[comp.id]?.variante)
}

function componenteEntregable(comp) {
  return comp.status !== 'entregado' && stockDe(comp) > 0
}

function motivoNoEntregable(comp) {
  if (comp.status === 'entregado') return 'Componente ya entregado'
  if (comp.componente_tipo === 'grupo' && !comp.producto_entregado && !seleccion[comp.id]?.variante) return 'Elige la variante'
  if (stockDe(comp) <= 0) return 'Sin stock en el almacén'
  return 'Seleccionar para entregar'
}

function onVarianteChange(comp) {
  const sel = seleccion[comp.id]
  sel.cantidad = cantidadSugerida(comp.cantidad_pendiente, stockDe(comp)) || comp.cantidad_pendiente
  if (!componenteEntregable(comp)) sel.marcado = false
}

const componentesMarcados = computed(() => componentes.value.filter(c => seleccion[c.id]?.marcado && componenteEntregable(c)))

function entregarSeleccionados(forzar = false) {
  const lista = payloadComponentes(componentesMarcados.value, seleccion, { incluirCantidad: !props.item.entrega_completa })
  return ejecutar(
    () => invEntregaService.entregarComponentes(props.item.entrega_kit.id, lista, forzar ? { forzar_parcial: true } : {}),
    () => entregarSeleccionados(true),
  )
}

function entregarTodoKit() {
  const pendientes = componentes.value.filter(c => c.status !== 'entregado')
  const lista      = payloadComponentes(pendientes, seleccion, { incluirCantidad: false })
  // `completar` no acepta forzar_parcial: si la marca bloquea, se reintenta por componentes
  return ejecutar(
    () => invEntregaService.completarKit(props.item.entrega_kit.id, lista),
    () => ejecutar(() => invEntregaService.entregarComponentes(props.item.entrega_kit.id, lista, { forzar_parcial: true })),
  )
}

// ─── Ejecución y lectura del resultado ───────────────────────────────────────
async function ejecutar(accion, reintentoForzado = null) {
  procesando.value = true
  bloqueo.value    = ''
  try {
    const res       = await accion()
    const resultado = interpretarResultadoEntrega(res, props.item)

    if (resultado.tipo === 'bloqueado') {
      bloqueo.value = resultado.mensaje
      reintento     = reintentoForzado
      return
    }
    if (resultado.tipo === 'sin_stock') notifyWarning(resultado.mensaje)
    else notifySuccess(resultado.mensaje)
    emit('actualizado')
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo registrar la entrega.')
  } finally {
    procesando.value = false
  }
}

function reintentarForzado() {
  if (reintento) reintento()
}
</script>
