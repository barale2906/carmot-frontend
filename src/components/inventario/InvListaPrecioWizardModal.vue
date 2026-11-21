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
      >
        <div
          class="relative my-auto w-full max-w-3xl rounded-[10px] border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Cabecera -->
          <div class="flex items-center justify-between gap-4 border-b border-black/5 px-6 py-5">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ esEdicion ? 'Editar lista de precios' : 'Nueva lista de precios' }}</h2>
              <p class="mt-0.5 text-sm text-slate-500">Paso {{ step }} de {{ totalPasos }} — {{ stepLabels[step - 1] }}</p>
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

          <!-- ═══ PASO 1: Datos de la lista ═══════════════════════════════════════ -->
          <div v-if="step === 1" class="flex flex-col gap-4 px-6 py-6">
            <p class="text-sm text-slate-600">
              Define el nombre, la vigencia y las poblaciones donde aplica la lista. Estado inicial: <strong class="text-slate-800">En Proceso</strong>.
            </p>
            <FormInput v-model="form.nombre" label="Nombre" placeholder="Ej: Lista Uniformes 2026-I" required :error="errors.nombre?.[0]" />
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput v-model="form.fecha_inicio" label="Inicio de vigencia" type="date" :error="errors.fecha_inicio?.[0]" />
              <FormInput v-model="form.fecha_fin" label="Fin de vigencia" type="date" :error="errors.fecha_fin?.[0]" />
            </div>
            <FormTextarea v-model="form.descripcion" label="Descripción" placeholder="Descripción opcional..." :rows="2" :error="errors.descripcion?.[0]" />
            <FormCheckboxGroup
              v-model="form.poblaciones"
              label="Poblaciones"
              required
              search-placeholder="Buscar población..."
              :options="poblacionOptions"
              :error="errors.poblaciones?.[0]"
            />
            <div v-if="saveError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ saveError }}</div>
          </div>

          <!-- ═══ PASO 2: Precios por producto ════════════════════════════════════ -->
          <div v-else class="flex flex-col gap-4 px-6 py-6">
            <p class="text-sm text-slate-600">
              Agrega los productos de <strong class="text-slate-800">{{ form.nombre }}</strong> y fija su precio.
              Un producto <em>grupo</em> asigna el mismo precio a todas sus variantes activas.
            </p>

            <InvProductoBuscador
              label="Agregar producto"
              placeholder="Buscar producto (simple, kit o grupo)..."
              clear-on-select
              @select="agregarProducto"
            />

            <p v-if="cargandoPrecios" class="py-6 text-center text-sm text-slate-500">Cargando precios...</p>
            <p v-else-if="!filas.length" class="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
              Aún no hay productos en la lista. Búscalos arriba para agregarlos.
            </p>

            <ul v-else class="divide-y divide-slate-100 rounded-lg border border-black/10" aria-label="Productos de la lista">
              <li v-for="fila in filas" :key="fila.producto_id" class="flex flex-col gap-2 px-4 py-3">
                <div class="flex flex-wrap items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-slate-900">{{ fila.nombre }}</p>
                    <p class="text-xs text-slate-400">
                      {{ [fila.codigo, tipoLabel(fila.tipo)].filter(Boolean).join(' · ') }}
                    </p>
                  </div>
                  <input
                    v-model="fila.precio"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    :aria-label="`Precio de ${fila.nombre}`"
                    class="w-36 rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-right text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{ 'ring-2 ring-red-400': filasInvalidas.has(fila.producto_id) }"
                  />
                  <button
                    v-if="fila.tipo === 'kit' && listaId"
                    type="button"
                    class="rounded px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    @click="alternarDesglose(fila.producto_id)"
                  >{{ desgloseAbierto.has(fila.producto_id) ? 'Ocultar desglose' : 'Ver desglose' }}</button>
                  <button
                    type="button"
                    title="Quitar de la lista"
                    class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="quitarFila(fila.producto_id)"
                  ><NavIcon name="trash" class="size-4" /></button>
                </div>
                <InvKitDesglose
                  v-if="desgloseAbierto.has(fila.producto_id)"
                  :key="`${fila.producto_id}-${versionDesglose}`"
                  :lista-id="listaId"
                  :kit-id="fila.producto_id"
                  :precio="fila.precio"
                  @usar-precio="fila.precio = $event"
                />
              </li>
            </ul>

            <p v-if="filas.length" class="text-xs text-slate-500">{{ filas.length }} producto{{ filas.length !== 1 ? 's' : '' }} en la lista.</p>
            <div v-if="saveError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ saveError }}</div>
          </div>

          <!-- Footer -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
            <button
              v-if="step > 1"
              type="button"
              :disabled="saving"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="step--"
            ><NavIcon name="arrow-left" class="size-4" /> Atrás</button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="close"
            >Cancelar</button>

            <div class="flex items-center gap-2">
              <button
                v-if="step === 2"
                type="button"
                :disabled="saving || !filas.length"
                class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="guardarPrecios(false)"
              >Guardar avance</button>
              <button
                type="button"
                :disabled="saving"
                class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="step === 1 ? continuarDesdePaso1() : guardarPrecios(true)"
              >{{ textoBotonPrincipal }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * Wizard para crear o editar una lista de precios de inventario.
 *   Paso 1: datos de la lista (nombre, vigencia, descripción, poblaciones). Al avanzar se guarda
 *           la lista, de modo que el paso 2 (y el desglose de kits) ya trabajan sobre una lista real.
 *   Paso 2: productos y precios. "Guardar avance" y "Guardar lista" sincronizan todos los precios
 *           de la lista (los productos quitados de la tabla se eliminan de ella).
 * Sin permiso de edición de precios, el wizard se reduce al paso 1.
 *
 * @prop {boolean} visible
 * @prop {Object|null} lista  Lista a editar (En Proceso); null para crear
 * @prop {Array} poblacionOptions  [{ value, label, description? }]
 * @prop {boolean} puedeEditarPrecios
 * @emits close
 * @emits saved  Se guardó (o cambió) la lista: el padre debe refrescar el listado
 */
import { ref, reactive, computed, watch } from 'vue'
import invListaPrecioService from '@/services/invListaPrecioService.js'
import invPrecioService      from '@/services/invPrecioService.js'
import { useNotification }   from '@/composables/useNotification'
import NavIcon               from '@/components/icons/NavIcon.vue'
import FormInput             from '@/components/forms/FormInput.vue'
import FormTextarea          from '@/components/forms/FormTextarea.vue'
import FormCheckboxGroup     from '@/components/forms/FormCheckboxGroup.vue'
import InvProductoBuscador   from '@/components/inventario/InvProductoBuscador.vue'
import InvKitDesglose        from '@/components/inventario/InvKitDesglose.vue'

const props = defineProps({
  visible:            { type: Boolean, default: false },
  lista:              { type: Object,  default: null },
  poblacionOptions:   { type: Array,   default: () => [] },
  puedeEditarPrecios: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'saved'])
const { success: notifySuccess } = useNotification()

const FORM_VACIO = { nombre: '', fecha_inicio: '', fecha_fin: '', descripcion: '', poblaciones: [] }

const step             = ref(1)
const form             = reactive({ ...FORM_VACIO })
const listaId          = ref(null)
const hayCambios       = ref(false)
const filas            = ref([])
const cargandoPrecios  = ref(false)
const saving           = ref(false)
const saveError        = ref('')
const errors           = ref({})
const filasInvalidas   = ref(new Set())
const desgloseAbierto  = ref(new Set())
const versionDesglose  = ref(0)

const esEdicion   = computed(() => !!props.lista)
const totalPasos  = computed(() => (props.puedeEditarPrecios ? 2 : 1))
const stepLabels  = computed(() => (props.puedeEditarPrecios ? ['Lista', 'Precios por producto'] : ['Lista']))
const textoBotonPrincipal = computed(() => {
  if (saving.value) return 'Guardando...'
  if (step.value === 1) return props.puedeEditarPrecios ? 'Siguiente' : (esEdicion.value ? 'Guardar cambios' : 'Crear lista')
  return 'Guardar lista'
})

const tipoLabel = (tipo) => ({ simple: 'Simple', kit: 'Kit', grupo: 'Grupo' }[tipo] ?? tipo ?? '')

const aFila = (precio) => ({
  producto_id:   precio.producto.id,
  nombre:        precio.producto.nombre,
  codigo:        precio.producto.codigo,
  tipo:          precio.producto.tipo,
  precio:        precio.precio ?? '',
  observaciones: precio.observaciones ?? null,
})

function reiniciar() {
  step.value = 1
  listaId.value = props.lista?.id ?? null
  hayCambios.value = false
  filas.value = []
  saveError.value = ''
  errors.value = {}
  filasInvalidas.value = new Set()
  desgloseAbierto.value = new Set()
  Object.assign(form, {
    nombre:       props.lista?.nombre       ?? '',
    fecha_inicio: props.lista?.fecha_inicio ?? '',
    fecha_fin:    props.lista?.fecha_fin    ?? '',
    descripcion:  props.lista?.descripcion  ?? '',
    poblaciones:  props.lista?.poblaciones?.map((p) => p.id) ?? [],
  })
  if (props.lista && props.puedeEditarPrecios) cargarPrecios()
}

async function cargarPrecios() {
  cargandoPrecios.value = true
  try {
    const res = await invListaPrecioService.getById(listaId.value)
    filas.value = (res.data?.precios ?? []).map(aFila)
  } catch {
    saveError.value = 'No se pudieron cargar los precios de la lista.'
  } finally {
    cargandoPrecios.value = false
  }
}

watch(() => props.visible, (visible) => { if (visible) reiniciar() })

function mostrarErrores(e, porDefecto) {
  if (e?.response?.status === 422) {
    errors.value    = e.response.data?.errors ?? {}
    saveError.value = e.response.data?.message ?? 'Verifica los datos.'
  } else {
    saveError.value = e?.response?.data?.message ?? porDefecto
  }
}

// ─── Paso 1 ───────────────────────────────────────────────────────────────────
async function continuarDesdePaso1() {
  saveError.value = ''
  errors.value = {}
  const faltantes = {}
  if (!form.nombre.trim()) faltantes.nombre = ['El nombre es obligatorio.']
  if (!form.poblaciones.length) faltantes.poblaciones = ['Selecciona al menos una población.']
  if (Object.keys(faltantes).length) {
    errors.value = faltantes
    return
  }
  saving.value = true
  const payload = {
    nombre:       form.nombre.trim(),
    fecha_inicio: form.fecha_inicio || null,
    fecha_fin:    form.fecha_fin    || null,
    descripcion:  form.descripcion.trim() || null,
    poblaciones:  form.poblaciones,
  }
  try {
    if (listaId.value) {
      await invListaPrecioService.update(listaId.value, payload)
    } else {
      const res = await invListaPrecioService.create(payload)
      listaId.value = res.data.id
    }
    hayCambios.value = true
    if (props.puedeEditarPrecios) {
      step.value = 2
    } else {
      notifySuccess(esEdicion.value ? 'Lista actualizada.' : 'Lista creada.')
      emit('saved')
      emit('close')
    }
  } catch (e) {
    mostrarErrores(e, 'No se pudo guardar la lista.')
  } finally {
    saving.value = false
  }
}

// ─── Paso 2 ───────────────────────────────────────────────────────────────────
function agregarProducto(producto) {
  if (filas.value.some((f) => f.producto_id === producto.id)) {
    saveError.value = `"${producto.nombre}" ya está en la lista.`
    return
  }
  saveError.value = ''
  filas.value.push({
    producto_id: producto.id, nombre: producto.nombre, codigo: producto.codigo,
    tipo: producto.tipo, precio: '', observaciones: null,
  })
}

function quitarFila(productoId) {
  filas.value = filas.value.filter((f) => f.producto_id !== productoId)
  filasInvalidas.value.delete(productoId)
}

function alternarDesglose(productoId) {
  const siguiente = new Set(desgloseAbierto.value)
  siguiente.has(productoId) ? siguiente.delete(productoId) : siguiente.add(productoId)
  desgloseAbierto.value = siguiente
}

function validarFilas() {
  const invalidas = filas.value.filter((f) => f.precio === '' || f.precio === null || Number(f.precio) < 0 || Number.isNaN(Number(f.precio)))
  filasInvalidas.value = new Set(invalidas.map((f) => f.producto_id))
  return invalidas.length === 0
}

async function guardarPrecios(cerrar) {
  saveError.value = ''
  if (!filas.value.length) {
    if (!cerrar) return
    if ((props.lista?.precios_count ?? 0) > 0) {
      saveError.value = 'La lista debe conservar al menos un producto con precio.'
      return
    }
    notifySuccess(esEdicion.value ? 'Lista actualizada.' : 'Lista creada sin productos.')
    finalizar()
    return
  }
  if (!validarFilas()) {
    saveError.value = 'Indica un precio válido (mayor o igual a 0) en los productos marcados.'
    return
  }
  saving.value = true
  try {
    const res = await invPrecioService.sincronizar(listaId.value, filas.value.map((f) => ({
      producto_id: f.producto_id, precio: Number(f.precio), observaciones: f.observaciones,
    })))
    // Los grupos vuelven expandidos en sus variantes
    filas.value = (res.data ?? []).map(aFila)
    hayCambios.value = true
    versionDesglose.value++
    if (cerrar) {
      notifySuccess('Lista guardada con sus precios.')
      finalizar()
    } else {
      notifySuccess('Avance guardado.')
    }
  } catch (e) {
    mostrarErrores(e, 'No se pudieron guardar los precios.')
  } finally {
    saving.value = false
  }
}

function finalizar() {
  emit('saved')
  emit('close')
}

/** Si la lista ya se persistió, el padre debe refrescar aunque se cierre sin terminar. */
function close() {
  if (hayCambios.value) emit('saved')
  emit('close')
}
</script>
