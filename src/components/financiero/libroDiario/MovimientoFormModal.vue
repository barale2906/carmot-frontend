<template>
  <ModalBase
    :model-value="modelValue"
    size="xl"
    :title="movimiento ? 'Editar movimiento' : 'Registrar movimiento'"
    description="Egreso de la sede u otro ingreso. Los valores se calculan al salir de cada campo."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="flex flex-col gap-5 pb-2" @submit.prevent="guardar">
      <FormSection title="Movimiento">
        <FormSelect
          v-model="form.tipo_movimiento_id"
          label="Tipo de movimiento"
          required
          :options="opcionesTipo"
          :error="errores.tipo_movimiento_id?.[0]"
        />
        <FormSelect
          v-model="form.medio_pago"
          label="Medio de pago"
          required
          :disabled="!permitirOtrosMedios"
          :options="opcionesMedio"
          :hint="permitirOtrosMedios ? '' : 'Los movimientos de caja se registran en efectivo.'"
          :error="errores.medio_pago?.[0]"
        />
        <FormSelect
          v-if="requiereBanco"
          v-model="form.banco_id"
          label="Banco"
          required
          :options="opcionesBanco"
          :error="errores.banco_id?.[0]"
        />
      </FormSection>

      <FormSection title="Tercero">
        <FormSelect
          v-model="form.tercero_tipo_identificacion"
          label="Tipo de identificación"
          required
          :options="opcionesDe(filtros.tipos_identificacion)"
          :error="errores.tercero_tipo_identificacion?.[0]"
        />
        <FormInput
          v-model="form.tercero_identificacion"
          label="Número de identificación"
          required
          :error="errores.tercero_identificacion?.[0]"
        />
        <FormInput
          v-model="form.tercero_nombre"
          label="Nombre o razón social"
          required
          span="full"
          :error="errores.tercero_nombre?.[0]"
        />
      </FormSection>

      <FormSection title="Documento soporte">
        <FormSelect
          v-model="form.documento_tipo"
          label="Tipo de documento"
          required
          :options="opcionesDe(filtros.tipos_documento)"
          :error="errores.documento_tipo?.[0]"
        />
        <FormInput
          v-model="form.documento_numero"
          label="Número del documento"
          :error="errores.documento_numero?.[0]"
        />
      </FormSection>

      <FormSection title="Valores">
        <FormInput
          v-model="form.subtotal"
          type="number"
          min="0"
          label="Subtotal (antes de impuestos)"
          required
          help="Al salir del campo se calculan los impuestos y el total."
          :error="errores.subtotal?.[0]"
          @blur="desdeSubtotal"
        />
        <FormInput
          v-model="form.valor_total"
          type="number"
          min="0"
          label="Valor total pagado"
          required
          help="Si lo escribe, el subtotal se despeja a partir de los impuestos."
          :error="errores.valor_total?.[0]"
          @blur="desdeTotal"
        />

        <div class="flex flex-col gap-2 md:col-span-2">
          <div class="flex items-end gap-2">
            <div class="min-w-0 flex-1">
              <FormSelect
                v-model="impuestoAAgregar"
                label="Impuestos y retenciones"
                placeholder="Agregar impuesto o retención"
                :options="opcionesImpuesto"
              />
            </div>
            <button
              type="button"
              :disabled="!impuestoAAgregar"
              class="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="agregarImpuesto"
            >
              Agregar
            </button>
          </div>

          <table v-if="form.impuestos.length" class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th class="py-1.5 pr-2 font-semibold">Impuesto</th>
                <th class="w-24 py-1.5 pr-2 font-semibold">%</th>
                <th class="w-36 py-1.5 pr-2 font-semibold">Valor</th>
                <th class="w-8" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(imp, i) in form.impuestos" :key="imp.impuesto_id" class="border-b border-slate-100">
                <td class="py-1.5 pr-2">
                  <span class="text-slate-800">{{ imp.nombre }}</span>
                  <span
                    class="ml-2 rounded-full px-2 py-0.5 text-xs"
                    :class="imp.efecto === EFECTO_RESTA ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'"
                  >{{ imp.efecto === EFECTO_RESTA ? 'Resta' : 'Suma' }}</span>
                </td>
                <td class="py-1.5 pr-2">
                  <input
                    v-model="imp.porcentaje"
                    type="number"
                    min="0"
                    max="100"
                    step="0.001"
                    class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    :aria-label="`Porcentaje de ${imp.nombre}`"
                    @blur="recalcular"
                  >
                </td>
                <td class="py-1.5 pr-2">
                  <input
                    v-model="imp.valor"
                    type="number"
                    min="0"
                    class="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    :aria-label="`Valor de ${imp.nombre}`"
                    title="Puede ajustarlo para que coincida con la factura"
                    @blur="ajustarTotales"
                  >
                </td>
                <td class="py-1.5 text-right">
                  <button
                    type="button"
                    class="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-700"
                    :aria-label="`Quitar ${imp.nombre}`"
                    @click="quitarImpuesto(i)"
                  >
                    <NavIcon name="close" class="size-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <dl class="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            <div><dt class="text-xs text-slate-500">Impuestos</dt><dd class="font-medium">{{ formatCOP(totales.total_impuestos) }}</dd></div>
            <div><dt class="text-xs text-slate-500">Retenciones</dt><dd class="font-medium">{{ formatCOP(totales.total_retenciones) }}</dd></div>
            <div><dt class="text-xs text-slate-500">Total</dt><dd class="font-semibold text-slate-900">{{ formatCOP(totales.valor_total) }}</dd></div>
          </dl>
        </div>
      </FormSection>

      <FormTextarea v-model="form.observaciones" label="Observaciones" :rows="2" />

      <section v-if="!movimiento" class="flex flex-col gap-2" aria-label="Soportes a cargar">
        <h3 class="text-sm font-semibold text-slate-900">Soportes (facturas, recibos…)</h3>
        <div class="flex flex-wrap items-end gap-2">
          <div class="w-40">
            <FormSelect v-model="soporteTipo" label="Tipo" :options="opcionesDe(filtros.tipos_soporte)" />
          </div>
          <input
            ref="inputSoporte"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            class="min-w-0 flex-1 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
            aria-label="Archivos de soporte"
            @change="agregarSoportes"
          >
        </div>
        <ul v-if="soportesPendientes.length" class="flex flex-col gap-1 text-sm">
          <li v-for="(s, i) in soportesPendientes" :key="i" class="flex items-center gap-2">
            <span class="text-slate-700">{{ s.archivo.name }}</span>
            <span class="text-xs text-slate-500">({{ filtros.tipos_soporte?.[s.tipo] ?? s.tipo }})</span>
            <button type="button" class="text-xs text-red-600 underline" @click="soportesPendientes.splice(i, 1)">Quitar</button>
          </li>
        </ul>
        <p v-if="errorSoportes" class="text-sm text-red-600">{{ errorSoportes }}</p>
      </section>

      <div v-if="errorGeneral" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-sm text-red-700">{{ errorGeneral }}</p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="emit('update:modelValue', false)"
      >
        Cancelar
      </button>
      <button
        type="button"
        :disabled="guardando"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="guardar"
      >
        {{ guardando ? 'Guardando...' : (movimiento ? 'Guardar cambios' : 'Registrar') }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import ModalBase from '@/components/ModalBase.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import FormSection from '@/components/forms/FormSection.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { opcionesBanco as aOpcionesBanco } from '@/utils/formatters.js'
import {
  EFECTO_RESTA,
  calcularDesdeSubtotal,
  calcularDesdeTotal,
  totalesMovimiento,
  formatCOP,
  validarArchivoSoporte,
} from '@/utils/libroDiario.js'

/**
 * Formulario para registrar o editar un movimiento del libro diario (egreso u
 * otro ingreso) con varios impuestos y retenciones.
 *
 * Autocálculo: el subtotal calcula impuestos y total; el total despeja el
 * subtotal; el valor de un impuesto se puede ajustar a mano y solo recalcula el total.
 * Al registrar, carga después los soportes elegidos. El medio de pago es efectivo
 * y solo se puede cambiar con `permitirOtrosMedios` (permiso fin_ldMedioPagoOtros).
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** Movimiento a editar (con impuestos); null para registrar uno nuevo */
  movimiento: { type: Object, default: null },
  /** Respuesta de /libro-diario/filters */
  filtros: { type: Object, default: () => ({}) },
  tiposMovimiento: { type: Array, default: () => [] },
  impuestos: { type: Array, default: () => [] },
  bancos: { type: Array, default: () => [] },
  /** Permite elegir medios distintos a efectivo (permiso fin_ldMedioPagoOtros) */
  permitirOtrosMedios: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'guardado'])

