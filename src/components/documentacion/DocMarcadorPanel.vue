<template>
  <aside class="flex flex-col gap-4 rounded-[14px] border border-black/10 bg-white p-4" aria-label="Datos insertables">
    <div class="flex gap-1 rounded-lg bg-slate-100 p-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="tabActiva === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        @click="tabActiva = tab.id"
      >
        {{ tab.label }} ({{ tab.total }})
      </button>
    </div>

    <!-- Variables habilitadas del tipo -->
    <template v-if="tabActiva === 'variables'">
      <FormInputSearch v-model="filtro" placeholder="Buscar variable..." />
      <p v-if="!editable" class="text-xs text-slate-400">La versión no está en proceso: solo lectura.</p>

      <div v-for="grupo in gruposFiltrados" :key="grupo.id" class="flex flex-col gap-1">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ grupo.titulo }}</h3>
        <button
          v-for="variable in grupo.items"
          :key="variable.clave"
          type="button"
          :disabled="!editable"
          :title="editable ? `Insertar «${variable.label}» en el cursor` : variable.label"
          class="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-slate-700"
          @click="emit('insertar-variable', variable.clave)"
        >
          <span>{{ variable.label }}</span>
          <NavIcon v-if="editable" name="plus" class="size-3.5 shrink-0 text-slate-400" />
        </button>
      </div>

      <p v-if="!gruposFiltrados.length" class="text-xs text-slate-400">
        {{ filtro ? 'Sin coincidencias.' : 'El tipo de documento no tiene variables habilitadas.' }}
      </p>
    </template>

    <!-- Bloques de consulta (tablas) -->
    <template v-else>
      <p v-if="!bloques.length" class="text-xs text-slate-400">
        No hay tablas de consulta disponibles para la entidad de este tipo de documento.
      </p>
      <article
        v-for="bloque in bloques"
        :key="bloque.clave"
        class="flex flex-col gap-2 rounded-lg border border-slate-200 p-3"
      >
        <div>
          <p class="text-sm font-medium text-slate-900">{{ bloque.label }}</p>
          <p v-if="bloque.descripcion" class="mt-0.5 text-xs text-slate-500">{{ bloque.descripcion }}</p>
          <p class="mt-1 text-xs text-slate-400">
            {{ bloque.columnas_activas.length }} de {{ bloque.columnas.length }} columnas
            <span v-if="bloque.configurado"> · personalizado</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="editable"
            type="button"
            class="flex items-center gap-1 rounded-md bg-[#213360] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="emit('insertar-bloque', bloque.clave)"
          >
            <NavIcon name="plus" class="size-3.5" /> Insertar
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="emit('configurar-bloque', bloque)"
          >
            {{ editable ? 'Columnas' : 'Ver columnas' }}
          </button>
        </div>
      </article>
    </template>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { agruparVariablesHabilitadas } from '@/utils/documentacion.js'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'

const props = defineProps({
  variables: { type: Array, default: () => [] },
  bloques:   { type: Array, default: () => [] },
  editable:  { type: Boolean, default: true },
})

const emit = defineEmits(['insertar-variable', 'insertar-bloque', 'configurar-bloque'])

const tabActiva = ref('variables')
const filtro    = ref('')

const agrupadas = computed(() => agruparVariablesHabilitadas(props.variables))

const tabs = computed(() => [
  { id: 'variables', label: 'Variables', total: agrupadas.value.entidad.length + agrupadas.value.global.length },
  { id: 'bloques',   label: 'Tablas',    total: props.bloques.length },
])

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const gruposFiltrados = computed(() => {
  const termino = normalizar(filtro.value.trim())
  const coincide = (v) => !termino || normalizar(v.label).includes(termino)
  return [
    { id: 'entidad', titulo: 'Datos del registro', items: agrupadas.value.entidad.filter(coincide) },
    { id: 'global',  titulo: 'Datos generales',    items: agrupadas.value.global.filter(coincide) },
  ].filter((g) => g.items.length)
})
</script>
