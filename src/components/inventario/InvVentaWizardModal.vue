<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
        @click.self="close"
      >
        <div
          class="relative my-auto w-full max-w-2xl rounded-xl border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Cabecera -->
          <div class="flex items-center justify-between gap-4 border-b border-black/5 px-6 py-5">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Nueva venta de inventario</h2>
              <p class="mt-0.5 text-sm text-slate-500">Paso {{ step }} de 3 — {{ stepLabel }}</p>
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar"
              @click="close"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </div>

          <!-- Indicador de pasos -->
          <div class="flex gap-0 border-b border-black/5">
            <div
              v-for="s in 3"
              :key="s"
              class="flex-1 py-2 text-center text-xs font-medium transition-colors"
              :class="s === step ? 'bg-[#213360] text-white' : s < step ? 'bg-blue-50 text-blue-700' : 'text-slate-400'"
            >{{ s < step ? '✓ ' : '' }}{{ ['Estudiante', 'Productos', 'Pago'][s - 1] }}</div>
          </div>

          <!-- ─── Paso 1: Buscar estudiante ─────────────────────────────────────── -->
          <div v-if="step === 1" class="flex flex-col gap-5 px-6 py-6">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Buscar estudiante</label>
              <input
                v-model="estudianteQuery"
                type="text"
                placeholder="Nombre, documento o código..."
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                @input="onEstudianteInput"
              />
            </div>
            <div v-if="buscandoEstudiante" class="text-sm text-slate-500">Buscando...</div>
            <ul v-if="estudiantesResultados.length" class="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              <li
                v-for="e in estudiantesResultados"
                :key="e.id"
                class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-blue-50"
                @click="selectEstudiante(e)"
              >
                <div>
                  <p class="text-sm font-medium text-slate-900">{{ e.nombre_completo ?? e.name ?? [e.primer_nombre, e.primer_apellido].filter(Boolean).join(' ') }}</p>
                  <p class="text-xs text-slate-500">{{ e.numero_documento ?? e.documento ?? '' }}</p>
                </div>
                <NavIcon name="arrow-right" class="size-4 shrink-0 text-slate-400" />
              </li>
            </ul>

            <div v-if="estudianteSeleccionado" class="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div class="flex-1">
                <p class="text-sm font-semibold text-blue-900">{{ nombreEstudiante }}</p>
                <p class="text-xs text-blue-600">{{ estudianteSeleccionado.numero_documento ?? estudianteSeleccionado.documento ?? '' }}</p>
              </div>
              <button type="button" class="text-xs text-blue-700 underline" @click="clearEstudiante">Cambiar</button>
            </div>

            <FormSelect v-model="form.almacen_id" label="Almacén" placeholder="Selecciona el almacén..." :options="almacenOptions" required />
          </div>

          <!-- ─── Paso 2: Selección de productos ────────────────────────────────── -->
          <div v-if="step === 2" class="flex flex-col gap-5 px-6 py-6">
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p class="font-medium text-slate-800">{{ nombreEstudiante }}</p>
              <p class="text-xs text-slate-500">Almacén: {{ almacenNombre }}</p>
            </div>

            <!-- Buscador de producto -->
            <InvProductoBuscador
              label="Agregar producto"
              placeholder="Buscar por nombre o código..."
              :clear-on-select="true"
              @select="addItem"
            />

            <!-- Lista de ítems -->
            <div v-if="items.length" class="rounded-lg border border-slate-200">
              <table class="w-full text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-left">
                    <th class="px-4 py-2 text-xs font-semibold text-slate-500">Producto</th>
                    <th class="px-2 py-2 text-center text-xs font-semibold text-slate-500">Cant.</th>
                    <th class="px-2 py-2 text-right text-xs font-semibold text-slate-500">Precio</th>
                    <th class="px-2 py-2 text-right text-xs font-semibold text-slate-500">Total</th>
                    <th class="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in items" :key="item.producto_id">
                    <td class="px-4 py-2 font-medium text-slate-900">{{ item.nombre }}</td>
                    <td class="px-2 py-2 text-center">
                      <input
                        v-model.number="item.cantidad"
                        type="number"
                        min="1"
                        class="w-16 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-2 py-2 text-right font-mono text-slate-700">{{ formatCurrency(item.precio_unitario) }}</td>
                    <td class="px-2 py-2 text-right font-mono font-medium text-slate-900">{{ formatCurrency(item.cantidad * item.precio_unitario) }}</td>
                    <td class="px-2 py-2 text-right">
                      <button type="button" class="rounded p-1 text-slate-400 hover:text-red-600 focus:outline-none" @click="removeItem(item.producto_id)">
                        <NavIcon name="close" class="size-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colspan="3" class="px-4 py-2 text-right text-sm font-semibold text-slate-700">Total</td>
                    <td class="px-2 py-2 text-right font-mono text-base font-bold text-[#213360]">{{ formatCurrency(totalItems) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-else class="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
              Agrega productos usando el buscador de arriba
            </div>
          </div>

          <!-- ─── Paso 3: Pago ───────────────────────────────────────────────────── -->
          <div v-if="step === 3" class="flex flex-col gap-5 px-6 py-6">
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div class="flex items-center justify-between">
                <p class="font-medium text-slate-800">{{ nombreEstudiante }}</p>
                <p class="font-bold text-[#213360]">{{ formatCurrency(totalItems) }}</p>
              </div>
              <p class="text-xs text-slate-500">{{ items.length }} producto(s) · Almacén: {{ almacenNombre }}</p>
            </div>

            <!-- Medio de pago principal -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Medio de pago</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="m in mediosPagoOptions"
                  :key="m.value"
                  type="button"
                  class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="medioPago === m.value ? 'border-[#213360] bg-[#213360] text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'"
                  @click="medioPago = m.value"
                >{{ m.label }}</button>
              </div>
            </div>

            <div v-if="medioPago === 'transferencia' || medioPago === 'consignacion'" class="grid grid-cols-2 gap-4">
              <FormSelect v-model="form.banco_id" label="Banco" placeholder="Selecciona..." :options="bancoOptions" />
              <FormInput v-model="form.referencia" label="Referencia" placeholder="Número de comprobante..." />
            </div>

            <FormInput
              v-model.number="form.monto_abono"
              label="Monto a abonar"
              type="number"
              min="0"
              :max="totalItems"
              step="100"
              placeholder="0"
              :hint="`Máx: ${formatCurrency(totalItems)} · Saldo pendiente queda en cartera`"
            />

            <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ formError }}</p>
            </div>
          </div>

          <!-- Footer de acciones -->
          <div class="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
            <button
              v-if="step > 1"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="step--"
            >
              <NavIcon name="arrow-left" class="size-4" /> Atrás
            </button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="close"
            >Cancelar</button>

            <button
              v-if="step < 3"
              type="button"
              :disabled="!canAdvance"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="nextStep"
            >
              Siguiente <NavIcon name="arrow-right" class="size-4" />
            </button>
            <button
              v-else
              type="button"
              :disabled="saving || !medioPago"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="handleSubmit"
            >
              {{ saving ? 'Procesando...' : 'Registrar venta' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import invVentaService        from '@/services/invVentaService.js'
import invAlmacenService      from '@/services/invAlmacenService.js'
import bancoService           from '@/services/bancoService.js'
import { authService }        from '@/services/authService.js'
import { useNotification }    from '@/composables/useNotification'
import NavIcon              from '@/components/icons/NavIcon.vue'
import FormInput            from '@/components/forms/FormInput.vue'
import FormSelect           from '@/components/forms/FormSelect.vue'
import InvProductoBuscador  from '@/components/inventario/InvProductoBuscador.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'venta-creada'])

const { success: notifySuccess } = useNotification()

const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

// ─── Datos de sesión ──────────────────────────────────────────────────────────
const sedeActual = ref(null)

async function loadUserContext() {
  try {
    const user = await authService.getUser()
    sedeActual.value = user?.sede_id ?? null
  } catch { /* sin sede */ }
}

// ─── Wizard state ─────────────────────────────────────────────────────────────
const step = ref(1)
const stepLabel = computed(() => ['Seleccionar estudiante', 'Seleccionar productos', 'Confirmar pago'][step.value - 1])

// ─── Paso 1: Estudiante + almacén ─────────────────────────────────────────────
const estudianteQuery       = ref('')
const estudiantesResultados = ref([])
const buscandoEstudiante    = ref(false)
const estudianteSeleccionado = ref(null)

const almacenOptions = ref([])
const form = reactive({
  almacen_id:   '',
  monto_abono:  0,
  banco_id:     '',
  referencia:   '',
})

const nombreEstudiante = computed(() => {
  const e = estudianteSeleccionado.value
  if (!e) return '—'
  return e.nombre_completo ?? e.name ?? [e.primer_nombre, e.primer_apellido].filter(Boolean).join(' ') ?? '—'
})

const almacenNombre = computed(() => {
  const opt = almacenOptions.value.find(o => o.value === form.almacen_id)
  return opt?.label ?? '—'
})

let estudianteTimer = null
function onEstudianteInput() {
  clearTimeout(estudianteTimer)
  if (estudianteQuery.value.length < 2) { estudiantesResultados.value = []; return }
  estudianteTimer = setTimeout(buscarEstudiante, 400)
}

async function buscarEstudiante() {
  buscandoEstudiante.value = true
  try {
    // Usa el servicio de auth/users o el de estudiantes que ya existe en el proyecto
    const { data } = await authService.searchUsers?.({ search: estudianteQuery.value, role: 'estudiante', per_page: 10 })
      ?? { data: [] }
    estudiantesResultados.value = data ?? []
  } catch { estudiantesResultados.value = [] }
  finally { buscandoEstudiante.value = false }
}

function selectEstudiante(e) {
  estudianteSeleccionado.value = e
  estudiantesResultados.value = []
  estudianteQuery.value = ''
}

function clearEstudiante() {
  estudianteSeleccionado.value = null
}

async function loadAlmacenes() {
  try {
    const res = await invAlmacenService.getActivos()
    almacenOptions.value = (res.data ?? res ?? []).map(a => ({ value: a.id, label: a.nombre }))
  } catch { almacenOptions.value = [] }
}

// ─── Paso 2: Productos ────────────────────────────────────────────────────────
const items = ref([])

const totalItems = computed(() => items.value.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0))

function addItem(p) {
  const existing = items.value.find(i => i.producto_id === p.id)
  if (existing) { existing.cantidad++; return }
  items.value.push({
    producto_id:    p.id,
    nombre:         p.nombre,
    precio_unitario: p.precio_venta ?? 0,
    cantidad:       1,
  })
}

function removeItem(productoId) {
  items.value = items.value.filter(i => i.producto_id !== productoId)
}

// ─── Paso 3: Pago ─────────────────────────────────────────────────────────────
const mediosPagoOptions = [
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta',      label: 'Tarjeta' },
]

const medioPago   = ref('efectivo')
const bancoOptions = ref([])
const saving      = ref(false)
const formError   = ref('')

async function loadBancos() {
  try {
    const res = await bancoService.getAll({ status: 'activo', per_page: 100 })
    bancoOptions.value = (res.data ?? res ?? []).map(b => ({ value: b.id, label: b.nombre }))
  } catch { bancoOptions.value = [] }
}

// ─── Navegación ───────────────────────────────────────────────────────────────
const canAdvance = computed(() => {
  if (step.value === 1) return !!estudianteSeleccionado.value && !!form.almacen_id
  if (step.value === 2) return items.value.length > 0
  return true
})

function nextStep() {
  if (!canAdvance.value) return
  if (step.value === 1) form.monto_abono = totalItems.value
  step.value++
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit() {
  formError.value = ''
  if (!medioPago.value) { formError.value = 'Selecciona un medio de pago.'; return }
  saving.value = true

  const medios_pago = [{
    medio: medioPago.value,
    valor: Number(form.monto_abono) || 0,
    ...(form.banco_id    ? { banco_id:   form.banco_id }   : {}),
    ...(form.referencia  ? { referencia: form.referencia } : {}),
  }]

  const payload = {
    estudiante_id: estudianteSeleccionado.value.id,
    almacen_id:    form.almacen_id,
    sede_id:       sedeActual.value ?? null,
    items: items.value.map(i => ({
      producto_id:     i.producto_id,
      cantidad:        i.cantidad,
      precio_unitario: i.precio_unitario,
    })),
    monto_abono: Number(form.monto_abono) || 0,
    medios_pago,
  }

  try {
    const res = await invVentaService.create(payload)
    notifySuccess('Venta registrada correctamente.')
    emit('venta-creada', res.data ?? res)
    close()
  } catch (e) {
    if (e?.response?.status === 422) {
      const errs = e.response.data?.errors ?? {}
      formError.value = Object.values(errs).flat().join(' ') || e.response.data?.message || 'Verifica los datos.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error al registrar la venta.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Reset al abrir ───────────────────────────────────────────────────────────
function resetWizard() {
  step.value = 1
  estudianteQuery.value = ''
  estudiantesResultados.value = []
  estudianteSeleccionado.value = null
  items.value = []
  medioPago.value = 'efectivo'
  formError.value = ''
  Object.assign(form, { almacen_id: '', monto_abono: 0, banco_id: '', referencia: '' })
}

function close() {
  emit('close')
}

watch(() => props.visible, (v) => { if (v) resetWizard() })

onMounted(() => { loadUserContext(); loadAlmacenes(); loadBancos() })
</script>
