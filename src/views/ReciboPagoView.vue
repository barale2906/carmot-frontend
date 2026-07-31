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

          <!-- Calculando... -->
          <div
            v-if="calculando"
            class="flex min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200"
          >
            <svg class="size-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="ml-2 text-sm text-slate-400">Calculando…</span>
          </div>

          <!-- Placeholder sin datos -->
          <div
            v-else-if="!calculado"
            class="flex min-h-[160px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200"
          >
            <p class="px-4 text-center text-sm text-slate-400">
              Ingresa el valor a pagar para previsualizar la distribución.
            </p>
          </div>

          <!-- Tabla calculada — mismo formato que el recibo final -->
          <div v-else>
            <div v-if="itemsCargados.length === 0" class="py-4 text-center text-sm text-slate-500">
              El monto ingresado no cubre ningún ítem pendiente.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <thead>
                  <tr class="border-b border-black/10 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th class="py-2 text-left">Concepto</th>
                    <th class="py-2 pr-2 text-right">Cant.</th>
                    <th class="py-2 pr-2 text-right">Valor unit.</th>
                    <th class="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/5">
                  <template v-for="(item, i) in itemsCargados" :key="i">
                    <!-- Cuota de cartera -->
                    <tr v-if="item.tipo === 'cuota'" class="text-slate-800">
                      <td class="py-2.5 pr-3">
                        <span class="font-medium">{{ item.conceptoNombre || item.label }}</span>
                        <span v-if="item.conceptoNombre" class="text-slate-400"> — {{ item.label }}</span>
                        <span
                          v-if="item.pagado >= item.saldo"
                          class="ml-1.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[#213360] text-white"
                        >Pagada</span>
                        <span
                          v-else
                          class="ml-1.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700"
                        >Abona</span>
                      </td>
                      <td class="py-2.5 pr-2 text-right font-mono">1</td>
                      <td class="py-2.5 pr-2 text-right font-mono">$ {{ formatMoney(item.pagado) }}</td>
                      <td class="py-2.5 text-right font-mono font-semibold">$ {{ formatMoney(item.pagado) }}</td>
                    </tr>

                    <!-- Concepto adicional -->
                    <tr v-else-if="item.tipo === 'concepto'" class="text-slate-800">
                      <td class="py-2.5 pr-3 font-medium">{{ item.label }}</td>
                      <td class="py-2.5 pr-2 text-right font-mono">{{ item.cantidad }}</td>
                      <td class="py-2.5 pr-2 text-right font-mono">$ {{ formatMoney(item.valor) }}</td>
                      <td class="py-2.5 text-right font-mono font-semibold">$ {{ formatMoney(item.pagado) }}</td>
                    </tr>

                    <!-- Descuento -->
                    <tr v-else class="bg-emerald-50 text-emerald-700">
                      <td class="py-2 pr-3 text-xs">
                        <span class="font-semibold">{{ item.label }}</span>
                        <span v-if="item.motivo" class="text-emerald-600"> — {{ item.motivo }}</span>
                        <span
                          v-if="item.hayAbonadasEnDist"
                          class="mt-0.5 block text-[10px] text-emerald-500"
                        >Calculado sobre el valor bruto de la cuota, no sobre el saldo pendiente.</span>
                      </td>
                      <td class="py-2 pr-2 text-right font-mono text-xs">1</td>
                      <td class="py-2 pr-2 text-right font-mono text-xs">$ {{ formatMoney(item.valor) }}</td>
                      <td class="py-2 text-right font-mono text-xs font-semibold"></td>
                    </tr>
                  </template>
                </tbody>
                <tfoot>
                  <!-- Descuento aplicado total -->
                  <tr v-if="totalDescuentosAplicados > 0" class="border-t border-emerald-100 text-emerald-700">
                    <td colspan="3" class="py-2 text-right text-xs font-medium">Descuento aplicado:</td>
                    <td class="py-2 text-right font-mono text-xs font-semibold">− $ {{ formatMoney(totalDescuentosAplicados) }}</td>
                  </tr>

                  <!-- Total pagado -->
                  <tr class="border-t border-black/10 bg-slate-50">
                    <td colspan="3" class="py-2.5 text-right text-sm font-bold text-slate-800">Total pagado:</td>
                    <td class="py-2.5 text-right font-mono text-base font-bold text-[#213360]">$ {{ formatMoney(totalItemsCargados) }}</td>
                  </tr>

                  <!-- Recargos por tarjeta -->
                  <template v-if="totalSobrecargo > 0">
                    <tr
                      v-for="sc in sobrecargosAgregados"
                      :key="sc.descuento_id"
                      class="text-orange-700"
                    >
                      <td class="py-1.5 pr-3 text-xs">
                        {{ sc.nombre }}{{ sc.tipo !== 'valor_fijo' ? ` (${sc.valor}%)` : '' }}
                      </td>
                      <td class="py-1.5 pr-2 text-right font-mono text-xs">1</td>
                      <td class="py-1.5 pr-2 text-right font-mono text-xs">$ {{ formatMoney(sc.valor_sobrecargo) }}</td>
                      <td class="py-1.5 text-right font-mono text-xs font-semibold">+ $ {{ formatMoney(sc.valor_sobrecargo) }}</td>
                    </tr>
                    <tr class="border-t border-orange-200 bg-orange-50">
                      <td colspan="3" class="py-2.5 text-right text-sm font-bold text-slate-800">Total final (con recargos):</td>
                      <td class="py-2.5 text-right font-mono text-base font-bold text-[#213360]">$ {{ formatMoney(totalItemsCargados + totalSobrecargo) }}</td>
                    </tr>
                  </template>
                </tfoot>
              </table>
            </div>

            <!-- Aviso cuando el descuento de pronto pago no aplica por días insuficientes -->
            <div
              v-if="descuentoMotivo"
              class="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700"
            >
              {{ descuentoMotivo }}
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
            :error="fieldErrors.monto_a_pagar?.[0]"
            required
          >
            <template v-if="minimoAPagar > 0" #label-suffix>
              <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Mín. $ {{ formatMoney(minimoAPagar) }}
              </span>
            </template>
          </FormInput>
          <FormInput
            v-model="form.fecha_recibo"
            label="Fecha de pago *"
            type="date"
            help="Día en que se recibe el dinero."
            :error="fieldErrors.fecha_recibo?.[0]"
            required
          />
        </div>

        <!-- Lista dinámica de medios de pago -->
        <div class="mt-5">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium text-slate-700">Métodos de pago *</span>
            <span
              class="font-mono text-xs"
              :class="Math.abs(sumaMediosPago - Number(form.monto_a_pagar)) < 1 ? 'text-green-600' : 'text-amber-600'"
            >
              Suma: $ {{ formatMoney(sumaMediosPago) }} / Total: $ {{ formatMoney(form.monto_a_pagar) }}
            </span>
          </div>

          <div class="space-y-3">
            <div
              v-for="(mp, idx) in mediosPago"
              :key="mp._id"
              class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div class="flex flex-wrap items-end gap-3">
                <div class="min-w-[160px] flex-1">
                  <label class="mb-1 block text-xs font-medium text-slate-700">Método</label>
                  <select
                    v-model="mp.medio_pago"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    @change="onMedioPagoEntradaChange(idx)"
                  >
                    <option v-for="op in mediosPagoOpciones" :key="op.value" :value="op.value">{{ op.label }}</option>
                  </select>
                </div>
                <div class="w-40">
                  <label class="mb-1 block text-xs font-medium text-slate-700">Valor</label>
                  <input
                    v-model.number="mp.valor"
                    type="number"
                    min="0"
                    step="1"
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    @change="calcularSobrecargoEntrada(idx)"
                  />
                </div>
                <button
                  v-if="mediosPago.length > 1"
                  type="button"
                  class="mb-1 text-xs text-red-500 hover:text-red-700 focus:outline-none"
                  @click="quitarMedioPagoEntrada(idx)"
                >
                  Quitar
                </button>
              </div>

              <!-- Sobrecargo tarjeta -->
              <div
                v-if="mp.medio_pago === 'tarjeta_debito' || mp.medio_pago === 'tarjeta_credito'"
                class="mt-2 flex flex-wrap items-center gap-3 text-xs"
              >
                <template v-if="mp.total_sobrecargo > 0">
                  <span class="font-medium text-orange-700">Recargo: + $ {{ formatMoney(mp.total_sobrecargo) }}</span>
                  <span class="text-slate-500">(bruto: $ {{ formatMoney(mp.valor + mp.total_sobrecargo) }})</span>
                </template>
                <span v-else class="text-green-700">Sin recargo por tarjeta</span>
                <button
                  type="button"
                  class="text-[#213360] underline hover:no-underline focus:outline-none"
                  @click="abrirModalTarjeta(idx)"
                >
                  Configurar recargo por tarjeta
                </button>
              </div>

              <!-- Referencia consignación -->
              <div v-if="mp.medio_pago === 'consignacion'" class="mt-2">
                <button
                  type="button"
                  class="text-sm text-[#213360] underline hover:no-underline focus:outline-none"
                  @click="abrirModalConsignacion(idx)"
                >
                  Ingresar datos de consignación
                  <span v-if="mp.referencia" class="ml-1 text-xs text-green-600">(✓)</span>
                </button>
              </div>

              <!-- Datos de transferencia bancaria (inline) -->
              <div v-if="mp.medio_pago === 'transferencia'" class="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p class="text-xs text-amber-800">
                  <strong>Pendiente de aprobación:</strong> El recibo no se cerrará de inmediato.
                  Un validador revisará el comprobante antes de confirmar el pago.
                </p>

                <div class="grid gap-3 sm:grid-cols-2">
                  <!-- Banco origen -->
                  <div>
                    <label class="mb-1 block text-xs font-medium text-slate-700">Banco origen <span class="text-red-500">*</span></label>
                    <select
                      v-model="mp.banco_id"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option :value="null" disabled>-- Seleccionar banco --</option>
                      <option v-for="b in bancosActivos" :key="b.id" :value="b.id">
                        {{ b.nombre }}{{ b.codigo ? ` (${b.codigo})` : '' }}
                      </option>
                    </select>
                  </div>

                  <!-- Número de transacción -->
                  <div>
                    <label class="mb-1 block text-xs font-medium text-slate-700">N.° de transacción <span class="text-red-500">*</span></label>
                    <input
                      v-model="mp.numero_transaccion"
                      type="text"
                      placeholder="Ej: 1234567890"
                      maxlength="100"
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- Comprobante -->
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-700">
                    Comprobante <span class="text-slate-400">(opcional, se puede enviar después)</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,.webp"
                    class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 file:mr-2 file:rounded file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @change="onComprobanteTransferenciaChange(mp, $event)"
                  />
                  <p class="mt-1 text-[11px] text-slate-400">JPG, PNG, PDF o WebP · máx. 5 MB.</p>

                  <!-- Miniatura del comprobante -->
                  <div v-if="mp.comprobante_preview_url" class="mt-2">
                    <!-- Imagen -->
                    <template v-if="mp.comprobante_file?.type?.startsWith('image/')">
                      <div class="relative inline-block">
                        <img
                          :src="mp.comprobante_preview_url"
                          :alt="mp.comprobante_file.name"
                          class="h-28 w-auto max-w-[200px] rounded-lg border border-slate-300 object-cover shadow-sm"
                        />
                        <span class="absolute bottom-1 left-1 right-1 truncate rounded bg-black/50 px-1 py-0.5 text-center text-[10px] text-white">
                          {{ mp.comprobante_file.name }}
                        </span>
                      </div>
                    </template>
                    <!-- PDF -->
                    <template v-else>
                      <a
                        :href="mp.comprobante_preview_url"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <svg class="size-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                          <path d="M8.5 14.5h1v-3h1.25c.83 0 1.25.5 1.25 1.25S11.58 14 10.75 14H10v.5H8.5v-3zm1 2v-1H10c1.38 0 2.25-.88 2.25-2.25S11.38 11 10 11H8.5v3.5h1z" opacity=".5"/>
                        </svg>
                        <span class="max-w-[160px] truncate">{{ mp.comprobante_file.name }}</span>
                        <span class="shrink-0 text-blue-600 underline">Ver</span>
                      </a>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            v-if="!hayTransferencia"
            type="button"
            class="mt-3 text-sm font-medium text-[#213360] underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="agregarMedioPagoEntrada"
          >
            + Agregar otro método de pago
          </button>
          <p v-else class="mt-3 text-xs text-amber-700">
            La transferencia bancaria no puede combinarse con otro medio de pago.
          </p>
        </div>

      </section>

      <!-- ── Error general ───────────────────────────────────────────────────── -->
      <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ formError }}
      </div>

      <!-- ── Acciones ────────────────────────────────────────────────────────── -->
      <div v-if="!reciboTransferenciaCreado" class="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 pt-4">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="onCancel"
        >
          Cancelar
        </button>

        <!-- Botón normal (no transferencia) -->
        <button
          v-if="!hayTransferencia"
          type="button"
          :disabled="guardando || !puedeCalcular"
          class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="onSubmit"
        >
          <svg v-if="guardando" class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ guardando ? 'Guardando...' : 'Generar recibo' }}
        </button>

        <!-- Botón transferencia -->
        <button
          v-else
          type="button"
          :disabled="guardando || !puedeCalcular || !transferenciaCompleta"
          class="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
          :title="!transferenciaCompleta ? 'Completa el banco y el número de transacción' : ''"
          @click="onSubmit"
        >
          <svg v-if="guardando" class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          {{ guardando ? 'Registrando...' : 'Enviar soporte y registrar' }}
        </button>
      </div>

    </template>

    <!-- ── Recibo de transferencia pendiente de aprobación ──────────────────── -->
    <div v-if="reciboTransferenciaCreado" ref="bloqueEsperaRef" class="rounded-[10px] border border-amber-200 bg-amber-50 px-6 py-5">
      <h3 class="mb-1 text-sm font-semibold text-amber-900">Recibo en espera de aprobación</h3>
      <p class="mb-1 text-sm text-amber-800">
        El recibo fue creado con ID <strong>#{{ reciboTransferenciaCreado.id }}</strong> y está
        <strong>pendiente de aprobación</strong> por un validador.
        El número de recibo se asignará automáticamente al ser aprobado.
      </p>
      <p class="mb-4 text-xs text-amber-700">
        Notifica al validador cuando el comprobante esté listo para que pueda revisarlo.
      </p>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          :disabled="notificando"
          class="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @click="notificarValidador"
        >
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {{ notificando ? 'Notificando...' : 'Notificar al validador' }}
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          @click="irAListado"
        >
          Ver lista de recibos
        </button>
      </div>
    </div>

    <!-- Modales de métodos de pago -->
    <ModalPagoTarjeta
      v-model="modalTarjetaOpen"
      :medio-pago="mediosPago[modalTargetIndex]?.medio_pago"
      :valor-base="Number(mediosPago[modalTargetIndex]?.valor) || 0"
      @confirm="onConfirmarTarjeta"
    />
    <ModalPagoConsignacion
      v-model="modalConsignacionOpen"
      @confirm="onConfirmarConsignacion"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, toRaw, nextTick } from 'vue'
