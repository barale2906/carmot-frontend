<template>
  <div class="rounded-[14px] border border-black/10 bg-white p-6">
    <header class="mb-6">
      <h2 class="text-base font-medium text-slate-900">
        Recibo de Pago - Matrículas y Mensualidades
      </h2>
      <p class="mt-1 text-base text-slate-500">
        Registra pagos de matrículas y mensualidades de estudiantes.
      </p>
    </header>

    <div class="flex flex-col gap-6">
      <!-- Card: Centro CARMOT + NIT -->
      <div class="flex items-center gap-4 border-b border-black/10 pb-6">
        <Logo size="small" class="size-20 shrink-0" />
        <div>
          <h3 class="text-lg font-medium text-[#213360]">
            Centro de Capacitaciones Carmot
          </h3>
          <p class="text-sm text-slate-500">
            NIT: 1.048.849.874-0
          </p>
        </div>
      </div>

      <!-- Información del estudiante -->
      <div class="rounded-[10px] border border-black/10 bg-slate-50 px-4 py-4">
        <h3 class="mb-4 text-lg font-medium text-[#213360]">
          Información del estudiante
        </h3>
        <div class="grid gap-4 md:grid-cols-3">
          <FormSelect
            v-model="form.estudiante"
            label="Estudiante"
            placeholder="Selecciona estudiante"
            :options="opcionesEstudiantes"
            required
          />
          <FormInput
            v-model="form.documento"
            label="Documento"
            disabled
          />
          <FormInput
            v-model="form.numeroRecibo"
            label="Número de recibo"
            disabled
            required
          />
        </div>
        <div class="mt-4">
          <FormSelect
            v-model="form.cursoTecnico"
            label="Selecciona el curso/técnico"
            placeholder="Selecciona el programa"
            :options="opcionesCursos"
            required
            span="full"
          />
          <p class="mt-1 text-xs text-slate-500">
            Selecciona el programa al que aplica este pago.
          </p>
        </div>
      </div>

      <!-- Historial de pagos -->
      <div class="rounded-[10px] border border-black/10 bg-blue-50/50 px-4 py-4">
        <h3 class="mb-4 text-lg font-medium text-[#213360]">
          Historial de pagos
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-[#213360] text-white">
                <th class="px-2 py-2 text-left font-bold">
                  Fecha
                </th>
                <th class="px-2 py-2 text-left font-bold">
                  Concepto
                </th>
                <th class="px-2 py-2 text-left font-bold">
                  Programa
                </th>
                <th class="px-2 py-2 text-right font-bold">
                  Monto
                </th>
                <th class="px-2 py-2 text-center font-bold">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(pago, i) in historialPagos"
                :key="i"
                class="border-b border-black/10 bg-white"
              >
                <td class="px-2 py-2 text-slate-900">
                  {{ pago.fecha }}
                </td>
                <td class="px-2 py-2 text-slate-900">
                  {{ pago.concepto }}
                </td>
                <td class="px-2 py-2 text-slate-900">
                  {{ pago.programa }}
                </td>
                <td class="px-2 py-2 text-right text-slate-900">
                  {{ pago.monto }}
                </td>
                <td class="px-2 py-2 text-center">
                  <span
                    class="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium"
                    :class="badgeClass(pago.estado)"
                  >
                    {{ pago.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-xs text-slate-500">
          <strong>Nota:</strong> Verifica los pagos pendientes o en mora antes de procesar un nuevo pago.
        </p>
      </div>

      <!-- Información del pago -->
      <FormSection title="Información del pago">
        <FormSelect
          v-model="form.conceptoPago"
          label="Concepto de pago"
          placeholder="Selecciona concepto"
          :options="opcionesConcepto"
          required
        />
        <FormInput
          v-model="form.fechaPago"
          label="Fecha de pago"
          type="date"
          required
        />
        <FormInput
          v-model="form.valorBase"
          label="Valor base"
          placeholder="0"
          required
        />
        <FormSelect
          v-model="form.metodoPago"
          label="Método de pago"
          placeholder="Selecciona método"
          :options="opcionesMetodoPago"
          required
        />
        <div v-if="form.metodoPago === 'tarjeta'" class="flex items-center gap-2 md:col-span-2">
          <button
            type="button"
            class="text-sm font-medium text-[#213360] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            @click="modalTarjetaOpen = true"
          >
            Configurar recargo por tarjeta
          </button>
        </div>
        <div v-if="form.metodoPago === 'consignacion'" class="flex items-center gap-2 md:col-span-2">
          <button
            type="button"
            class="text-sm font-medium text-[#213360] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            @click="modalConsignacionOpen = true"
          >
            Ingresar datos de consignación
          </button>
        </div>
      </FormSection>

      <ModalPagoTarjeta
        v-model="modalTarjetaOpen"
        :valor-base="valorBaseNumerico"
        @confirm="onConfirmarTarjeta"
      />
      <ModalPagoConsignacion
        v-model="modalConsignacionOpen"
        @confirm="onConfirmarConsignacion"
      />

      <!-- Aplicar descuento -->
      <div class="flex flex-col gap-4 border-t border-black/10 pt-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-base font-medium text-[#213360]">
            Aplicar descuento
          </h3>
          <button
            type="button"
            class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Ofertas especiales (Black Friday, Diciembre, etc.)
          </button>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium text-slate-900">Tipo de descuento</span>
            <div class="flex gap-4">
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="form.tipoDescuento"
                  type="radio"
                  value="porcentaje"
                  class="size-4 rounded-full border-slate-300 text-[#213360] focus:ring-[#213360]"
                />
                <span class="text-sm text-slate-900">% Porcentaje</span>
              </label>
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  v-model="form.tipoDescuento"
                  type="radio"
                  value="fijo"
                  class="size-4 rounded-full border-slate-300 text-[#213360] focus:ring-[#213360]"
                />
                <span class="text-sm text-slate-900">$ Valor fijo</span>
              </label>
            </div>
          </div>
          <FormInput
            v-model="form.porcentajeDescuento"
            label="Porcentaje de descuento (%)"
            placeholder="Ej: 40, 70"
          />
          <FormInput
            v-model="form.descuentoAplicado"
            label="Descuento aplicado"
            disabled
            span="full"
          />
        </div>
        <p class="text-xs text-slate-500">
          Ejemplos: Black Friday (40% desc.), Diciembre (70% desc. en matrícula), Ofertas especiales.
        </p>
      </div>

      <!-- Valor total -->
      <FormSection title="Valor total a pagar" layout="single">
        <FormInput
          v-model="form.valorTotal"
          label="Valor total a pagar"
          disabled
          span="full"
        />
      </FormSection>

      <!-- Responsable y observaciones -->
      <FormSection title="Responsable (quien elabora el recibo)" layout="single">
        <FormInput
          v-model="form.responsable"
          label="Nombre del responsable"
          placeholder="Nombre completo del responsable"
          required
          span="full"
        />
      </FormSection>

      <FormSection title="Observaciones adicionales" layout="custom">
        <FormTextarea
          v-model="form.observaciones"
          placeholder="Notas adicionales sobre el pago (opcional)"
          :rows="3"
        />
      </FormSection>

      <FormActions
        cancel-label="Cancelar"
        submit-label="Guardar y generar recibo"
        :loading="loading"
        @cancel="onCancel"
        @submit="onSubmit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import FormSection from '@/components/forms/FormSection.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormActions from '@/components/forms/FormActions.vue'
import ModalPagoTarjeta from '@/components/ModalPagoTarjeta.vue'
import ModalPagoConsignacion from '@/components/ModalPagoConsignacion.vue'

const router = useRouter()
const modalTarjetaOpen = ref(false)
const modalConsignacionOpen = ref(false)
const loading = ref(false)

const form = reactive({
  estudiante: '002',
  documento: '1.123.456.789',
  numeroRecibo: 'REC-083299',
  cursoTecnico: 'motos-duitama',
  conceptoPago: 'matricula',
  fechaPago: '',
  valorBase: '300000',
  metodoPago: 'efectivo',
  tipoDescuento: 'porcentaje',
  porcentajeDescuento: '',
  descuentoAplicado: '$0',
  valorTotal: '300000',
  responsable: '',
  observaciones: '',
  recargoTarjeta: null,
  totalConRecargo: null,
  referenciaConsignacion: '',
  fechaConsignacion: ''
})

const historialPagos = [
  { fecha: '9/1/2026', concepto: 'Matrícula', programa: 'Técnico laboral en Mecánica de Motos', monto: '$220.000', estado: 'Pagado' },
  { fecha: '14/12/2025', concepto: 'Cuota 4', programa: 'Técnico laboral en Mecánica de Motos', monto: '$220.000', estado: 'En mora' },
  { fecha: '14/1/2026', concepto: 'Cuota 5', programa: 'Técnico laboral en Mecánica de Motos', monto: '$220.000', estado: 'Pendiente' }
]

const opcionesEstudiantes = [
  { value: '002', label: '002 - María González' },
  { value: '003', label: '003 - Carlos Rodríguez' }
]

const opcionesCursos = [
  { value: 'motos-duitama', label: 'Técnico laboral en Mecánica de Motos - Duitama (Mensualidad: $220.000)' },
  { value: 'soldadura', label: 'Soldadura Industrial - Tunja' }
]

const opcionesConcepto = [
  { value: 'matricula', label: 'Matrícula' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'cuota', label: 'Cuota' }
]

const opcionesMetodoPago = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'consignacion', label: 'Consignación' }
]

const valorBaseNumerico = computed(() => {
  const v = String(form.valorBase || '').replace(/\D/g, '')
  return Number(v) || 0
})

function badgeClass(estado) {
  if (estado === 'Pagado') return 'bg-[#213360] text-white'
  if (estado === 'En mora') return 'bg-red-600 text-white'
  return 'bg-slate-200 text-[#213360]'
}

function onConfirmarTarjeta(payload) {
  form.recargoTarjeta = payload.recargo
  form.totalConRecargo = payload.total
}

function onConfirmarConsignacion(payload) {
  form.referenciaConsignacion = payload.referencia
  form.fechaConsignacion = payload.fechaConsignacion
}

function onCancel() {
  router.back()
}

function onSubmit() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}
</script>