const vacio = () => ({
  tipo_movimiento_id: '',
  medio_pago: 'efectivo',
  banco_id: '',
  tercero_tipo_identificacion: 'NIT',
  tercero_identificacion: '',
  tercero_nombre: '',
  documento_tipo: 'factura',
  documento_numero: '',
  subtotal: '',
  valor_total: '',
  impuestos: [],
  observaciones: '',
})

const form = reactive(vacio())
const errores = ref({})
const errorGeneral = ref('')
const guardando = ref(false)
const impuestoAAgregar = ref('')
const soporteTipo = ref('factura')
const soportesPendientes = ref([])
const errorSoportes = ref('')
const inputSoporte = ref(null)
/** Último valor escrito por el usuario: define desde dónde se recalcula al cambiar impuestos */
const ancla = ref('subtotal')

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  Object.assign(form, vacio())
  if (props.movimiento) {
    const m = props.movimiento
    Object.assign(form, {
      tipo_movimiento_id: m.tipo_movimiento_id,
      medio_pago: m.medio_pago,
      banco_id: m.banco_id ?? '',
      tercero_tipo_identificacion: m.tercero_tipo_identificacion,
      tercero_identificacion: m.tercero_identificacion,
      tercero_nombre: m.tercero_nombre,
      documento_tipo: m.documento_tipo,
      documento_numero: m.documento_numero ?? '',
      subtotal: m.subtotal,
      valor_total: m.valor_total,
      impuestos: (m.impuestos ?? []).map((i) => ({ ...i })),
      observaciones: m.observaciones ?? '',
    })
  }
  errores.value = {}
  errorGeneral.value = ''
  errorSoportes.value = ''
  soportesPendientes.value = []
  ancla.value = 'subtotal'
})