import { useRoute, useRouter }    from 'vue-router'
import Logo                       from '@/components/Logo.vue'
import FormInputSearch             from '@/components/forms/FormInputSearch.vue'
import FormInput                   from '@/components/forms/FormInput.vue'
import FormSelect                  from '@/components/forms/FormSelect.vue'
import ModalPagoTarjeta            from '@/components/ModalPagoTarjeta.vue'
import ModalPagoConsignacion       from '@/components/ModalPagoConsignacion.vue'
import userService                 from '@/services/userService.js'
import carteraService              from '@/services/carteraService.js'
import conceptoPagoService         from '@/services/conceptoPagoService.js'
import reciboPagoService           from '@/services/reciboPagoService.js'
import { authService }             from '@/services/authService.js'
import { useNotification }         from '@/composables/useNotification'
import bancoService                from '@/services/bancoService.js'

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
const conceptoSeleccionado  = ref(null)
const cantidadConcepto      = ref(1)
const conceptosAdicionales  = ref([])   // [{ concepto_id, nombre, valor, cantidad }]

// ─── Distribución previsualizada ──────────────────────────────────────────────
const calculado        = ref(false)
const calculando       = ref(false)
const itemsCargados    = ref([])   // [{ tipo, label, valor?, cantidad?, saldo?, pagado }]
const descuentoMotivo  = ref('')   // motivo cuando precalcular-descuento devuelve aplica:false

