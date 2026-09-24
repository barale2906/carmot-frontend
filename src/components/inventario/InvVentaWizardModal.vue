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
        class="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
        @click.self="close"
      >
        <div
          class="relative my-auto w-full max-w-3xl rounded-xl border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Cabecera -->
          <div class="flex items-center justify-between gap-4 border-b border-black/5 px-6 py-5">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Nueva venta de inventario</h2>
              <p class="mt-0.5 text-sm text-slate-500">Paso {{ step }} de 3 — {{ stepLabel }}</p>
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar"
              @click="close"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </div>

          <!-- Indicador de pasos -->
          <div class="flex gap-0 border-b border-black/5">
            <div
              v-for="s in 3"
              :key="s"
              class="flex-1 py-2 text-center text-xs font-medium transition-colors"
              :class="s === step ? 'bg-[#213360] text-white' : s < step ? 'bg-blue-50 text-blue-700' : 'text-slate-400'"
            >{{ s < step ? '✓ ' : '' }}{{ ['Estudiante', 'Productos', 'Pago'][s - 1] }}</div>
          </div>

          <!-- ─── Paso 1: Buscar / registrar estudiante + almacén ─────────────── -->
          <div v-if="step === 1" class="flex flex-col gap-5 px-6 py-6">

            <!-- Estudiante ya seleccionado -->
            <div v-if="estudianteSeleccionado" class="flex items-center gap-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <div class="flex-1">
                <p class="text-xs text-blue-500">{{ estudianteNuevo ? 'Nuevo estudiante a registrar' : 'Estudiante seleccionado' }}</p>
                <p class="text-sm font-semibold text-blue-900">{{ nombreEstudiante }}</p>
                <p class="text-xs text-blue-600">{{ estudianteSeleccionado.documento ?? estudianteSeleccionado.numero_documento ?? '' }}</p>
              </div>
              <button type="button" class="text-xs font-medium text-blue-700 underline" @click="clearEstudiante">Cambiar</button>
            </div>

            <!-- Búsqueda (cuando no hay selección) -->
            <template v-else>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700">Buscar estudiante</label>
                <div class="relative">
                  <input
                    v-model="estudianteQuery"
                    type="text"
                    placeholder="Nombre o número de documento (mín. 2 caracteres)..."
                    class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    @input="onEstudianteInput"
                    @keydown.enter.prevent="buscarEstudiante"
                  />
                  <button
                    v-if="estudianteQuery"
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                    @click="estudianteQuery = ''; estudiantesResultados = []; estudianteBuscado = false"
                  >
                    <NavIcon name="close" class="size-3.5" />
                  </button>
                </div>
              </div>

              <!-- Buscando... -->
              <div v-if="buscandoEstudiante" class="flex items-center gap-2 text-sm text-slate-500">
                <svg class="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Buscando...
              </div>

              <!-- Resultados -->
              <ul v-else-if="estudiantesResultados.length" class="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                <li
                  v-for="e in estudiantesResultados"
                  :key="e.id"
                  class="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-blue-50"
                  @click="selectEstudiante(e)"
                >
                  <div>
                    <p class="text-sm font-medium text-slate-900">{{ nombreDeEstudiante(e) }}</p>
                    <p class="text-xs text-slate-500">{{ e.documento ?? e.numero_documento ?? '' }}</p>
                  </div>
                  <NavIcon name="arrow-right" class="size-4 shrink-0 text-slate-400" />
                </li>
              </ul>

              <!-- Sin resultados: opción de crear -->
              <div
                v-else-if="estudianteBuscado && !buscandoEstudiante && estudianteQuery.length >= 2"
                class="rounded-lg border border-dashed border-slate-300 p-4 text-center"
              >
                <p class="text-sm text-slate-500">No se encontró ningún estudiante con <strong>{{ estudianteQuery }}</strong>.</p>
                <button
                  type="button"
                  class="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="iniciarRegistroNuevo"
                >
                  <NavIcon name="plus" class="size-4" /> Registrar como nuevo estudiante
                </button>
              </div>

              <!-- Formulario de nuevo estudiante -->
              <div v-if="mostrarFormNuevo" class="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Datos del nuevo estudiante</p>
                <div class="grid grid-cols-2 gap-3">
                  <FormInput v-model="nuevoForm.primer_nombre"   label="Primer nombre *"   :error="nuevoErrors.primer_nombre?.[0]" />
                  <FormInput v-model="nuevoForm.primer_apellido" label="Primer apellido *"  :error="nuevoErrors.primer_apellido?.[0]" />
                  <FormInput v-model="nuevoForm.documento"       label="N.° documento *"    :error="nuevoErrors.documento?.[0]" />
                  <FormInput v-model="nuevoForm.email"           label="Correo electrónico *" type="email" :error="nuevoErrors.email?.[0]" />
                </div>
                <p class="text-xs text-slate-400">La contraseña inicial será el número de documento.</p>
                <div v-if="nuevoError" class="rounded-lg bg-red-50 p-2 text-xs text-red-700">{{ nuevoError }}</div>
                <div class="flex justify-end gap-2">
                  <button type="button" class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none" @click="mostrarFormNuevo = false">Cancelar</button>
                  <button type="button" class="rounded-lg bg-[#213360] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a294d] focus:outline-none" @click="confirmarNuevoEstudiante">Confirmar y continuar</button>
                </div>
              </div>
            </template>

            <FormSelect v-model="form.almacen_id" label="Almacén" placeholder="Selecciona el almacén..." :options="almacenOptions" required />
          </div>

          <!-- ─── Paso 2: Selección de productos ──────────────────────────────── -->
          <div v-if="step === 2" class="flex flex-col gap-5 px-6 py-6">
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p class="font-medium text-slate-800">{{ nombreEstudiante }}</p>
              <p class="text-xs text-slate-500">Almacén: {{ almacenNombre }}</p>
            </div>

            <InvProductoBuscador
              label="Agregar producto"
              placeholder="Buscar por nombre o código..."
              :clear-on-select="true"
              @select="addItem"
            />

            <!-- La falta de stock no impide facturar: solo define qué se entrega ahora -->
            <div v-if="items.length" class="flex items-center justify-between gap-3 text-xs text-slate-500">
              <p>Puedes facturar aunque no haya stock; lo que falte queda pendiente de entrega.</p>
              <span v-if="verificando" class="shrink-0 text-slate-400">Verificando stock...</span>
            </div>
            <p v-if="errorDisponibilidad" class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{{ errorDisponibilidad }}</p>

            <div v-if="items.length" class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full text-sm">
                <thead class="bg-slate-50">
                  <tr class="text-left">
                    <th class="px-4 py-2 text-xs font-semibold text-slate-500">Producto</th>
                    <th class="px-2 py-2 text-center text-xs font-semibold text-slate-500">Cant.</th>
                    <th class="px-2 py-2 text-right text-xs font-semibold text-slate-500">Precio</th>
                    <th class="px-2 py-2 text-right text-xs font-semibold text-slate-500">Descuento</th>
                    <th class="px-2 py-2 text-right text-xs font-semibold text-slate-500">Total</th>
                    <th class="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody v-for="(item, index) in items" :key="item.producto_id" class="border-t border-slate-100 first:border-t-0">
                  <tr>
                    <td class="px-4 pb-1 pt-2 font-medium text-slate-900">{{ item.nombre }}</td>
                    <td class="px-2 py-2 text-center">
                      <input
                        v-model.number="item.cantidad"
                        type="number" min="1"
                        class="w-16 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-2 py-2 text-right font-mono text-slate-700">
                      <span v-if="item._cargandoPrecio" class="text-xs text-slate-400">Cargando...</span>
                      <span v-else>{{ formatCurrency(item.precio_unitario) }}</span>
                    </td>
                    <td class="px-2 py-2 text-right">
                      <select
                        v-model="item.descuento_id"
                        class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option :value="null">Sin desc.</option>
                        <option v-for="d in descuentosActivos" :key="d.id" :value="d.id">
                          {{ d.nombre }} ({{ d.tipo === 'porcentual' ? d.valor + '%' : formatCurrency(d.valor) }})
                        </option>
                      </select>
                    </td>
                    <td class="px-2 py-2 text-right font-mono font-medium text-slate-900">{{ formatCurrency(item.cantidad * item.precio_unitario) }}</td>
                    <td class="px-2 py-2 text-right">
                      <button type="button" title="Quitar producto" class="rounded p-1 text-slate-400 hover:text-red-600 focus:outline-none" @click="removeItem(item.producto_id)">
                        <NavIcon name="close" class="size-3.5" />
                      </button>
                    </td>
                  </tr>
                  <!-- Controles de entrega de la línea -->
                  <tr>
                    <td colspan="6" class="px-4 pb-3 pt-1">
                      <InvVentaItemEntrega
                        v-model:entregar="item.entregar"
                        v-model:entrega-completa="item.entrega_completa"
                        v-model:variantes="item.variantes"
                        :disponibilidad="disponibilidadDe(index)"
                      />
                    </td>
                  </tr>
                </tbody>
                <tfoot class="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colspan="4" class="px-4 py-2 text-right text-sm font-semibold text-slate-700">Total estimado</td>
                    <td class="px-2 py-2 text-right font-mono text-base font-bold text-[#213360]">{{ formatCurrency(totalItems) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div v-else class="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
              Agrega productos usando el buscador de arriba
            </div>
          </div>

          <!-- ─── Paso 3: Pago ──────────────────────────────────────────────── -->
          <div v-if="step === 3" class="flex flex-col gap-5 px-6 py-6">
            <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div class="flex items-center justify-between">
                <p class="font-medium text-slate-800">{{ nombreEstudiante }}</p>
                <p class="font-bold text-[#213360]">{{ formatCurrency(totalItems) }}</p>
              </div>
              <p class="text-xs text-slate-500">{{ items.length }} producto(s) · Almacén: {{ almacenNombre }}</p>
            </div>

            <!-- Entrega inmediata -->
            <div class="rounded-lg border border-slate-200 p-4">
              <label class="flex cursor-pointer items-start gap-3">
                <input v-model="entregaInmediata" type="checkbox" class="mt-0.5 rounded" />
                <span>
                  <span class="block text-sm font-medium text-slate-800">Entregar ahora los productos disponibles</span>
                  <span class="block text-xs text-slate-500">Se descarga del inventario en el mismo recibo. Si lo desmarcas, todo queda pendiente en Entregas.</span>
                </span>
              </label>

              <p v-if="!pagoCompleto" class="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
                El abono no cubre el total: el pedido queda con saldo y la entrega se hará al completar el pago.
              </p>
              <ul v-else-if="entregaInmediata" class="mt-3 flex flex-wrap gap-2 text-xs">
                <li v-if="resumenEntrega.ok" class="rounded-full bg-green-100 px-2 py-0.5 text-green-800">{{ resumenEntrega.ok }} se entrega(n) ahora</li>
                <li v-if="resumenEntrega.parcial" class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{{ resumenEntrega.parcial }} con entrega parcial</li>
                <li v-if="resumenEntrega.pendiente" class="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">{{ resumenEntrega.pendiente }} pendiente(s) por stock</li>
                <li v-if="resumenEntrega.diferido" class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{{ resumenEntrega.diferido }} se entrega(n) después</li>
                <li v-if="resumenEntrega.variante" class="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">{{ resumenEntrega.variante }} sin variante elegida</li>
              </ul>
              <p v-if="pagoCompleto && entregaInmediata && disponibilidad?.requiere_seleccion_variante" class="mt-2 text-xs text-blue-700">
                Hay componentes sin variante elegida: quedarán pendientes de entrega. Puedes volver al paso anterior para elegirla.
              </p>
            </div>

            <!-- Medios de pago (múltiples) -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700">Medios de pago</span>
                <button type="button" class="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none" @click="addMedioPago">
                  <NavIcon name="plus" class="size-3.5" /> Agregar medio
                </button>
              </div>
              <div class="flex flex-col gap-3">
                <div v-for="(mp, idx) in mediosPago" :key="idx" class="rounded-lg border border-slate-200 p-3">
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <label class="mb-1 block text-xs font-medium text-slate-600">Medio</label>
                      <select
                        v-model="mp.medio_pago"
                        class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        @change="onMedioPagoChange(idx)"
                      >
                        <option v-for="m in mediosPagoOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
                      </select>
                    </div>
                    <div class="flex-1">
                      <label class="mb-1 block text-xs font-medium text-slate-600">Valor</label>
                      <input
                        v-model.number="mp.valor"
                        type="number" min="0"
                        class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        @blur="onValorChange"
                      />
                    </div>
                    <button v-if="mediosPago.length > 1" type="button" class="mt-5 rounded p-1 text-slate-400 hover:text-red-600 focus:outline-none" @click="removeMedioPago(idx)">
                      <NavIcon name="close" class="size-4" />
                    </button>
                  </div>

                  <!-- Campos extra para transferencia -->
                  <div v-if="mp.medio_pago === 'transferencia'" class="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-xs font-medium text-slate-600">Banco</label>
                      <select v-model="mp.banco_id" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option :value="null">Selecciona...</option>
                        <option v-for="b in bancoOptions" :key="b.value" :value="b.value">{{ b.label }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs font-medium text-slate-600">Referencia</label>
                      <input v-model="mp.referencia" type="text" placeholder="Número de comprobante..." class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label class="mb-1 block text-xs font-medium text-slate-600">N.° Transacción</label>
                      <input v-model="mp.numero_transaccion" type="text" placeholder="Ej: XYZ-9912" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div v-if="idx === 0">
                      <label class="mb-1 block text-xs font-medium text-slate-600">Comprobante (imagen/PDF)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        class="w-full text-xs text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:text-slate-700"
                        @change="onComprobanteChange"
                      />
                    </div>
                  </div>

                  <!-- Campos extra para tarjeta -->
                  <div v-if="mp.medio_pago === 'tarjeta_debito' || mp.medio_pago === 'tarjeta_credito'" class="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label class="mb-1 block text-xs font-medium text-slate-600">Tipo de tarjeta</label>
                      <select v-model="mp.tipo_tarjeta" class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" @change="onValorChange">
                        <option value="">Selecciona...</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">American Express</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label class="mb-1 block text-xs font-medium text-slate-600">Referencia</label>
                      <input v-model="mp.referencia" type="text" placeholder="Número voucher..." class="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Resumen medios vs total -->
              <div class="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span class="text-slate-500">Total medios de pago</span>
                <span class="font-mono font-semibold" :class="totalMedios === form.monto_abono ? 'text-green-700' : 'text-red-600'">
                  {{ formatCurrency(totalMedios) }}
                </span>
              </div>
            </div>

            <!-- Sobrecargos calculados -->
            <div v-if="sobrecargos.length" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p class="mb-1.5 text-xs font-semibold text-amber-800">Sobrecargos por medio de pago</p>
              <ul class="space-y-1">
                <li v-for="sc in sobrecargos" :key="sc.descuento_id" class="flex items-center justify-between text-xs text-amber-700">
                  <span>{{ sc.nombre }} ({{ sc.medio_pago }})</span>
                  <span class="font-mono">+ {{ formatCurrency(sc.valor_sobrecargo) }}</span>
                </li>
              </ul>
              <div class="mt-2 flex items-center justify-between border-t border-amber-200 pt-2 text-sm font-semibold text-amber-900">
                <span>Total con sobrecargos</span>
                <span class="font-mono">{{ formatCurrency(totalItems + totalSobrecargo) }}</span>
              </div>
              <label class="mt-2 flex cursor-pointer items-center gap-2 text-xs font-medium text-amber-800">
                <input v-model="aplicarSobrecargos" type="checkbox" class="rounded" />
                Aplicar sobrecargos al pago
              </label>
            </div>

            <!-- Monto a abonar -->
            <FormInput
              v-model.number="form.monto_abono"
              label="Monto a abonar"
              type="number"
              min="0"
              :max="totalConSobrecargos"
              step="100"
              placeholder="0"
              :hint="`Total pedido: ${formatCurrency(totalConSobrecargos)} · Un abono parcial deja el pedido activo`"
            />

            <!-- Observaciones -->
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Observaciones <span class="text-slate-400">(opcional)</span></label>
              <textarea
                v-model="form.observaciones"
                rows="2"
                maxlength="1000"
                placeholder="Ej: Uniforme primer semestre..."
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
              <p class="text-sm text-red-700">{{ formError }}</p>
            </div>
          </div>

          <!-- Footer de acciones -->
          <div class="flex items-center justify-between gap-3 border-t border-black/5 px-6 py-4">
            <button
              v-if="step > 1"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="step--"
            >
              <NavIcon name="arrow-left" class="size-4" /> Atrás
            </button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="close"
            >Cancelar</button>

            <button
              v-if="step < 3"
              type="button"
              :disabled="!canAdvance"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="nextStep"
            >
              Siguiente <NavIcon name="arrow-right" class="size-4" />
            </button>
            <button
              v-else
              type="button"
              :disabled="saving || !canSubmit"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="handleSubmit"
            >
              {{ saving ? 'Procesando...' : 'Registrar venta' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, toRef } from 'vue'
import invVentaService        from '@/services/invVentaService.js'
import invAlmacenService      from '@/services/invAlmacenService.js'
import invPrecioService       from '@/services/invPrecioService.js'
import bancoService           from '@/services/bancoService.js'
import userService            from '@/services/userService.js'
import { authService }        from '@/services/authService.js'
import { useNotification }    from '@/composables/useNotification'
import {
  useDisponibilidadVenta,
  estadoEntregaItem,
  variantesSeleccionadas,
}                             from '@/composables/useDisponibilidadVenta.js'
import NavIcon              from '@/components/icons/NavIcon.vue'
import FormInput            from '@/components/forms/FormInput.vue'
import FormSelect           from '@/components/forms/FormSelect.vue'
import InvProductoBuscador  from '@/components/inventario/InvProductoBuscador.vue'
import InvVentaItemEntrega  from '@/components/inventario/InvVentaItemEntrega.vue'

const emit = defineEmits(['close', 'venta-creada'])

const { success: notifySuccess } = useNotification()

const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

// ─── Contexto de sesión ───────────────────────────────────────────────────────
const sedeActual = ref(null)

async function loadUserContext() {
  try {
    const user = await authService.getUser()
    sedeActual.value = user?.sede_id ?? null
  } catch { /* sin sede */ }
}

// ─── Wizard state ─────────────────────────────────────────────────────────────
const step = ref(1)
const stepLabel = computed(() => ['Seleccionar estudiante', 'Seleccionar productos', 'Confirmar pago'][step.value - 1])

// ─── Paso 1: Estudiante + almacén ─────────────────────────────────────────────
const estudianteQuery        = ref('')
const estudiantesResultados  = ref([])
const buscandoEstudiante     = ref(false)
const estudianteBuscado      = ref(false)
const estudianteSeleccionado = ref(null)
const estudianteNuevo        = ref(false)
const mostrarFormNuevo       = ref(false)
const nuevoForm   = reactive({ primer_nombre: '', primer_apellido: '', documento: '', email: '' })
const nuevoErrors = ref({})
const nuevoError  = ref('')
const almacenOptions         = ref([])

const form = reactive({
  almacen_id:   '',
  monto_abono:  0,
  observaciones: '',
})

function nombreDeEstudiante(e) {
  return e.nombre_completo ?? e.name ?? [e.primer_nombre, e.primer_apellido].filter(Boolean).join(' ') ?? '—'
}

const nombreEstudiante = computed(() => estudianteSeleccionado.value ? nombreDeEstudiante(estudianteSeleccionado.value) : '—')

const almacenSeleccionado = computed(() => almacenOptions.value.find(o => o.value === form.almacen_id))
const almacenNombre   = computed(() => almacenSeleccionado.value?.label ?? '—')
const almacenSedeId   = computed(() => almacenSeleccionado.value?.sede_id ?? null)

let estudianteTimer = null
function onEstudianteInput() {
  clearTimeout(estudianteTimer)
  estudianteBuscado.value = false
  if (estudianteQuery.value.length < 2) { estudiantesResultados.value = []; return }
  estudianteTimer = setTimeout(buscarEstudiante, 350)
}

async function buscarEstudiante() {
  if (estudianteQuery.value.length < 2) return
  buscandoEstudiante.value = true
  estudianteBuscado.value  = false
  try {
    const res = await userService.getAll(
      { search: estudianteQuery.value, per_page: 10, with: 'roles' },
      { _silent: true }
    )
    estudiantesResultados.value = res.data ?? []
  } catch { estudiantesResultados.value = [] }
  finally {
    buscandoEstudiante.value = false
    estudianteBuscado.value  = true
  }
}

function selectEstudiante(e) {
  estudianteSeleccionado.value = e
  estudianteNuevo.value        = false
  estudiantesResultados.value  = []
  estudianteBuscado.value      = false
  estudianteQuery.value        = ''
}

function clearEstudiante() {
  estudianteSeleccionado.value = null
  estudianteNuevo.value        = false
  mostrarFormNuevo.value       = false
  estudianteBuscado.value      = false
  estudiantesResultados.value  = []
  estudianteQuery.value        = ''
  Object.assign(nuevoForm, { primer_nombre: '', primer_apellido: '', documento: '', email: '' })
  nuevoErrors.value = {}
  nuevoError.value  = ''
}

function iniciarRegistroNuevo() {
  mostrarFormNuevo.value = true
  // Pre-rellenar documento si parece numérico
  if (/^\d+$/.test(estudianteQuery.value)) {
    nuevoForm.documento = estudianteQuery.value
  }
}

function confirmarNuevoEstudiante() {
  nuevoErrors.value = {}
  nuevoError.value  = ''
  const errs = {}
  if (!nuevoForm.primer_nombre.trim())   errs.primer_nombre   = ['Campo requerido']
  if (!nuevoForm.primer_apellido.trim()) errs.primer_apellido = ['Campo requerido']
  if (!nuevoForm.documento.trim())       errs.documento       = ['Campo requerido']
  if (!nuevoForm.email.trim())           errs.email           = ['Campo requerido']
  if (Object.keys(errs).length) { nuevoErrors.value = errs; return }

  // Usar los datos del formulario como "estudiante temporal" para mostrar en el chip
  estudianteSeleccionado.value = {
    id:             null, // se creará en handleSubmit
    primer_nombre:  nuevoForm.primer_nombre,
    primer_apellido: nuevoForm.primer_apellido,
    documento:      nuevoForm.documento,
    email:          nuevoForm.email,
  }
  estudianteNuevo.value  = true
  mostrarFormNuevo.value = false
}

async function loadAlmacenes() {
  try {
    const res = await invAlmacenService.getActivos()
    almacenOptions.value = (res.data ?? res ?? []).map(a => ({ value: String(a.id), label: a.nombre, sede_id: a.sede_id }))
  } catch { almacenOptions.value = [] }
}

// ─── Paso 2: Productos + descuentos ──────────────────────────────────────────
const items             = ref([])
const descuentosActivos = ref([])

const totalItems = computed(() => items.value.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0))

async function addItem(p) {
  // Los grupos no son vendibles directamente (se usan como ancla de variantes)
  if (p.tipo === 'grupo') return

  const existing = items.value.find(i => i.producto_id === p.id)
  if (existing) { existing.cantidad++; return }

  const item = reactive({
    producto_id:      p.id,
    nombre:           p.nombre,
    precio_unitario:  p.precio_venta ?? p.precio ?? 0,
    cantidad:         1,
    descuento_id:     null,
    entregar:         true,
    entrega_completa: false,
    variantes:        {},
    _cargandoPrecio:  true,
  })
  items.value.push(item)

  try {
    const res    = await invPrecioService.getByProducto(p.id)
    const lista  = res.data ?? res ?? []
    const primer = Array.isArray(lista) ? lista[0] : lista
    if (primer?.precio != null) item.precio_unitario = Number(primer.precio)
  } catch { /* precio queda en 0; el backend validará */ }
  finally { item._cargandoPrecio = false }
}

function removeItem(productoId) {
  items.value = items.value.filter(i => i.producto_id !== productoId)
}

// ─── Disponibilidad y entrega ─────────────────────────────────────────────────
// El stock nunca bloquea la venta: solo define qué se descarga ahora y qué queda pendiente.
const {
  disponibilidad,
  verificando,
  errorDisponibilidad,
  disponibilidadDe,
} = useDisponibilidadVenta({ items, almacenId: toRef(form, 'almacen_id') })

const entregaInmediata = ref(true)

const resumenEntrega = computed(() => {
  const conteo = { ok: 0, parcial: 0, pendiente: 0, variante: 0, diferido: 0, cargando: 0 }
  items.value.forEach((item, idx) => { conteo[estadoEntregaItem(item, disponibilidadDe(idx)).tono]++ })
  return conteo
})

async function loadDescuentos() {
  try {
    // Descuentos activos de inventario: status=3 (activo) y origen=0 (inventarios)
    const { default: api } = await import('@/services/api.js')
    const { data } = await api.get('/financiero/descuentos', { params: { status: 3, origen: 0, per_page: 100 } })
    descuentosActivos.value = data?.data ?? data ?? []
  } catch { descuentosActivos.value = [] }
}

// ─── Paso 3: Pago ─────────────────────────────────────────────────────────────
const mediosPagoOptions = [
  { value: 'efectivo',       label: 'Efectivo' },
  { value: 'transferencia',  label: 'Transferencia' },
  { value: 'tarjeta_debito', label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'cheque',         label: 'Cheque' },
]

const mediosPago   = ref([{ medio_pago: 'efectivo', valor: 0, banco_id: null, referencia: '', numero_transaccion: '', tipo_tarjeta: '' }])
const bancoOptions = ref([])
const comprobante  = ref(null)
const sobrecargos  = ref([])
const aplicarSobrecargos = ref(false)
const saving       = ref(false)
const formError    = ref('')

const totalMedios    = computed(() => mediosPago.value.reduce((s, m) => s + (Number(m.valor) || 0), 0))
const totalSobrecargo = computed(() => sobrecargos.value.reduce((s, sc) => s + sc.valor_sobrecargo, 0))
const totalConSobrecargos = computed(() => totalItems.value + (aplicarSobrecargos.value ? totalSobrecargo.value : 0))
// El backend solo despacha cuando el pedido queda pagado en su totalidad
const pagoCompleto = computed(() => Number(form.monto_abono) >= totalConSobrecargos.value)

function addMedioPago() {
  mediosPago.value.push({ medio_pago: 'efectivo', valor: 0, banco_id: null, referencia: '', numero_transaccion: '', tipo_tarjeta: '' })
}

function removeMedioPago(idx) {
  mediosPago.value.splice(idx, 1)
  recalcularSobrecargos()
}

function onMedioPagoChange(idx) {
  const mp = mediosPago.value[idx]
  mp.banco_id          = null
  mp.referencia        = ''
  mp.numero_transaccion = ''
  mp.tipo_tarjeta      = ''
  recalcularSobrecargos()
}

function onValorChange() {
  recalcularSobrecargos()
}

function onComprobanteChange(e) {
  comprobante.value = e.target.files?.[0] ?? null
}

let sobrecargosTimer = null
async function recalcularSobrecargos() {
  clearTimeout(sobrecargosTimer)
  const mediosConRecargo = mediosPago.value.filter(m =>
    (m.medio_pago === 'tarjeta_credito' || m.medio_pago === 'tarjeta_debito') && m.valor > 0
  )
  if (!mediosConRecargo.length) { sobrecargos.value = []; return }

  sobrecargosTimer = setTimeout(async () => {
    try {
      const res = await invVentaService.precalcularSobrecargos({
        medios_pago: mediosPago.value
          .filter(m => m.valor > 0)
          .map(m => ({ medio_pago: m.medio_pago, tipo_tarjeta: m.tipo_tarjeta || undefined, valor: Number(m.valor) }))
      })
      sobrecargos.value = res.data?.sobrecargos ?? []
    } catch { sobrecargos.value = [] }
  }, 600)
}

async function loadBancos() {
  try {
    const res = await bancoService.getActivos()
    bancoOptions.value = (res.data ?? res ?? []).map(b => ({ value: b.id, label: b.nombre }))
  } catch { bancoOptions.value = [] }
}

// ─── Navegación ───────────────────────────────────────────────────────────────
const canAdvance = computed(() => {
  if (step.value === 1) return !!estudianteSeleccionado.value && !!form.almacen_id
  if (step.value === 2) return items.value.length > 0
  return true
})

const canSubmit = computed(() => {
  if (mediosPago.value.length === 0) return false
  if (form.monto_abono <= 0) return false
  return Math.abs(totalMedios.value - form.monto_abono) < 1
})

function nextStep() {
  if (!canAdvance.value) return
  if (step.value === 2) form.monto_abono = totalItems.value
  step.value++
}

// ─── Submit ───────────────────────────────────────────────────────────────────
const MENSAJE_VENTA = {
  entregado:  'Venta registrada y productos entregados.',
  entregando: 'Venta registrada. Algunos productos quedaron pendientes de entrega.',
  pagado:     'Venta registrada. Los productos quedaron pendientes de entrega.',
  activo:     'Venta registrada con saldo pendiente. Se entregará al completar el pago.',
}

async function handleSubmit() {
  formError.value = ''
  if (!canSubmit.value) {
    formError.value = 'La suma de medios de pago debe coincidir con el monto a abonar.'
    return
  }

  saving.value = true

  // Si el estudiante es nuevo, crearlo primero
  if (estudianteNuevo.value) {
    try {
      const payload = {
        primer_nombre:         nuevoForm.primer_nombre,
        primer_apellido:       nuevoForm.primer_apellido,
        documento:             nuevoForm.documento,
        email:                 nuevoForm.email,
        password:              nuevoForm.documento,
        password_confirmation: nuevoForm.documento,
        roles:                 ['alumno'],
        ...(sedeActual.value ? { sedes: [sedeActual.value] } : {}),
      }
      const created = await userService.create(payload, { _silent: true })
      const newId   = created.data?.id ?? created?.id ?? null
      if (!newId) throw new Error('No se obtuvo ID del nuevo estudiante.')
      estudianteSeleccionado.value = { ...estudianteSeleccionado.value, id: newId }
    } catch (e) {
      const errs = e?.response?.data?.errors ?? {}
      formError.value = Object.values(errs).flat().join(' ')
        || e?.response?.data?.message
        || e?.message
        || 'Error al crear el estudiante.'
      saving.value = false
      return
    }
  }

  const tieneTransferencia = mediosPago.value.some(m => m.medio_pago === 'transferencia')

  const mediosPayload = mediosPago.value
    .filter(m => Number(m.valor) > 0)
    .map(m => {
      const mp = { medio_pago: m.medio_pago, valor: Number(m.valor) }
      if (m.banco_id)           mp.banco_id            = m.banco_id
      if (m.referencia)         mp.referencia          = m.referencia
      if (m.numero_transaccion) mp.numero_transaccion  = m.numero_transaccion
      if (m.tipo_tarjeta)       mp.tipo_tarjeta        = m.tipo_tarjeta
      return mp
    })

  const itemsPayload = items.value.map(i => ({
    producto_id:      i.producto_id,
    cantidad:         i.cantidad,
    descuento_id:     i.descuento_id ?? null,
    entregar:         i.entregar,
    entrega_completa: i.entrega_completa,
  }))

  // Al crear la venta los ítems aún no tienen id: las variantes se referencian por posición
  const variantesKitPayload = items.value
    .map((i, idx) => ({ item_index: idx, componentes: variantesSeleccionadas(i.variantes) }))
    .filter(v => v.componentes.length)

  const sobrecargosPayload = aplicarSobrecargos.value
    ? sobrecargos.value.map((sc, idx) => ({ descuento_id: sc.descuento_id, medio_pago_index: idx }))
    : []

  let res
  try {
    if (tieneTransferencia && comprobante.value) {
      const fd = new FormData()
      fd.append('estudiante_id', estudianteSeleccionado.value.id)
      fd.append('sede_id',       almacenSedeId.value ?? '')
      fd.append('almacen_id',    Number(form.almacen_id))
      fd.append('monto_abono',   form.monto_abono)
      if (form.observaciones) fd.append('observaciones', form.observaciones)
      fd.append('comprobante',   comprobante.value)
      // Laravel valida `boolean` en multipart solo con 1/0
      fd.append('entrega_inmediata', entregaInmediata.value ? 1 : 0)
      itemsPayload.forEach((it, i) => {
        fd.append(`items[${i}][producto_id]`,      it.producto_id)
        fd.append(`items[${i}][cantidad]`,         it.cantidad)
        fd.append(`items[${i}][entregar]`,         it.entregar ? 1 : 0)
        fd.append(`items[${i}][entrega_completa]`, it.entrega_completa ? 1 : 0)
        if (it.descuento_id) fd.append(`items[${i}][descuento_id]`, it.descuento_id)
      })
      variantesKitPayload.forEach((v, i) => {
        fd.append(`variantes_kit[${i}][item_index]`, v.item_index)
        v.componentes.forEach((c, j) => {
          fd.append(`variantes_kit[${i}][componentes][${j}][kit_componente_id]`,     c.kit_componente_id)
          fd.append(`variantes_kit[${i}][componentes][${j}][producto_entregado_id]`, c.producto_entregado_id)
        })
      })
      mediosPayload.forEach((mp, i) => {
        Object.entries(mp).forEach(([k, v]) => fd.append(`medios_pago[${i}][${k}]`, v))
      })
      sobrecargosPayload.forEach((sc, i) => {
        fd.append(`sobrecargos[${i}][descuento_id]`,    sc.descuento_id)
        fd.append(`sobrecargos[${i}][medio_pago_index]`, sc.medio_pago_index)
      })
      res = await invVentaService.create(fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else {
      res = await invVentaService.create({
        estudiante_id: estudianteSeleccionado.value.id,
        sede_id:       almacenSedeId.value ? Number(almacenSedeId.value) : null,
        almacen_id:    Number(form.almacen_id),
        monto_abono:   Number(form.monto_abono),
        observaciones: form.observaciones || undefined,
        items:             itemsPayload,
        entrega_inmediata: entregaInmediata.value,
        variantes_kit:     variantesKitPayload,
        medios_pago:       mediosPayload,
        sobrecargos:       sobrecargosPayload,
      })
    }

    const pedido = res.data ?? res
    notifySuccess(MENSAJE_VENTA[pedido?.status] ?? 'Venta registrada correctamente.')
    emit('venta-creada', pedido, res.recibo ?? null)
    close()
  } catch (e) {
    if (e?.response?.status === 422) {
      const errs = e.response.data?.errors ?? {}
      formError.value = Object.values(errs).flat().join(' ') || e.response.data?.message || 'Verifica los datos.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error al registrar la venta.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function resetWizard() {
  step.value                   = 1
  estudianteQuery.value        = ''
  estudiantesResultados.value  = []
  estudianteBuscado.value      = false
  estudianteSeleccionado.value = null
  estudianteNuevo.value        = false
  mostrarFormNuevo.value       = false
  nuevoErrors.value            = {}
  nuevoError.value             = ''
  Object.assign(nuevoForm, { primer_nombre: '', primer_apellido: '', documento: '', email: '' })
  items.value                  = []
  mediosPago.value             = [{ medio_pago: 'efectivo', valor: 0, banco_id: null, referencia: '', numero_transaccion: '', tipo_tarjeta: '' }]
  comprobante.value            = null
  sobrecargos.value            = []
  aplicarSobrecargos.value     = false
  entregaInmediata.value       = true
  formError.value              = ''
  Object.assign(form, { almacen_id: '', monto_abono: 0, observaciones: '' })
}

function close() { emit('close') }

onMounted(() => { resetWizard(); loadUserContext(); loadAlmacenes(); loadBancos(); loadDescuentos() })
</script>
