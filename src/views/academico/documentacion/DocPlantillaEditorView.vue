<template>
  <div class="flex flex-col gap-6">
    <div v-if="cargando" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
      <span class="text-sm text-slate-500">Cargando plantilla...</span>
    </div>

    <div v-else-if="!plantilla" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
      <p class="text-sm text-red-700">{{ error || 'No se encontró la plantilla.' }}</p>
      <RouterLink to="/academico/documentacion/plantillas" class="mt-3 inline-block text-sm font-medium text-red-700 underline">
        Volver a las versiones
      </RouterLink>
    </div>

    <template v-else>
      <!-- Cabecera de la versión -->
      <section class="flex flex-wrap items-end gap-4 rounded-[14px] border border-black/10 bg-white p-6">
        <div class="min-w-0 flex-1">
          <RouterLink
            to="/academico/documentacion/plantillas"
            class="text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            ← Versiones de plantillas
          </RouterLink>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium text-slate-900">{{ tipoDocumento?.nombre }}</span>
            <span class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">v{{ plantilla.version }}</span>
            <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" :class="plantillaStatusClass(plantilla.status)">
              {{ plantilla.status_text ?? plantillaStatusText(plantilla.status) }}
            </span>
            <span v-if="tipoDocumento?.entidad_nombre" class="text-xs text-slate-500">
              · Datos de: {{ tipoDocumento.entidad_nombre }}
            </span>
          </div>
        </div>
        <div class="w-full sm:w-72">
          <FormInput
            v-model="nombre"
            label="Nombre de la versión"
            :disabled="!puedeEditar"
            :error="erroresForm.nombre?.[0]"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="guardando"
            @click="abrirPrevisualizacion"
          >
            <NavIcon name="eye" class="size-4" /> Previsualizar
          </button>
          <button
            v-if="puedeEditar"
            type="button"
            :disabled="guardando || !hayCambios"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            @click="handleGuardar"
          >
            <NavIcon name="check" class="size-4" />
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </section>

      <!-- Avisos -->
      <p v-if="!editable" class="rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Esta versión está <strong>{{ plantilla.status_text }}</strong> y su contenido está congelado.
        Para cambiarla, clónala desde el listado de versiones y edita el borrador.
      </p>
      <div
        v-if="variablesInvalidas.length || bloquesInvalidos.length"
        class="rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <p class="font-medium">El contenido tiene marcadores que no se pueden resolver (marcados en rojo):</p>
        <p v-if="variablesInvalidas.length" class="mt-1">Variables no habilitadas: {{ variablesInvalidas.join(', ') }}</p>
        <p v-if="bloquesInvalidos.length" class="mt-1">Tablas no disponibles: {{ bloquesInvalidos.join(', ') }}</p>
        <p class="mt-1 text-xs">Quítalos o habilita las variables en el tipo de documento.</p>
      </div>
      <div v-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-4">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <!-- Editor + panel de datos insertables -->
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <DocRichEditor
          ref="editorRef"
          v-model="contenido"
          :editable="puedeEditar"
          :variables="variables"
          :bloques="bloques"
        />
        <DocMarcadorPanel
          :variables="variables"
          :bloques="bloques"
          :editable="puedeEditar"
          class="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto"
          @insertar-variable="editorRef?.insertarVariable($event)"
          @insertar-bloque="editorRef?.insertarBloque($event)"
          @configurar-bloque="abrirConfigBloque"
        />
      </div>
    </template>

    <DocBloqueConfigModal
      v-model="showConfigBloque"
      :bloque="bloqueEnEdicion"
      :editable="puedeEditar"
      :guardando="guardandoBloque"
      :error="errorBloque"
      @guardar="handleGuardarBloque"
      @restablecer="handleGuardarBloque(null)"
    />

    <DocPrevisualizarModal
      v-if="plantilla"
      v-model="showPrevisualizar"
      :tipo-documento="tipoDocumento ?? {}"
      :previsualizar="previsualizar"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import { usePlantillaEditor } from '@/composables/usePlantillaEditor.js'
import { usePermisos }        from '@/composables/usePermisos.js'
import { useNotification }    from '@/composables/useNotification'
import { useConfirm }         from '@/composables/useConfirm.js'
import { plantillaStatusText, plantillaStatusClass } from '@/utils/documentacion.js'
import NavIcon               from '@/components/icons/NavIcon.vue'
import FormInput             from '@/components/forms/FormInput.vue'
import DocRichEditor         from '@/components/documentacion/DocRichEditor.vue'
import DocMarcadorPanel      from '@/components/documentacion/DocMarcadorPanel.vue'
import DocBloqueConfigModal  from '@/components/documentacion/DocBloqueConfigModal.vue'
import DocPrevisualizarModal from '@/components/documentacion/DocPrevisualizarModal.vue'

const route = useRoute()
const { success: notifySuccess } = useNotification()
const { confirm } = useConfirm()
const { can, loadPermisos } = usePermisos()

const {
  plantilla, tipoDocumento, variables, bloques, nombre, contenido,
  cargando, guardando, error, erroresForm, editable, hayCambios,
  variablesInvalidas, bloquesInvalidos,
  cargar, guardar, guardarBloque, previsualizar,
} = usePlantillaEditor()

const editorRef = ref(null)

const puedeEditar        = computed(() => editable.value && can('aca_docPlantillaEditar'))

async function handleGuardar() {
  if (await guardar()) notifySuccess('Versión guardada.')
}

// ─── Previsualización ─────────────────────────────────────────────────────────
const showPrevisualizar = ref(false)

// El backend previsualiza lo guardado: si hay cambios pendientes se guardan primero.
async function abrirPrevisualizacion() {
  if (puedeEditar.value && hayCambios.value && !await guardar()) return
  showPrevisualizar.value = true
}

// ─── Configuración de bloques ─────────────────────────────────────────────────
const showConfigBloque = ref(false)
const bloqueEnEdicion  = ref(null)
const guardandoBloque  = ref(false)
const errorBloque      = ref('')

function abrirConfigBloque(bloque) {
  bloqueEnEdicion.value  = bloque
  errorBloque.value      = ''
  showConfigBloque.value = true
}

async function handleGuardarBloque(configuracion) {
  guardandoBloque.value = true
  errorBloque.value     = ''
  try {
    await guardarBloque(bloqueEnEdicion.value.clave, configuracion)
    notifySuccess(configuracion ? 'Columnas de la tabla actualizadas.' : 'Tabla restablecida a sus columnas por defecto.')
    showConfigBloque.value = false
  } catch (e) {
    const errores = e?.response?.data?.errors
    errorBloque.value = (errores && Object.values(errores)[0]?.[0])
      ?? e?.response?.data?.message
      ?? 'No se pudo guardar la configuración de la tabla.'
  } finally {
    guardandoBloque.value = false
  }
}

// ─── Salida con cambios sin guardar ───────────────────────────────────────────
onBeforeRouteLeave(async () => {
  if (!puedeEditar.value || !hayCambios.value) return true
  return confirm('Hay cambios sin guardar en esta versión. ¿Salir de todos modos?', {
    title: 'Cambios sin guardar',
    confirmLabel: 'Salir sin guardar',
  })
})

onMounted(() => {
  loadPermisos()
  cargar(Number(route.params.id))
})
</script>
