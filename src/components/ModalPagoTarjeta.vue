<template>
  <ModalBase
    :model-value="modelValue"
    title="Recargo por pago con tarjeta"
    description="Revisa el recargo aplicable según el medio de pago seleccionado."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 text-[#213360]" aria-hidden="true">
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </span>
    </template>

    <div class="flex flex-col gap-4 pb-2">

      <!-- Selector de marca cuando hay múltiples opciones -->
      <div v-if="marcasDisponibles.length > 1">
        <label class="mb-1 block text-sm font-medium text-slate-700">Marca de tarjeta</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="marca in marcasDisponibles"
            :key="marca"
            type="button"
            class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="marcaSeleccionada === marca
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
            @click="seleccionarMarca(marca)"
          >
            {{ marca }}
          </button>
          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="marcaSeleccionada === ''
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
            @click="seleccionarMarca('')"
          >
            Otra / no especifica
          </button>
        </div>
      </div>

      <!-- Input de marca cuando hay una sola opción o es campo libre -->
      <div v-else>
        <label class="mb-1 block text-sm font-medium text-slate-700">Marca de tarjeta <span class="text-slate-400">(opcional)</span></label>
        <input
          v-model="marcaSeleccionada"
          type="text"
          placeholder="Ej: Visa, Mastercard..."
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          @input="onMarcaInput"
        />
        <p class="mt-1 text-xs text-slate-500">Déjalo vacío si no aplica o no es relevante.</p>
      </div>

      <!-- Loading -->
      <div v-if="cargando" class="rounded-[10px] border border-black/10 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
        Consultando recargos...
      </div>

      <!-- Sin sobrecargos configurados -->
      <div v-else-if="!cargando && sobrecargos.length === 0" class="rounded-[10px] border border-green-200 bg-green-50 px-4 py-4">
        <p class="text-sm text-green-700">No hay recargo configurado para este medio de pago. El total no cambia.</p>
        <div class="mt-2 flex justify-between text-sm font-semibold">
          <span class="text-slate-700">Total a cobrar:</span>
          <span class="font-mono text-[#213360]">$ {{ formatMoney(valorBase) }}</span>
        </div>
      </div>

      <!-- Detalle del sobrecargo -->
      <div v-else-if="sobrecargos.length > 0" class="rounded-[10px] border border-black/10 bg-slate-50 px-4 py-4">
        <div v-for="sc in sobrecargos" :key="sc.descuento_id" class="mb-3 last:mb-0">
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{{ sc.nombre }}</p>
          <div class="flex justify-between text-sm">
            <span class="text-slate-700">Valor base (deudas cubiertas):</span>
            <span class="font-mono font-medium text-slate-900">$ {{ formatMoney(sc.valor_base) }}</span>
          </div>
          <div class="mt-1 flex justify-between text-sm">
            <span class="text-slate-700">Recargo {{ sc.porcentaje }}%:</span>
            <span class="font-mono font-medium text-orange-600">+ $ {{ formatMoney(sc.valor_sobrecargo) }}</span>
          </div>
        </div>
        <div class="mt-3 flex justify-between border-t border-black/10 pt-3 text-base">
          <span class="font-bold text-slate-900">Total a cobrar (bruto):</span>
          <span class="font-mono font-bold text-[#213360]">$ {{ formatMoney(totalConSobrecargo) }}</span>
        </div>
        <p class="mt-2 text-xs text-slate-500">
          El recargo corre por cuenta del pagador. La institución recibe $ {{ formatMoney(valorBase) }} neto.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="cargando"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2950] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="onConfirmar"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0v8a3 3 0 003 3z" />
        </svg>
        Confirmar
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase          from '@/components/ModalBase.vue'
import descuentoService   from '@/services/descuentoService.js'

const props = defineProps({
  modelValue: { type: Boolean,          default: false },
  medioPago:  { type: String,           default: '' },
  valorBase:  { type: [Number, String], default: 0 },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const marcaSeleccionada = ref('')
const sobrecargos       = ref([])
const cargando          = ref(false)
let   marcaTimer        = null

const valorNumerico = computed(() => Number(props.valorBase) || 0)

const totalConSobrecargo = computed(() =>
  sobrecargos.value.reduce((sum, sc) => sum + (sc.valor_sobrecargo ?? 0), valorNumerico.value)
)

// Marcas de tarjeta disponibles según la API (unión de todas las marcas de sobrecargos activos)
const marcasDisponibles = computed(() => {
  const marcas = new Set()
  sobrecargos.value.forEach(sc => (sc.tipo_tarjeta ? marcas.add(sc.tipo_tarjeta) : null))
  return [...marcas]
})

async function consultarSobrecargos() {
  if (!props.medioPago || !props.modelValue) return
  cargando.value = true
  try {
    const params = { medio_pago: props.medioPago, valor_base: valorNumerico.value }
    if (marcaSeleccionada.value) params.tipo_tarjeta = marcaSeleccionada.value
    const res   = await descuentoService.getSobrecargosPorMedioPago(params)
    sobrecargos.value = res.data ?? []
  } catch {
    sobrecargos.value = []
  } finally {
    cargando.value = false
  }
}

function seleccionarMarca(marca) {
  marcaSeleccionada.value = marca
  consultarSobrecargos()
}

function onMarcaInput() {
  clearTimeout(marcaTimer)
  marcaTimer = setTimeout(consultarSobrecargos, 600)
}

// Consultar al abrir o cuando cambia el medio de pago
watch(() => props.modelValue, (open) => {
  if (open) {
    marcaSeleccionada.value = ''
    consultarSobrecargos()
  }
})

watch(() => props.medioPago, () => {
  if (props.modelValue) {
    marcaSeleccionada.value = ''
    consultarSobrecargos()
  }
})

watch(valorNumerico, () => {
  if (props.modelValue && sobrecargos.value.length) {
    consultarSobrecargos()
  }
})

function formatMoney(val) {
  if (val == null) return '0'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function onConfirmar() {
  emit('confirm', {
    sobrecargos:        sobrecargos.value,
    marcaTarjeta:       marcaSeleccionada.value || null,
    totalSobrecargo:    totalConSobrecargo.value - valorNumerico.value,
    total:              totalConSobrecargo.value,
  })
  emit('update:modelValue', false)
}
</script>
