<template>
  <div class="flex flex-col gap-6">
    <!-- Avisos del cierre: fuera de la cadena v-if/v-else del contenido para mostrarse junto a él -->
    <div
      v-if="!cargando && meta.cierre_por_aprobar"
      class="rounded-[14px] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
      role="status"
    >
      Su cierre de caja N.° {{ meta.cierre_por_aprobar.id }} ({{ meta.cierre_por_aprobar.fecha?.slice(0, 10) }}) está pendiente de aprobación.
    </div>
    <div
      v-if="!cargando && turno && meta.cierre_rechazado"
      class="rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      role="alert"
    >
      <strong>Su cierre fue rechazado:</strong> {{ meta.cierre_rechazado.motivo }}. Corrija lo necesario y vuelva a cerrar la caja.
    </div>

    <div v-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-16 text-center text-sm text-slate-500">
      Cargando turno de caja...
    </div>

    <div v-else-if="errorTurno" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
      <p class="text-sm text-red-700">{{ errorTurno }}</p>
    </div>

    <!-- Sin turno: apertura con base inicial -->
    <section
      v-else-if="!turno"
      aria-labelledby="abrir-turno-heading"
      class="rounded-[14px] border border-black/10 bg-white p-6"
    >
      <SectionHeader
        id="abrir-turno-heading"
        title="Abrir turno de caja"
        description="Registre la base inicial de efectivo antes de generar cualquier pago."
        class="mb-4"
      />

      <div v-if="!meta.puede_abrir" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {{ meta.motivo_no_puede }}
      </div>

      <form v-else class="grid max-w-xl grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="abrirTurno">
        <FormSelect
          v-model="apertura.sede_id"
          label="Sede"
          required
          :options="meta.sedes_disponibles.map((s) => ({ value: s.id, label: s.nombre }))"
          :error="erroresApertura.sede_id?.[0]"
        />
        <FormInput
          v-model="apertura.base_inicial"
          type="number"
          min="0"
          label="Base inicial (efectivo)"
          required
          hint="Si no recibe dinero para iniciar, registre 0."
          :error="erroresApertura.base_inicial?.[0]"
        />
        <p v-if="erroresApertura.turno" class="text-sm text-red-600 md:col-span-2">{{ erroresApertura.turno[0] }}</p>
        <div class="md:col-span-2">
          <button
            type="submit"
            :disabled="abriendo"
            class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {{ abriendo ? 'Abriendo...' : 'Abrir turno' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Turno abierto -->
    <template v-else>
      <section aria-labelledby="turno-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
          <SectionHeader
            id="turno-heading"
            :title="`Turno N.° ${turno.id} — ${turno.sede?.nombre ?? ''}`"
            :description="`Abierto el ${turno.abierto_at} con base de ${formatCOP(turno.base_inicial)}`"
          />
          <div class="flex flex-wrap gap-2">
            <button
              v-if="can('fin_ldRegistroCrear')"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 text-sm font-medium text-white hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="nuevoMovimiento"
            >
              <NavIcon name="plus" class="size-4" />
              Movimiento
            </button>
            <button
              v-if="can('fin_ldRegistroCrear')"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="nuevaConsignacion"
            >
              <NavIcon name="account_balance" class="size-4" />
              Consignación
            </button>
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="descargarArqueo"
            >
              <NavIcon name="print" class="size-4" />
              Arqueo PDF
            </button>
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="abrirCierre"
            >
              Cerrar caja
            </button>
          </div>
        </div>

        <ResumenTurno :resumen="turno.resumen" :medios="filtros.medios_pago ?? {}" />
      </section>

      <section aria-labelledby="registros-turno-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <SectionHeader
          id="registros-turno-heading"
          title="Registros del turno"
          description="Movimientos y consignaciones registrados en este turno. Haga clic para ver el detalle, soportes o anular."
          class="mb-4"
        />
        <FormTabs v-model="pestana" :tabs="[{ value: 'movimientos', label: 'Movimientos' }, { value: 'consignaciones', label: 'Consignaciones' }]" />

        <ul v-if="registrosVisibles.length" class="mt-3 divide-y divide-slate-100">
          <li v-for="r in registrosVisibles" :key="r.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-2 py-2.5 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="verDetalle(r)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium" :class="r.status === 2 ? 'text-slate-400 line-through' : 'text-slate-900'">
                  {{ pestana === 'movimientos' ? `${r.tipo_movimiento?.nombre} · ${r.tercero_nombre}` : `${r.banco?.nombre} · ${r.titular}` }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ pestana === 'movimientos' ? `${r.clase_text} · ${r.medio_pago_text}` : (r.numero_comprobante ?? 'Sin comprobante') }}
                  · {{ r.soportes_count ?? 0 }} soporte(s) · {{ r.status_text }}
                </p>
              </div>
              <span class="text-sm font-semibold text-slate-900">{{ formatCOP(r.valor_total ?? r.valor) }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-slate-400">Sin registros en este turno.</p>
      </section>
    </template>

    <MovimientoFormModal
      v-model="mostrarMovimiento"
      :movimiento="movimientoEditando"
      :filtros="filtros"
      :tipos-movimiento="tiposMovimiento"
      :impuestos="impuestos"
      :bancos="bancos"
      :permitir-otros-medios="can('fin_ldMedioPagoOtros')"
      @guardado="onGuardado('Movimiento', $event.soportesFallidos)"
    />

    <ConsignacionFormModal
      v-model="mostrarConsignacion"
      :consignacion="consignacionEditando"
      :bancos="bancos"
      @guardado="onGuardado('Consignación', $event.comprobanteFallido ? ['comprobante'] : [])"
    />

    <RegistroDetalleModal
      v-model="mostrarDetalle"
      :tipo="detalle.tipo"
      :registro-id="detalle.id"
      :tipos-soporte="filtros.tipos_soporte ?? {}"
      :puede-editar="can('fin_ldRegistroEditar')"
      :puede-subir-soportes="can('fin_ldRegistroCrear')"
      :puede-anular="can('fin_ldRegistroAnular')"
      :puede-anular-cerrado="can('fin_ldAnularCerrado')"
      @editar="editarRegistro"
      @cambio="recargar"
    />

    <!-- Cierre de caja -->
    <ModalBase v-model="mostrarCierre" title="Cerrar caja" description="Cuente el efectivo que tiene en caja y regístrelo. El cierre quedará pendiente de aprobación y no podrá generar más pagos hoy sin autorización.">
      <form class="flex flex-col gap-4 pb-2" @submit.prevent="cerrarCaja">
        <FormInput
          v-model="cierre.efectivo_contado"
          type="number"
          min="0"
          label="Efectivo contado"
          required
          :error="erroresCierre.efectivo_contado?.[0]"
        />
        <FormTextarea v-model="cierre.observaciones" label="Observaciones" :rows="2" />
        <p v-if="errorCierre" class="text-sm text-red-600">{{ errorCierre }}</p>
      </form>
      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="mostrarCierre = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="cerrando || cierre.efectivo_contado === ''"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="cerrarCaja"
        >
          {{ cerrando ? 'Cerrando...' : 'Cerrar caja' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormTabs from '@/components/forms/FormTabs.vue'
import ResumenTurno from '@/components/financiero/libroDiario/ResumenTurno.vue'
import MovimientoFormModal from '@/components/financiero/libroDiario/MovimientoFormModal.vue'
import ConsignacionFormModal from '@/components/financiero/libroDiario/ConsignacionFormModal.vue'
import RegistroDetalleModal from '@/components/financiero/libroDiario/RegistroDetalleModal.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import bancoService from '@/services/bancoService.js'
import { useTurnoCaja } from '@/composables/useTurnoCaja.js'
import { usePermisos } from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import { formatCOP } from '@/utils/libroDiario.js'

/**
 * Mi caja: el cajero abre su turno con la base inicial, registra movimientos y
 * consignaciones y cierra la caja con conteo ciego (no ve el efectivo esperado);
 * el cierre queda pendiente de aprobación.
 */
const { turno, meta, cargando, error: errorTurno, cargarTurno } = useTurnoCaja()
const { can, loadPermisos } = usePermisos()
const notify = useNotification()

const filtros = ref({})
const tiposMovimiento = ref([])
const impuestos = ref([])
const bancos = ref([])

async function cargarCatalogos() {
  const [f, t, i, b] = await Promise.allSettled([
    libroDiarioService.getFilters(),
    libroDiarioService.getCatalogoActivos('tipos-movimiento'),
    libroDiarioService.getCatalogoActivos('impuestos'),
    bancoService.getActivos(),
  ])
  filtros.value = f.value?.data ?? {}
  tiposMovimiento.value = t.value?.data ?? []
  impuestos.value = i.value?.data ?? []
  bancos.value = b.value?.data ?? []
}

// ─── Apertura ─────────────────────────────────────────────────────────────────
const apertura = reactive({ sede_id: '', base_inicial: '' })
const erroresApertura = ref({})
const abriendo = ref(false)

async function abrirTurno() {
  abriendo.value = true
  erroresApertura.value = {}
  try {
    await libroDiarioService.abrirTurno({ ...apertura })
    notify.success('Turno de caja abierto.')
    await recargar()
  } catch (e) {
    erroresApertura.value = e?.response?.data?.errors ?? { turno: [e?.response?.data?.message ?? 'No se pudo abrir el turno.'] }
  } finally {
    abriendo.value = false
  }
}

// ─── Registros del turno ──────────────────────────────────────────────────────
const pestana = ref('movimientos')
const movimientos = ref([])
const consignaciones = ref([])
const registrosVisibles = computed(() => (pestana.value === 'movimientos' ? movimientos.value : consignaciones.value))

async function cargarRegistros() {
  if (!turno.value) return
  const params = { turno_caja_id: turno.value.id, per_page: 100 }
  const [m, c] = await Promise.allSettled([
    libroDiarioService.getMovimientos(params),
    libroDiarioService.getConsignaciones(params),
  ])
  movimientos.value = m.value?.data ?? []
  consignaciones.value = c.value?.data ?? []
}

async function recargar() {
  await cargarTurno()
  await cargarRegistros()
}

const mostrarMovimiento = ref(false)
const movimientoEditando = ref(null)
const mostrarConsignacion = ref(false)
const consignacionEditando = ref(null)
const mostrarDetalle = ref(false)
const detalle = reactive({ tipo: 'movimiento', id: null })

function nuevoMovimiento() {
  movimientoEditando.value = null
  mostrarMovimiento.value = true
}

function nuevaConsignacion() {
  consignacionEditando.value = null
  mostrarConsignacion.value = true
}

function verDetalle(registro) {
  detalle.tipo = pestana.value === 'movimientos' ? 'movimiento' : 'consignacion'
  detalle.id = registro.id
  mostrarDetalle.value = true
}

function editarRegistro(registro) {
  mostrarDetalle.value = false
  if (detalle.tipo === 'movimiento') {
    movimientoEditando.value = registro
    mostrarMovimiento.value = true
  } else {
    consignacionEditando.value = registro
    mostrarConsignacion.value = true
  }
}

function onGuardado(etiqueta, soportesFallidos) {
  notify.success(`${etiqueta} guardado(a) correctamente.`)
  if (soportesFallidos.length) {
    notify.warning(`No se pudieron cargar: ${soportesFallidos.join(', ')}. Cárguelos desde el detalle.`)
  }
  recargar()
}

// ─── Cierre ───────────────────────────────────────────────────────────────────
const mostrarCierre = ref(false)
const cierre = reactive({ efectivo_contado: '', observaciones: '' })
const erroresCierre = ref({})
const errorCierre = ref('')
const cerrando = ref(false)

async function abrirCierre() {
  await cargarTurno()
  cierre.efectivo_contado = ''
  cierre.observaciones = ''
  erroresCierre.value = {}
  errorCierre.value = ''
  mostrarCierre.value = true
}

async function cerrarCaja() {
  cerrando.value = true
  errorCierre.value = ''
  const id = turno.value.id
  try {
    await libroDiarioService.cerrarTurno(id, { ...cierre })
    mostrarCierre.value = false
    notify.success('Cierre enviado para aprobación. Se descargará el comprobante.')
    await descargarPdf(id)
    await recargar()
  } catch (e) {
    erroresCierre.value = e?.response?.data?.errors ?? {}
    errorCierre.value = e?.response?.data?.message ?? 'No se pudo cerrar la caja.'
  } finally {
    cerrando.value = false
  }
}

async function descargarPdf(id) {
  try {
    const res = await libroDiarioService.pdfTurno(id)
    descargarBlob(res.data, `cierre-caja-${id}.pdf`, 'application/pdf')
  } catch (e) {
    notify.error(await mensajeErrorBlob(e, 'No se pudo descargar el PDF.'))
  }
}

const descargarArqueo = () => descargarPdf(turno.value.id)

onMounted(async () => {
  await Promise.all([loadPermisos(), cargarCatalogos(), cargarTurno()])
  await cargarRegistros()
})
</script>
