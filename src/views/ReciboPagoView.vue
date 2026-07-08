<template>
  <div class="flex flex-col gap-6">

    <!-- ── Encabezado institucional ──────────────────────────────────────────── -->
    <div class="flex items-center gap-4 border-b border-black/10 pb-4">
      <Logo size="small" class="size-14 shrink-0" />
      <div>
        <h3 class="text-base font-semibold text-[#213360]">Centro de Capacitaciones CARMOT</h3>
        <p class="text-xs text-slate-500">NIT: 1.048.849.874-0</p>
      </div>
    </div>

    <!-- ── Paso 1: Buscar estudiante ─────────────────────────────────────────── -->
    <section v-if="!estudiantePrecargado" class="rounded-[10px] border border-black/10 bg-white px-6 py-5">
      <h3 class="mb-4 text-sm font-semibold text-[#213360]">Buscar estudiante</h3>
      <div class="flex gap-3">
        <div class="flex-1">
          <FormInputSearch
            v-model="busqueda"
            label="Nombre o documento"
            placeholder="Ej: Juan Pérez o 1234567890"
            help="Busca por nombre, apellido o número de documento."
            @input="onBusquedaInput"
          />
        </div>
        <div class="flex items-end">
          <button
            type="button"
            :disabled="buscando || busqueda.length < 3"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="buscarEstudiante"
          >
            {{ buscando ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
      </div>
      <div v-if="resultadosBusqueda.length" class="mt-3 overflow-hidden rounded-lg border border-black/10">
        <button
          v-for="est in resultadosBusqueda"
          :key="est.id"
          type="button"
          class="flex w-full items-center justify-between border-b border-black/5 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-blue-500"
          @click="seleccionarEstudiante(est)"
        >
          <span class="font-medium text-slate-900">{{ est.name ?? [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' ') }}</span>
          <span class="text-xs text-slate-500">{{ est.documento ?? est.email }}</span>
        </button>
      </div>
      <p v-else-if="sinResultados" class="mt-3 text-sm text-slate-500">
        No se encontraron estudiantes. Intenta con otro término.
      </p>
    </section>

    <!-- ── Info del estudiante seleccionado ──────────────────────────────────── -->
    <section v-if="estudiante" class="rounded-[10px] border border-black/10 bg-slate-50 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Estudiante</p>
          <p class="mt-0.5 text-base font-semibold text-slate-900">{{ estudiante.nombre }}</p>
          <p class="text-sm text-slate-600">{{ estudiante.documento }}</p>
        </div>
        <button
          v-if="!estudiantePrecargado"
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="cambiarEstudiante"
        >
          Cambiar estudiante
        </button>
      </div>
    </section>

    <!-- ── Paso 2: Deudas del estudiante ─────────────────────────────────────── -->
    <section v-if="estudiante && !deudaSeleccionada">
      <h3 class="mb-3 text-sm font-semibold text-slate-700">Selecciona el programa a pagar</h3>
      <div v-if="cargandoDeudas" class="rounded-[10px] border border-black/10 bg-white py-8 text-center text-sm text-slate-500">
        Cargando obligaciones...
      </div>
      <div v-else-if="errorDeudas" class="rounded-[10px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
        {{ errorDeudas }}
        <button type="button" class="ml-2 underline" @click="cargarDeudas">Reintentar</button>
      </div>
      <div v-else-if="deudas.length === 0" class="rounded-[10px] border border-black/10 bg-white py-8 text-center text-sm text-slate-500">
        El estudiante no tiene obligaciones activas.
      </div>
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="deuda in deudas"
          :key="deuda.matricula_id"
          type="button"
          class="rounded-[10px] border border-black/10 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="seleccionarDeuda(deuda)"
        >
          <p class="text-sm font-semibold text-slate-900">{{ deuda.curso ?? `Matrícula #${deuda.matricula_id}` }}</p>
          <p class="mt-1 text-xs text-slate-500">ID matrícula: {{ deuda.matricula_id }}</p>
          <p class="mt-2 text-base font-bold text-amber-700">$ {{ formatMoney(deuda.total_saldo) }}</p>
          <p class="text-xs text-slate-500">Saldo pendiente</p>
        </button>
      </div>
    </section>

    <!-- ── Formulario principal ───────────────────────────────────────────────── -->
    <template v-if="deudaSeleccionada">

      <!-- Programa seleccionado -->
      <section class="rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-blue-600">Programa seleccionado</p>
            <p class="text-sm font-semibold text-slate-900">{{ deudaSeleccionada.curso ?? `Matrícula #${deudaSeleccionada.matricula_id}` }}</p>
          </div>
          <button
            v-if="!matriculaPrecargada"
            type="button"
            class="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="cambiarDeuda"
          >
            Cambiar
          </button>
        </div>
      </section>

      <!-- ── Vista dividida: pendientes | ítems cargados ───────────────────── -->
      <div class="grid gap-4 lg:grid-cols-2">

        <!-- Panel izquierdo: obligaciones pendientes -->
        <section class="rounded-[10px] border border-black/10 bg-white px-5 py-4">
          <h3 class="mb-3 text-sm font-semibold text-[#213360]">Obligaciones pendientes</h3>

          <div v-if="cargandoDetalle" class="py-6 text-center text-sm text-slate-500">Cargando cuotas...</div>

          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr class="border-b border-black/10 bg-slate-100 text-left">
                  <th class="px-2 py-2 font-medium text-slate-600">Concepto</th>
                  <th class="px-2 py-2 font-medium text-slate-600">Vence</th>
                  <th class="px-2 py-2 text-right font-medium text-slate-600">Valor</th>
                  <th class="px-2 py-2 text-right font-medium text-slate-600">Saldo</th>
                  <th class="px-2 py-2 text-center font-medium text-slate-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="cuota in historialCuotas"
                  :key="cuota.id"
                  class="border-b border-black/5"
                  :class="cuotaEsVencida(cuota) ? 'bg-red-50' : 'bg-white'"
                >
                  <td class="px-2 py-2 font-medium text-slate-800">
                    {{ cuota.numero_cuota === 0 ? 'Matrícula' : `Cuota ${cuota.numero_cuota}` }}
                  </td>
                  <td class="px-2 py-2 text-slate-600">{{ cuota.fecha_vencimiento ?? '—' }}</td>
                  <td class="px-2 py-2 text-right font-mono text-slate-700">$ {{ formatMoney(cuota.valor) }}</td>
                  <td class="px-2 py-2 text-right font-mono">
                    <span :class="Number(cuota.saldo) > 0 ? 'font-semibold text-amber-700' : 'text-slate-400'">
                      $ {{ formatMoney(cuota.saldo) }}
                    </span>
                  </td>
                  <td class="px-2 py-2 text-center">
                    <span class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium" :class="badgeCuotaClass(cuota)">
                      {{ cuota.status_text ?? '—' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="historialCuotas.length === 0">
                  <td colspan="5" class="px-2 py-4 text-center text-slate-500">Sin cuotas registradas.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mínimo sugerido -->
          <div v-if="minimoAPagar > 0" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p class="text-xs text-amber-800">
              <strong>Mínimo sugerido: $ {{ formatMoney(minimoAPagar) }}</strong>
              <span class="mt-0.5 block text-[11px] text-amber-700">Corresponde a cuotas vencidas o con vencimiento hoy.</span>
            </p>
          </div>
          <div v-else-if="!cargandoDetalle && historialCuotas.length > 0" class="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
            <p class="text-xs text-green-700">No hay cuotas vencidas. Puedes anticipar la próxima cuota.</p>
          </div>
        </section>

        <!-- Panel derecho: ítems a cobrar en el recibo -->
        <section class="rounded-[10px] border border-black/10 bg-white px-5 py-4">
          <h3 class="mb-3 text-sm font-semibold text-[#213360]">Ítems a cobrar en este recibo</h3>

          <!-- Placeholder antes de calcular -->
          <div
            v-if="!calculado"
            class="flex min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200"
          >
            <p class="px-4 text-center text-sm text-slate-400">
              Ingresa el valor, agrega conceptos opcionales<br>
              y haz clic en <strong class="text-slate-600">Calcular</strong> para previsualizar.
            </p>
          </div>

          <!-- Lista calculada -->
          <div v-else>
            <div v-if="itemsCargados.length === 0" class="py-4 text-center text-sm text-slate-500">
              El monto ingresado no cubre ningún ítem pendiente.
            </div>
            <div v-else class="divide-y divide-black/5">
              <template v-for="(item, i) in itemsCargados" :key="i">
                <!-- Ítem de cartera o concepto -->
                <div
                  v-if="item.tipo !== 'descuento'"
                  class="flex items-center justify-between py-2.5"
                >
                  <div>
                    <!-- Para cuotas: muestra el concepto estándar como título y el detalle de cuota como subtítulo -->
                    <template v-if="item.tipo === 'cuota'">
                      <p class="text-sm font-medium text-slate-800">
                        {{ item.conceptoNombre || item.label }}
                      </p>
                      <p v-if="item.conceptoNombre" class="text-xs text-slate-500">
                        {{ item.label }}
                      </p>
                    </template>
                    <template v-else>
                      <p class="text-sm font-medium text-slate-800">{{ item.label }}</p>
                      <p class="text-xs text-slate-500">
                        {{ item.cantidad }} × $ {{ formatMoney(item.valor) }}
                      </p>
                    </template>
                  </div>
                  <span class="font-mono text-sm font-semibold text-slate-900">$ {{ formatMoney(item.pagado) }}</span>
                </div>

                <!-- Ítem de descuento por pronto pago -->
                <div
                  v-else
                  class="flex items-start justify-between rounded-lg bg-emerald-50 px-2 py-2.5"
                >
                  <div>
                    <p class="text-sm font-semibold text-emerald-700">{{ item.label }}</p>
                    <p class="text-xs text-emerald-600">{{ item.motivo }}</p>
                    <p class="mt-0.5 text-[11px] text-emerald-500">La institución absorbe este valor al generar el recibo.</p>
                  </div>
                  <span class="ml-4 shrink-0 font-mono text-sm font-semibold text-emerald-700">
                    − $ {{ formatMoney(item.valor) }}
                  </span>
                </div>
              </template>
            </div>

            <!-- Total distribución -->
            <div class="mt-3 flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2.5">
              <span class="text-sm font-semibold text-slate-700">Total a cobrar:</span>
              <span class="font-mono text-base font-bold text-[#213360]">$ {{ formatMoney(totalItemsCargados) }}</span>
            </div>

            <!-- Recargo tarjeta (si aplica) -->
            <div
              v-if="recargoTarjeta && (form.medio_pago === 'tarjeta_debito' || form.medio_pago === 'tarjeta_credito')"
              class="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2"
            >
              <template v-if="recargoTarjeta.sobrecargos?.length">
                <div
                  v-for="sc in recargoTarjeta.sobrecargos"
                  :key="sc.descuento_id"
                  class="flex justify-between text-xs"
                >
                  <span class="text-slate-700">{{ sc.nombre }} ({{ sc.porcentaje }}%):</span>
                  <span class="font-mono text-orange-700">+ $ {{ formatMoney(sc.valor_sobrecargo) }}</span>
                </div>
              </template>
              <template v-else>
                <div class="text-xs text-green-700">Sin recargo por tarjeta</div>
              </template>
              <div class="mt-1 flex justify-between border-t border-orange-200 pt-1 text-sm font-bold">
                <span class="text-slate-800">Total final:</span>
                <span class="font-mono text-[#213360]">$ {{ formatMoney(recargoTarjeta.total) }}</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- ── Conceptos adicionales ──────────────────────────────────────────── -->
      <section class="rounded-[10px] border border-black/10 bg-white px-6 py-5">
        <h3 class="mb-1 text-sm font-semibold text-[#213360]">Conceptos adicionales <span class="font-normal text-slate-400">(opcional)</span></h3>
        <p class="mb-4 text-xs text-slate-500">Certificados, copias, constancias u otros cobros que no sean de cartera.</p>

        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[180px]">
            <label class="mb-1 block text-xs font-medium text-slate-700">Concepto</label>
            <select
              v-model="conceptoSeleccionado"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option :value="null" disabled>-- Seleccionar --</option>
              <option v-for="c in conceptosDisponibles" :key="c.id" :value="c">
                {{ c.nombre }} — $ {{ formatMoney(c.valor) }}
              </option>
            </select>
          </div>
          <div class="w-24">
            <label class="mb-1 block text-xs font-medium text-slate-700">Cantidad</label>
            <input
              v-model.number="cantidadConcepto"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            :disabled="!conceptoSeleccionado"
            class="flex h-9 items-center gap-1 rounded-lg bg-slate-700 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="agregarConcepto"
          >
            + Agregar
          </button>
        </div>

        <div v-if="conceptosAdicionales.length" class="mt-4 overflow-hidden rounded-lg border border-black/10">
          <div
            v-for="(ca, idx) in conceptosAdicionales"
            :key="idx"
            class="flex items-center justify-between border-b border-black/5 px-4 py-2.5 last:border-0"
          >
            <div>
              <span class="text-sm font-medium text-slate-800">{{ ca.nombre }}</span>
              <span class="ml-2 text-xs text-slate-500">× {{ ca.cantidad }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-mono text-sm text-slate-700">$ {{ formatMoney(ca.valor * ca.cantidad) }}</span>
              <button
                type="button"
                class="text-xs text-red-500 hover:text-red-700 focus:outline-none"
                @click="quitarConcepto(idx)"
              >
                Quitar
              </button>
            </div>
          </div>
          <div class="flex justify-between bg-slate-50 px-4 py-2">
            <span class="text-xs font-semibold text-slate-600">Subtotal conceptos:</span>
            <span class="font-mono text-sm font-semibold text-slate-800">$ {{ formatMoney(totalConceptosAdicionales) }}</span>
          </div>
        </div>
      </section>

      <!-- ── Detalle del pago ────────────────────────────────────────────────── -->
      <section class="rounded-[10px] border border-black/10 bg-white px-6 py-5">
        <h3 class="mb-4 text-sm font-semibold text-[#213360]">Detalle del pago</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput
            v-model.number="form.monto_a_pagar"
            label="Valor a pagar *"
            type="number"
            min="0"
            step="1"
            :help="minimoAPagar > 0 ? `Mínimo sugerido: $ ${formatMoney(minimoAPagar)}` : 'Monto que entrega el estudiante hoy.'"
            :error="fieldErrors.monto_a_pagar?.[0]"
            required
          />
          <FormInput
            v-model="form.fecha_recibo"
            label="Fecha de pago *"
            type="date"
            help="Día en que se recibe el dinero."
            :error="fieldErrors.fecha_recibo?.[0]"
            required
          />
          <FormSelect
            v-model="form.medio_pago"
            label="Método de pago *"
            help="Medio por el cual paga el estudiante."
            :options="mediosPagoOpciones"
            required
          />
          <div v-if="form.medio_pago === 'tarjeta_debito' || form.medio_pago === 'tarjeta_credito'" class="flex items-end">
            <button
              type="button"
              class="rounded text-sm font-medium text-[#213360] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="modalTarjetaOpen = true"
            >
              Configurar recargo por tarjeta
            </button>
          </div>
          <div v-else-if="form.medio_pago === 'consignacion'" class="flex items-end">
            <button
              type="button"
              class="rounded text-sm font-medium text-[#213360] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="modalConsignacionOpen = true"
            >
              Ingresar datos de consignación
              <span v-if="referenciaConsignacion" class="ml-1 text-xs text-green-600">(✓)</span>
            </button>
          </div>
          <div v-else-if="form.medio_pago === 'transferencia'" class="flex items-end">
            <button
              type="button"
              class="rounded text-sm font-medium text-[#213360] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="modalTransferenciaOpen = true"
            >
              Ingresar datos de transferencia
              <span v-if="referenciaTransferencia" class="ml-1 text-xs text-green-600">(✓)</span>
            </button>
          </div>

          <!-- Responsable: automático, solo lectura -->
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-700">Responsable del recibo</span>
            <div class="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              {{ currentUser?.name ?? '—' }}
            </div>
            <p class="text-xs text-slate-400">Corresponde al usuario conectado al sistema.</p>
          </div>
        </div>
      </section>

      <!-- ── Error general ───────────────────────────────────────────────────── -->
      <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ formError }}
      </div>

      <!-- ── Acciones ────────────────────────────────────────────────────────── -->
      <div class="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 pt-4">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="onCancel"
        >
          Cancelar
        </button>

        <!-- Antes de calcular -->
        <button
          v-if="!calculado"
          type="button"
          :disabled="!puedeCalcular"
          class="flex items-center gap-2 rounded-lg border border-[#213360] px-4 py-2 text-sm font-medium text-[#213360] transition-colors hover:bg-blue-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="calcular"
        >
          Calcular y previsualizar
        </button>

        <!-- Después de calcular -->
        <template v-else>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="recalcular"
          >
            Recalcular
          </button>
          <button
            type="button"
            :disabled="guardando"
            class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="onSubmit"
          >
            <svg v-if="guardando" class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ guardando ? 'Guardando...' : 'Generar recibo' }}
          </button>
        </template>
      </div>

    </template>

    <!-- Modales de métodos de pago -->
    <ModalPagoTarjeta
      v-model="modalTarjetaOpen"
      :medio-pago="form.medio_pago"
      :valor-base="Number(form.monto_a_pagar) || 0"
      @confirm="onConfirmarTarjeta"
    />
    <ModalPagoConsignacion
      v-model="modalConsignacionOpen"
      @confirm="onConfirmarConsignacion"
    />
    <ModalPagoTransferencia
      v-model="modalTransferenciaOpen"
      @confirm="onConfirmarTransferencia"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter }    from 'vue-router'
