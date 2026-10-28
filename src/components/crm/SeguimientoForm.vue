<template>
  <div class="flex flex-col gap-3">
    <FormTextarea
      :model-value="texto"
      :label="label"
      :required="textoRequerido"
      placeholder="Ej: Llamada — quiere jornada sábado, pide información de financiación."
      :rows="3"
      @update:model-value="emit('update:texto', $event)"
    />
    <p v-if="errores.seguimiento" class="-mt-2 text-xs text-red-600">{{ errores.seguimiento[0] }}</p>

    <FormSelect
      :model-value="estado"
      label="Estado del lead"
      :options="opciones"
      :error="errorEstado"
      :hint="esMatriculado ? 'Al guardar se abre el asistente de matrícula; el lead queda Matriculado al generarla.' : ''"
      @update:model-value="emit('update:estado', $event)"
    />

    <!-- Próxima acción: queda en la agenda para continuar con el lead -->
    <fieldset v-if="permitirAgendar" class="flex flex-col gap-3 rounded-lg border border-slate-200 p-3">
      <legend class="px-1 text-sm font-medium text-slate-900">Próxima acción</legend>
      <FormSelect
        :model-value="proxima.tipo"
        label="Qué sigue"
        :options="opcionesTipo"
        :error="errores['proxima_accion.tipo']?.[0] ?? errores.proxima_accion?.[0] ?? ''"
        hint="Se agenda para el asesor que registra el seguimiento."
        @update:model-value="actualizarProxima('tipo', $event)"
      />
      <div v-if="proxima.tipo" class="grid grid-cols-2 gap-3">
        <FormInput
          :model-value="proxima.fecha"
          type="date"
          label="Fecha"
          required
          :min="hoy"
          :error="errores['proxima_accion.fecha']?.[0]"
          @update:model-value="actualizarProxima('fecha', $event)"
        />
        <FormInput
          :model-value="proxima.hora"
          type="time"
          label="Hora"
          required
          :error="errores['proxima_accion.hora']?.[0]"
          @update:model-value="actualizarProxima('hora', $event)"
        />
        <div class="col-span-2">
          <FormInput
            :model-value="proxima.nota"
            label="Nota"
            placeholder="Ej: Confirmar si le sirve la jornada sábado."
            :error="errores['proxima_accion.nota']?.[0]"
            @update:model-value="actualizarProxima('nota', $event)"
          />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
/**
 * Campos de un seguimiento del CRM: el detalle de la gestión, el estado en que queda el lead y
 * la próxima acción que se agenda (llamada, visita...). Lo usan la ficha del lead, el alta de un
 * lead y la bitácora de seguimientos; cada pantalla pone su propio botón de guardar y arma el
 * payload con `resolverEstadoSeguimiento` y `proximaAccionPayload`.
 */
import { computed } from 'vue'
import FormInput    from '@/components/forms/FormInput.vue'
import FormSelect   from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import {
  ESTADOS_REFERIDO, OPCIONES_TIPO_AGENDA, opcionesEstadoSeguimiento, fechaISO
} from '@/utils/crm.js'

const props = defineProps({
  /** Detalle del seguimiento (v-model:texto). */
  texto:              { type: String,           default: '' },
  /** Estado elegido para el lead (v-model:estado). */
  estado:             { type: [Number, String], default: '' },
  /** Próxima acción { tipo, fecha, hora, nota } (v-model:proxima); sin tipo no se agenda nada. */
  proxima:            { type: Object,           default: () => ({ tipo: '', fecha: '', hora: '', nota: '' }) },
  label:              { type: String,           default: 'Seguimiento' },
  textoRequerido:     { type: Boolean,          default: false },
  /** Ofrece "Matriculado": el usuario puede crear matrículas y el lead aún se puede convertir. */
  permitirMatricular: { type: Boolean,          default: false },
  /** Muestra la próxima acción: el usuario puede crear agendas. */
  permitirAgendar:    { type: Boolean,          default: false },
  /** Errores 422 del backend (claves `seguimiento`, `estado_referido`/`status`, `proxima_accion.*`). */
  errores:            { type: Object,           default: () => ({}) }
})
const emit = defineEmits(['update:texto', 'update:estado', 'update:proxima'])

const hoy           = fechaISO()
const opciones      = computed(() => opcionesEstadoSeguimiento(props.permitirMatricular))
const opcionesTipo  = [{ value: '', label: 'Nada por ahora' }, ...OPCIONES_TIPO_AGENDA]
const esMatriculado = computed(() => Number(props.estado) === ESTADOS_REFERIDO.MATRICULADO)
const errorEstado   = computed(() => (props.errores.estado_referido ?? props.errores.status)?.[0] ?? '')

function actualizarProxima(campo, valor) {
  emit('update:proxima', { ...props.proxima, [campo]: valor })
}
</script>
