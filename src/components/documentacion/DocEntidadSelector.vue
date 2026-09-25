<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm font-medium text-slate-700">
      {{ entidadNombre || 'Registro' }} asociado
      <span v-if="required" class="text-red-500">*</span>
    </p>

    <!-- Registro elegido -->
    <div
      v-if="seleccionado"
      class="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2"
    >
      <div class="min-w-0">
        <p class="truncate text-sm font-medium text-slate-900">{{ seleccionado.titulo }}</p>
        <p v-if="seleccionado.detalle || padre" class="truncate text-xs text-slate-500">
          {{ [padre?.titulo, seleccionado.detalle].filter(Boolean).join(' · ') }}
        </p>
      </div>
      <button
        v-if="!disabled"
        type="button"
        class="shrink-0 text-xs font-medium text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="reiniciar"
      >
        Cambiar
      </button>
    </div>

    <!-- Entidad sin buscador registrado en el frontend: ID manual -->
    <FormInput
      v-else-if="!soportado"
      :model-value="modelValue ?? ''"
      type="number"
      min="1"
      label="ID del registro"
      placeholder="Ej: 345"
      hint="Esta entidad aún no tiene buscador; ingresa el ID del registro."
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event ? Number($event) : null)"
    />

    <template v-else>
      <!-- Paso intermedio (p. ej. cuota): muestra el padre elegido -->
      <div v-if="padre" class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span class="truncate">{{ padre.titulo }} — {{ adaptador.ayudaHijos }}</span>
        <button type="button" class="shrink-0 font-medium text-blue-700 underline" @click="reiniciar">Cambiar</button>
      </div>

      <FormInputSearch
        v-else
        v-model="termino"
        :placeholder="adaptador.placeholder"
        :hint="`Escribe al menos ${minCaracteres} caracteres.`"
        :disabled="disabled"
      />

      <p v-if="buscando" class="text-xs text-slate-500">Buscando...</p>
      <p v-else-if="error" class="text-xs text-red-600">{{ error }}</p>
      <p v-else-if="sinResultados" class="text-xs text-slate-400">Sin resultados.</p>

      <ul v-if="resultados.length" class="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
        <li v-for="item in resultados" :key="item.id">
          <button
            type="button"
            class="flex w-full flex-col items-start px-3 py-2 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            @click="elegir(item)"
          >
            <span class="text-sm font-medium text-slate-900">{{ item.titulo }}</span>
            <span v-if="item.detalle" class="text-xs text-slate-500">{{ item.detalle }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { computed, toRef, watch } from 'vue'
import { useDocEntidadBuscador } from '@/composables/useDocEntidadBuscador.js'
import FormInput       from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'

const props = defineProps({
  /** `entidad_id` elegido. */
  modelValue:    { type: Number, default: null },
  /** Clase completa de la entidad del tipo de documento. */
  entidadType:   { type: String, default: null },
  entidadNombre: { type: String, default: '' },
  required:      { type: Boolean, default: false },
  disabled:      { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const {
  termino, resultados, buscando, error, padre, seleccionado,
  adaptador, soportado, elegir, reiniciar, minCaracteres,
} = useDocEntidadBuscador(toRef(props, 'entidadType'))

const sinResultados = computed(() =>
  !padre.value && termino.value.trim().length >= minCaracteres && !resultados.value.length,
)

watch(seleccionado, (item) => emit('update:modelValue', item?.id ?? null))
</script>