import Logo                       from '@/components/Logo.vue'
import FormInputSearch             from '@/components/forms/FormInputSearch.vue'
import FormInput                   from '@/components/forms/FormInput.vue'
import FormSelect                  from '@/components/forms/FormSelect.vue'
import ModalPagoTarjeta            from '@/components/ModalPagoTarjeta.vue'
import ModalPagoConsignacion       from '@/components/ModalPagoConsignacion.vue'
import ModalPagoTransferencia      from '@/components/ModalPagoTransferencia.vue'
import userService                 from '@/services/userService.js'
import carteraService              from '@/services/carteraService.js'
import conceptoPagoService         from '@/services/conceptoPagoService.js'
import reciboPagoService           from '@/services/reciboPagoService.js'
import { authService }             from '@/services/authService.js'
import { useNotification }         from '@/composables/useNotification'

const route  = useRoute()
const router = useRouter()
const { success: notifySuccess } = useNotification()

const today = () => new Date().toISOString().substring(0, 10)

// ─── Usuario actual ───────────────────────────────────────────────────────────
const currentUser = ref(null)

// ─── Búsqueda de estudiante ───────────────────────────────────────────────────
const busqueda           = ref('')
const resultadosBusqueda = ref([])
const buscando           = ref(false)
const sinResultados      = ref(false)
let   searchTimer        = null

