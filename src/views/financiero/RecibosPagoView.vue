<template>
  <div class="flex flex-col gap-6">

    <!-- ── Estadísticas ─────────────────────────────────────────────────────── -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-recibos-heading">
      <h2 id="stats-recibos-heading" class="sr-only">Resumen de recibos de pago</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard title="Total"    :value="stats.total"    description="Recibos registrados"     icon="receipt"  icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Creados"  :value="stats.creados"  description="Pendientes de cierre"    icon="pendientes" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Cerrados" :value="stats.cerrados" description="Incluidos en cierre"     icon="activos"  icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Anulados" :value="stats.anulados" description="Recibos sin efecto"      icon="track_changes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- ── API no disponible ─────────────────────────────────────────────────── -->
    <section v-if="apiError" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
      <p class="text-sm text-amber-800">{{ apiError }}</p>
      <p class="mt-2 text-xs text-amber-700">
        Verifica que el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/recibos-pago</code>
        esté disponible.
      </p>
    </section>

    <template v-else>

      <!-- ── Filtros y acciones ────────────────────────────────────────────── -->
      <section aria-labelledby="filtros-recibos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-recibos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">

          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Número de recibo..."
              help="Filtra por número o prefijo del recibo."
              @input="onSearchInput"
            />
          </div>

          <div class="w-full sm:w-[180px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              help="Filtra por estado del recibo en el flujo de caja."
              :options="statusFilterOptions"
            />
          </div>

          <div class="w-full sm:w-[170px]">
            <FormInput
              v-model="filters.fecha_inicio"
              label="Desde:"
              type="date"
              help="Fecha inicial del rango de búsqueda."
              @change="loadRecibos(1)"
            />
          </div>

          <div class="w-full sm:w-[170px]">
            <FormInput
              v-model="filters.fecha_fin"
              label="Hasta:"
              type="date"
              help="Fecha final del rango de búsqueda."
              @change="loadRecibos(1)"
            />
          </div>

          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="filters.vigentes
                ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'"
              @click="toggleVigentes"
            >
              <NavIcon name="eye" class="size-4" />
              {{ filters.vigentes ? 'Solo vigentes' : 'Todos' }}
            </button>

            <button
              v-if="canCreate"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openCreate"
            >
              <NavIcon name="plus" class="size-4" /> Nuevo recibo
            </button>
          </div>
        </div>
      </section>

      <!-- ── Tabla ──────────────────────────────────────────────────────────── -->
      <section aria-labelledby="listado-recibos-heading">
        <SectionHeader
          id="listado-recibos-heading"
          title="Recibos de pago"
          description="Registro de cobros emitidos. Los recibos cerrados forman parte del cierre de caja; los anulados no tienen efecto contable."
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando recibos de pago...</span>
        </div>

        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadRecibos(1)">Reintentar</button>
        </div>

        <DataTable
          v-else
          :columns="tableColumns"
          :data="recibos"
          row-key="id"
          aria-label="Listado de recibos de pago"
          actions-first
        >
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'numero_recibo'">
              <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800">{{ value }}</code>
            </template>

            <template v-else-if="column.key === 'status_text'">
              <StatusBadge :label="value ?? '—'" :variant="statusBadgeVariant(row.status)" />
            </template>

            <template v-else-if="column.key === 'valor_total_formatted'">
              <span class="font-mono text-sm text-slate-900">$ {{ value ?? row.valor_total }}</span>
            </template>

            <template v-else>{{ value ?? '—' }}</template>
          </template>

          <template #actions="{ row }">
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Ver detalle"
              @click="openDetail(row)"
            >
              <NavIcon name="eye" class="size-4" />
            </button>

            <button
              v-if="canPdf"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Imprimir / PDF"
              :disabled="printLoading"
              @click="descargarPdf(row)"
            >
              <NavIcon name="print" class="size-4" />
            </button>

            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-sky-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              title="Enviar por correo"
              :disabled="emailLoadingId === row.id"
              @click="enviarEmail(row)"
            >
              <svg v-if="emailLoadingId === row.id" class="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <NavIcon v-else name="mail" class="size-4" />
            </button>

            <button
              v-if="row.status === 1 && canAnular"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Anular recibo"
              @click="openAnular(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>

            <!-- Notificar (status 4 — pendiente aprobación) -->
            <button
              v-if="row.status === 4"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Notificar al validador"
              :disabled="notificarLoadingId === row.id"
              @click="notificarTransferencia(row)"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            <!-- Reenviar (status 5 — rechazado) -->
            <button
              v-if="row.status === 5"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Corregir y reenviar"
              @click="openReenviar(row)"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <!-- Eliminar (status 4 ó 5) -->
            <button
              v-if="row.status === 4 || row.status === 5"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar recibo"
              @click="openEliminar(row)"
            >
              <NavIcon name="trash" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} recibos
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              :disabled="pagination.currentPage === 1"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="goToPage(pagination.currentPage - 1)"
            >Anterior</button>
            <button
              type="button"
              :disabled="pagination.currentPage === pagination.lastPage"
              class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="goToPage(pagination.currentPage + 1)"
            >Siguiente</button>
          </div>
        </div>
      </section>
    </template>
  </div>

  <!-- ── Modal: Detalle ───────────────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle del recibo" size="xl">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="receipt" class="size-5" />
      </span>
    </template>

    <div v-if="detailLoading" class="flex justify-center py-8">
      <span class="text-sm text-slate-500">Cargando detalle...</span>
    </div>

    <div v-else-if="detailRecibo" class="space-y-5 pb-4">
      <!-- Encabezado -->
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt class="font-medium text-slate-500">Número</dt>
          <dd class="mt-0.5 font-mono font-semibold text-slate-900">{{ detailRecibo.numero_recibo }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="detailRecibo.status_text ?? '—'" :variant="statusBadgeVariant(detailRecibo.status)" />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Fecha</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailRecibo.fecha_recibo }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Sede</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailRecibo.sede?.nombre ?? detailRecibo.sede_id }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Cajero</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailRecibo.cajero?.name ?? detailRecibo.cajero_id }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Total</dt>
          <dd class="mt-0.5 font-mono font-semibold text-slate-900">$ {{ detailRecibo.valor_total_formatted ?? detailRecibo.valor_total }}</dd>
        </div>
        <div v-if="detailRecibo.descuento_total > 0">
          <dt class="font-medium text-slate-500">Descuento</dt>
          <dd class="mt-0.5 font-mono font-semibold text-emerald-700">− $ {{ detailRecibo.descuento_total_formatted ?? formatMoney(detailRecibo.descuento_total) }}</dd>
        </div>
        <div v-if="detailRecibo.sobrecargo_total > 0">
          <dt class="font-medium text-slate-500">Recargo</dt>
          <dd class="mt-0.5 font-mono font-semibold text-orange-700">+ $ {{ detailRecibo.sobrecargo_total_formatted ?? formatMoney(detailRecibo.sobrecargo_total) }}</dd>
        </div>
        <div v-if="detailRecibo.valor_neto != null">
          <dt class="font-medium text-slate-500">Valor neto (cubre deuda)</dt>
          <dd class="mt-0.5 font-mono font-semibold text-slate-900">$ {{ formatMoney(detailRecibo.valor_neto) }}</dd>
        </div>
        <div v-if="detailRecibo.fecha_aprobacion">
          <dt class="font-medium text-slate-500">Fecha aprobación</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailRecibo.fecha_aprobacion }}</dd>
        </div>
        <div v-if="detailRecibo.aprobado_por">
          <dt class="font-medium text-slate-500">Aprobado por</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailRecibo.aprobado_por?.name ?? detailRecibo.aprobado_por_id }}</dd>
        </div>
      </dl>

      <!-- Motivo de anulación -->
      <div v-if="detailRecibo.esta_anulado && detailRecibo.motivo_anulacion" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-red-700">Motivo de anulación</p>
        <p class="mt-1 text-sm text-red-800">{{ detailRecibo.motivo_anulacion }}</p>
      </div>

      <!-- Motivo de rechazo (transferencia rechazada) -->
      <div v-if="detailRecibo.esta_rechazado && detailRecibo.motivo_rechazo" class="rounded-lg border border-red-200 bg-red-50 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-red-700">Motivo de rechazo</p>
        <p class="mt-1 text-sm text-red-800">{{ detailRecibo.motivo_rechazo }}</p>
      </div>

      <!-- Pendiente de aprobación (aviso) -->
      <div v-if="detailRecibo.esta_pendiente_aprobacion" class="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">Pendiente de aprobación</p>
        <p class="mt-1 text-sm text-amber-800">
          Este recibo está en espera de validación. El número de recibo se asignará al ser aprobado.
        </p>
      </div>

      <!-- Conceptos de pago -->
      <div v-if="detailRecibo.conceptos_pago?.length">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">Conceptos de pago</h3>
        <div class="overflow-auto rounded-lg border border-black/10">
          <table class="w-full text-xs">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-slate-500">Concepto</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Cant.</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Unitario</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              <tr v-for="cp in detailRecibo.conceptos_pago" :key="cp.id" class="hover:bg-slate-50">
                <td class="px-3 py-2">
                  <div class="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                    <span class="font-medium text-slate-800">{{ cpNombre(cp) }}</span>
                    <span v-if="cp.observaciones" class="text-slate-500">— {{ cp.observaciones }}</span>
                    <span
                      v-if="cp.status_cartera != null"
                      class="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                      :class="statusConceptoClass(cp.status_cartera)"
                    >{{ cp.status_cartera === 2 ? 'Pagada' : statusCarteraText(cp.status_cartera) }}</span>
                    <span
                      v-if="cp.status_cartera === 1 && cp.saldo_cartera"
                      class="text-[10px] font-medium text-amber-700"
                    >· Saldo: $ {{ formatMoney(cp.saldo_cartera) }}</span>
                  </div>
                </td>
                <td class="px-3 py-2 text-right text-slate-800">{{ cp.cantidad }}</td>
                <td class="px-3 py-2 text-right font-mono text-slate-800">$ {{ formatMoney(cp.unitario) }}</td>
                <td class="px-3 py-2 text-right font-mono font-medium text-slate-900">$ {{ formatMoney(cp.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Medios de pago -->
      <div v-if="detailRecibo.medios_pago?.length">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">Medios de pago</h3>
        <div class="overflow-auto rounded-lg border border-black/10">
          <table class="w-full text-xs">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-slate-500">Medio</th>
                <th class="px-3 py-2 text-left font-medium text-slate-500">Referencia</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Valor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              <tr v-for="mp in detailRecibo.medios_pago" :key="mp.id" class="hover:bg-slate-50">
                <td class="px-3 py-2 text-slate-800 capitalize">{{ mp.medio_pago?.replace(/_/g, ' ') }}</td>
                <td class="px-3 py-2 text-slate-600">
                  <template v-if="mp.medio_pago === 'transferencia'">
                    <div v-if="mp.banco_nombre" class="font-medium text-slate-800">{{ mp.banco_nombre }}</div>
                    <div v-if="mp.numero_transaccion" class="text-xs text-slate-500">Trans: {{ mp.numero_transaccion }}</div>
                    <template v-if="mp.comprobante_url">
                      <a
                        v-if="isImageUrl(mp.comprobante_url)"
                        :href="resolveStorageUrl(mp.comprobante_url)"
                        target="_blank"
                        rel="noopener"
                        class="mt-1 block"
                      >
                        <img
                          :src="resolveStorageUrl(mp.comprobante_url)"
                          alt="Comprobante"
                          class="h-20 w-auto max-w-[160px] rounded border border-slate-200 object-cover"
                        />
                      </a>
                      <a
                        v-else
                        :href="resolveStorageUrl(mp.comprobante_url)"
                        target="_blank"
                        rel="noopener"
                        class="mt-1 inline-flex items-center gap-1.5 text-xs text-blue-600 underline"
                      >
                        <svg class="size-3.5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                        </svg>
                        Ver comprobante PDF
                      </a>
                    </template>
                  </template>
                  <template v-else>{{ mp.referencia ?? '—' }}</template>
                </td>
                <td class="px-3 py-2 text-right font-mono font-medium text-slate-900">$ {{ formatMoney(mp.valor) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sobrecargos aplicados -->
      <div v-if="detailRecibo.sobrecargos?.length">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">Recargos aplicados</h3>
        <div class="overflow-auto rounded-lg border border-orange-200 bg-orange-50">
          <table class="w-full text-xs">
            <thead class="bg-orange-100">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-orange-700">Concepto</th>
                <th class="px-3 py-2 text-right font-medium text-orange-700">Recargo</th>
                <th class="px-3 py-2 text-right font-medium text-orange-700">Valor base</th>
                <th class="px-3 py-2 text-right font-medium text-orange-700">Recargo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-orange-100">
              <tr v-for="sc in detailRecibo.sobrecargos" :key="sc.id" class="hover:bg-orange-100">
                <td class="px-3 py-2 text-slate-800">{{ sc.nombre }}</td>
                <td class="px-3 py-2 text-right font-mono text-slate-700">
                  {{ sc.tipo === 'valor_fijo' ? `$ ${formatMoney(sc.valor)}` : `${sc.valor ?? sc.porcentaje}%` }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-slate-700">$ {{ formatMoney(sc.valor_base) }}</td>
                <td class="px-3 py-2 text-right font-mono font-semibold text-orange-700">+ $ {{ sc.valor_sobrecargo_formatted ?? formatMoney(sc.valor_sobrecargo) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showDetailModal = false"
      >Cerrar</button>
      <button
        v-if="detailRecibo && canPdf"
        type="button"
        class="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="descargarPdf(detailRecibo)"
      >
        <NavIcon name="print" class="size-4" /> Imprimir
      </button>
      <button
        v-if="detailRecibo?.status === 1 && canAnular"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="openAnularDesdeDetalle"
      >
        Anular
      </button>

      <!-- Acciones para transferencias pendientes / rechazadas -->
      <button
        v-if="detailRecibo?.esta_pendiente_aprobacion"
        type="button"
        :disabled="notificarLoadingId === detailRecibo?.id"
        class="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
        @click="notificarTransferencia(detailRecibo)"
      >
        Notificar al validador
      </button>
      <button
        v-if="detailRecibo?.esta_rechazado"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="openReenviar(detailRecibo); showDetailModal = false"
      >
        Corregir y reenviar
      </button>
      <button
        v-if="detailRecibo?.esta_pendiente_aprobacion || detailRecibo?.esta_rechazado"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="openEliminar(detailRecibo); showDetailModal = false"
      >
        Eliminar
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Imprimir recibo ──────────────────────────────────────────── -->
  <ReciboPrintModal
    :open="showPrintModal"
    :recibo="printRecibo"
    @close="showPrintModal = false"
  />

  <!-- ── Modal: Anular ────────────────────────────────────────────────────── -->
  <ModalBase
    v-model="showAnularModal"
    title="Anular recibo de pago"
    description="Esta acción no se puede deshacer. El recibo quedará sin efecto contable."
  >
    <div class="space-y-4 pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas que deseas anular el recibo
        <strong>{{ targetRecibo?.numero_recibo }}</strong>
        por <strong>$ {{ formatMoney(targetRecibo?.valor_total) }}</strong>?
      </p>
      <div>
        <label for="motivo-anulacion" class="mb-1 block text-sm font-medium text-slate-700">
          Motivo de anulación <span class="text-red-500">*</span>
        </label>
        <textarea
          id="motivo-anulacion"
          v-model="motivoAnulacion"
          rows="3"
          maxlength="500"
          placeholder="Describe el motivo por el cual se anula este recibo..."
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
        />
        <p class="mt-1 text-right text-xs text-slate-400">{{ motivoAnulacion.length }}/500</p>
      </div>
      <p class="text-xs text-slate-500">
        Solo pueden anularse recibos en estado Creado. Los recibos cerrados (en cierre de caja) no pueden anularse.
      </p>
      <div v-if="actionError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {{ actionError }}
      </div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showAnularModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="actionLoading || !motivoAnulacion.trim()"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="confirmAnular"
      >
        {{ actionLoading ? 'Anulando...' : 'Anular recibo' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Corregir y reenviar transferencia ────────────────────────── -->
  <ModalBase
    v-model="showReenviarModal"
    title="Corregir y reenviar transferencia"
    description="Actualiza los datos del recibo rechazado y reenvíalo a aprobación."
  >
    <div class="space-y-4 pb-2">
      <div v-if="actionError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>

      <!-- Banco -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">Banco origen <span class="text-red-500">*</span></label>
        <select
          v-model="reenviarForm.banco_id"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option :value="null">-- Sin cambio --</option>
          <option v-for="b in bancosActivos" :key="b.id" :value="b.id">
            {{ b.nombre }}{{ b.codigo ? ` (${b.codigo})` : '' }}
          </option>
        </select>
      </div>

      <!-- Número de transacción -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">Número de transacción <span class="text-red-500">*</span></label>
        <input
          v-model="reenviarForm.numero_transaccion"
          type="text"
          placeholder="Nuevo número de transacción"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <!-- Comprobante -->
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700">Nuevo comprobante <span class="text-red-500">*</span></label>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,.webp"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="onReenviarFileChange"
        />
        <p class="mt-1 text-xs text-slate-400">Reemplaza el comprobante anterior. JPG, PNG, PDF o WebP · máx. 5 MB.</p>
      </div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showReenviarModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="actionLoading || !reenviarCompleto"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="confirmReenviar"
      >
        {{ actionLoading ? 'Reenviando...' : 'Reenviar a aprobación' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Eliminar recibo pendiente/rechazado ──────────────────────── -->
  <ModalBase
    v-model="showEliminarModal"
    title="Eliminar recibo"
    description="Esta acción eliminará el recibo y su comprobante adjunto."
  >
    <div class="space-y-3 pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas que deseas eliminar el recibo de
        <strong>$ {{ formatMoney(targetRecibo?.valor_total) }}</strong>
        en estado <strong>{{ targetRecibo?.status_text }}</strong>?
      </p>
      <p class="text-xs text-slate-500">Esta acción no se puede deshacer. El comprobante adjunto también será eliminado.</p>
      <div v-if="actionError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showEliminarModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="actionLoading"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="confirmEliminar"
      >
        {{ actionLoading ? 'Eliminando...' : 'Eliminar recibo' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter }           from 'vue-router'
import StatCard                from '@/components/dashboard/StatCard.vue'
import DataTable               from '@/components/activos/DataTable.vue'
import SectionHeader           from '@/components/activos/SectionHeader.vue'
import StatusBadge             from '@/components/activos/StatusBadge.vue'
import FormInput               from '@/components/forms/FormInput.vue'
import FormInputSearch         from '@/components/forms/FormInputSearch.vue'
import FormSelect              from '@/components/forms/FormSelect.vue'
import NavIcon                 from '@/components/icons/NavIcon.vue'
import ModalBase               from '@/components/ModalBase.vue'
import ReciboPrintModal        from '@/components/financiero/ReciboPrintModal.vue'
import reciboPagoService       from '@/services/reciboPagoService.js'
import bancoService            from '@/services/bancoService.js'
import { useNotification }     from '@/composables/useNotification'

const router = useRouter()
const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate = ref(true)
const canAnular = ref(true)
const canPdf    = ref(true)

// ─── Bancos activos (para modal reenviar) ─────────────────────────────────────
const bancosActivos = ref([])

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'numero_recibo',         label: 'N.° Recibo' },
  { key: 'fecha_recibo',          label: 'Fecha' },
  { key: 'valor_total_formatted', label: 'Total' },
  { key: 'status_text',           label: 'Estado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const recibos  = ref([])
const loading  = ref(false)
const error    = ref('')
const apiError = ref('')

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, creados: 0, cerrados: 0, anulados: 0 })
const filters    = reactive({ search: '', status: '', fecha_inicio: '', fecha_fin: '', vigentes: true })

const statusFilterOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '1', label: 'Creado' },
  { value: '2', label: 'Cerrado' },
  { value: '3', label: 'Anulado' },
  { value: '4', label: 'Pendiente Aprobación' },
  { value: '5', label: 'Rechazado' },
]

function statusBadgeVariant(status) {
  const map = { 1: 'disponible', 2: 'activo', 3: 'inactivo', 4: 'mantenimiento', 5: 'baja' }
  return map[status] ?? 'inactivo'
}

function formatMoney(val) {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isImageUrl(url) {
  return /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(url)
}

const backendBase = import.meta.env.VITE_API_URL.replace(/\/api$/, '')

function resolveStorageUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return backendBase + url
}

function cpNombre(cp) {
  const nombre = cp.nombre ?? ''
  if (cp.observaciones?.includes('cuota 0') || nombre === 'Matrícula') return 'Matrícula'
  if (nombre === 'Pago de mensualidad') return 'Pago mes'
  return nombre || '—'
}

function statusConceptoClass(status) {
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

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadRecibos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: pagination.perPage }
    if (filters.search)        params.search       = filters.search
    if (filters.status !== '') params.status        = filters.status
    if (filters.fecha_inicio)  params.fecha_inicio  = filters.fecha_inicio
    if (filters.fecha_fin)     params.fecha_fin     = filters.fecha_fin
    if (filters.vigentes)      params.vigentes      = true

    const res = await reciboPagoService.getAll(params)
    recibos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    const status = e?.response?.status
    if (status === 404 || status >= 500) {
      apiError.value = 'El servicio de recibos de pago no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los recibos de pago.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [creados, cerrados, anulados] = await Promise.all([
      reciboPagoService.getAll({ per_page: 1, page: 1, status: 1 }),
      reciboPagoService.getAll({ per_page: 1, page: 1, status: 2 }),
      reciboPagoService.getAll({ per_page: 1, page: 1, status: 3, vigentes: false }),
    ])
    stats.creados  = creados.meta?.total  ?? 0
    stats.cerrados = cerrados.meta?.total ?? 0
    stats.anulados = anulados.meta?.total ?? 0
    stats.total    = stats.creados + stats.cerrados + stats.anulados
  } catch {
    // Informativo, no bloquea la vista
  }
}

// ─── Filtros y búsqueda ───────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadRecibos(1), 400)
}

function toggleVigentes() {
  filters.vigentes = !filters.vigentes
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadRecibos(page)
}

watch(() => filters.status,   () => loadRecibos(1))
watch(() => filters.vigentes, () => loadRecibos(1))

// ─── Nuevo recibo ─────────────────────────────────────────────────────────────
function openCreate() {
  router.push({ name: 'NuevoReciboPago' })
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailRecibo    = ref(null)
const detailLoading   = ref(false)

async function openDetail(recibo) {
  detailRecibo.value    = recibo
  showDetailModal.value = true
  detailLoading.value   = true
  try {
    const res = await reciboPagoService.getById(recibo.id, { with: 'sede,cajero,conceptosPago,mediosPago,sobrecargos,matricula' })
    detailRecibo.value = res.data
  } catch {
    // Mantiene los datos del listado
  } finally {
    detailLoading.value = false
  }
}

// ─── Modal Anular ─────────────────────────────────────────────────────────────
const showAnularModal  = ref(false)
const targetRecibo     = ref(null)
const motivoAnulacion  = ref('')
const actionLoading    = ref(false)
const actionError      = ref('')

function openAnular(recibo) {
  targetRecibo.value    = recibo
  motivoAnulacion.value = ''
  actionError.value     = ''
  showAnularModal.value = true
}

function openAnularDesdeDetalle() {
  targetRecibo.value    = detailRecibo.value
  motivoAnulacion.value = ''
  actionError.value     = ''
  showDetailModal.value = false
  showAnularModal.value = true
}

async function confirmAnular() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await reciboPagoService.anular(targetRecibo.value.id, motivoAnulacion.value.trim())
    notifySuccess(`Recibo ${targetRecibo.value.numero_recibo} anulado correctamente.`)
    showAnularModal.value = false
    await Promise.all([loadRecibos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al anular el recibo de pago.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Acciones de transferencia ───────────────────────────────────────────────
const notificarLoadingId = ref(null)

async function notificarTransferencia(recibo) {
  notificarLoadingId.value = recibo.id
  try {
    const res = await reciboPagoService.notificarTransferencia(recibo.id)
    notifySuccess(res.message ?? 'Validadores notificados correctamente.')
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'Error al enviar la notificación.')
  } finally {
    notificarLoadingId.value = null
  }
}

// Modal reenviar
const showReenviarModal  = ref(false)
const reenviarForm       = reactive({ banco_id: null, numero_transaccion: '', comprobante_file: null })
const reenviarCompleto   = computed(() =>
  reenviarForm.banco_id !== null &&
  reenviarForm.numero_transaccion.trim() !== '' &&
  reenviarForm.comprobante_file !== null
)

function onReenviarFileChange(e) {
  reenviarForm.comprobante_file = e.target.files?.[0] ?? null
}

async function openReenviar(recibo) {
  targetRecibo.value       = recibo
  reenviarForm.banco_id          = null
  reenviarForm.numero_transaccion = ''
  reenviarForm.comprobante_file  = null
  actionError.value        = ''
  if (!bancosActivos.value.length) {
    try {
      const res = await bancoService.getActivos()
      bancosActivos.value = res.data ?? []
    } catch { /* no bloquea */ }
  }
  showReenviarModal.value = true
}

async function confirmReenviar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    let payload, config
    if (reenviarForm.comprobante_file) {
      const fd = new FormData()
      if (reenviarForm.banco_id)          fd.append('banco_id', reenviarForm.banco_id)
      if (reenviarForm.numero_transaccion) fd.append('numero_transaccion', reenviarForm.numero_transaccion)
      fd.append('comprobante', reenviarForm.comprobante_file)
      payload = fd
      config  = {}
    } else {
      payload = {}
      if (reenviarForm.banco_id)          payload.banco_id          = reenviarForm.banco_id
      if (reenviarForm.numero_transaccion) payload.numero_transaccion = reenviarForm.numero_transaccion
      config = {}
    }
    const res = await reciboPagoService.reenviarTransferencia(targetRecibo.value.id, payload, config)
    notifySuccess(res.message ?? 'Recibo corregido y reenviado a aprobación.')
    showReenviarModal.value = false
    loadRecibos(pagination.currentPage)
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al reenviar el recibo.'
  } finally {
    actionLoading.value = false
  }
}

// Modal eliminar (status 4 ó 5)
const showEliminarModal = ref(false)

function openEliminar(recibo) {
  targetRecibo.value      = recibo
  actionError.value       = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await reciboPagoService.eliminar(targetRecibo.value.id)
    notifySuccess('Recibo eliminado correctamente.')
    showEliminarModal.value = false
    loadRecibos(pagination.currentPage)
    loadStatistics()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el recibo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Envío de correo desde la lista ──────────────────────────────────────────
const emailLoadingId = ref(null)

async function enviarEmail(recibo) {
  emailLoadingId.value = recibo.id
  try {
    const res = await reciboPagoService.enviarEmail(recibo.id)
    notifySuccess(`Recibo enviado a ${res.estudiante_email}`)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo enviar el correo.')
  } finally {
    emailLoadingId.value = null
  }
}

// ─── Impresión de recibo ──────────────────────────────────────────────────────
const showPrintModal  = ref(false)
const printRecibo     = ref(null)
const printLoading    = ref(false)

async function descargarPdf(recibo) {
  printLoading.value = true
  try {
    const res = await reciboPagoService.getById(recibo.id, {
      with: 'sede,cajero,conceptosPago,mediosPago,matricula',
    })
    printRecibo.value    = res.data
    showPrintModal.value = true
  } catch {
    // El toast global de api.js cubre el error
  } finally {
    printLoading.value = false
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadRecibos(1)
  if (!apiError.value) {
    await loadStatistics()
  }
})
</script>
