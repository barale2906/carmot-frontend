<template>
  <div class="flex flex-col gap-6">
    <section aria-labelledby="filtros-turnos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-turnos-heading" class="sr-only">Filtros</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-full sm:w-[200px]">
          <FormSelect v-model="filtros.sede_id" label="Sede:" placeholder="Todas mis sedes" :options="opcionesSede" @change="cargar(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect v-model="filtros.status" label="Estado:" placeholder="Todos" :options="opcionesStatus" @change="cargar(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filtros.fecha_desde" type="date" label="Desde:" @change="cargar(1)" />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormInput v-model="filtros.fecha_hasta" type="date" label="Hasta:" @change="cargar(1)" />
        </div>
      </div>
    </section>

    <section aria-labelledby="listado-turnos-heading">
      <SectionHeader
        id="listado-turnos-heading"
        title="Turnos de caja"
        description="Aperturas y cierres de caja por cajero. Los supervisores ven los turnos de sus sedes."
        class="mb-4"
      />
      <div v-if="cargando" class="rounded-[14px] border border-black/10 bg-white py-16 text-center text-sm text-slate-500">Cargando turnos...</div>
      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{{ error }}</div>
      <DataTable v-else :columns="columnas" :data="turnos" row-key="id" aria-label="Turnos de caja" actions-first>
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status_text'">
            <StatusBadge :label="value + (row.ajustado ? ' (ajustado)' : '')" :variant="varianteStatus(row.status)" />
            <span
              v-if="row.descuadre"
              class="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
              title="El efectivo contado no coincide con el esperado"
            >Descuadre</span>
          </template>
          <template v-else-if="['base_inicial', 'efectivo_contado'].includes(column.key)">
            {{ value == null ? '—' : formatCOP(value) }}
          </template>
          <template v-else-if="column.key === 'diferencia'">
            <span v-if="value != null" :class="value === 0 ? 'text-green-700' : 'font-semibold text-amber-700'">{{ formatCOP(value) }}</span>
            <span v-else>—</span>
          </template>
          <template v-else-if="column.key === 'cajero'">{{ row.cajero?.name }}</template>
          <template v-else-if="column.key === 'sede'">{{ row.sede?.nombre }}</template>
          <template v-else>{{ value ?? '—' }}</template>
        </template>
        <template #actions="{ row }">
          <button type="button" class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Ver detalle" @click="verTurno(row)">
            <NavIcon name="eye" class="size-4" />
          </button>
          <button type="button" class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700" title="Descargar PDF" @click="descargarPdf(row)">
            <NavIcon name="print" class="size-4" />
          </button>
          <button
            v-if="can('fin_ldTurnoAutorizar') && row.status !== STATUS_ABIERTO && row.fecha === hoy"
            type="button"
            class="rounded p-1.5 text-slate-500 hover:bg-blue-100 hover:text-blue-700"
            title="Autorizar nuevo turno hoy"
            @click="abrirAutorizacion(row)"
          >
            <NavIcon name="check" class="size-4" />
          </button>
        </template>
      </DataTable>

      <div v-if="paginacion.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
        <p class="text-sm text-slate-500">Mostrando {{ paginacion.from }}–{{ paginacion.to }} de {{ paginacion.total }} turnos</p>
        <div class="flex gap-2">
          <button type="button" :disabled="paginacion.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40" @click="cargar(paginacion.currentPage - 1)">Anterior</button>
          <button type="button" :disabled="paginacion.currentPage === paginacion.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40" @click="cargar(paginacion.currentPage + 1)">Siguiente</button>
        </div>
      </div>
    </section>

    <!-- Detalle del turno -->
    <ModalBase v-model="mostrarDetalle" size="xl" :title="turno ? `Turno N.° ${turno.id} — ${turno.cajero?.name ?? ''}` : 'Turno'" :description="turno ? `${turno.sede?.nombre} · ${turno.fecha}` : ''">
      <div v-if="!turno" class="py-8 text-center text-sm text-slate-500">Cargando...</div>
      <div v-else class="flex flex-col gap-5 pb-2">
        <div
          v-if="turno.descuadre"
          class="flex items-start gap-3 rounded-lg border-2 border-red-300 bg-red-50 p-4"
          role="alert"
        >
          <NavIcon name="pendientes" class="mt-0.5 size-5 shrink-0 text-red-600" />
          <div class="text-sm text-red-800">
            <p class="font-semibold">
              Descuadre de caja: {{ turno.diferencia < 0 ? 'faltante' : 'sobrante' }} de {{ formatCOP(Math.abs(turno.diferencia)) }}
            </p>
            <p>
              Esperado {{ formatCOP(turno.efectivo_esperado) }} · contado {{ formatCOP(turno.efectivo_contado) }}.
              Quien aprueba decide si acepta el cierre o lo rechaza para que el cajero vuelva a contar.
            </p>
          </div>
        </div>

        <dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt class="text-xs text-slate-500">Estado</dt><dd>{{ turno.status_text }}{{ turno.ajustado ? ' (ajustado)' : '' }}</dd></div>
          <div><dt class="text-xs text-slate-500">Apertura</dt><dd>{{ turno.abierto_at }}</dd></div>
          <div><dt class="text-xs text-slate-500">Cierre</dt><dd>{{ turno.cerrado_at ?? '—' }}</dd></div>
          <div><dt class="text-xs text-slate-500">Cerrado por</dt><dd>{{ turno.cerrado_por?.name ?? '—' }}</dd></div>
          <div><dt class="text-xs text-slate-500">Efectivo contado</dt><dd>{{ turno.efectivo_contado == null ? '—' : formatCOP(turno.efectivo_contado) }}</dd></div>
          <div v-if="turno.efectivo_esperado !== undefined"><dt class="text-xs text-slate-500">Efectivo esperado</dt><dd>{{ turno.efectivo_esperado == null ? '—' : formatCOP(turno.efectivo_esperado) }}</dd></div>
          <div v-if="turno.diferencia !== undefined">
            <dt class="text-xs text-slate-500">Diferencia</dt>
            <dd :class="turno.diferencia ? 'font-semibold text-amber-700' : ''">{{ turno.diferencia == null ? '—' : formatCOP(turno.diferencia) }}</dd>
          </div>
          <div><dt class="text-xs text-slate-500">Aprobado por</dt><dd>{{ turno.aprobado_por?.name ?? '—' }}<template v-if="turno.aprobado_at"> · {{ turno.aprobado_at }}</template></dd></div>
          <div class="col-span-2"><dt class="text-xs text-slate-500">Observaciones del cajero</dt><dd>{{ turno.observaciones_cierre ?? '—' }}</dd></div>
          <div v-if="turno.observaciones_aprobacion" class="col-span-2"><dt class="text-xs text-slate-500">Observaciones de aprobación</dt><dd>{{ turno.observaciones_aprobacion }}</dd></div>
        </dl>

        <ResumenTurno :resumen="turno.resumen" :medios="catalogos.medios_pago ?? {}" />

        <section aria-label="Bitácora">
          <h3 class="mb-2 text-sm font-semibold text-slate-900">Bitácora</h3>
          <ol class="flex flex-col gap-2 text-sm">
            <li v-for="e in turno.eventos ?? []" :key="e.id" class="rounded-lg border border-slate-100 px-3 py-2">
              <p class="font-medium text-slate-800">{{ etiquetaAccion(e.accion) }} · {{ e.usuario ?? '—' }} · <span class="font-normal text-slate-500">{{ e.created_at }}</span></p>
              <p v-if="e.motivo" class="text-slate-600">{{ e.motivo }}</p>
            </li>
          </ol>
        </section>

        <p
          v-if="can('fin_ldCierreAprobar') && turno.status === STATUS_POR_APROBAR && esCierrePropio"
          class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
        >
          Este cierre es suyo: debe aprobarlo o rechazarlo otra persona con el permiso correspondiente.
        </p>
        <section
          v-else-if="can('fin_ldCierreAprobar') && turno.status === STATUS_POR_APROBAR"
          class="flex flex-col gap-2 rounded-lg border border-blue-200 p-3"
          aria-label="Aprobación del cierre"
        >
          <p class="text-sm font-medium text-blue-900">
            Revise el arqueo. Al aprobar, el cierre queda definitivo; al rechazar, el turno se reabre para que el cajero corrija o vuelva a contar.
          </p>
          <FormTextarea v-model="revision.texto" label="Observaciones (obligatorio para rechazar, mínimo 5 caracteres)" :rows="2" />
          <div class="flex justify-end gap-2">
            <button
              type="button"
              :disabled="revisando"
              class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              @click="rechazar"
            >
              Rechazar cierre
            </button>
            <button
              type="button"
              :disabled="revisando"
              class="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              @click="aprobar"
            >
              {{ revisando ? 'Guardando...' : 'Aprobar cierre' }}
            </button>
          </div>
        </section>

        <form
          v-if="can('fin_ldTurnoReversar') && turno.status === STATUS_CERRADO"
          class="flex flex-col gap-2 rounded-lg border border-amber-200 p-3"
          @submit.prevent="reversar"
        >
          <p class="text-sm font-medium text-amber-800">Reversar cierre aprobado: el turno se reabre y sus recibos vuelven a estado Creado para corregirlos.</p>
          <FormTextarea v-model="motivoReversion" label="Motivo (mínimo 5 caracteres)" :rows="2" />
          <button
            type="submit"
            :disabled="reversando"
            class="self-end rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {{ reversando ? 'Reversando...' : 'Reversar cierre' }}
          </button>
        </form>
        <p v-if="errorDetalle" class="text-sm text-red-600">{{ errorDetalle }}</p>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200" @click="mostrarDetalle = false">Cerrar</button>
      </template>
    </ModalBase>

    <!-- Autorización de nuevo turno -->
    <ModalBase v-model="mostrarAutorizacion" title="Autorizar nuevo turno" :description="autorizacion.cajero ? `${autorizacion.cajero.name} podrá abrir otro turno hoy (un solo uso).` : ''">
      <form class="flex flex-col gap-3 pb-2" @submit.prevent="autorizar">
        <FormTextarea v-model="autorizacion.motivo" label="Motivo (mínimo 5 caracteres)" :rows="2" />
        <p v-if="errorAutorizacion" class="text-sm text-red-600">{{ errorAutorizacion }}</p>
      </form>
      <template #footer>
        <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200" @click="mostrarAutorizacion = false">Cancelar</button>
        <button
          type="button"
          :disabled="autorizando"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d] disabled:opacity-50"
          @click="autorizar"
        >
          {{ autorizando ? 'Autorizando...' : 'Autorizar' }}
        </button>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import DataTable from '@/components/activos/DataTable.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import ResumenTurno from '@/components/financiero/libroDiario/ResumenTurno.vue'