// ─── Estudiante seleccionado ──────────────────────────────────────────────────
const estudiantePrecargado = ref(false)
const matriculaPrecargada  = ref(false)
const estudiante           = ref(null)   // { id, nombre, documento }

// ─── Deudas del estudiante ────────────────────────────────────────────────────
const deudas         = ref([])
const cargandoDeudas = ref(false)
const errorDeudas    = ref('')

// ─── Deuda seleccionada y detalle de cuotas ──────────────────────────────────
const deudaSeleccionada = ref(null)
const historialCuotas   = ref([])
const cargandoDetalle   = ref(false)
const detalleInfo       = ref(null)

// ─── Conceptos adicionales ────────────────────────────────────────────────────
const conceptosDisponibles  = ref([])
const conceptoCarteraNombre = ref('')   // Nombre del concepto estándar de tipo Cartera (tipo 0)
const conceptoSeleccionado  = ref(null)
const cantidadConcepto      = ref(1)
const conceptosAdicionales  = ref([])   // [{ concepto_id, nombre, valor, cantidad }]

// ─── Distribución previsualizada ──────────────────────────────────────────────
const calculado     = ref(false)
const itemsCargados = ref([])   // [{ tipo, label, valor?, cantidad?, saldo?, pagado }]

// ─── Modales de pago ─────────────────────────────────────────────────────────
const modalTarjetaOpen        = ref(false)
const modalConsignacionOpen   = ref(false)
const modalTransferenciaOpen  = ref(false)
// { sobrecargos: [{descuento_id, ...}], marcaTarjeta, totalSobrecargo, total }
const recargoTarjeta          = ref(null)
const referenciaConsignacion  = ref('')
const referenciaTransferencia = ref('')