// ─── Recibo de transferencia creado (pendiente aprobación) ────────────────────
const reciboTransferenciaCreado = ref(null)
const bloqueEsperaRef           = ref(null)
const notificando               = ref(false)

// ─── Bancos activos (para selector inline de transferencia) ───────────────────
const bancosActivos = ref([])

async function cargarBancosActivos() {
  if (bancosActivos.value.length) return
  try {
    const res = await bancoService.getActivos()
    bancosActivos.value = res.data ?? []
  } catch { /* no bloquea */ }
}

/** True cuando los campos obligatorios de la transferencia están completos */
const transferenciaCompleta = computed(() => {
  if (!hayTransferencia.value) return true
  const mp = mediosPago.value.find(m => m.medio_pago === 'transferencia')
  return !!(mp?.banco_id && mp?.numero_transaccion?.trim())
})

// ─── Modales de pago ─────────────────────────────────────────────────────────
const modalTarjetaOpen       = ref(false)
const modalConsignacionOpen  = ref(false)
const modalTargetIndex       = ref(0)

// ─── Formulario ──────────────────────────────────────────────────────────────
const form = reactive({
  fecha_recibo:  today(),
  monto_a_pagar: 0,
})

// ─── Lista de medios de pago ─────────────────────────────────────────────────
function nuevoMedioPago() {
  return {
    _id:               Date.now() + Math.random(),
    medio_pago:        'efectivo',
    valor:             0,
    tipo_tarjeta:      null,
    referencia:        null,
    banco_id:               null,
    banco_nombre:           null,
    numero_transaccion:     null,
    comprobante_file:       null,
    comprobante_preview_url: null,
    sobrecargos:       [],
    total_sobrecargo:  0,
  }
}
const mediosPago = ref([nuevoMedioPago()])

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

