<template>
  <ModalBase
    :model-value="modelValue"
    size="xl"
    :title="activo ? `Editar ${activo.codigo}` : 'Nuevo activo'"
    :description="activo ? 'La ubicación y el estado se cambian con Mover y Estado, que dejan historial.' : 'Registra un equipo, herramienta o mueble en una sede.'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="grid grid-cols-1 gap-4 pb-2 md:grid-cols-2" @submit.prevent="guardar">
      <FormInput v-model="form.codigo" label="Código" required placeholder="Ej: TUN-HER-0001" :error="errores.codigo?.[0]" />
      <FormInput v-model="form.nombre" label="Nombre" required :error="errores.nombre?.[0]" />
      <FormSelect v-model="form.categoria_id" label="Categoría" required :options="opcionesCategoria" :error="errores.categoria_id?.[0]" />
      <FormSelect v-model="form.responsable_id" label="Responsable" :options="opcionesResponsable" :error="errores.responsable_id?.[0]" />

      <template v-if="!activo">
        <FormSelect v-model="form.sede_id" label="Sede" required :options="opcionesSede" :error="errores.sede_id?.[0]" @change="form.area_id = ''" />
        <FormSelect v-model="form.area_id" label="Área" :options="opcionesArea" :disabled="!form.sede_id" :error="errores.area_id?.[0]" />
        <FormSelect v-model="form.estado" label="Estado inicial" :options="ESTADOS_INICIALES" :error="errores.estado?.[0]" />
      </template>

      <FormInput v-model="form.fecha_ingreso" type="date" label="Fecha de ingreso" required :max="hoy" :error="errores.fecha_ingreso?.[0]" />
      <FormInput v-model="form.valor" type="number" label="Valor de adquisición" min="0" step="1" required :error="errores.valor?.[0]" />
      <FormInput v-model="form.marca" label="Marca" :error="errores.marca?.[0]" />
      <FormInput v-model="form.modelo" label="Modelo" :error="errores.modelo?.[0]" />
      <FormInput v-model="form.serial" label="Serial" :error="errores.serial?.[0]" />
      <div class="md:col-span-2">
        <FormTextarea v-model="form.descripcion" label="Descripción" :rows="2" />
      </div>
      <div class="md:col-span-2">
        <FormTextarea v-model="form.observaciones" label="Observaciones" :rows="2" />
      </div>
      <p v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{{ error }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : (activo ? 'Guardar cambios' : 'Registrar activo') }}
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
import { ESTADOS_INICIALES, areasDeSede, payloadActivo } from '@/utils/activos.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Activo a editar; null para registrar uno nuevo. */
  activo:     { type: Object,  default: null },
  /** Catálogos de GET /activos/activos/filters. */
  catalogos:  { type: Object,  default: () => ({}) },
  /** Sede preseleccionada al registrar (la del filtro activo). */
  sedeId:     { type: [String, Number], default: '' }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const { success: notifySuccess } = useNotification()
const hoy = fechaISO()

const opcionesCategoria   = computed(() => (props.catalogos.categorias ?? []).map(c => ({ value: c.id, label: c.nombre })))
const opcionesResponsable = computed(() => [{ value: '', label: 'Sin responsable' }, ...(props.catalogos.responsables ?? []).map(u => ({ value: u.id, label: u.name }))])
const opcionesSede        = computed(() => (props.catalogos.sedes ?? []).map(s => ({ value: s.id, label: s.nombre })))
const opcionesArea        = computed(() => [{ value: '', label: 'Sin área' }, ...areasDeSede(props.catalogos.sedes, form.sede_id).map(a => ({ value: a.id, label: a.nombre }))])

const form      = reactive({})
const errores   = ref({})
const error     = ref('')
const guardando = ref(false)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  errores.value = {}
  error.value   = ''
  const a = props.activo
  Object.assign(form, {
    codigo: a?.codigo ?? '', nombre: a?.nombre ?? '', descripcion: a?.descripcion ?? '',
    categoria_id: a?.categoria_id ?? '', responsable_id: a?.responsable_id ?? '',
    sede_id: a?.sede_id ?? props.sedeId ?? '', area_id: a?.area_id ?? '', estado: a?.estado ?? 'operativo',
    marca: a?.marca ?? '', modelo: a?.modelo ?? '', serial: a?.serial ?? '',
    fecha_ingreso: a?.fecha_ingreso ?? hoy, valor: a?.valor ?? '', observaciones: a?.observaciones ?? ''
  })
})

async function guardar() {
  guardando.value = true
  errores.value   = {}
  error.value     = ''
  try {
    const payload = payloadActivo(form, { creando: !props.activo })
    const res = props.activo
      ? await activoService.update(props.activo.id, payload)
      : await activoService.create(payload)
    notifySuccess(res.message ?? 'Activo guardado.')
    emit('saved', res.data)
    emit('update:modelValue', false)
  } catch (e) {
    if (e?.response?.status === 422) errores.value = e.response.data?.errors ?? {}
    error.value = e?.response?.data?.message ?? 'No se pudo guardar el activo.'
  } finally {
    guardando.value = false
  }
}
</script>