// ─── Formulario ──────────────────────────────────────────────────────────────
const form = reactive({
  fecha_recibo:  today(),
  monto_a_pagar: 0,
  medio_pago:    'efectivo',
})

const guardando   = ref(false)
const formError   = ref('')
const fieldErrors = ref({})

const mediosPagoOpciones = [
  { value: 'efectivo',        label: 'Efectivo' },
  { value: 'transferencia',   label: 'Transferencia' },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'cheque',          label: 'Cheque' },
  { value: 'consignacion',    label: 'Consignación' },
]

// ─── Computed ────────────────────────────────────────────────────────────────
/** Cuotas con saldo pendiente, ordenadas de más antigua a más reciente. */
const cuotasPendientes = computed(() =>
  historialCuotas.value
    .filter(c => Number(c.saldo) > 0)
    .sort((a, b) => a.numero_cuota - b.numero_cuota)
)

/** Suma del saldo de cuotas vencidas o con vencimiento hoy — es el mínimo a pagar. */
const minimoAPagar = computed(() => {
  const hoy = today()
  return cuotasPendientes.value
    .filter(c => !c.fecha_vencimiento || c.fecha_vencimiento <= hoy)
    .reduce((sum, c) => sum + Number(c.saldo), 0)
})

const totalConceptosAdicionales = computed(() =>
  conceptosAdicionales.value.reduce((sum, c) => sum + c.valor * c.cantidad, 0)
)