const totalDescuentosAplicados = computed(() =>
  itemsCargados.value
    .filter(i => i.tipo === 'descuento')
    .reduce((sum, i) => sum + (i.valor ?? 0), 0)
)

const puedeCalcular = computed(() =>
  Number(form.monto_a_pagar) > 0 && !!form.fecha_recibo
)

/** Suma de valores de todos los medios de pago ingresados */
const sumaMediosPago = computed(() =>
  mediosPago.value.reduce((sum, mp) => sum + Number(mp.valor || 0), 0)
)

/** Todos los sobrecargos aplanados de entradas de tipo tarjeta */
const sobrecargosAgregados = computed(() =>
  mediosPago.value.flatMap(mp => mp.sobrecargos ?? [])
)

/** Suma total de sobrecargos por tarjeta */
const totalSobrecargo = computed(() =>
  mediosPago.value.reduce((sum, mp) => sum + (mp.total_sobrecargo ?? 0), 0)
)

/** True cuando algún medio de pago es transferencia (es exclusivo, no puede combinarse) */
const hayTransferencia = computed(() =>
  mediosPago.value.some(mp => mp.medio_pago === 'transferencia')
)

// Cuando hay exactamente un medio de pago, sincronizar su valor con el monto total
watch(() => form.monto_a_pagar, (monto) => {
  if (mediosPago.value.length === 1) {
    mediosPago.value[0].valor = Number(monto) || 0
    calcularSobrecargoEntrada(0)
  }
})

