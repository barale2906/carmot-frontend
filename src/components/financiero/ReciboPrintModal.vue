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
        v-if="open"
        id="recibo-print-overlay"
        class="fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      >
        <div
          class="relative my-auto w-full max-w-2xl rounded-xl border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Cabecera del modal (no se imprime) -->
          <div class="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Recibo de pago</h2>
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
          <div id="recibo-print-sheet" class="max-h-[72vh] overflow-y-auto px-8 py-6">
            <template v-if="recibo">

              <!-- Encabezado institucional -->
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-4">
                  <div class="flex shrink-0 items-center rounded-lg bg-[#213360] px-3 py-2">
                    <img :src="logoSrc" alt="CARMOT" class="h-10 w-auto" />
                  </div>
                  <div>
                    <h1 class="text-base font-bold text-slate-900">Centro de Capacitaciones CARMOT</h1>
                    <p class="text-xs text-slate-500">NIT: 1.048.849.874-0</p>
                    <p v-if="recibo.sede?.nombre" class="mt-0.5 text-xs text-slate-600">
                      Sede: {{ recibo.sede.nombre }}
                    </p>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <span class="inline-block rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-bold text-white">
                    {{ recibo.numero_recibo }}
                  </span>
                  <p class="mt-1.5 text-xs text-slate-500">Fecha: {{ recibo.fecha_recibo }}</p>
                  <p class="mt-0.5 text-xs">
                    Estado:
                    <span
                      class="font-medium"
                      :class="recibo.status === 1 ? 'text-green-700' : recibo.status === 3 ? 'text-red-600' : 'text-slate-700'"
                    >{{ recibo.status_text }}</span>
                  </p>
                </div>
              </div>

              <div class="mt-4 h-px bg-[#213360]" />

              <div class="my-4 rounded-lg bg-[#213360] py-2.5 text-center text-white">
                <p class="text-sm font-semibold uppercase tracking-wide">Recibo de pago</p>
              </div>

              <!-- Datos generales -->
              <div class="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-slate-200 p-4 text-sm">
                <div>
                  <dt class="text-xs text-slate-400">Estudiante</dt>
                  <dd class="font-medium text-slate-800">{{ nombreEstudiante }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-400">Programa</dt>
                  <dd class="text-slate-800">{{ nombreCurso }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-400">Responsable</dt>
                  <dd class="text-slate-800">{{ recibo.cajero?.name ?? `ID ${recibo.cajero_id}` }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-slate-400">Fecha de transacción</dt>
                  <dd class="text-slate-800">{{ recibo.fecha_transaccion ?? recibo.fecha_recibo }}</dd>
                </div>
              </div>

              <!-- Conceptos de pago -->
              <div class="mt-5">
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#213360]">Conceptos de pago</h3>
                <table class="w-full border-collapse text-xs">
                  <thead>
                    <tr class="border-b-2 border-[#213360]">
                      <th class="py-2 text-left font-semibold text-slate-700">Concepto</th>
                      <th class="py-2 text-right font-semibold text-slate-700">Cant.</th>
                      <th class="py-2 text-right font-semibold text-slate-700">Valor unitario</th>
                      <th class="py-2 text-right font-semibold text-slate-700">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(cp, idx) in recibo.conceptos_pago" :key="idx">
                      <td class="py-2 text-slate-800">
                        <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                          <span class="font-medium">{{ cpNombre(cp) }}</span>
                          <span v-if="cp.observaciones" class="text-slate-500">— {{ cp.observaciones }}</span>
                          <span
                            v-if="cp.status_cartera != null"
                            class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            :class="statusCarteraClass(cp.status_cartera)"
                          >{{ cp.status_cartera === 2 ? 'Pagada' : statusCarteraText(cp.status_cartera) }}</span>
                          <span
                            v-if="cp.status_cartera === 1 && cp.saldo_cartera"
                            class="text-[10px] font-medium text-amber-700"
                          >· Saldo: $ {{ formatMoney(cp.saldo_cartera) }}</span>
                        </div>
                      </td>
                      <td class="py-2 text-right text-slate-700">{{ cp.cantidad }}</td>
                      <td class="py-2 text-right font-mono text-slate-700">$ {{ formatMoney(cp.unitario) }}</td>
                      <td class="py-2 text-right font-mono font-medium text-slate-900">$ {{ formatMoney(cp.subtotal) }}</td>
                    </tr>
                    <tr v-if="!recibo.conceptos_pago?.length">
                      <td colspan="4" class="py-3 text-center text-slate-400">Sin conceptos registrados.</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr v-if="Number(recibo.descuento_total) > 0" class="border-t border-slate-200">
                      <td colspan="3" class="py-2 text-right text-sm text-emerald-700">Descuento aplicado:</td>
                      <td class="py-2 text-right font-mono text-sm font-semibold text-emerald-700">
                        − $ {{ formatMoney(recibo.descuento_total) }}
                      </td>
                    </tr>
                    <tr class="border-t-2 border-[#213360]">
                      <td colspan="3" class="py-2.5 text-right text-sm font-bold text-slate-800">Total pagado:</td>
                      <td class="py-2.5 text-right font-mono text-base font-bold text-[#213360]">
                        $ {{ recibo.valor_total_formatted ?? formatMoney(recibo.valor_total) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Medios de pago -->
              <div class="mt-5">
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-[#213360]">Medios de pago</h3>
                <table class="w-full border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-300">
                      <th class="py-2 text-left font-semibold text-slate-700">Medio</th>
                      <th class="py-2 text-left font-semibold text-slate-700">Referencia</th>
                      <th class="py-2 text-right font-semibold text-slate-700">Valor</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(mp, idx) in recibo.medios_pago" :key="idx">
                      <td class="py-2 capitalize text-slate-800">{{ mp.medio_pago?.replace(/_/g, ' ') }}</td>
                      <td class="py-2 text-slate-600">{{ mp.referencia ?? '—' }}</td>
                      <td class="py-2 text-right font-mono font-medium text-slate-900">$ {{ formatMoney(mp.valor) }}</td>
                    </tr>
                    <tr v-if="!recibo.medios_pago?.length">
                      <td colspan="3" class="py-3 text-center text-slate-400">Sin medios de pago registrados.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Firmas -->
              <div class="mt-10 grid grid-cols-2 gap-8 break-inside-avoid">
                <div class="border-t border-slate-300 pt-2">
                  <p class="text-xs font-medium text-slate-700">Firma del estudiante</p>
                  <p class="mt-0.5 text-xs text-slate-400">{{ nombreEstudiante }}</p>
                </div>
                <div class="border-t border-slate-300 pt-2">
                  <p class="text-xs font-medium text-slate-700">Responsable de caja</p>
                  <p class="mt-0.5 text-xs text-slate-400">{{ recibo.cajero?.name ?? '' }}</p>
                </div>
              </div>

              <p class="mt-6 border-t border-black/5 pt-3 text-center text-[10px] text-slate-400">
                Centro de Capacitaciones CARMOT — NIT: 1.048.849.874-0
                <br>Generado el: {{ generadoEl }}
              </p>
            </template>
          </div>

          <!-- Footer del modal (no se imprime) -->
          <div class="border-t border-black/5 px-6 py-4">
            <!-- Feedback de envío de correo -->
            <p
              v-if="emailStatus"
              class="mb-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
              :class="emailStatus === 'ok'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'"
            >
              <NavIcon :name="emailStatus === 'ok' ? 'check' : 'close'" class="size-4 shrink-0" />
              {{ emailMsg }}
            </p>
            <div class="flex items-center justify-end gap-3">
              <button
                type="button"
                class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                @click="emit('close')"
              >
                Cerrar
              </button>
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
import NavIcon          from '@/components/icons/NavIcon.vue'
import logoSrc          from '@/assets/images/logo.svg'
import reciboPagoService from '@/services/reciboPagoService.js'

const props = defineProps({
  open:   { type: Boolean, default: false },
  recibo: { type: Object,  default: null },
})
const emit = defineEmits(['close'])

// ── Estado de envío de correo ─────────────────────────────────────────────────
const emailLoading = ref(false)
const emailStatus  = ref(null)   // null | 'ok' | 'error'
const emailMsg     = ref('')

watch(() => props.open, (val) => {
  if (!val) {
    emailStatus.value  = null
    emailMsg.value     = ''
    emailLoading.value = false
  }
})

async function enviarEmail() {
  if (!props.recibo?.id || emailLoading.value) return
  emailLoading.value = true
  emailStatus.value  = null
  emailMsg.value     = ''
  try {
    const res = await reciboPagoService.enviarEmail(props.recibo.id)
    emailStatus.value = 'ok'
    emailMsg.value    = `Enviado a ${res.estudiante_email}`
  } catch (err) {
    emailStatus.value = 'error'
    const msg = err?.response?.data?.message
    emailMsg.value = msg || 'No se pudo enviar el correo.'
  } finally {
    emailLoading.value = false
  }
}

const generadoEl = computed(() =>
  new Date().toLocaleString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
)

/**
 * El backend puede devolver `matricula.estudiante` como string (guía) u objeto
 * con campos `name`/`primer_nombre`. Se maneja ambos casos.
 */
const nombreEstudiante = computed(() => {
  const est = props.recibo?.matricula?.estudiante
  if (!est) return `ID ${props.recibo?.estudiante_id ?? '—'}`
  if (typeof est === 'string') return est
  return est.name ?? [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' ') ?? `ID ${est.id}`
})

/**
 * El backend puede devolver `matricula.curso` como string u objeto con `nombre`.
 */
const nombreCurso = computed(() => {
  const curso = props.recibo?.matricula?.curso
  if (!curso) return '—'
  if (typeof curso === 'string') return curso
  return curso.nombre ?? '—'
})

function formatMoney(val) {
  if (val == null) return '0'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/** Nombre legible del concepto de cartera en el recibo. */
function cpNombre(cp) {
  const nombre = cp.nombre ?? ''
  // Cuota 0 siempre es la matrícula inicial
  if (cp.observaciones?.includes('cuota 0') || nombre === 'Matrícula') return 'Matrícula'
  if (nombre === 'Pago de mensualidad') return 'Pago mes'
  return nombre || '—'
}

function statusCarteraClass(status) {
  // 0=Activa 1=Abonada 2=Cerrada 3=Anulada 4=En Acuerdo
  const map = {
    0: 'bg-blue-100 text-blue-800',
    1: 'bg-amber-100 text-amber-800',
    2: 'bg-green-100 text-green-800',
    3: 'bg-slate-100 text-slate-500',
    4: 'bg-purple-100 text-purple-800',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}

function statusCarteraText(status) {
  const map = { 0: 'Activa', 1: 'Abonada', 2: 'Cerrada', 3: 'Anulada', 4: 'En Acuerdo' }
  return map[status] ?? ''
}

/**
 * Agrega la clase `printing-recibo` al elemento <html> justo antes de imprimir.
 * Esto eleva la especificidad de nuestras reglas @media print por encima de las
 * reglas globales de MatriculaPrintModal (body > *:not(#matricula-print-overlay)
 * tiene especificidad 0,1,0,1; las nuestras con html.printing-recibo alcanzan
 * 0,1,1,2 y las ganan aunque ambas usen !important).
 */
function handlePrint() {
  document.documentElement.classList.add('printing-recibo')
  window.addEventListener('afterprint', () => {
    document.documentElement.classList.remove('printing-recibo')
  }, { once: true })
  window.print()
}
</script>

<style>
/*
 * Todas las reglas llevan el prefijo html.printing-recibo para que su
 * especificidad supere a la regla global de MatriculaPrintModal:
 *   body > *:not(#matricula-print-overlay) → especificidad 0,1,0,1
 * Con html.printing-recibo body > #recibo-print-overlay → 0,1,1,2 → gana.
 */
@media print {
  html.printing-recibo body > *:not(#recibo-print-overlay) {
    display: none !important;
  }

  html.printing-recibo body > #recibo-print-overlay {
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

  html.printing-recibo body > #recibo-print-overlay > div {
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

  html.printing-recibo #recibo-print-sheet {
    display: block !important;
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
    width: 100% !important;
    padding: 0 !important;
  }

  html.printing-recibo #recibo-print-sheet,
  html.printing-recibo #recibo-print-sheet * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Ocultar cabecera y footer del modal */
  html.printing-recibo body > #recibo-print-overlay > div > div:first-child,
  html.printing-recibo body > #recibo-print-overlay > div > div:last-child {
    display: none !important;
  }
}

@page { margin: 14mm; }
</style>