const totalItemsCargados = computed(() =>
  itemsCargados.value
    .filter(i => i.tipo !== 'descuento')
    .reduce((sum, item) => sum + item.pagado, 0)
)

const puedeCalcular = computed(() =>
  Number(form.monto_a_pagar) > 0 && !!form.fecha_recibo
)

// Resetear la previsualización si cambia el monto, fecha o la lista de conceptos
watch(
  [() => form.monto_a_pagar, () => form.fecha_recibo, () => conceptosAdicionales.value.length],
  () => { if (calculado.value) recalcular() }
)

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMoney(val) {
  if (val == null) return '0'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function cuotaEsVencida(cuota) {
  return cuota.fecha_vencimiento && cuota.fecha_vencimiento < today() && Number(cuota.saldo) > 0
}

function badgeCuotaClass(cuota) {
  const s = cuota.status
  if (s === 2) return 'bg-[#213360] text-white'
  if (s === 0 || s === 1) {
    if (cuotaEsVencida(cuota)) return 'bg-red-600 text-white'
    return 'bg-slate-200 text-slate-700'
  }
  if (s === 3) return 'bg-slate-200 text-slate-500'
  return 'bg-slate-100 text-slate-600'
}

// ─── Búsqueda de estudiante ───────────────────────────────────────────────────
function onBusquedaInput() {
  clearTimeout(searchTimer)
  sinResultados.value      = false
  resultadosBusqueda.value = []
  if (busqueda.value.length < 3) return
  searchTimer = setTimeout(buscarEstudiante, 400)
}

async function buscarEstudiante() {
  if (busqueda.value.length < 3) return
  buscando.value           = true
  sinResultados.value      = false
  resultadosBusqueda.value = []
  try {
    const res = await userService.getAll({ search: busqueda.value, per_page: 10 })
    resultadosBusqueda.value = res.data ?? []
    sinResultados.value = resultadosBusqueda.value.length === 0
  } catch {
    sinResultados.value = true
  } finally {
    buscando.value = false
  }
}

function seleccionarEstudiante(est) {
  estudiante.value = {
    id:        est.id,
    nombre:    est.name ?? [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' '),
    documento: est.documento ?? est.email ?? '',
  }
  resultadosBusqueda.value = []
  busqueda.value           = ''
  cargarDeudas()
}

function cambiarEstudiante() {
  estudiante.value        = null
  deudaSeleccionada.value = null
  historialCuotas.value   = []
  deudas.value            = []
  resetForm()
}

// ─── Deudas ──────────────────────────────────────────────────────────────────
async function cargarDeudas() {
  if (!estudiante.value?.id) return
  cargandoDeudas.value = true
  errorDeudas.value    = ''
  deudas.value         = []
  try {
    const res = await carteraService.getDeudasEstudiante({ estudiante_id: estudiante.value.id })
    deudas.value = res.data ?? []
  } catch (e) {
    errorDeudas.value = e?.response?.data?.message ?? 'Error al cargar las obligaciones del estudiante.'
  } finally {
    cargandoDeudas.value = false
  }
}

async function seleccionarDeuda(deuda) {
  deudaSeleccionada.value = deuda
  await cargarDetalleDeuda(deuda.matricula_id)
  // Precargar con el mínimo sugerido; si no hay mora, con el saldo total
  form.monto_a_pagar = minimoAPagar.value || Number(deuda.total_saldo) || 0
}

function cambiarDeuda() {
  deudaSeleccionada.value = null
  historialCuotas.value   = []
  detalleInfo.value       = null
  resetForm()
}

// ─── Detalle de cuotas ────────────────────────────────────────────────────────
async function cargarDetalleDeuda(matriculaId) {
  cargandoDetalle.value = true
  historialCuotas.value = []
  try {
    const res = await carteraService.getDetalleMatricula({ matricula_id: matriculaId })
    const d   = res.data ?? res
    detalleInfo.value = d
    const vencidas = (d.vencidas ?? []).map(c => ({ ...c, _grupo: 'vencida' }))
    const proximas = (d.proximas ?? []).map(c => ({ ...c, _grupo: 'proxima' }))
    historialCuotas.value = [...vencidas, ...proximas]
  } catch {
    // Fallback: cargar cuotas desde listado general
    try {
      const res2 = await carteraService.getAll({
        matricula_id:   matriculaId,
        per_page:       50,
        sort_by:        'numero_cuota',
        sort_direction: 'asc',
      })
      historialCuotas.value = res2.data ?? []
    } catch {
      historialCuotas.value = []
    }
  } finally {
    cargandoDetalle.value = false
  }
}

// ─── Conceptos adicionales ────────────────────────────────────────────────────
async function cargarConceptos() {
  try {
    const res  = await conceptoPagoService.getAll({ per_page: 200 })
    const todos = res.data ?? []
    // El concepto tipo 0 (Cartera) lo asigna el backend automáticamente; guardamos su nombre para el preview
    const cartera = todos.find(c => c.tipo === 0)
    if (cartera) conceptoCarteraNombre.value = cartera.nombre
    // Solo los no-cartera quedan disponibles para conceptos adicionales
    conceptosDisponibles.value = todos.filter(c => c.tipo !== 0)
  } catch { /* no bloquea el flujo */ }
}

function agregarConcepto() {
  if (!conceptoSeleccionado.value) return
  const existe = conceptosAdicionales.value.find(c => c.concepto_id === conceptoSeleccionado.value.id)
  if (existe) {
    existe.cantidad += cantidadConcepto.value
  } else {
    conceptosAdicionales.value.push({
      concepto_id: conceptoSeleccionado.value.id,
      nombre:      conceptoSeleccionado.value.nombre,
      valor:       Number(conceptoSeleccionado.value.valor),
      cantidad:    cantidadConcepto.value,
    })
  }
  conceptoSeleccionado.value = null
  cantidadConcepto.value     = 1
}

function quitarConcepto(idx) {
  conceptosAdicionales.value.splice(idx, 1)
}

// ─── Distribución cliente (previsualización) ──────────────────────────────────
/**
 * Simula la distribución que hará el backend:
 * primero cubre conceptos adicionales, luego cuotas de más antigua a más reciente.
 */
function calcular() {
  formError.value = ''
  if (!puedeCalcular.value) return

  const monto = Number(form.monto_a_pagar)
  if (monto < totalConceptosAdicionales.value) {
    formError.value = `El valor ($${formatMoney(monto)}) es menor al total de conceptos adicionales ($${formatMoney(totalConceptosAdicionales.value)}).`
    return
  }

  const items = []
  let restante = monto

  for (const ca of conceptosAdicionales.value) {
    if (restante <= 0) break
    const subtotal = ca.valor * ca.cantidad
    const pagado   = Math.min(restante, subtotal)
    items.push({ tipo: 'concepto', label: ca.nombre, valor: ca.valor, cantidad: ca.cantidad, pagado })
    restante -= pagado
  }

  for (const cuota of cuotasPendientes.value) {
    if (restante <= 0) break
    const saldo  = Number(cuota.saldo)
    const pagado = Math.min(restante, saldo)
    items.push({
      tipo:          'cuota',
      label:         cuota.numero_cuota === 0 ? 'Matrícula' : `Cuota ${cuota.numero_cuota}`,
      conceptoNombre: conceptoCarteraNombre.value,
      numero_cuota:  cuota.numero_cuota,
      saldo,
      pagado,
    })
    restante -= pagado
  }

  // Mostrar descuento por pronto pago si aplica (calculado por el backend en detalle-matricula)
  const desc = detalleInfo.value?.descuento_disponible
  if (desc?.aplica && items.some(i => i.tipo === 'cuota')) {
    items.push({
      tipo:    'descuento',
      label:   desc.descuento?.nombre ?? 'Descuento pronto pago',
      motivo:  desc.motivo ?? '',
      valor:   desc.valor,
      pagado:  0,  // no afecta el monto que paga el estudiante; lo absorbe la institución
    })
  }

  itemsCargados.value = items
  calculado.value     = true
}

function recalcular() {
  calculado.value     = false
  itemsCargados.value = []
}

// ─── Modales de pago ─────────────────────────────────────────────────────────
function onConfirmarTarjeta(payload) {
  recargoTarjeta.value = payload  // { sobrecargos, marcaTarjeta, totalSobrecargo, total }
}
function onConfirmarConsignacion(payload)  { referenciaConsignacion.value  = payload.referencia }
function onConfirmarTransferencia(payload) { referenciaTransferencia.value = payload.referencia }

// ─── Envío del recibo ─────────────────────────────────────────────────────────
async function onSubmit() {
  formError.value   = ''
  fieldErrors.value = {}

  if (!deudaSeleccionada.value) {
    formError.value = 'Selecciona una obligación antes de continuar.'
    return
  }
  if (!form.monto_a_pagar || Number(form.monto_a_pagar) <= 0) {
    formError.value = 'El valor a pagar debe ser mayor a cero.'
    return
  }
  if (!calculado.value) {
    formError.value = 'Primero haz clic en "Calcular y previsualizar" para revisar la distribución.'
    return
  }

  const sedeId = historialCuotas.value[0]?.sede_id
    ?? detalleInfo.value?.vencidas?.[0]?.sede_id
    ?? detalleInfo.value?.proximas?.[0]?.sede_id
    ?? null

  const medioPago = form.medio_pago
  let referencia  = null
  if (medioPago === 'consignacion')  referencia = referenciaConsignacion.value  || null
  if (medioPago === 'transferencia') referencia = referenciaTransferencia.value || null

  const esTarjeta = medioPago === 'tarjeta_debito' || medioPago === 'tarjeta_credito'

  // El total bruto incluye el recargo cuando hay sobrecargos configurados
  const montoFinal = esTarjeta && recargoTarjeta.value?.total
    ? recargoTarjeta.value.total
    : Number(form.monto_a_pagar)

  const medioPagoEntry = {
    medio_pago: medioPago,
    valor:      montoFinal,
    ...(referencia ? { referencia } : {}),
    ...(esTarjeta && recargoTarjeta.value?.marcaTarjeta ? { tipo_tarjeta: recargoTarjeta.value.marcaTarjeta } : {}),
  }

  // Sobrecargos seleccionados (solo tarjeta con API de sobrecargos)
  const sobrecargosPayload = (esTarjeta && recargoTarjeta.value?.sobrecargos?.length)
    ? recargoTarjeta.value.sobrecargos.map(sc => ({
        descuento_id:     sc.descuento_id,
        medio_pago_index: 0,
      }))
    : undefined

  const payload = {
    sede_id:           sedeId,
    cajero_id:         currentUser.value?.id ?? null,
    matricula_id:      deudaSeleccionada.value.matricula_id,
    origen:            1,
    fecha_recibo:      form.fecha_recibo,
    fecha_transaccion: form.fecha_recibo,
    monto_a_pagar:     montoFinal,
    aplicar_descuento: true,
    conceptos_adicionales: conceptosAdicionales.value.map(c => ({
      concepto_pago_id: c.concepto_id,
      cantidad:         c.cantidad,
    })),
    medios_pago: [medioPagoEntry],
    ...(sobrecargosPayload ? { sobrecargos: sobrecargosPayload } : {}),
  }

  guardando.value = true
  try {
    const res = await reciboPagoService.create(payload, { _silent: true })
    notifySuccess(`Recibo ${res.data?.numero_recibo ?? ''} generado correctamente.`)
    router.push('/financiero/recibos-pago')
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors  ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los datos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.'
    }
  } finally {
    guardando.value = false
  }
}