import libroDiarioService from '@/services/libroDiarioService.js'
import { authService } from '@/services/authService.js'
import { usePermisos } from '@/composables/usePermisos.js'
import { useNotification } from '@/composables/useNotification.js'
import { useConfirm } from '@/composables/useConfirm.js'
import { descargarBlob, mensajeErrorBlob } from '@/utils/descargas.js'
import { formatCOP, validarMotivo } from '@/utils/libroDiario.js'

/**
 * Historial de turnos de caja: detalle con arqueo y bitácora, aprobación o rechazo
 * de cierres pendientes, PDF del cierre, reversión del cierre aprobado y
 * autorización para que un cajero abra otro turno el mismo día.
 */
const { can, loadPermisos } = usePermisos()
const { confirm } = useConfirm()

/** Usuario autenticado: nadie aprueba ni rechaza su propio cierre. */
const usuarioId = ref(null)
const esCierrePropio = computed(() => !!turno.value
  && [turno.value.cajero_id, turno.value.cerrado_por?.id].includes(usuarioId.value))
const notify = useNotification()

const hoy = new Date().toLocaleDateString('en-CA')
const catalogos = ref({})
const filtros = reactive({ sede_id: '', status: '', fecha_desde: '', fecha_hasta: '' })
const opcionesSede = computed(() => (catalogos.value.sedes ?? []).map((s) => ({ value: s.id, label: s.nombre })))
const opcionesStatus = computed(() => Object.entries(catalogos.value.status_turno ?? {}).map(([value, label]) => ({ value, label })))

