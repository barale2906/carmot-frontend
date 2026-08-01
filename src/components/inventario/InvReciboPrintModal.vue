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
        v-if="pedido"
        id="inv-recibo-print-overlay"
        class="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      >
        <div
          class="relative my-auto w-full max-w-2xl rounded-xl border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Cabecera del modal (no se imprime) -->
          <div class="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5 print:hidden">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Recibo de venta — Inventario</h2>
              <p class="mt-0.5 text-sm text-slate-500">Revisa y presiona Imprimir para generar el PDF</p>
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar"
              @click="$emit('close')"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </div>

          <!-- Acciones (no se imprimen) -->
          <div class="flex justify-end gap-2 border-b border-black/5 px-6 py-3 print:hidden">
            <button
              type="button"
              class="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="$emit('close')"
            >Cancelar</button>
            <button
              type="button"
              class="flex h-8 items-center gap-2 rounded-lg bg-[#213360] px-3 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="imprimir"
            >
              <NavIcon name="layout" class="size-4" /> Imprimir
            </button>
          </div>

          <!-- Contenido imprimible -->
          <div id="inv-recibo-print-sheet" class="max-h-[72vh] overflow-y-auto px-8 py-6">

            <!-- Encabezado institucional -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="flex shrink-0 items-center rounded-lg bg-[#213360] px-3 py-2">
                  <img :src="logoSrc" alt="CARMOT" class="h-10 w-auto" />
                </div>
                <div>
                  <h1 class="text-base font-bold text-slate-900">Centro de Capacitaciones CARMOT</h1>
                  <p class="text-xs text-slate-500">NIT: 1.048.849.874-0</p>
                  <p v-if="pedido.sede?.nombre" class="mt-0.5 text-xs text-slate-600">Sede: {{ pedido.sede.nombre }}</p>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <span class="inline-block rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-bold text-white">
                  INV-{{ String(pedido.id).padStart(6, '0') }}
                </span>
                <p class="mt-1.5 text-xs text-slate-500">Fecha: {{ fechaFormateada }}</p>
                <p class="mt-0.5 text-xs">
                  Estado: <span class="font-medium" :class="statusClass">{{ statusTexto }}</span>
                </p>
              </div>
            </div>

            <div class="mt-4 h-px bg-[#213360]" />

            <div class="my-4 rounded-lg bg-[#213360] py-2.5 text-center text-white">
              <p class="text-sm font-semibold uppercase tracking-wide">Comprobante de venta — Inventario</p>
            </div>

            <!-- Datos del cliente -->
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-slate-200 p-4 text-sm">
              <div>
                <dt class="text-xs text-slate-400">Estudiante</dt>
                <dd class="font-medium text-slate-800">{{ nombreEstudiante }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-400">Documento</dt>
                <dd class="font-medium text-slate-800">{{ pedido.estudiante?.documento ?? pedido.estudiante?.numero_documento ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-400">Almacén</dt>
                <dd class="text-slate-800">{{ pedido.almacen?.nombre ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-400">Cajero</dt>
                <dd class="text-slate-800">{{ pedido.cajero?.nombre_completo ?? pedido.cajero?.name ?? '—' }}</dd>
              </div>
            </div>

            <!-- Tabla de ítems -->
            <div class="mt-4">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200 text-left">
                    <th class="pb-2 text-xs font-semibold text-slate-500">Producto</th>
                    <th class="pb-2 text-center text-xs font-semibold text-slate-500">Cant.</th>
                    <th class="pb-2 text-right text-xs font-semibold text-slate-500">Precio unit.</th>
                    <th class="pb-2 text-right text-xs font-semibold text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in pedido.items ?? []" :key="item.id" class="border-b border-slate-100">
                    <td class="py-2 font-medium text-slate-800">{{ item.producto?.nombre ?? '—' }}</td>
                    <td class="py-2 text-center text-slate-600">{{ item.cantidad }}</td>
                    <td class="py-2 text-right text-slate-600">{{ formatCurrency(item.precio_unitario) }}</td>
                    <td class="py-2 text-right font-medium text-slate-800">{{ formatCurrency(item.total ?? (item.precio_unitario * item.cantidad)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="mt-4 flex flex-col items-end gap-1.5 border-t border-slate-200 pt-3 text-sm">
              <div class="flex w-full max-w-xs justify-between gap-4">
                <span class="text-slate-500">Subtotal</span>
                <span class="font-medium text-slate-800">{{ formatCurrency(pedido.total) }}</span>
              </div>
              <div class="flex w-full max-w-xs justify-between gap-4">
                <span class="text-slate-500">Total abonado</span>
                <span class="font-medium text-green-700">{{ formatCurrency(totalAbonado) }}</span>
              </div>
              <div v-if="saldoPendiente > 0" class="flex w-full max-w-xs justify-between gap-4">
                <span class="text-slate-500">Saldo pendiente</span>
                <span class="font-medium text-amber-700">{{ formatCurrency(saldoPendiente) }}</span>
              </div>
              <div class="mt-1 flex w-full max-w-xs justify-between gap-4 border-t border-slate-200 pt-2">
                <span class="font-semibold text-slate-900">Total</span>
                <span class="text-lg font-bold text-[#213360]">{{ formatCurrency(pedido.total) }}</span>
              </div>
            </div>

            <!-- Medios de pago -->
            <div v-if="pedido.abonos?.length" class="mt-4">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Abonos registrados</p>
              <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li v-for="abono in pedido.abonos" :key="abono.id" class="flex items-center justify-between px-4 py-2 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-700">{{ medioLabel(abono.medio_pago) }}</span>
                    <span v-if="abono.referencia" class="text-xs text-slate-400">· {{ abono.referencia }}</span>
                    <span v-if="abono.banco?.nombre" class="text-xs text-slate-400">· {{ abono.banco.nombre }}</span>
                  </div>
                  <span class="font-mono font-medium text-slate-800">{{ formatCurrency(abono.valor) }}</span>
                </li>
              </ul>
            </div>

            <!-- Pie de página -->
            <div class="mt-6 border-t border-slate-100 pt-4 text-center">
              <p class="text-xs text-slate-400">Este comprobante es válido como constancia de venta de inventario.</p>
              <p class="mt-1 text-xs text-slate-400">CARMOT — NIT: 1.048.849.874-0</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import logoImg from '@/assets/images/logo.svg'

const props = defineProps({
  pedido: { type: Object, default: null },
})

defineEmits(['close'])

const logoSrc = logoImg

const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

const medioLabel = (m) => ({
  efectivo:     'Efectivo',
  transferencia: 'Transferencia',
  tarjeta:      'Tarjeta',
  consignacion: 'Consignación',
}[m] ?? m)

const nombreEstudiante = computed(() => {
  const e = props.pedido?.estudiante
  if (!e) return '—'
  return e.nombre_completo ?? e.name ?? [e.primer_nombre, e.primer_apellido].filter(Boolean).join(' ') ?? '—'
})

const fechaFormateada = computed(() => {
  const f = props.pedido?.created_at
  if (!f) return '—'
  return f.split('T')[0]
})

const totalAbonado = computed(() => {
  if (props.pedido?.abonos?.length) return props.pedido.abonos.reduce((s, a) => s + (a.valor ?? 0), 0)
  return (props.pedido?.total ?? 0) - (props.pedido?.saldo ?? 0)
})

const saldoPendiente = computed(() => props.pedido?.saldo ?? 0)

const statusClass = computed(() => ({
  activo:    'text-amber-700',
  pagado:    'text-blue-700',
  entregando: 'text-purple-700',
  entregado: 'text-green-700',
  cancelado: 'text-red-600',
}[props.pedido?.status] ?? 'text-slate-700'))

const statusTexto = computed(() => ({
  activo:    'Activo (con saldo)',
  pagado:    'Pagado',
  entregando: 'Entregando',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}[props.pedido?.status] ?? props.pedido?.status ?? '—'))

function imprimir() {
  window.print()
}
</script>

<style scoped>
@media print {
  #inv-recibo-print-overlay {
    position: static;
    background: none;
    padding: 0;
  }

  .print\:hidden {
    display: none !important;
  }

  #inv-recibo-print-sheet {
    max-height: none;
    overflow: visible;
  }
}
</style>