function onCancel() {
  router.back()
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetForm() {
  form.fecha_recibo  = today()
  form.monto_a_pagar = 0
  form.medio_pago    = 'efectivo'
  recargoTarjeta.value          = null
  referenciaConsignacion.value  = ''
  referenciaTransferencia.value = ''
  conceptosAdicionales.value    = []
  conceptoSeleccionado.value    = null
  cantidadConcepto.value        = 1
  formError.value               = ''
  fieldErrors.value             = {}
  calculado.value               = false
  itemsCargados.value           = []
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(async () => {
  try { currentUser.value = await authService.getUser() } catch { /* no bloquea */ }
  cargarConceptos()

  const qMatricula  = route.query.matricula_id  ? Number(route.query.matricula_id)  : null
  const qEstudiante = route.query.estudiante_id ? Number(route.query.estudiante_id) : null

  if (!qEstudiante) return

  estudiantePrecargado.value = true
  matriculaPrecargada.value  = Boolean(qMatricula)

  try {
    const res = await userService.getById(qEstudiante)
    const est = res.data ?? res
    estudiante.value = {
      id:        est.id,
      nombre:    est.name ?? [est.primer_nombre, est.primer_apellido].filter(Boolean).join(' '),
      documento: est.documento ?? est.email ?? '',
    }
  } catch {
    estudiante.value = { id: qEstudiante, nombre: `Estudiante #${qEstudiante}`, documento: '' }
  }

  if (qMatricula) {
    deudaSeleccionada.value = { matricula_id: qMatricula, curso: null, total_saldo: 0 }
    await cargarDetalleDeuda(qMatricula)

    if (detalleInfo.value?.total_saldo != null) {
      deudaSeleccionada.value = { ...deudaSeleccionada.value, total_saldo: detalleInfo.value.total_saldo }
      form.monto_a_pagar = minimoAPagar.value || Number(detalleInfo.value.total_saldo) || 0
    }

    // Enriquecer con el nombre del curso desde deudas-estudiante
    try {
      const deudasRes  = await carteraService.getDeudasEstudiante({ estudiante_id: qEstudiante })
      const deudaMatch = (deudasRes.data ?? []).find(d => d.matricula_id === qMatricula)
      if (deudaMatch) {
        deudaSeleccionada.value = {
          ...deudaSeleccionada.value,
          curso:       deudaMatch.curso,
          total_saldo: deudaMatch.total_saldo,
        }
        if (!form.monto_a_pagar) {
          form.monto_a_pagar = minimoAPagar.value || Number(deudaMatch.total_saldo) || 0
        }
      }
    } catch { /* no bloquea */ }
  } else {
    await cargarDeudas()
  }
})
</script>
