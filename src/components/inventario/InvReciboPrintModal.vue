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
          <div class="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
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
                  {{ numeroRecibo }}
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
                <dd class="font-medium text-slate-800">{{ pedido.estudiante?.documento ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-400">Almacén</dt>
                <dd class="text-slate-800">{{ pedido.almacen?.nombre ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-slate-400">Cajero</dt>
                <dd class="text-slate-800">{{ pedido.cajero?.nombre ?? '—' }}</dd>
              </div>
            </div>

            <!-- Tabla de ítems -->
            <div class="mt-4">
              <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#213360]">Productos</h3>
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b-2 border-[#213360] text-left">
                    <th class="pb-2 text-xs font-semibold text-slate-700">Producto</th>
                    <th class="pb-2 text-center text-xs font-semibold text-slate-700">Cant.</th>
                    <th class="pb-2 text-right text-xs font-semibold text-slate-700">Precio unit.</th>
                    <th class="pb-2 text-right text-xs font-semibold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="item in pedido.items ?? []" :key="item.id">
                    <td class="py-2 font-medium text-slate-800">{{ item.producto?.nombre ?? '—' }}</td>
                    <td class="py-2 text-center text-slate-600">{{ item.cantidad }}</td>
                    <td class="py-2 text-right font-mono text-slate-600">{{ formatCurrency(item.precio_unitario) }}</td>
                    <td class="py-2 text-right font-mono font-medium text-slate-800">{{ formatCurrency(item.subtotal ?? (item.precio_unitario * item.cantidad)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="mt-4 flex flex-col items-end gap-1.5 border-t border-slate-200 pt-3 text-sm">
              <div class="flex w-full max-w-xs justify-between gap-4">
                <span class="text-slate-500">Total abonado</span>
                <span class="font-medium text-green-700">{{ formatCurrency(totalAbonado) }}</span>
              </div>
              <div v-if="saldoPendiente > 0" class="flex w-full max-w-xs justify-between gap-4">
                <span class="text-slate-500">Saldo pendiente</span>
                <span class="font-medium text-amber-700">{{ formatCurrency(saldoPendiente) }}</span>
              </div>
              <div class="mt-1 flex w-full max-w-xs justify-between gap-4 border-t border-slate-200 pt-2">
                <span class="font-semibold text-slate-900">Total pedido</span>
                <span class="text-lg font-bold text-[#213360]">{{ formatCurrency(pedido.valor_total) }}</span>
              </div>
            </div>

            <!-- Recibos de pago vinculados -->
            <div v-if="pedido.recibo_links?.length" class="mt-4">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recibos de inventario</p>
              <ul class="divide-y divide-slate-100 rounded-lg border border-slate-200">
                <li v-for="link in pedido.recibo_links" :key="link.recibo_pago_id" class="flex items-center justify-between px-4 py-2 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-slate-700">{{ link.numero_recibo ?? `#${link.recibo_pago_id}` }}</span>
                    <span v-if="link.created_at" class="text-xs text-slate-400">· {{ new Date(link.created_at).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }) }}</span>
                  </div>
                  <span class="font-mono font-medium text-slate-800">{{ formatCurrency(link.monto_abonado) }}</span>
                </li>
              </ul>
            </div>

            <!-- Firmas -->
            <div class="mt-10 grid grid-cols-2 gap-8 break-inside-avoid">
              <div class="border-t border-slate-300 pt-2">
                <p class="text-xs font-medium text-slate-700">Firma del estudiante</p>
                <p class="mt-0.5 text-xs text-slate-400">{{ nombreEstudiante }}</p>
              </div>
              <div class="border-t border-slate-300 pt-2">
                <p class="text-xs font-medium text-slate-700">Responsable de caja</p>
                <p class="mt-0.5 text-xs text-slate-400">{{ pedido.cajero?.nombre ?? '' }}</p>
              </div>
            </div>

            <!-- Pie de página -->
            <p class="mt-6 border-t border-black/5 pt-3 text-center text-[10px] text-slate-400">
              Centro de Capacitaciones CARMOT — NIT: 1.048.849.874-0
              <br>Generado el: {{ generadoEl }}
            </p>
          </div>

          <!-- Footer del modal (no se imprime) -->
          <div class="border-t border-black/5 px-6 py-4">
            <!-- Feedback de envío de correo -->
            <p
              v-if="emailStatus"
              class="mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
              :class="emailStatus === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            >
              <NavIcon :name="emailStatus === 'ok' ? 'check' : 'close'" class="size-4 shrink-0" />
              {{ emailMsg }}
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                type="button"
                class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                @click="emit('close')"
              >Cerrar</button>
              <button
                type="button"
                :disabled="emailLoading || emailStatus === 'ok'"
                class="inline-flex items-center gap-2 rounded-lg border border-[#213360] px-4 py-2 text-sm font-medium text-[#213360] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                @click="enviarEmail"
              >
                <NavIcon v-if="!emailLoading" name="mail" class="size-4" />
                <svg v-else class="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                {{ emailLoading ? 'Enviando...' : emailStatus === 'ok' ? 'Correo enviado' : 'Enviar por correo' }}
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d]"
                @click="handlePrint"
              >
                <NavIcon name="print" class="size-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import NavIcon           from '@/components/icons/NavIcon.vue'
import logoSrc           from '@/assets/images/logo.svg'
import reciboPagoService from '@/services/reciboPagoService.js'

const props = defineProps({
  pedido: { type: Object, default: null },
})
const emit = defineEmits(['close'])

// ── Estado de envío de correo ─────────────────────────────────────────────────
const emailLoading = ref(false)
const emailStatus  = ref(null)
const emailMsg     = ref('')

watch(() => props.pedido, () => {
  emailStatus.value  = null
  emailMsg.value     = ''
  emailLoading.value = false
})

const primerReciboId = computed(() => props.pedido?.recibo_links?.[0]?.recibo_pago_id ?? null)

async function enviarEmail() {
  if (!primerReciboId.value || emailLoading.value) return
  emailLoading.value = true
  emailStatus.value  = null
  emailMsg.value     = ''
  try {
    const res = await reciboPagoService.enviarEmail(primerReciboId.value)
    emailStatus.value = 'ok'
    emailMsg.value    = `Enviado a ${res.estudiante_email ?? res.email ?? 'correo registrado'}`
  } catch (err) {
    emailStatus.value = 'error'
    emailMsg.value    = err?.response?.data?.message || 'No se pudo enviar el correo.'
  } finally {
    emailLoading.value = false
  }
}

/**
 * Agrega la clase `printing-inv-recibo` al elemento <html> antes de imprimir
 * para que las reglas @media print superen en especificidad a las de otros modales.
 */
function handlePrint() {
  document.documentElement.classList.add('printing-inv-recibo')
  window.addEventListener('afterprint', () => {
    document.documentElement.classList.remove('printing-inv-recibo')
  }, { once: true })
  window.print()
}

const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

const nombreEstudiante = computed(() => {
  const e = props.pedido?.estudiante
  if (!e) return '—'
  return e.nombre ?? e.nombre_completo ?? e.name ?? '—'
})

const numeroRecibo = computed(() => {
  const link = props.pedido?.recibo_links?.[0]
  return link?.numero_recibo ?? (link ? `#${link.recibo_pago_id}` : `INV-${String(props.pedido?.id ?? '').padStart(6, '0')}`)
})

const fechaFormateada = computed(() => {
  const f = props.pedido?.created_at
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' })
})

const totalAbonado = computed(() => {
  const p = props.pedido
  if (!p) return 0
  if (p.recibo_links?.length) return p.recibo_links.reduce((s, l) => s + Number(l.monto_abonado ?? 0), 0)
  return Number(p.abono_acumulado ?? 0) || (Number(p.valor_total ?? 0) - Number(p.saldo ?? 0))
})

const saldoPendiente = computed(() => Number(props.pedido?.saldo ?? 0))

const generadoEl = computed(() =>
  new Date().toLocaleString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
)

const statusClass = computed(() => ({
  activo:     'text-amber-700',
  pagado:     'text-blue-700',
  entregando: 'text-purple-700',
  entregado:  'text-green-700',
  cancelado:  'text-red-600',
}[props.pedido?.status] ?? 'text-slate-700'))

const statusTexto = computed(() => ({
  activo:     'Activo (con saldo)',
  pagado:     'Pagado',
  entregando: 'Entregando',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
}[props.pedido?.status] ?? props.pedido?.status ?? '—'))
</script>

<style>
@media print {
  html.printing-inv-recibo body > *:not(#inv-recibo-print-overlay) {
    display: none !important;
  }

  html.printing-inv-recibo body > #inv-recibo-print-overlay {
    display: block !important;
    position: static !important;
    inset: auto !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: none !important;
    overflow: visible !important;
  }

  html.printing-inv-recibo body > #inv-recibo-print-overlay > div {
    display: block !important;
    position: static !important;
    width: auto !important;
    max-width: none !important;
    margin: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    overflow: visible !important;
  }

  html.printing-inv-recibo #inv-recibo-print-sheet {
    display: block !important;
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
    width: 100% !important;
    padding: 0 !important;
  }

  html.printing-inv-recibo #inv-recibo-print-sheet,
  html.printing-inv-recibo #inv-recibo-print-sheet * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Ocultar cabecera y footer del modal */
  html.printing-inv-recibo body > #inv-recibo-print-overlay > div > div:first-child,
  html.printing-inv-recibo body > #inv-recibo-print-overlay > div > div:last-child {
    display: none !important;
  }
}

@page { margin: 14mm; }
</style>