const columnas = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'sede', label: 'Sede' },
  { key: 'cajero', label: 'Cajero' },
  { key: 'base_inicial', label: 'Base' },
  { key: 'efectivo_contado', label: 'Contado' },
  { key: 'diferencia', label: 'Diferencia' },
  { key: 'status_text', label: 'Estado' },
]

const turnos = ref([])
const cargando = ref(false)
const error = ref('')
const paginacion = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

async function cargar(page = 1) {
  cargando.value = true
  error.value = ''
  try {
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
    const res = await libroDiarioService.getTurnos({ ...params, page })
    turnos.value = res.data ?? []
    Object.assign(paginacion, {
      currentPage: res.meta?.current_page ?? 1,
      lastPage: res.meta?.last_page ?? 1,
      total: res.meta?.total ?? 0,
      from: res.meta?.from ?? 0,
      to: res.meta?.to ?? 0,
    })
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los turnos.'
  } finally {
    cargando.value = false
  }
}

/** Estados del turno (coinciden con LdTurnoCaja del backend). */
const STATUS_ABIERTO = 0
const STATUS_CERRADO = 1
const STATUS_POR_APROBAR = 2

const varianteStatus = (status) => ({
  [STATUS_ABIERTO]: 'disponible',
  [STATUS_POR_APROBAR]: 'mantenimiento',
  [STATUS_CERRADO]: 'inactivo',
}[status] ?? 'inactivo')

const etiquetaAccion = (accion) => ({
  apertura: 'Apertura',
  cierre: 'Cierre enviado a aprobación',
  aprobacion: 'Cierre aprobado',
  rechazo: 'Cierre rechazado',
  reversion: 'Reversión del cierre',
  anulacion: 'Anulación posterior al cierre',
}[accion] ?? accion)

