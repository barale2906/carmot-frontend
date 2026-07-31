<template>
  <ModalBase
    :model-value="modelValue"
    title="Pago por transferencia bancaria"
    description="Ingresa los datos del banco y la transacción"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 text-[#213360]" aria-hidden="true">
        <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </span>
    </template>

    <div class="flex flex-col gap-4">

      <!-- Aviso de flujo de aprobación -->
      <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
        <strong>Pendiente de aprobación:</strong> Este recibo no se cerrará inmediatamente.
        Un validador revisará el comprobante antes de confirmar el pago.
      </div>

      <!-- Banco origen -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">
          Banco origen <span class="text-red-500">*</span>
        </label>
        <select
          v-model="bancoId"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-300': errorBanco }"
        >
          <option :value="null" disabled>-- Seleccionar banco --</option>
          <option v-for="b in bancos" :key="b.id" :value="b.id">
            {{ b.nombre }}{{ b.codigo ? ` (${b.codigo})` : '' }}
          </option>
        </select>
        <p v-if="errorBanco" class="mt-1 text-xs text-red-600">{{ errorBanco }}</p>
        <p v-if="cargandoBancos" class="mt-1 text-xs text-slate-400">Cargando bancos...</p>
      </div>

      <!-- Número de transacción -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">
          Número de transacción <span class="text-red-500">*</span>
        </label>
        <input
          v-model="numeroTransaccion"
          type="text"
          placeholder="Ej: 1234567890"
          maxlength="100"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{ 'border-red-300': errorNumero }"
        />
        <p v-if="errorNumero" class="mt-1 text-xs text-red-600">{{ errorNumero }}</p>
        <p class="mt-1 text-xs text-slate-400">Número único que aparece en el comprobante bancario.</p>
      </div>

      <!-- Comprobante (opcional) -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">
          Comprobante <span class="text-slate-400">(opcional)</span>
        </label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.webp"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="onFileChange"
        />
        <p class="mt-1 text-xs text-slate-400">JPG, PNG, PDF o WebP · máx. 5 MB. Se puede adjuntar después.</p>
        <p v-if="nombreArchivo" class="mt-1 text-xs text-green-700">Archivo seleccionado: {{ nombreArchivo }}</p>
      </div>

    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="onCancelar"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a2950] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="onConfirmar"
      >
        <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        Confirmar datos
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, watch }  from 'vue'
import ModalBase       from '@/components/ModalBase.vue'
import bancoService    from '@/services/bancoService.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const bancos          = ref([])
const cargandoBancos  = ref(false)
const bancoId         = ref(null)
const numeroTransaccion = ref('')
const comprobanteFile = ref(null)
const nombreArchivo   = ref('')
const errorBanco      = ref('')
const errorNumero     = ref('')

async function cargarBancos() {
  if (bancos.value.length) return
  cargandoBancos.value = true
  try {
    const res = await bancoService.getActivos()
    bancos.value = res.data ?? []
  } catch {
    /* no bloquea el modal */
  } finally {
    cargandoBancos.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) cargarBancos()
})

function onFileChange(e) {
  const file = e.target.files?.[0] ?? null
  comprobanteFile.value = file
  nombreArchivo.value   = file?.name ?? ''
}

function validar() {
  errorBanco.value  = ''
  errorNumero.value = ''
  let ok = true
  if (!bancoId.value) {
    errorBanco.value = 'Selecciona el banco origen.'
    ok = false
  }
  if (!numeroTransaccion.value.trim()) {
    errorNumero.value = 'El número de transacción es obligatorio.'
    ok = false
  }
  return ok
}

function onConfirmar() {
  if (!validar()) return
  const bancoSeleccionado = bancos.value.find(b => b.id === bancoId.value)
  emit('confirm', {
    banco_id:            bancoId.value,
    banco_nombre:        bancoSeleccionado?.nombre ?? '',
    numero_transaccion:  numeroTransaccion.value.trim(),
    comprobante_file:    comprobanteFile.value,
  })
  resetFields()
  emit('update:modelValue', false)
}

function onCancelar() {
  resetFields()
  emit('update:modelValue', false)
}

function resetFields() {
  bancoId.value           = null
  numeroTransaccion.value = ''
  comprobanteFile.value   = null
  nombreArchivo.value     = ''
  errorBanco.value        = ''
  errorNumero.value       = ''
}
</script>
