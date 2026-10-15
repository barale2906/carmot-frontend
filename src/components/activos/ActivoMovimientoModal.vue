<template>
  <ModalBase
    :model-value="modelValue"
    :title="modo === 'traslado' ? `Mover ${activo?.codigo ?? ''}` : `Cambiar estado de ${activo?.codigo ?? ''}`"
    :description="activo ? `${activo.nombre} · ${ubicacionActual}` : ''"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-4 pb-2" @submit.prevent="guardar">
      <template v-if="modo === 'traslado'">
        <FormSelect v-model="form.sede_id" label="Sede de destino" required :options="opcionesSede" :error="errores.sede_id?.[0]" @change="form.area_id = ''" />
        <FormSelect v-model="form.area_id" label="Área de destino" :options="opcionesArea" :error="errores.area_id?.[0]" />
        <FormSelect v-model="form.responsable_id" label="Responsable" :options="opcionesResponsable" />
      </template>
      <template v-else>
        <FormSelect v-model="form.estado" label="Nuevo estado" required :options="opcionesEstado" :error="errores.estado?.[0]" />
        <p v-if="form.estado === 'baja'" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          La baja es definitiva: el activo no se podrá volver a mover ni cambiar de estado.
        </p>
      </template>
      <FormInput v-model="form.fecha" type="date" label="Fecha" required :max="hoy" :error="errores.fecha?.[0]" />
      <FormTextarea v-model="form.motivo" label="Motivo" required :rows="3" />
      <p v-if="errores.motivo" class="-mt-3 text-xs text-red-600">{{ errores.motivo[0] }}</p>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando || !form.motivo.trim()"
        class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="form.estado === 'baja' && modo === 'estado' ? 'bg-red-700 hover:bg-red-800' : 'bg-[#213360] hover:bg-[#1a294d]'"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : (modo === 'traslado' ? 'Mover activo' : 'Cambiar estado') }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import ModalBase     from '@/components/ModalBase.vue'
import FormInput     from '@/components/forms/FormInput.vue'
import FormSelect    from '@/components/forms/FormSelect.vue'
import FormTextarea  from '@/components/forms/FormTextarea.vue'
import activoService from '@/services/activoService.js'
import { useNotification } from '@/composables/useNotification'
import { fechaISO } from '@/utils/crm.js'
import { ESTADOS_ACTIVO, areasDeSede } from '@/utils/activos.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  activo:     { type: Object,  default: null },
  /** 'traslado' (sede/área/responsable) o 'estado'. */
  modo:       { type: String,  default: 'traslado', validator: (v) => ['traslado', 'estado'].includes(v) },
  catalogos:  { type: Object,  default: () => ({}) }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { success: notifySuccess } = useNotification()
const hoy = fechaISO()

const ubicacionActual = computed(() => [props.activo?.sede?.nombre, props.activo?.area?.nombre].filter(Boolean).join(' · '))
const opcionesSede    = computed(() => (props.catalogos.sedes ?? []).map(s => ({ value: s.id, label: s.nombre })))
const opcionesArea    = computed(() => [{ value: '', label: 'Sin área' }, ...areasDeSede(props.catalogos.sedes, form.sede_id).map(a => ({ value: a.id, label: a.nombre }))])
const opcionesResponsable = computed(() => [{ value: '', label: 'Sin responsable' }, ...(props.catalogos.responsables ?? []).map(u => ({ value: u.id, label: u.name }))])
const opcionesEstado  = computed(() => ESTADOS_ACTIVO.filter(e => e.value !== props.activo?.estado))

const form      = reactive({ sede_id: '', area_id: '', responsable_id: '', estado: '', fecha: hoy, motivo: '' })
const errores   = ref({})
const error     = ref('')
const guardando = ref(false)

watch(() => props.modelValue, (abierto) => {
  if (!abierto || !props.activo) return
  errores.value = {}
  error.value   = ''
  Object.assign(form, {
    // El destino arranca en la ubicación actual: el usuario elige a propósito a dónde mover.
    sede_id: props.activo.sede_id, area_id: props.activo.area_id ?? '', responsable_id: props.activo.responsable_id ?? '',
    estado: '', fecha: hoy, motivo: ''
  })
})

async function guardar() {
  guardando.value = true
  errores.value   = {}
  error.value     = ''
  try {
    const base = { fecha: form.fecha, motivo: form.motivo.trim() }
    const res = props.modo === 'traslado'
      ? await activoService.trasladar(props.activo.id, {
          ...base,
          sede_id:        Number(form.sede_id),
          area_id:        form.area_id ? Number(form.area_id) : null,
          responsable_id: form.responsable_id ? Number(form.responsable_id) : null
        })
      : await activoService.cambiarEstado(props.activo.id, { ...base, estado: form.estado })
    notifySuccess(res.message ?? 'Activo actualizado.')
    emit('saved', res.data)
    emit('update:modelValue', false)
  } catch (e) {
    if (e?.response?.status === 422) errores.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo registrar el movimiento.'
  } finally {
    guardando.value = false
  }
}
</script>
