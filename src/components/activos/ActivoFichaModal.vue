<template>
  <ModalBase
    :model-value="modelValue"
    size="xl"
    :title="ficha ? `${ficha.codigo} · ${ficha.nombre}` : 'Ficha del activo'"
    :description="ficha ? [ficha.sede?.nombre, ficha.area?.nombre].filter(Boolean).join(' · ') : ''"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p v-if="cargando" class="py-8 text-center text-sm text-slate-500">Cargando ficha...</p>
    <p v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

    <div v-else-if="ficha" class="flex flex-col gap-6 pb-2">
      <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <div v-for="dato in datos" :key="dato.etiqueta">
          <dt class="text-xs text-slate-400">{{ dato.etiqueta }}</dt>
          <dd class="font-medium text-slate-800">{{ dato.valor || '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">Estado</dt>
          <dd><StatusBadge :label="ficha.estado_texto" :variant="varianteEstado(ficha.estado)" /></dd>
        </div>
      </dl>
      <p v-if="ficha.descripcion" class="text-sm text-slate-600">{{ ficha.descripcion }}</p>

      <section aria-labelledby="ficha-activo-historial">
        <h3 id="ficha-activo-historial" class="mb-2 text-sm font-semibold text-slate-900">Historial</h3>
        <ol class="space-y-2">
          <li v-for="mov in ficha.movimientos" :key="mov.id" class="rounded-lg border border-slate-200 p-3 text-sm">
            <p class="text-slate-800">
              <strong>{{ mov.tipo_texto }}</strong>
              <template v-if="mov.tipo === 'traslado'">: {{ mov.origen }} → {{ mov.destino }}</template>
              <template v-else-if="mov.tipo === 'cambio_estado'">: {{ mov.estado_anterior }} → {{ mov.estado_nuevo }}</template>
              <template v-else-if="mov.destino">: {{ mov.destino }}</template>
              <span class="text-xs text-slate-400"> · {{ fechaCorta(mov.fecha) }} · {{ mov.usuario?.name ?? '—' }}</span>
            </p>
            <p v-if="mov.motivo" class="mt-1 text-slate-600">{{ mov.motivo }}</p>
          </li>
        </ol>
      </section>
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
import ModalBase     from '@/components/ModalBase.vue'
import StatusBadge   from '@/components/activos/StatusBadge.vue'
import activoService from '@/services/activoService.js'
import { fechaCorta } from '@/utils/crm.js'
import { varianteEstado, formatoCOP } from '@/utils/activos.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  activoId:   { type: Number,  default: null }
})
const emit = defineEmits(['update:modelValue'])

const ficha    = ref(null)
const cargando = ref(false)
const error    = ref('')

const datos = computed(() => {
  const a = ficha.value
  if (!a) return []
  return [
    { etiqueta: 'Categoría',        valor: a.categoria?.nombre },
    { etiqueta: 'Responsable',      valor: a.responsable?.name },
    { etiqueta: 'Fecha de ingreso', valor: fechaCorta(a.fecha_ingreso) },
    { etiqueta: 'Valor',            valor: formatoCOP(a.valor) },
    { etiqueta: 'Marca / modelo',   valor: [a.marca, a.modelo].filter(Boolean).join(' / ') },
    { etiqueta: 'Serial',           valor: a.serial },
    { etiqueta: 'Observaciones',    valor: a.observaciones }
  ]
})

watch(() => [props.modelValue, props.activoId], async ([abierto]) => {
  if (!abierto || !props.activoId) return
  cargando.value = true
  error.value    = ''
  try {
    const res = await activoService.getById(props.activoId)
    ficha.value = res.data
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar la ficha del activo.'
  } finally {
    cargando.value = false
  }
})
</script>