// Auto-calcular preview con debounce al cambiar el monto
let calcularTimer = null
watch(() => form.monto_a_pagar, () => {
  clearTimeout(calcularTimer)
  calcularTimer = setTimeout(() => { if (puedeCalcular.value) calcular() }, 500)
})

// Recalcular inmediatamente al cambiar fecha o conceptos adicionales
watch(
  [() => form.fecha_recibo, () => conceptosAdicionales.value.length],
  () => { if (puedeCalcular.value) calcular() }
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
    // Solo los conceptos no-Cartera quedan disponibles para conceptos adicionales;
    // el backend asigna automáticamente el concepto de Cartera (Matrícula/Mensualidad).
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
 * Llama a precalcular-descuento para obtener el descuento real con el monto y fecha actuales.
 */
async function calcular() {
  formError.value      = ''
  descuentoMotivo.value = ''
  if (!puedeCalcular.value) return
  calculando.value = true

  const monto = Number(form.monto_a_pagar)
  if (monto < totalConceptosAdicionales.value) {
    formError.value  = `El valor ($${formatMoney(monto)}) es menor al total de conceptos adicionales ($${formatMoney(totalConceptosAdicionales.value)}).`
    calculando.value = false
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
    // cuota.concepto viene del backend (CarteraResource): 'Matrícula' o 'Pago de mensualidad'
    const conceptoNombre = cuota.concepto
      || (cuota.numero_cuota === 0 ? 'Matrícula' : 'Pago de mensualidad')
    items.push({
      tipo:          'cuota',
      label:         cuota.numero_cuota === 0 ? 'Matrícula' : `Cuota ${cuota.numero_cuota}`,
      conceptoNombre,
      numero_cuota:  cuota.numero_cuota,
      saldo,
      valorBruto:    Number(cuota.valor) || saldo,
      esAbonada:     cuota.status === 1,
      pagado,
    })
    restante -= pagado
  }

  // Consultar descuento con el monto y fecha reales para reflejar las condiciones actuales
  if (items.some(i => i.tipo === 'cuota') && deudaSeleccionada.value?.matricula_id) {
    try {
      const descRes = await reciboPagoService.precalcularDescuento({
        matricula_id:      deudaSeleccionada.value.matricula_id,
        monto_a_pagar:     monto,
        fecha_transaccion: form.fecha_recibo,
      })
      const desc = descRes.data

      // Descuento pronto pago (cuotas mensuales numero_cuota >= 1)
      if (desc?.aplica) {
        items.push({
          tipo:               'descuento',
          label:              desc.descuento?.nombre ?? 'Descuento pronto pago',
          motivo:             desc.motivo ?? '',
          valor:              desc.valor,
          pagado:             0,
          hayAbonadasEnDist:  items.some(i => i.tipo === 'cuota' && i.esAbonada),
        })
      } else if (desc?.motivo) {
        descuentoMotivo.value = desc.motivo
      }

      // Descuento de matrícula automático (cuota numero_cuota = 0)
      const descMat = desc?.descuento_matricula
      if (descMat?.aplica) {
        items.push({
          tipo:   'descuento',
          label:  descMat.descuento?.nombre ?? 'Descuento matrícula',
          motivo: descMat.motivo ?? '',
          valor:  descMat.valor,
          pagado: 0,
        })
      }
    } catch { /* no bloquea el flujo */ }
  }

  itemsCargados.value = items
  calculado.value     = true
  calculando.value    = false
}

function recalcular() {
  calculado.value       = false
  itemsCargados.value   = []
  descuentoMotivo.value = ''
  calcular()
}

// ─── Medios de pago: gestión de entradas ─────────────────────────────────────
function agregarMedioPagoEntrada() {
  mediosPago.value.push(nuevoMedioPago())
}

function quitarMedioPagoEntrada(idx) {
  mediosPago.value.splice(idx, 1)
}

function onMedioPagoEntradaChange(idx) {
  const mp = mediosPago.value[idx]
  if (!mp) return
  const esTarjeta = mp.medio_pago === 'tarjeta_debito' || mp.medio_pago === 'tarjeta_credito'
  mp.sobrecargos       = []
  mp.total_sobrecargo  = 0
  mp.tipo_tarjeta      = null
  mp.referencia        = null
  mp.banco_id                = null
  mp.banco_nombre            = null
  mp.numero_transaccion      = null
  if (mp.comprobante_preview_url) {
    URL.revokeObjectURL(mp.comprobante_preview_url)
    mp.comprobante_preview_url = null
  }
  mp.comprobante_file        = null
  if (esTarjeta && mp.valor > 0) calcularSobrecargoEntrada(idx)
  if (mp.medio_pago === 'transferencia') cargarBancosActivos()
}

async function calcularSobrecargoEntrada(idx) {
  const mp = mediosPago.value[idx]
  if (!mp) return
  const esTarjeta = mp.medio_pago === 'tarjeta_debito' || mp.medio_pago === 'tarjeta_credito'
  if (!esTarjeta || Number(mp.valor) <= 0) return
  try {
    const res  = await reciboPagoService.precalcularSobrecargos({
      medios_pago: [{ medio_pago: mp.medio_pago, tipo_tarjeta: mp.tipo_tarjeta, valor: mp.valor }],
    })
    const datos = res.data
    mp.sobrecargos      = datos.sobrecargos     ?? []
    mp.total_sobrecargo = datos.total_sobrecargo ?? 0
  } catch { /* no bloquea */ }
}

// ─── Comprobante de transferencia (campo inline) ──────────────────────────────
function onComprobanteTransferenciaChange(mp, e) {
  // Liberar URL anterior para evitar memory leaks
  if (mp.comprobante_preview_url) {
    URL.revokeObjectURL(mp.comprobante_preview_url)
    mp.comprobante_preview_url = null
  }
  const file = e.target.files?.[0] ?? null
  mp.comprobante_file = file
  if (file) {
    mp.comprobante_preview_url = URL.createObjectURL(file)
  }
}

// ─── Modales de pago ─────────────────────────────────────────────────────────
function abrirModalTarjeta(idx) {
  modalTargetIndex.value = idx
  modalTarjetaOpen.value = true
}

function abrirModalConsignacion(idx) {
  modalTargetIndex.value      = idx
  modalConsignacionOpen.value = true
}

function onConfirmarTarjeta(payload) {
  const mp = mediosPago.value[modalTargetIndex.value]
  if (!mp) return
  mp.sobrecargos      = payload.sobrecargos    ?? []
  mp.tipo_tarjeta     = payload.marcaTarjeta   ?? null
  mp.total_sobrecargo = payload.totalSobrecargo ?? 0
}

function onConfirmarConsignacion(payload) {
  const mp = mediosPago.value[modalTargetIndex.value]
  if (mp) mp.referencia = payload.referencia ?? null
}

function onConfirmarTransferencia(payload) {
  const mp = mediosPago.value[modalTargetIndex.value]
  if (!mp) return
  mp.banco_id           = payload.banco_id          ?? null
  mp.banco_nombre       = payload.banco_nombre       ?? null
  mp.numero_transaccion = payload.numero_transaccion ?? null
  mp.comprobante_file   = payload.comprobante_file   ?? null
}

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

  // Construir medios_pago y sobrecargos desde la lista dinámica.
  // mp.valor es siempre el monto base; el sobrecargo lo calcula el backend sobre ese valor.
  const sobrecargosPayload = []
  const mediosPagoPayload  = mediosPago.value.map((mp, idx) => {
    const esTarjeta = mp.medio_pago === 'tarjeta_debito' || mp.medio_pago === 'tarjeta_credito'
    if (esTarjeta && mp.sobrecargos?.length) {
      mp.sobrecargos.forEach(sc =>
        sobrecargosPayload.push({ descuento_id: sc.descuento_id, medio_pago_index: idx })
      )
    }
    const entry = {
      medio_pago: mp.medio_pago,
      valor:      Number(mp.valor),
      ...(mp.tipo_tarjeta ? { tipo_tarjeta: mp.tipo_tarjeta } : {}),
      ...(mp.referencia   ? { referencia:   mp.referencia   } : {}),
    }
    if (mp.medio_pago === 'transferencia') {
      if (mp.banco_id)          entry.banco_id          = mp.banco_id
      if (mp.numero_transaccion) entry.numero_transaccion = mp.numero_transaccion
    }
    return entry
  })

  const montoTotalBruto    = mediosPagoPayload.reduce((sum, mp) => sum + mp.valor, 0)
  const mpTransferencia    = mediosPago.value.find(mp => mp.medio_pago === 'transferencia')
  // toRaw extrae el File puro del Proxy reactivo de Vue; FormData usa internal slots
  // que no cruzan el Proxy y recibiría el archivo como texto en lugar de binario
  const comprobanteFile    = toRaw(mpTransferencia?.comprobante_file ?? null)

  // Cuando hay comprobante se envía como multipart/form-data
  let reqPayload, reqConfig
  if (comprobanteFile) {
    const fd = new FormData()
    fd.append('sede_id',           sedeId ?? '')
    fd.append('cajero_id',         currentUser.value?.id ?? '')
    fd.append('matricula_id',      deudaSeleccionada.value.matricula_id)
    fd.append('origen',            1)
    fd.append('fecha_recibo',      form.fecha_recibo)
    fd.append('fecha_transaccion', form.fecha_recibo)
    fd.append('monto_a_pagar',     montoTotalBruto)
    fd.append('aplicar_descuento', '1')
    mediosPagoPayload.forEach((mp, i) => {
      Object.entries(mp).forEach(([k, v]) => fd.append(`medios_pago[${i}][${k}]`, v))
    })
    conceptosAdicionales.value.forEach((ca, i) => {
      fd.append(`conceptos_adicionales[${i}][concepto_pago_id]`, ca.concepto_id)
      fd.append(`conceptos_adicionales[${i}][cantidad]`,         ca.cantidad)
    })
    fd.append('comprobante', comprobanteFile)
    reqPayload = fd
    reqConfig  = { _silent: true }
  } else {
    reqPayload = {
      sede_id:           sedeId,
      cajero_id:         currentUser.value?.id ?? null,
      matricula_id:      deudaSeleccionada.value.matricula_id,
      origen:            1,
      fecha_recibo:      form.fecha_recibo,
      fecha_transaccion: form.fecha_recibo,
      monto_a_pagar:     montoTotalBruto,
      aplicar_descuento: true,
      conceptos_adicionales: conceptosAdicionales.value.map(c => ({
        concepto_pago_id: c.concepto_id,
        cantidad:         c.cantidad,
      })),
      medios_pago: mediosPagoPayload,
      ...(sobrecargosPayload.length ? { sobrecargos: sobrecargosPayload } : {}),
    }
    reqConfig = { _silent: true }
  }

  guardando.value = true
  try {
    const res = await reciboPagoService.create(reqPayload, reqConfig)
    if (res.data?.esta_pendiente_aprobacion) {
      // Transferencia: queda en status 4, sin número de recibo
      reciboTransferenciaCreado.value = res.data
      nextTick(() => bloqueEsperaRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } else {
      notifySuccess(`Recibo ${res.data?.numero_recibo ?? ''} generado correctamente.`)
      router.push('/financiero/recibos-pago')
    }
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

function irAListado() {
  router.push('/financiero/recibos-pago')
}

async function notificarValidador() {
  if (!reciboTransferenciaCreado.value?.id) return
  notificando.value = true
  try {
    const res = await reciboPagoService.notificarTransferencia(reciboTransferenciaCreado.value.id)
    notifySuccess(res.message ?? 'Validadores notificados correctamente.')
  } catch (e) {
    formError.value = e?.response?.data?.message ?? 'Error al enviar la notificación.'
  } finally {
    notificando.value = false
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetForm() {
  form.fecha_recibo  = today()
  form.monto_a_pagar = 0
  mediosPago.value               = [nuevoMedioPago()]
  modalTargetIndex.value         = 0
  conceptosAdicionales.value     = []
  conceptoSeleccionado.value     = null
  cantidadConcepto.value         = 1
  formError.value                = ''
  fieldErrors.value              = {}
  calculado.value                = false
  calculando.value               = false
  itemsCargados.value            = []
  reciboTransferenciaCreado.value = null
  mediosPago.value.forEach(mp => {
    if (mp.comprobante_preview_url) {
      URL.revokeObjectURL(mp.comprobante_preview_url)
    }
  })
  clearTimeout(calcularTimer)
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(async () => {
  try { currentUser.value = await authService.getUser() } catch { /* no bloquea */ }
  cargarConceptos()
  cargarBancosActivos()

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
      }
    } catch { /* no bloquea */ }
  } else {
    await cargarDeudas()
  }
})
</script>
