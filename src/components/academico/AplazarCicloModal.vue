<template>
  <ModalBase
    :model-value="modelValue"
    :title="modalTitle"
    :description="modalDescription"
    size="lg"
    @update:model-value="onModalClose"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-amber-500">
        <NavIcon name="calendario" class="size-5" />
      </span>
    </template>

    <!-- ── Cargando ─────────────────────────────────────────────────────────── -->
    <div v-if="view === 'loading'" class="flex items-center justify-center py-12">
      <span class="text-sm text-slate-500">Cargando información del ciclo...</span>
    </div>

    <!-- ── Error de carga ───────────────────────────────────────────────────── -->
    <div v-else-if="loadError" class="py-8 text-center">
      <p class="text-sm text-red-600">{{ loadError }}</p>
      <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadData">
        Reintentar
      </button>
    </div>

    <!-- ── Vista principal ─────────────────────────────────────────────────── -->
    <div v-else-if="view === 'main'" class="space-y-5 pb-4">

      <!-- Banner: aplazamiento activo -->
      <div v-if="aplazamientoActivo" class="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p class="text-sm font-semibold text-amber-900">Ciclo en aplazamiento</p>
        <dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-amber-800">
          <div>
            <dt class="inline font-medium">Tipo: </dt>
            <dd class="inline">{{ aplazamientoActivo.tipo_aplazamiento?.nombre ?? '—' }}</dd>
          </div>
          <div>
            <dt class="inline font-medium">Días aplazado: </dt>
            <dd class="inline">{{ aplazamientoActivo.dias_aplazamiento }}</dd>
          </div>
          <div>
            <dt class="inline font-medium">Inicio original: </dt>
            <dd class="inline">{{ formatDate(aplazamientoActivo.fecha_inicio_original) }}</dd>
          </div>
          <div>
            <dt class="inline font-medium">Reinicio probable: </dt>
            <dd class="inline">{{ formatDate(aplazamientoActivo.fecha_reinicio_probable) }}</dd>
          </div>
          <div v-if="aplazamientoActivo.observaciones" class="col-span-2 mt-1 italic">
            {{ aplazamientoActivo.observaciones }}
          </div>
        </dl>

        <!-- Acciones del aplazamiento activo -->
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-if="canCreate"
            type="button"
            class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            @click="openConfirmar"
          >
            Confirmar
          </button>
          <button
            v-if="canCreate"
            type="button"
            class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openAmpliar"
          >
            Ampliar
          </button>
          <button
            v-if="canCreate"
            type="button"
            class="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            @click="openInterrumpir"
          >
            Interrumpir
          </button>
          <button
            v-if="canRevert"
            type="button"
            class="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            @click="openRevertir"
          >
            Revertir
          </button>
        </div>
      </div>

      <!-- Sin aplazamiento activo -->
      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4"
      >
        <p class="text-sm text-slate-500">Este ciclo no tiene aplazamientos pendientes.</p>
        <button
          v-if="canCreate && !cicloDetalle?.finalizado"
          type="button"
          class="flex items-center gap-1.5 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="openAplazar"
        >
          <NavIcon name="plus" class="size-4" />
          Aplazar ciclo
        </button>
      </div>

      <!-- Historial de aplazamientos -->
      <div v-if="historial.length">
        <p class="mb-3 text-sm font-medium text-slate-700">
          Historial ({{ historial.length }} {{ historial.length === 1 ? 'registro' : 'registros' }})
        </p>
        <div class="relative pl-5">
          <!-- Línea vertical de la línea de tiempo -->
          <div class="absolute left-1.5 top-2 h-[calc(100%-0.75rem)] w-px bg-slate-200" />
          <div
            v-for="item in historial"
            :key="item.id"
            class="relative mb-3 last:mb-0"
          >
            <!-- Punto de la línea de tiempo -->
            <div :class="['absolute -left-[18px] top-2 size-3 rounded-full ring-2 ring-white', statusDotClass(item.estado)]" />
            <div
              :class="[
                'rounded-lg border bg-white p-3 text-sm',
                item.aplazamiento_padre_id ? 'ml-2 border-slate-100' : 'border-slate-200'
              ]"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span :class="['rounded-full px-2 py-0.5 text-xs font-medium', statusBadgeClass(item.estado)]">
                  {{ item.estado_text }}
                </span>
                <span v-if="item.aplazamiento_padre_id" class="text-xs italic text-slate-400">Ampliación</span>
                <span class="text-xs text-slate-500">{{ item.dias_aplazamiento }} días</span>
              </div>
              <p class="mt-1 font-medium text-slate-800">{{ item.tipo_aplazamiento?.nombre ?? '—' }}</p>
              <p class="text-xs text-slate-500">
                {{ formatDate(item.fecha_aplazamiento) }} → reinicio: {{ formatDate(item.fecha_reinicio_probable) }}
              </p>
              <p v-if="item.fecha_reinicio_real" class="text-xs text-slate-500">
                Reinició el {{ formatDate(item.fecha_reinicio_real) }} ({{ item.dias_reales }} días efectivos)
              </p>
              <p v-if="item.observaciones" class="mt-1 text-xs italic text-slate-400">{{ item.observaciones }}</p>
              <p v-if="item.user?.name" class="mt-0.5 text-xs text-slate-400">Por {{ item.user.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <p v-else-if="!aplazamientoActivo" class="text-center text-xs text-slate-400">
        Sin historial de aplazamientos para este ciclo.
      </p>
    </div>

    <!-- ── Vista: Aplazar ───────────────────────────────────────────────────── -->
    <form v-else-if="view === 'aplazar'" class="flex flex-col gap-4 pb-2" @submit.prevent="submitAplazar">
      <FormSelect
        v-model="aplazarForm.tipo_aplazamiento_id"
        label="Tipo de aplazamiento *"
        help="Motivo por el que se aplaza el ciclo."
        :options="tiposOptions"
        :required="true"
      />
      <div>
        <FormInput
          v-model="aplazarForm.fecha_reinicio_probable"
          label="Fecha probable de reinicio *"
          type="date"
          :min="minFechaReinicio"
          help="Debe ser posterior a la fecha de inicio actual del ciclo."
          :required="true"
        />
        <p v-if="diasAplazamiento !== null" class="mt-1.5 text-sm font-medium text-blue-700">
          El ciclo se aplazaría {{ diasAplazamiento }} día{{ diasAplazamiento !== 1 ? 's' : '' }}.
        </p>
      </div>
      <FormInput
        v-model="aplazarForm.fecha_aplazamiento"
        label="Fecha de la decisión"
        type="date"
        :max="todayStr"
        help="Cuándo se tomó la decisión. Por defecto hoy."
      />
      <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          v-model="aplazarForm.mover_cartera"
          type="checkbox"
          class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Mover fechas de vencimiento de cartera activa
      </label>
      <FormTextarea
        v-model="aplazarForm.observaciones"
        label="Observaciones"
        placeholder="Razón del aplazamiento o comentarios adicionales..."
        :rows="3"
      />
      <FormErrors :error="formError" :field-errors="fieldErrors" />
    </form>

    <!-- ── Vista: Confirmar ─────────────────────────────────────────────────── -->
    <div v-else-if="view === 'confirmar'" class="flex flex-col gap-4 pb-2">
      <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p class="font-medium">¿Confirmar que el ciclo reinició correctamente?</p>
        <p class="mt-1">
          Fecha probable de reinicio:
          <strong>{{ formatDate(aplazamientoActivo?.fecha_reinicio_probable) }}</strong>.
          Esta acción no mueve fechas.
        </p>
      </div>
      <FormTextarea
        v-model="confirmarForm.observaciones"
        label="Observaciones (opcional)"
        placeholder="Ej: El ciclo reinició correctamente en la fecha prevista."
        :rows="2"
      />
      <FormErrors :error="formError" :field-errors="fieldErrors" />
    </div>

    <!-- ── Vista: Ampliar ───────────────────────────────────────────────────── -->
    <form v-else-if="view === 'ampliar'" class="flex flex-col gap-4 pb-2" @submit.prevent="submitAmpliar">
      <div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        Fecha probable actual:
        <strong>{{ formatDate(aplazamientoActivo?.fecha_reinicio_probable) }}</strong>.
        La nueva fecha debe ser posterior.
      </div>
      <div>
        <FormInput
          v-model="ampliarForm.fecha_reinicio_probable"
          label="Nueva fecha probable de reinicio *"
          type="date"
          :min="minFechaAmpliar"
          help="Debe ser posterior a la fecha probable actual."
          :required="true"
        />
        <p v-if="diasAmpliar !== null" class="mt-1.5 text-sm font-medium text-blue-700">
          Se agregarían {{ diasAmpliar }} día{{ diasAmpliar !== 1 ? 's' : '' }} adicionales.
        </p>
      </div>
      <FormSelect
        v-model="ampliarForm.tipo_aplazamiento_id"
        label="Tipo de aplazamiento"
        help="Opcional. Cambiar si la causa evolucionó."
        :options="tiposOptions"
      />
      <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          v-model="ampliarForm.mover_cartera"
          type="checkbox"
          class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        Mover fechas de vencimiento de cartera activa
      </label>
      <FormTextarea
        v-model="ampliarForm.observaciones"
        label="Observaciones"
        placeholder="Motivo de la ampliación..."
        :rows="2"
      />
      <FormErrors :error="formError" :field-errors="fieldErrors" />
    </form>

    <!-- ── Vista: Interrumpir ───────────────────────────────────────────────── -->
    <form v-else-if="view === 'interrumpir'" class="flex flex-col gap-4 pb-2" @submit.prevent="submitInterrumpir">
      <div class="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-xs text-orange-800">
        La fecha de reinicio real debe estar entre
        <strong>{{ formatDate(aplazamientoActivo?.fecha_inicio_original) }}</strong>
        y <strong>{{ formatDate(aplazamientoActivo?.fecha_reinicio_probable) }}</strong> (exclusivos).
        Para reiniciar exactamente en la fecha probable, usa <em>Confirmar</em>.
      </div>
      <div>
        <FormInput
          v-model="interrumpirForm.fecha_reinicio_real"
          label="Fecha real de reinicio *"
          type="date"
          :min="minFechaInterrumpir"
          :max="maxFechaInterrumpir"
          help="Día en que el ciclo retomó efectivamente."
          :required="true"
        />
        <p v-if="diasInterrumpir !== null" class="mt-1.5 text-sm font-medium text-orange-700">
          Días efectivos de aplazamiento: {{ diasInterrumpir }}.
        </p>
      </div>
      <FormTextarea
        v-model="interrumpirForm.observaciones"
        label="Observaciones"
        placeholder="Ej: Se encontró un profesor sustituto antes de lo previsto."
        :rows="2"
      />
      <FormErrors :error="formError" :field-errors="fieldErrors" />
    </form>

    <!-- ── Vista: Revertir ──────────────────────────────────────────────────── -->
    <div v-else-if="view === 'revertir'" class="flex flex-col gap-4 pb-2">
      <div class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p class="font-medium">Esta acción restaurará todas las fechas a su estado original.</p>
        <p class="mt-1">
          Se revertirán las fechas del ciclo, sus grupos y las clases programadas
          al estado anterior al aplazamiento del
          <strong>{{ formatDate(aplazamientoActivo?.fecha_aplazamiento) }}</strong>.
        </p>
      </div>
      <FormTextarea
        v-model="revertirForm.observaciones"
        label="Observaciones (opcional)"
        placeholder="Motivo de la reversión..."
        :rows="2"
      />
      <FormErrors :error="formError" :field-errors="fieldErrors" />
    </div>

    <!-- ── Footer ───────────────────────────────────────────────────────────── -->
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="handleFooterCancel"
      >
        {{ view === 'main' || view === 'loading' ? 'Cerrar' : '← Volver' }}
      </button>
      <button
        v-if="isFormView"
        type="button"
        :disabled="submitLoading"
        :class="[
          'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60',
          view === 'revertir'
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-[#213360] hover:bg-[#1a294d] focus:ring-blue-500'
        ]"
        @click="handleSubmit"
      >
        {{ submitLoading ? 'Procesando...' : submitLabel }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import ModalBase      from '@/components/ModalBase.vue'
import NavIcon        from '@/components/icons/NavIcon.vue'
import FormInput      from '@/components/forms/FormInput.vue'
import FormTextarea   from '@/components/forms/FormTextarea.vue'
import FormSelect     from '@/components/forms/FormSelect.vue'
import cicloService           from '@/services/cicloService.js'
import aplazamientoService    from '@/services/aplazamientoService.js'
import { authService }        from '@/services/authService.js'
import { useNotification }    from '@/composables/useNotification'

// ── Bloque de error reutilizable (componente funcional inline) ────────────────
// Se define como componente local para evitar duplicar el markup de error en
// cada vista del formulario, sin necesidad de extraerlo a un archivo separado.
const FormErrors = {
  props: {
    error: { type: String, default: '' },
    fieldErrors: { type: Object, default: () => ({}) }
  },
  template: `
    <div v-if="error || Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700 space-y-1">
      <p v-if="error">{{ error }}</p>
      <ul v-if="Object.keys(fieldErrors).length" class="list-inside list-disc space-y-0.5">
        <li v-for="(msgs, field) in fieldErrors" :key="field">
          <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
        </li>
      </ul>
    </div>
  `
}

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  ciclo: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const { success: notifySuccess } = useNotification()

// ── Estado global del modal ───────────────────────────────────────────────────
const view             = ref('loading')
const loadError        = ref('')
const cicloDetalle     = ref(null)
const aplazamientoActivo = ref(null)
const historial        = ref([])
const tiposAplazamiento = ref([])
const canCreate        = ref(false)
const canRevert        = ref(false)

// ── Estado de formularios ─────────────────────────────────────────────────────
const formError   = ref('')
const fieldErrors = ref({})
const submitLoading = ref(false)

const aplazarForm = reactive({
  tipo_aplazamiento_id: null,
  fecha_reinicio_probable: '',
  fecha_aplazamiento: '',
  mover_cartera: false,
  observaciones: ''
})

const confirmarForm   = reactive({ observaciones: '' })

const ampliarForm = reactive({
  fecha_reinicio_probable: '',
  tipo_aplazamiento_id: null,
  mover_cartera: false,
  observaciones: ''
})

const interrumpirForm = reactive({ fecha_reinicio_real: '', observaciones: '' })
const revertirForm    = reactive({ observaciones: '' })

// ── Computados ────────────────────────────────────────────────────────────────
const todayStr = new Date().toISOString().slice(0, 10)

const FORM_VIEWS = ['aplazar', 'confirmar', 'ampliar', 'interrumpir', 'revertir']
const isFormView = computed(() => FORM_VIEWS.includes(view.value))

const MODAL_TITLES = {
  loading:     () => `Aplazamientos — ${props.ciclo?.nombre ?? ''}`,
  main:        () => `Aplazamientos — ${props.ciclo?.nombre ?? ''}`,
  aplazar:     () => 'Aplazar ciclo',
  confirmar:   () => 'Confirmar aplazamiento',
  ampliar:     () => 'Ampliar aplazamiento',
  interrumpir: () => 'Interrumpir aplazamiento',
  revertir:    () => 'Revertir aplazamiento'
}

const SUBMIT_LABELS = {
  aplazar:     'Aplazar ciclo',
  confirmar:   'Confirmar reinicio',
  ampliar:     'Ampliar aplazamiento',
  interrumpir: 'Interrumpir aplazamiento',
  revertir:    'Revertir aplazamiento'
}

const modalTitle = computed(() => (MODAL_TITLES[view.value] ?? MODAL_TITLES.main)())

const modalDescription = computed(() => {
  if (view.value === 'main' && aplazamientoActivo.value) {
    return `Aplazado ${aplazamientoActivo.value.dias_aplazamiento} días · Reinicio probable: ${formatDate(aplazamientoActivo.value.fecha_reinicio_probable)}`
  }
  return ''
})

const submitLabel = computed(() => SUBMIT_LABELS[view.value] ?? 'Confirmar')

const tiposOptions = computed(() =>
  tiposAplazamiento.value.map((t) => ({ value: t.id, label: t.nombre }))
)

/** Fecha mínima de reinicio en aplazar: día siguiente al inicio actual del ciclo. */
const minFechaReinicio = computed(() => {
  const fecha = cicloDetalle.value?.fecha_inicio ?? props.ciclo?.fecha_inicio
  if (!fecha) return ''
  const d = new Date(fecha)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})

/** Fecha mínima en ampliar: día siguiente al reinicio probable actual. */
const minFechaAmpliar = computed(() => {
  if (!aplazamientoActivo.value?.fecha_reinicio_probable) return ''
  const d = new Date(aplazamientoActivo.value.fecha_reinicio_probable)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})

/** Fecha mínima en interrumpir: día siguiente al inicio original. */
const minFechaInterrumpir = computed(() => {
  if (!aplazamientoActivo.value?.fecha_inicio_original) return ''
  const d = new Date(aplazamientoActivo.value.fecha_inicio_original)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})

/** Fecha máxima en interrumpir: día anterior al reinicio probable. */
const maxFechaInterrumpir = computed(() => {
  if (!aplazamientoActivo.value?.fecha_reinicio_probable) return ''
  const d = new Date(aplazamientoActivo.value.fecha_reinicio_probable)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
})

/** Días calculados al aplazar (para preview en tiempo real). */
const diasAplazamiento = computed(() => {
  const inicio = cicloDetalle.value?.fecha_inicio ?? props.ciclo?.fecha_inicio
  if (!inicio || !aplazarForm.fecha_reinicio_probable) return null
  const diff = Math.round(
    (new Date(aplazarForm.fecha_reinicio_probable) - new Date(inicio)) / 86_400_000
  )
  return diff > 0 ? diff : null
})

/** Días adicionales al ampliar. */
const diasAmpliar = computed(() => {
  if (!aplazamientoActivo.value?.fecha_reinicio_probable || !ampliarForm.fecha_reinicio_probable) return null
  const diff = Math.round(
    (new Date(ampliarForm.fecha_reinicio_probable) - new Date(aplazamientoActivo.value.fecha_reinicio_probable)) / 86_400_000
  )
  return diff > 0 ? diff : null
})

/** Días efectivos al interrumpir. */
const diasInterrumpir = computed(() => {
  if (!aplazamientoActivo.value?.fecha_inicio_original || !interrumpirForm.fecha_reinicio_real) return null
  const diff = Math.round(
    (new Date(interrumpirForm.fecha_reinicio_real) - new Date(aplazamientoActivo.value.fecha_inicio_original)) / 86_400_000
  )
  return diff > 0 ? diff : null
})

// ── Ciclo de vida ─────────────────────────────────────────────────────────────
watch(() => props.modelValue, async (val) => {
  if (val && props.ciclo) {
    await loadData()
  } else if (!val) {
    resetState()
  }
})

// ── Carga de datos ────────────────────────────────────────────────────────────
async function loadData() {
  view.value = 'loading'
  loadError.value = ''
  try {
    const [cicloRes, tiposRes, userPerms] = await Promise.all([
      cicloService.getById(props.ciclo.id, { with: 'aplazamientoActivo,aplazamientos' }),
      aplazamientoService.getTipos({ status: 1, per_page: 50 }),
      authService.getUserPermissions()
    ])
    cicloDetalle.value      = cicloRes.data
    aplazamientoActivo.value = cicloRes.data?.aplazamiento_activo ?? null
    historial.value         = cicloRes.data?.aplazamientos ?? []
    tiposAplazamiento.value = tiposRes.data ?? []
    canCreate.value         = userPerms.includes('aca_aplazamientoCrear')
    canRevert.value         = userPerms.includes('aca_aplazamientoInactivar')
    view.value = 'main'
  } catch {
    loadError.value = 'Error al cargar la información del ciclo.'
    view.value = 'main'
  }
}

function resetState() {
  view.value = 'loading'
  loadError.value = ''
  cicloDetalle.value = null
  aplazamientoActivo.value = null
  historial.value = []
  formError.value = ''
  fieldErrors.value = {}
}

// ── Navegación entre vistas ───────────────────────────────────────────────────
function openView(newView) {
  formError.value = ''
  fieldErrors.value = {}
  view.value = newView
}

function goToMain() {
  openView('main')
}

function openAplazar() {
  aplazarForm.tipo_aplazamiento_id = null
  aplazarForm.fecha_reinicio_probable = ''
  aplazarForm.fecha_aplazamiento = todayStr
  aplazarForm.mover_cartera = false
  aplazarForm.observaciones = ''
  openView('aplazar')
}

function openConfirmar() {
  confirmarForm.observaciones = ''
  openView('confirmar')
}

function openAmpliar() {
  ampliarForm.fecha_reinicio_probable = ''
  ampliarForm.tipo_aplazamiento_id = aplazamientoActivo.value?.tipo_aplazamiento_id ?? null
  ampliarForm.mover_cartera = aplazamientoActivo.value?.mover_cartera ?? false
  ampliarForm.observaciones = ''
  openView('ampliar')
}

function openInterrumpir() {
  interrumpirForm.fecha_reinicio_real = ''
  interrumpirForm.observaciones = ''
  openView('interrumpir')
}

function openRevertir() {
  revertirForm.observaciones = ''
  openView('revertir')
}

// ── Manejo del footer ─────────────────────────────────────────────────────────
function handleFooterCancel() {
  if (view.value === 'main' || view.value === 'loading') {
    emit('update:modelValue', false)
  } else {
    goToMain()
  }
}

function onModalClose(val) {
  emit('update:modelValue', val)
  if (!val) resetState()
}

// ── Envío de formularios ──────────────────────────────────────────────────────
async function handleSubmit() {
  if (view.value === 'aplazar')     await submitAplazar()
  else if (view.value === 'confirmar')   await submitConfirmar()
  else if (view.value === 'ampliar')     await submitAmpliar()
  else if (view.value === 'interrumpir') await submitInterrumpir()
  else if (view.value === 'revertir')    await submitRevertir()
}

function handleFormError(e) {
  if (e?.response?.status === 422) {
    fieldErrors.value = e.response.data?.errors ?? {}
    formError.value = e.response.data?.message ?? 'Verifica los datos ingresados.'
  } else {
    formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
  }
}

async function submitAplazar() {
  submitLoading.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    const payload = {
      tipo_aplazamiento_id: Number(aplazarForm.tipo_aplazamiento_id),
      fecha_reinicio_probable: aplazarForm.fecha_reinicio_probable,
      mover_cartera: aplazarForm.mover_cartera
    }
    if (aplazarForm.fecha_aplazamiento) payload.fecha_aplazamiento = aplazarForm.fecha_aplazamiento
    if (aplazarForm.observaciones?.trim()) payload.observaciones = aplazarForm.observaciones.trim()

    const res = await aplazamientoService.aplazar(props.ciclo.id, payload)
    notifySuccess(res.message ?? `Ciclo "${props.ciclo.nombre}" aplazado correctamente.`)
    emit('updated')
    await loadData()
  } catch (e) {
    handleFormError(e)
  } finally {
    submitLoading.value = false
  }
}

async function submitConfirmar() {
  submitLoading.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    const payload = {}
    if (confirmarForm.observaciones?.trim()) payload.observaciones = confirmarForm.observaciones.trim()

    const res = await aplazamientoService.confirmar(aplazamientoActivo.value.id, payload)
    notifySuccess(res.message ?? 'Aplazamiento confirmado correctamente.')
    emit('updated')
    await loadData()
  } catch (e) {
    handleFormError(e)
  } finally {
    submitLoading.value = false
  }
}

async function submitAmpliar() {
  submitLoading.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    const payload = { fecha_reinicio_probable: ampliarForm.fecha_reinicio_probable }
    if (ampliarForm.tipo_aplazamiento_id) payload.tipo_aplazamiento_id = Number(ampliarForm.tipo_aplazamiento_id)
    payload.mover_cartera = ampliarForm.mover_cartera
    if (ampliarForm.observaciones?.trim()) payload.observaciones = ampliarForm.observaciones.trim()

    const res = await aplazamientoService.ampliar(aplazamientoActivo.value.id, payload)
    notifySuccess(res.message ?? 'Aplazamiento ampliado correctamente.')
    emit('updated')
    await loadData()
  } catch (e) {
    handleFormError(e)
  } finally {
    submitLoading.value = false
  }
}