const opcionesDe = (mapa) => Object.entries(mapa ?? {}).map(([value, label]) => ({ value, label }))
const opcionesTipo = computed(() => props.tiposMovimiento.map((t) => ({ value: t.id, label: `${t.nombre} (${t.clase_text})` })))
const opcionesMedio = computed(() => (props.permitirOtrosMedios
  ? opcionesDe(props.filtros.medios_pago)
  : [{ value: 'efectivo', label: props.filtros.medios_pago?.efectivo ?? 'Efectivo' }]))
const opcionesBanco = computed(() => aOpcionesBanco(props.bancos))
const opcionesImpuesto = computed(() => props.impuestos
  .filter((i) => !form.impuestos.some((f) => f.impuesto_id === i.id))
  .map((i) => ({ value: i.id, label: `${i.nombre} (${i.porcentaje} %)` })))
const requiereBanco = computed(() => ['transferencia', 'consignacion'].includes(form.medio_pago))
const totales = computed(() => totalesMovimiento(form.subtotal, form.impuestos))

function aplicar(calculo) {
  form.subtotal = calculo.subtotal
  form.valor_total = calculo.valor_total
  form.impuestos = calculo.impuestos
}

function desdeSubtotal() {
  if (form.subtotal === '') return
  ancla.value = 'subtotal'
  aplicar(calcularDesdeSubtotal(form.subtotal, form.impuestos))
}

function desdeTotal() {
  if (form.valor_total === '') return
  ancla.value = 'total'
  aplicar(calcularDesdeTotal(form.valor_total, form.impuestos))
}

/** Cambió la lista o el porcentaje de impuestos: recalcula desde el último valor escrito. */
function recalcular() {
  if (ancla.value === 'total') desdeTotal()
  else desdeSubtotal()
}

/** Se ajustó a mano el valor de un impuesto: conserva el subtotal y recalcula el total. */
function ajustarTotales() {
  form.valor_total = totalesMovimiento(form.subtotal, form.impuestos).valor_total
  ancla.value = 'subtotal'
}

function agregarImpuesto() {
  const imp = props.impuestos.find((i) => i.id === Number(impuestoAAgregar.value))
  if (!imp) return
  form.impuestos.push({ impuesto_id: imp.id, nombre: imp.nombre, efecto: imp.efecto, porcentaje: imp.porcentaje, valor: 0 })
  impuestoAAgregar.value = ''
  recalcular()
}

function quitarImpuesto(indice) {
  form.impuestos.splice(indice, 1)
  recalcular()
}

function agregarSoportes(evento) {
  errorSoportes.value = ''
  for (const archivo of evento.target.files ?? []) {
    const invalido = validarArchivoSoporte(archivo)
    if (invalido) errorSoportes.value = invalido
    else soportesPendientes.value.push({ tipo: soporteTipo.value, archivo })
  }
  if (inputSoporte.value) inputSoporte.value.value = ''
}

async function guardar() {
  guardando.value = true
  errores.value = {}
  errorGeneral.value = ''
  const payload = {
    ...form,
    banco_id: requiereBanco.value ? form.banco_id : null,
    impuestos: form.impuestos.map(({ impuesto_id, porcentaje, valor }) => ({ impuesto_id, porcentaje, valor })),
  }
  try {
    const res = props.movimiento
      ? await libroDiarioService.actualizarMovimiento(props.movimiento.id, payload)
      : await libroDiarioService.crearMovimiento(payload)

    const fallidos = []
    for (const s of soportesPendientes.value) {
      try {
        await libroDiarioService.subirSoporte('movimiento', res.data.id, s.tipo, s.archivo)
      } catch {
        fallidos.push(s.archivo.name)
      }
    }

    emit('guardado', { movimiento: res.data, soportesFallidos: fallidos })
    emit('update:modelValue', false)
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? {}
    errorGeneral.value = errores.value.turno?.[0] ?? e?.response?.data?.message ?? 'No se pudo guardar el movimiento.'
  } finally {
    guardando.value = false
  }
}
</script>
