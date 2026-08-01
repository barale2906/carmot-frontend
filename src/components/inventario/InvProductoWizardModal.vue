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
              <h2 class="text-lg font-semibold text-slate-900">Nuevo producto</h2>
              <p class="mt-0.5 text-sm text-slate-500">Paso {{ step }} de 3 — {{ stepLabel }}</p>
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar"
              @click="close"
            ><NavIcon name="close" class="size-4" /></button>
          </div>

          <!-- Indicador de pasos -->
          <div class="flex border-b border-black/5">
            <div
              v-for="(label, i) in stepLabels"
              :key="i"
              class="flex-1 py-2 text-center text-xs font-medium transition-colors"
              :class="i + 1 === step ? 'bg-[#213360] text-white' : i + 1 < step ? 'bg-blue-50 text-blue-700' : 'text-slate-400'"
            >{{ i + 1 < step ? '✓ ' : '' }}{{ label }}</div>
          </div>

          <!-- ═══ PASO 1: Tipo de producto ════════════════════════════════════════ -->
          <div v-if="step === 1" class="flex flex-col gap-4 px-6 py-6">
            <p class="text-sm text-slate-600">
              Selecciona el tipo de producto. La relación entre tipos es:
              <strong class="text-slate-800">Simples → Grupos → Kits</strong>.
            </p>

            <!-- Diagrama de jerarquía -->
            <div class="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
              <div class="text-center">
                <span class="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-blue-800 font-medium">Simple</span>
                <p class="mt-1 text-slate-500">Camisa talla M<br/>Camisa talla L</p>
              </div>
              <span class="text-slate-300 text-lg">→</span>
              <div class="text-center">
                <span class="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 font-medium">Grupo</span>
                <p class="mt-1 text-slate-500">Camisas<br/>(agrupa tallas)</p>
              </div>
              <span class="text-slate-300 text-lg">→</span>
              <div class="text-center">
                <span class="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-purple-800 font-medium">Kit</span>
                <p class="mt-1 text-slate-500">Uniforme<br/>(1 Camisas + 1 Zapatos)</p>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <!-- Tarjeta: Simple -->
              <button
                type="button"
                class="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="form.tipo === 'simple'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'"
                @click="form.tipo = 'simple'"
              >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <span class="text-xl">📦</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-semibold text-slate-900">Simple</p>
                    <span v-if="form.tipo === 'simple'" class="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">Seleccionado</span>
                  </div>
                  <p class="mt-0.5 text-sm text-slate-600">Producto independiente con stock propio.</p>
                  <p class="mt-1 text-xs text-slate-400">Ej: Camisa talla M, Bota número 39, Cuaderno A4</p>
                </div>
              </button>

              <!-- Tarjeta: Grupo -->
              <button
                type="button"
                class="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                :class="form.tipo === 'grupo'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'"
                @click="form.tipo = 'grupo'"
              >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <span class="text-xl">🗂️</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-semibold text-slate-900">Grupo</p>
                    <span v-if="form.tipo === 'grupo'" class="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">Seleccionado</span>
                  </div>
                  <p class="mt-0.5 text-sm text-slate-600">Agrupa productos simples como variantes (tallas, colores, números).</p>
                  <p class="mt-1 text-xs text-slate-400">Ej: «Camisas» agrupa Camisa talla M, L y XL. Al entregar un kit, el estudiante elige cuál variante quiere.</p>
                </div>
              </button>

              <!-- Tarjeta: Kit -->
              <button
                type="button"
                class="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                :class="form.tipo === 'kit'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'"
                @click="form.tipo = 'kit'"
              >
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <span class="text-xl">🎁</span>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <p class="font-semibold text-slate-900">Kit</p>
                    <span v-if="form.tipo === 'kit'" class="rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">Seleccionado</span>
                  </div>
                  <p class="mt-0.5 text-sm text-slate-600">Contiene cantidades de grupos. No maneja stock propio; lo resuelven los simples de cada grupo.</p>
                  <p class="mt-1 text-xs text-slate-400">Ej: «Uniforme» = 1× Camisas + 1× Zapatos. El estudiante elige talla/número al momento de la entrega.</p>
                </div>
              </button>
            </div>
          </div>

          <!-- ═══ PASO 2: Datos básicos ════════════════════════════════════════════ -->
          <div v-if="step === 2" class="flex flex-col gap-4 px-6 py-6">
            <div class="flex items-center gap-2">
              <span
                class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800':   form.tipo === 'simple',
                  'bg-amber-100 text-amber-800':  form.tipo === 'grupo',
                  'bg-purple-100 text-purple-800': form.tipo === 'kit',
                }"
              >{{ tipoLabels[form.tipo] }}</span>
              <span class="text-sm text-slate-500">Completa la información básica del producto.</span>
            </div>

            <FormInput
              v-model="form.nombre"
              label="Nombre del producto"
              :placeholder="nombrePlaceholder"
              required
              :error="formErrors.nombre?.[0]"
            />
            <FormInput
              v-model="form.codigo"
              label="Código / SKU"
              placeholder="Ej: CAM-M-001 (opcional)"
              :error="formErrors.codigo?.[0]"
            />
            <div class="grid grid-cols-2 gap-4">
              <FormSelect
                v-model="form.categoria_id"
                label="Categoría"
                placeholder="Sin categoría"
                :options="categoriaOptions"
                :error="formErrors.categoria_id?.[0]"
              />
              <FormSelect
                v-model="form.unidad_medida_id"
                label="Unidad de medida"
                placeholder="Sin unidad"
                :options="unidadOptions"
                :error="formErrors.unidad_medida_id?.[0]"
              />
            </div>
            <FormTextarea
              v-model="form.descripcion"
              label="Descripción"
              placeholder="Descripción opcional..."
              :rows="2"
              :error="formErrors.descripcion?.[0]"
            />
            <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ formError }}</p>
            </div>
          </div>

          <!-- ═══ PASO 3A: Variantes del grupo (simples) ══════════════════════════ -->
          <div v-if="step === 3 && form.tipo === 'grupo'" class="flex flex-col gap-4 px-6 py-6">
            <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <p class="font-medium text-amber-900">Grupo: {{ form.nombre }}</p>
              <p class="mt-0.5 text-xs text-amber-700">Agrega los productos simples que serán variantes de este grupo. Puedes agregarlos ahora o después desde la tabla.</p>
            </div>

            <!-- Buscador de simples -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Agregar variante (producto simple)</label>
              <div class="relative">
                <input
                  v-model="compQuery"
                  type="text"
                  placeholder="Buscar por nombre del producto simple..."
                  class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <ul v-if="compResultados.length" class="mt-1 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                <li
                  v-for="p in compResultados"
                  :key="p.value"
                  class="flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-amber-50"
                  @click="addVariante(p)"
                >
                  <span class="text-sm font-medium text-slate-900">{{ p.label }}</span>
                  <NavIcon name="plus" class="size-4 shrink-0 text-amber-600" />
                </li>
              </ul>
              <p v-else-if="compQuery.length >= 2 && !compResultados.length" class="mt-1.5 text-xs text-slate-400">
                No hay productos simples que coincidan.
              </p>
            </div>

            <!-- Lista de variantes añadidas -->
            <div v-if="composicion.length">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Variantes añadidas ({{ composicion.length }})</p>
              <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li
                  v-for="(v, i) in composicion"
                  :key="v.id"
                  class="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div class="flex items-center gap-2">
                    <span class="flex size-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{{ i + 1 }}</span>
                    <span class="text-sm font-medium text-slate-900">{{ v.label }}</span>
                  </div>
                  <button
                    type="button"
                    class="rounded p-1 text-slate-400 hover:text-red-600 focus:outline-none"
                    @click="removeComposicion(v.id)"
                  ><NavIcon name="close" class="size-3.5" /></button>
                </li>
              </ul>
            </div>
            <div v-else class="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
              Aún no hay variantes. Puedes agregarlas ahora o después desde la tabla.
            </div>

            <div v-if="saveError" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ saveError }}</p>
            </div>
          </div>

          <!-- ═══ PASO 3B: Componentes del kit (grupos) ═══════════════════════════ -->
          <div v-if="step === 3 && form.tipo === 'kit'" class="flex flex-col gap-4 px-6 py-6">
            <div class="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm">
              <p class="font-medium text-purple-900">Kit: {{ form.nombre }}</p>
              <p class="mt-0.5 text-xs text-purple-700">Agrega los grupos que componen este kit y la cantidad de cada uno. Al entregar, el estudiante elige qué variante del grupo quiere.</p>
            </div>

            <!-- Buscador de grupos -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Agregar componente (grupo)</label>
              <input
                v-model="compQuery"
                type="text"
                placeholder="Buscar por nombre del grupo..."
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <ul v-if="compResultados.length" class="mt-1 max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                <li
                  v-for="p in compResultados"
                  :key="p.value"
                  class="flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-purple-50"
                  @click="addComponente(p)"
                >
                  <span class="text-sm font-medium text-slate-900">{{ p.label }}</span>
                  <NavIcon name="plus" class="size-4 shrink-0 text-purple-600" />
                </li>
              </ul>
              <p v-else-if="compQuery.length >= 2 && !compResultados.length" class="mt-1.5 text-xs text-slate-400">
                No hay grupos que coincidan. Primero crea grupos de productos.
              </p>
            </div>

            <!-- Lista de componentes -->
            <div v-if="composicion.length">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Componentes del kit ({{ composicion.length }})</p>
              <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li
                  v-for="comp in composicion"
                  :key="comp.id"
                  class="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span class="flex-1 text-sm font-medium text-slate-900">{{ comp.label }}</span>
                  <div class="flex items-center gap-2">
                    <label class="text-xs text-slate-500">Cant.:</label>
                    <input
                      v-model.number="comp.cantidad"
                      type="number"
                      min="1"
                      class="w-16 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    type="button"
                    class="rounded p-1 text-slate-400 hover:text-red-600 focus:outline-none"
                    @click="removeComposicion(comp.id)"
                  ><NavIcon name="close" class="size-3.5" /></button>
                </li>
              </ul>
            </div>
            <div v-else class="rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400">
              Aún no hay componentes. Puedes agregarlos ahora o después desde la tabla.
            </div>

            <div v-if="saveError" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ saveError }}</p>
            </div>
          </div>

          <!-- ═══ PASO 3C: Resumen (simple) ════════════════════════════════════════ -->
          <div v-if="step === 3 && form.tipo === 'simple'" class="flex flex-col gap-4 px-6 py-6">
            <p class="text-sm text-slate-600">Revisa los datos antes de crear el producto.</p>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div class="col-span-2">
                  <dt class="text-xs text-slate-400">Tipo</dt>
                  <dd><span class="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Simple</span></dd>
                </div>
                <div class="col-span-2">
                  <dt class="text-xs text-slate-400">Nombre</dt>
                  <dd class="font-semibold text-slate-900">{{ form.nombre }}</dd>
                </div>
                <div v-if="form.codigo">
                  <dt class="text-xs text-slate-400">Código / SKU</dt>
                  <dd class="text-slate-800">{{ form.codigo }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-400">Categoría</dt>
                  <dd class="text-slate-800">{{ categoriaLabel || '—' }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-400">Unidad de medida</dt>
                  <dd class="text-slate-800">{{ unidadLabel || '—' }}</dd>
                </div>
                <div v-if="form.descripcion" class="col-span-2">
                  <dt class="text-xs text-slate-400">Descripción</dt>
                  <dd class="text-slate-800">{{ form.descripcion }}</dd>
                </div>
              </dl>
            </div>
            <div v-if="saveError" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ saveError }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
            <button
              v-if="step > 1"
              type="button"
              :disabled="saving"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            >Siguiente <NavIcon name="arrow-right" class="size-4" /></button>

            <button
              v-else
              type="button"
              :disabled="saving"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="handleSubmit"
            >{{ saving ? 'Creando...' : 'Crear producto' }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import invProductoService from '@/services/invProductoService.js'
import { useNotification } from '@/composables/useNotification'
import NavIcon    from '@/components/icons/NavIcon.vue'
import FormInput  from '@/components/forms/FormInput.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormSelect from '@/components/forms/FormSelect.vue'

const props = defineProps({
  visible:         { type: Boolean, default: false },
  categoriaOptions: { type: Array, default: () => [] },
  unidadOptions:   { type: Array, default: () => [] },
  simplesOptions:  { type: Array, default: () => [] }, // productos tipo simple activos
  gruposOptions:   { type: Array, default: () => [] }, // productos tipo grupo activos
})

const emit = defineEmits(['close', 'created'])
const { success: notifySuccess } = useNotification()

// ─── Pasos ────────────────────────────────────────────────────────────────────
const step = ref(1)
const stepLabels = computed(() => ['Tipo', 'Datos básicos', tipoStep3Label.value])
const tipoStep3Label = computed(() => ({
  simple: 'Resumen',
  grupo:  'Variantes',
  kit:    'Componentes',
}[form.tipo] ?? 'Composición'))
const stepLabel = computed(() => stepLabels.value[step.value - 1])

const tipoLabels = { simple: 'Simple', grupo: 'Grupo', kit: 'Kit' }
const nombrePlaceholder = computed(() => ({
  simple: 'Ej: Camisa talla M',
  grupo:  'Ej: Camisas (agrupa tallas)',
  kit:    'Ej: Uniforme completo',
}[form.tipo] ?? 'Nombre del producto'))

// ─── Formulario ───────────────────────────────────────────────────────────────
const form = reactive({
  nombre: '', codigo: '', tipo: 'simple',
  categoria_id: '', unidad_medida_id: '', descripcion: '',
})
const formErrors = ref({})
const formError  = ref('')
const saveError  = ref('')
const saving     = ref(false)

// ─── Composición (variantes / componentes) ────────────────────────────────────
// composicion: [{ id, label, cantidad }]
const composicion = ref([])
const compQuery   = ref('')

// Filtra la lista según tipo: paso 3 grupo → simples, kit → grupos
const compResultados = computed(() => {
  const q = compQuery.value.toLowerCase().trim()
  if (q.length < 2) return []
  const pool = form.tipo === 'grupo' ? props.simplesOptions : props.gruposOptions
  const yaAgregados = new Set(composicion.value.map(c => c.id))
  return pool.filter(p => p.label.toLowerCase().includes(q) && !yaAgregados.has(p.value))
})

function addVariante(p) {
  composicion.value.push({ id: p.value, label: p.label, cantidad: 1 })
  compQuery.value = ''
}
function addComponente(p) {
  composicion.value.push({ id: p.value, label: p.label, cantidad: 1 })
  compQuery.value = ''
}
function removeComposicion(id) {
  composicion.value = composicion.value.filter(c => c.id !== id)
}

// ─── Computed de resumen (simple) ─────────────────────────────────────────────
const categoriaLabel = computed(() => {
  // eslint-disable-next-line eqeqeq
  const opt = props.categoriaOptions.find(o => o.value == form.categoria_id)
  return opt?.label ?? ''
})
const unidadLabel = computed(() => {
  // eslint-disable-next-line eqeqeq
  const opt = props.unidadOptions.find(o => o.value == form.unidad_medida_id)
  return opt?.label ?? ''
})

// ─── Avanzar paso ─────────────────────────────────────────────────────────────
const canAdvance = computed(() => {
  if (step.value === 1) return !!form.tipo
  if (step.value === 2) return form.nombre.trim().length > 0
  return true
})

function nextStep() {
  if (!canAdvance.value) return
  formError.value = ''
  formErrors.value = {}
  step.value++
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit() {
  saveError.value = ''
  saving.value = true

  const payload = {
    nombre:           form.nombre.trim(),
    codigo:           form.codigo.trim() || null,
    tipo:             form.tipo,
    categoria_id:     form.categoria_id     ? Number(form.categoria_id)     : null,
    unidad_medida_id: form.unidad_medida_id ? Number(form.unidad_medida_id) : null,
    descripcion:      form.descripcion.trim() || null,
    status:           1,
  }

  try {
    const res = await invProductoService.create(payload)
    const productoId = res.data?.id ?? res.id

    // Agregar componentes/variantes secuencialmente
    if (composicion.value.length && productoId) {
      const errores = []
      for (let i = 0; i < composicion.value.length; i++) {
        const comp = composicion.value[i]
        try {
          if (form.tipo === 'grupo') {
            // Vincula cada simple al grupo recién creado (producto_padre_id)
            await invProductoService.addVariante(comp.id, productoId)
          } else {
            // Kit: agrega cada grupo como componente (grupo_producto_id)
            await invProductoService.addComponente(productoId, {
              grupo_producto_id: comp.id,
              cantidad:          comp.cantidad,
              orden:             i + 1,
            })
          }
        } catch {
          errores.push(comp.label)
        }
      }
      if (errores.length) {
        // El producto se creó — avisamos pero no bloqueamos
        saveError.value = `Producto creado, pero no se pudieron agregar: ${errores.join(', ')}. Agrégalos manualmente desde la tabla.`
        notifySuccess(`Producto "${form.nombre}" creado con advertencias.`)
        emit('created', res.data ?? res)
        return
      }
    }

    notifySuccess(`Producto "${form.nombre}" creado correctamente.`)
    emit('created', res.data ?? res)
    close()
  } catch (e) {
    if (e?.response?.status === 422) {
      formErrors.value = e.response.data?.errors ?? {}
      const msgs = Object.values(formErrors.value).flat()
      saveError.value = msgs[0] ?? e.response.data?.message ?? 'Verifica los datos.'
    } else {
      saveError.value = e?.response?.data?.message ?? 'Ocurrió un error al crear el producto.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Reset y ciclo de vida ────────────────────────────────────────────────────
function resetWizard() {
  step.value = 1
  Object.assign(form, { nombre: '', codigo: '', tipo: 'simple', categoria_id: '', unidad_medida_id: '', descripcion: '' })
  formErrors.value = {}
  formError.value  = ''
  saveError.value  = ''
  composicion.value = []
  compQuery.value   = ''
}

function close() {
  emit('close')
}

watch(() => props.visible, (v) => { if (v) resetWizard() })

// Limpia composición al cambiar de tipo en paso 1
watch(() => form.tipo, () => { composicion.value = []; compQuery.value = '' })
</script>
