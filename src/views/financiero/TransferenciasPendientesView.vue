<template>
  <div class="flex flex-col gap-6">

    <!-- ══════════════════════════════════════════════════════════════
         VISTA LISTADO
    ═══════════════════════════════════════════════════════════════ -->
    <template v-if="!selectedRecibo">

      <!-- Encabezado -->
      <section class="rounded-[14px] border border-amber-200 bg-amber-50 px-6 py-4">
        <h2 class="text-sm font-semibold text-amber-900">Bandeja de transferencias pendientes</h2>
        <p class="mt-1 text-xs text-amber-700">
          Haz clic en un recibo para revisar el comprobante y tomar una decisión.
        </p>
      </section>

      <!-- Filtros -->
      <section class="rounded-[14px] border border-black/10 bg-white p-6">
        <div class="flex flex-wrap items-end gap-4">
          <div class="w-full sm:w-48">
            <label class="mb-1 block text-xs font-medium text-slate-700">Sede</label>
            <select
              v-model="filters.sede_id"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              @change="loadPendientes(1)"
            >
              <option :value="null">Todas las sedes</option>
              <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </div>
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadPendientes(1)"
          >
            Actualizar
          </button>
        </div>
      </section>

      <!-- Carga -->
      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando transferencias pendientes...</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPendientes(1)">Reintentar</button>
      </div>

      <!-- Vacío -->
      <div v-else-if="!pendientes.length" class="rounded-[14px] border border-black/10 bg-white py-16 text-center">
        <p class="text-sm text-slate-500">No hay transferencias pendientes de aprobación.</p>
      </div>

      <!-- Tabla -->
      <template v-else>
        <p class="text-xs text-slate-500">
          {{ pagination.total }} recibo{{ pagination.total !== 1 ? 's' : '' }} pendiente{{ pagination.total !== 1 ? 's' : '' }}, del más antiguo al más nuevo.
        </p>

        <div class="overflow-hidden rounded-[14px] border border-black/10 bg-white">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-black/10 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th class="px-4 py-3">Estudiante</th>
                  <th class="px-4 py-3">Fecha</th>
                  <th class="px-4 py-3">Cajero</th>
                  <th class="px-4 py-3">Banco</th>
                  <th class="px-4 py-3">N.° Transacción</th>
                  <th class="px-4 py-3 text-right">Valor</th>
                  <th class="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-black/5">
                <tr
                  v-for="recibo in pendientes"
                  :key="recibo.id"
                  class="cursor-pointer transition-colors hover:bg-amber-50"
                  @click="openDetalle(recibo)"
                >
                  <td class="px-4 py-3 font-medium text-slate-900">
                    {{ recibo.estudiante?.name ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ recibo.fecha_recibo }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ recibo.cajero?.name ?? '—' }}</td>
                  <td class="px-4 py-3 text-slate-700">{{ bancoNombre(getTransferenciaMp(recibo)) ?? '—' }}</td>
                  <td class="px-4 py-3 font-mono text-slate-700">{{ getTransferenciaMp(recibo)?.numero_transaccion ?? '—' }}</td>
                  <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                    $ {{ formatMoney(recibo.valor_total) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-xs font-medium text-amber-600 whitespace-nowrap">Ver detalle →</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              :disabled="pagination.currentPage === 1"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="goToPage(pagination.currentPage - 1)"
            >Anterior</button>
            <button
              type="button"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="goToPage(pagination.currentPage + 1)"
            >Siguiente</button>
          </div>
        </div>
      </template>
    </template>

    <!-- ══════════════════════════════════════════════════════════════
         VISTA DETALLE
    ═══════════════════════════════════════════════════════════════ -->
    <template v-else>

      <!-- Volver -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="cerrarDetalle"
        >
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al listado
        </button>
        <span class="text-sm text-slate-500">Revisión de transferencia</span>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <!-- ── Comprobante ───────────────────────────────────────── -->
        <div class="rounded-[14px] border border-black/10 bg-white p-6">
          <h3 class="mb-4 text-sm font-semibold text-slate-900">Comprobante de pago</h3>

          <template v-if="selectedMp?.comprobante_url">
            <!-- Imagen -->
            <template v-if="isImageUrl(selectedMp.comprobante_url)">
              <a :href="resolveStorageUrl(selectedMp.comprobante_url)" target="_blank" rel="noopener">
                <img
                  :src="resolveStorageUrl(selectedMp.comprobante_url)"
                  alt="Comprobante de transferencia"
                  class="w-full rounded-xl border border-slate-200 object-contain shadow-sm transition-opacity hover:opacity-90"
                  style="max-height: 520px;"
                />
              </a>
              <p class="mt-2 text-center text-xs text-slate-400">Clic en la imagen para verla en tamaño completo.</p>
            </template>

            <!-- PDF u otro -->
            <template v-else>
              <div class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-14">
                <svg class="size-12 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                </svg>
                <p class="text-sm font-medium text-slate-600">Documento adjunto (PDF)</p>
                <a
                  :href="resolveStorageUrl(selectedMp.comprobante_url)"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Abrir documento
                </a>
              </div>
            </template>
          </template>

          <!-- Sin comprobante -->
          <div v-else class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-14">
            <svg class="size-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm text-slate-400">Sin comprobante adjunto</p>
          </div>
        </div>

        <!-- ── Datos del recibo + acciones ─────────────────────── -->
        <div class="flex flex-col gap-4">

          <!-- Datos del recibo -->
          <div class="rounded-[14px] border border-black/10 bg-white p-6">
            <h3 class="mb-4 text-sm font-semibold text-slate-900">Datos del recibo</h3>

            <dl class="space-y-3">
              <div class="flex justify-between border-b border-black/5 pb-3">
                <dt class="text-xs font-medium text-slate-500">Estudiante</dt>
                <dd class="text-sm font-semibold text-slate-900">{{ selectedRecibo.estudiante?.name ?? '—' }}</dd>
              </div>
              <div class="flex justify-between border-b border-black/5 pb-3">
                <dt class="text-xs font-medium text-slate-500">Cajero</dt>
                <dd class="text-sm text-slate-700">{{ selectedRecibo.cajero?.name ?? '—' }}</dd>
              </div>
              <div class="flex justify-between border-b border-black/5 pb-3">
                <dt class="text-xs font-medium text-slate-500">Fecha</dt>
                <dd class="text-sm text-slate-700">{{ selectedRecibo.fecha_recibo }}</dd>
              </div>
              <div class="flex justify-between border-b border-black/5 pb-3">
                <dt class="text-xs font-medium text-slate-500">Banco</dt>
                <dd class="text-sm font-semibold text-slate-900">{{ bancoNombre(selectedMp) ?? '—' }}</dd>
              </div>
              <div class="flex justify-between border-b border-black/5 pb-3">
                <dt class="text-xs font-medium text-slate-500">N.° Transacción</dt>
                <dd class="font-mono text-sm text-slate-900">{{ selectedMp?.numero_transaccion ?? '—' }}</dd>
              </div>
              <div class="flex items-baseline justify-between pt-1">
                <dt class="text-xs font-medium text-slate-500">Valor total</dt>
                <dd class="font-mono text-2xl font-bold text-[#213360]">
                  $ {{ formatMoney(selectedRecibo.valor_total) }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Acciones -->
          <div class="rounded-[14px] border border-black/10 bg-white p-6">
            <h3 class="mb-1 text-sm font-semibold text-slate-900">Decisión</h3>
            <p class="mb-4 text-xs text-slate-500">
              Al aprobar se cierra el recibo y se genera el número. Al rechazar, el cajero podrá corregir y reenviar.
            </p>

            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                :disabled="aprobandoId === selectedRecibo.id"
                class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
                @click="openAprobar(selectedRecibo)"
              >
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ aprobandoId === selectedRecibo.id ? 'Aprobando...' : 'Aprobar recibo' }}
              </button>
              <button
                type="button"
                :disabled="aprobandoId === selectedRecibo.id"
                class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-6 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
                @click="openRechazar(selectedRecibo)"
              >
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Rechazar
              </button>
            </div>

            <div v-if="actionError" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {{ actionError }}
            </div>
          </div>

        </div>
      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════════
         MODAL: APROBAR
    ═══════════════════════════════════════════════════════════════ -->
    <ModalBase
      v-model="showAprobarModal"
      title="Aprobar transferencia"
      description="El recibo se cerrará y se generará el número de recibo."
    >
      <div class="space-y-3 pb-2">
        <p class="text-sm text-slate-700">
          ¿Confirmas que deseas aprobar el recibo de
          <strong>{{ reciboAprobarTarget?.estudiante?.name }}</strong>
          por <strong>$ {{ formatMoney(reciboAprobarTarget?.valor_total) }}</strong>?
        </p>
        <p class="text-xs text-slate-500">
          Esta acción distribuirá el pago en cartera y enviará el comprobante al estudiante.
        </p>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showAprobarModal = false"
        >Cancelar</button>
        <button
          type="button"
          :disabled="aprobandoId !== null"
          class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
          @click="doAprobar"
        >
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ aprobandoId !== null ? 'Aprobando...' : 'Confirmar aprobación' }}
        </button>
      </template>
    </ModalBase>

    <!-- ══════════════════════════════════════════════════════════════
         MODAL: RECHAZAR
    ═══════════════════════════════════════════════════════════════ -->
    <ModalBase
      v-model="showRechazarModal"
      title="Rechazar transferencia"
      description="El cajero recibirá una notificación con el motivo indicado."
    >
      <div class="space-y-4 pb-2">
        <p class="text-sm text-slate-700">
          ¿Confirmas que deseas rechazar el recibo de
          <strong>{{ reciboTarget?.estudiante?.name }}</strong>
          por <strong>$ {{ formatMoney(reciboTarget?.valor_total) }}</strong>?
        </p>
        <div>
          <label for="motivo-rechazo" class="mb-1 block text-sm font-medium text-slate-700">
            Motivo del rechazo <span class="text-red-500">*</span>
          </label>
          <textarea
            id="motivo-rechazo"
            v-model="motivoRechazo"
            rows="4"
            maxlength="500"
            placeholder="Describe por qué se rechaza la transferencia..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-right text-xs text-slate-400">{{ motivoRechazo.length }}/500</p>
        </div>
        <div v-if="modalError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ modalError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showRechazarModal = false"
        >Cancelar</button>
        <button
          type="button"
          :disabled="rechazando || !motivoRechazo.trim()"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmRechazar"
        >
          {{ rechazando ? 'Rechazando...' : 'Confirmar rechazo' }}
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import reciboPagoService   from '@/services/reciboPagoService.js'
import ModalBase           from '@/components/ModalBase.vue'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// La URL base del backend (sin /api) para resolver rutas de storage relativas
const backendBase = import.meta.env.VITE_API_URL.replace(/\/api$/, '')

function resolveStorageUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return backendBase + url
}

// ─── Estado listado ───────────────────────────────────────────────────────────
const pendientes  = ref([])
const loading     = ref(false)
const error       = ref('')
const sedes       = ref([])
const filters     = reactive({ sede_id: null })
const pagination  = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

// ─── Detalle seleccionado ─────────────────────────────────────────────────────
const selectedRecibo = ref(null)
const actionError    = ref('')

const selectedMp = computed(() =>
  (selectedRecibo.value?.medios_pago ?? []).find(mp => mp.medio_pago === 'transferencia') ?? null
)

function getTransferenciaMp(recibo) {
  return (recibo.medios_pago ?? []).find(mp => mp.medio_pago === 'transferencia') ?? null
}

function bancoNombre(mp) {
  // banco_nombre viene del accessor; banco?.nombre es el objeto completo cargado por la relación
  return mp?.banco_nombre ?? mp?.banco?.nombre ?? null
}

function openDetalle(recibo) {
  selectedRecibo.value = recibo
  actionError.value    = ''
}

function cerrarDetalle() {
  selectedRecibo.value = null
  actionError.value    = ''
}

function isImageUrl(url) {
  return /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url)
}

// ─── Formateo ─────────────────────────────────────────────────────────────────
function formatMoney(val) {
  if (val == null) return '0'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadPendientes(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (filters.sede_id) params.sede_id = filters.sede_id
    const res = await reciboPagoService.getPendientesTransferencia(params)
    pendientes.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar las transferencias pendientes.'
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadPendientes(page)
}

// ─── Aprobar ──────────────────────────────────────────────────────────────────
const aprobandoId        = ref(null)
const showAprobarModal   = ref(false)
const reciboAprobarTarget = ref(null)

function openAprobar(recibo) {
  reciboAprobarTarget.value = recibo
  showAprobarModal.value    = true
}

async function doAprobar() {
  const recibo = reciboAprobarTarget.value
  if (!recibo) return
  aprobandoId.value = recibo.id
  actionError.value = ''
  showAprobarModal.value = false
  try {
    const res = await reciboPagoService.aprobarTransferencia(recibo.id)
    notifySuccess(res.message ?? `Recibo ${res.data?.numero_recibo ?? ''} aprobado correctamente.`)
    pendientes.value = pendientes.value.filter(r => r.id !== recibo.id)
    pagination.total = Math.max(0, pagination.total - 1)
    cerrarDetalle()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al aprobar el recibo.'
  } finally {
    aprobandoId.value = null
    reciboAprobarTarget.value = null
  }
}

// ─── Rechazar ─────────────────────────────────────────────────────────────────
const showRechazarModal = ref(false)
const reciboTarget      = ref(null)
const motivoRechazo     = ref('')
const rechazando        = ref(false)
const modalError        = ref('')

function openRechazar(recibo) {
  reciboTarget.value      = recibo
  motivoRechazo.value     = ''
  modalError.value        = ''
  showRechazarModal.value = true
}

async function confirmRechazar() {
  if (!motivoRechazo.value.trim()) return
  rechazando.value = true
  modalError.value = ''
  try {
    await reciboPagoService.rechazarTransferencia(reciboTarget.value.id, motivoRechazo.value.trim())
    notifySuccess('Recibo rechazado. El cajero fue notificado.')
    pendientes.value = pendientes.value.filter(r => r.id !== reciboTarget.value.id)
    pagination.total = Math.max(0, pagination.total - 1)
    showRechazarModal.value = false
    cerrarDetalle()
  } catch (e) {
    modalError.value = e?.response?.data?.message ?? 'Error al rechazar el recibo.'
  } finally {
    rechazando.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => loadPendientes(1))
</script>