async function submitInterrumpir() {
  submitLoading.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    const payload = { fecha_reinicio_real: interrumpirForm.fecha_reinicio_real }
    if (interrumpirForm.observaciones?.trim()) payload.observaciones = interrumpirForm.observaciones.trim()

    const res = await aplazamientoService.interrumpir(aplazamientoActivo.value.id, payload)
    notifySuccess(res.message ?? 'Aplazamiento interrumpido correctamente.')
    emit('updated')
    await loadData()
  } catch (e) {
    handleFormError(e)
  } finally {
    submitLoading.value = false
  }
}

async function submitRevertir() {
  submitLoading.value = true
  formError.value = ''
  fieldErrors.value = {}
  try {
    const payload = {}
    if (revertirForm.observaciones?.trim()) payload.observaciones = revertirForm.observaciones.trim()

    const res = await aplazamientoService.revertir(aplazamientoActivo.value.id, payload)
    notifySuccess(res.message ?? 'Aplazamiento revertido. Las fechas han sido restauradas.')
    emit('updated')
    await loadData()
  } catch (e) {
    handleFormError(e)
  } finally {
    submitLoading.value = false
  }
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function statusDotClass(estado) {
  const map = { 0: 'bg-amber-400', 1: 'bg-emerald-500', 2: 'bg-blue-500', 3: 'bg-slate-400', 4: 'bg-orange-500' }
  return map[estado] ?? 'bg-slate-400'
}

function statusBadgeClass(estado) {
  const map = {
    0: 'bg-amber-100 text-amber-800',
    1: 'bg-emerald-100 text-emerald-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-slate-100 text-slate-700',
    4: 'bg-orange-100 text-orange-800'
  }
  return map[estado] ?? 'bg-slate-100 text-slate-700'
}
</script>