// ─── Detalle y reversión ──────────────────────────────────────────────────────
const mostrarDetalle = ref(false)
const turno = ref(null)
const motivoReversion = ref('')
const reversando = ref(false)
const errorDetalle = ref('')

// ─── Aprobación ───────────────────────────────────────────────────────────────
const revision = reactive({ texto: '' })
const revisando = ref(false)

async function aprobar() {
  if (turno.value.descuadre) {
    const aceptar = await confirm(
      `El cierre tiene un ${turno.value.diferencia < 0 ? 'faltante' : 'sobrante'} de ${formatCOP(Math.abs(turno.value.diferencia))}. ¿Desea aprobarlo de todas formas?`,
      { title: 'Aprobar cierre con descuadre', confirmLabel: 'Aprobar con descuadre' }
    )
    if (!aceptar) return
  }
  revisando.value = true
  errorDetalle.value = ''
  try {
    await libroDiarioService.aprobarTurno(turno.value.id, revision.texto || null)
    notify.success('Cierre de caja aprobado.')
    await verTurno(turno.value)
    cargar(paginacion.currentPage)
  } catch (e) {
    errorDetalle.value = e?.response?.data?.message ?? 'No se pudo aprobar el cierre.'
  } finally {
    revisando.value = false
  }
}

async function rechazar() {
  errorDetalle.value = validarMotivo(revision.texto) ?? ''
  if (errorDetalle.value) return
  revisando.value = true
  try {
    await libroDiarioService.rechazarTurno(turno.value.id, revision.texto)
    notify.success('Cierre rechazado. El turno quedó abierto para el cajero.')
    await verTurno(turno.value)
    cargar(paginacion.currentPage)
  } catch (e) {
    errorDetalle.value = e?.response?.data?.errors?.motivo?.[0] ?? e?.response?.data?.message ?? 'No se pudo rechazar el cierre.'
  } finally {
    revisando.value = false
  }
}

async function verTurno(row) {
  turno.value = null
  revision.texto = ''
  motivoReversion.value = ''
  errorDetalle.value = ''
  mostrarDetalle.value = true
  try {
    turno.value = (await libroDiarioService.getTurno(row.id)).data
  } catch (e) {
    errorDetalle.value = e?.response?.data?.message ?? 'No se pudo cargar el turno.'
  }
}

async function reversar() {
  errorDetalle.value = validarMotivo(motivoReversion.value) ?? ''
  if (errorDetalle.value) return
  reversando.value = true
  try {
    await libroDiarioService.reversarTurno(turno.value.id, motivoReversion.value)
    notify.success('Cierre reversado. El turno quedó abierto para corrección.')
    await verTurno(turno.value)
    cargar(paginacion.currentPage)
  } catch (e) {
    errorDetalle.value = e?.response?.data?.message ?? 'No se pudo reversar el cierre.'
  } finally {
    reversando.value = false
  }
}

async function descargarPdf(row) {
  try {
    const res = await libroDiarioService.pdfTurno(row.id)
    descargarBlob(res.data, `cierre-caja-${row.id}.pdf`, 'application/pdf')
  } catch (e) {
    notify.error(await mensajeErrorBlob(e, 'No se pudo descargar el PDF.'))
  }
}

// ─── Autorización ─────────────────────────────────────────────────────────────
const mostrarAutorizacion = ref(false)
const autorizacion = reactive({ cajero: null, motivo: '' })
const autorizando = ref(false)
const errorAutorizacion = ref('')

function abrirAutorizacion(row) {
  autorizacion.cajero = row.cajero
  autorizacion.motivo = ''
  errorAutorizacion.value = ''
  mostrarAutorizacion.value = true
}

async function autorizar() {
  errorAutorizacion.value = validarMotivo(autorizacion.motivo) ?? ''
  if (errorAutorizacion.value) return
  autorizando.value = true
  try {
    await libroDiarioService.autorizarTurno({ cajero_id: autorizacion.cajero.id, motivo: autorizacion.motivo })
    notify.success(`${autorizacion.cajero.name} puede abrir un nuevo turno hoy.`)
    mostrarAutorizacion.value = false
  } catch (e) {
    const errores = e?.response?.data?.errors
    errorAutorizacion.value = errores ? Object.values(errores).flat()[0] : (e?.response?.data?.message ?? 'No se pudo autorizar.')
  } finally {
    autorizando.value = false
  }
}

onMounted(async () => {
  await loadPermisos()
  try {
    usuarioId.value = (await authService.getUser())?.id ?? null
  } catch { /* sin usuario: el backend igual impide aprobar el cierre propio */ }
  try {
    catalogos.value = (await libroDiarioService.getFilters()).data ?? {}
  } catch { /* sin opciones de filtro */ }
  cargar(1)
})
</script>
