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
              title="Descargar PDF"
              @click="descargarPdf(row)"
            >
              <NavIcon name="download" class="size-4" />
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

  <!-- ── Modal: Crear recibo ──────────────────────────────────────────────── -->
  <ModalBase
    v-model="showFormModal"
    title="Nuevo recibo de pago"
    description="Registra manualmente un cobro con sus conceptos y medios de pago."
    size="xl"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="receipt" class="size-5" />
      </span>
    </template>

    <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitForm">

      <!-- ── Campos comunes ────────────────────────────────────────── -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          v-model="form.sede_id"
          label="Sede *"
          :options="sedeOptions"
          :required="true"
          help="Sede que emite el recibo."
          :error="fieldErrors.sede_id?.[0]"
        />
        <FormInput
          v-model="form.fecha_recibo"
          label="Fecha del recibo *"
          type="date"
          :required="true"
          help="Fecha de emisión del comprobante."
          :error="fieldErrors.fecha_recibo?.[0]"
        />
      </div>

      <!-- ── Estudiante y matrícula opcionales ──────────────────────── -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          v-model="form.estudiante_id"
          label="ID Estudiante"
          type="number"
          placeholder="Opcional"
          help="ID del estudiante asociado al cobro."
          :error="fieldErrors.estudiante_id?.[0]"
        />
        <FormInput
          v-model="form.matricula_id"
          label="ID Matrícula"
          type="number"
          placeholder="Opcional"
          help="ID de matrícula si el cobro está vinculado."
          :error="fieldErrors.matricula_id?.[0]"
        />
      </div>

      <!-- ── Conceptos de pago ────────────────────────────────────────── -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-medium text-slate-700">Conceptos de pago</h3>
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="addConcepto"
          >
            <NavIcon name="plus" class="size-3.5" /> Agregar línea
          </button>
        </div>

        <div v-if="form.conceptos_pago.length === 0" class="rounded-lg border border-dashed border-slate-300 py-4 text-center text-sm text-slate-400">
          Sin líneas. Agrega al menos un concepto de pago.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(linea, idx) in form.conceptos_pago"
            :key="idx"
            class="rounded-lg border border-black/10 bg-slate-50 p-3"
          >
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div class="sm:col-span-4">
                <FormSelect
                  v-model="linea.concepto_pago_id"
                  label="Concepto"
                  :options="conceptoOptions"
                  @update:modelValue="(v) => onConceptoChange(idx, v)"
                />
              </div>
              <div class="sm:col-span-3">
                <FormInput v-model="linea.producto" label="Producto / descripción" placeholder="Opcional" />
              </div>
              <div class="sm:col-span-2">
                <FormInput
                  v-model.number="linea.cantidad"
                  label="Cantidad"
                  type="number"
                  min="1"
                  @input="recalcLinea(idx)"
                />
              </div>
              <div class="sm:col-span-2">
                <FormInput
                  v-model.number="linea.unitario"
                  label="Valor unit."
                  type="number"
                  min="0"
                  step="0.01"
                  @input="recalcLinea(idx)"
                />
              </div>
              <div class="flex items-end sm:col-span-1">
                <button
                  type="button"
                  class="mb-px flex h-9 w-full items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Eliminar línea"
                  @click="removeConcepto(idx)"
                >
                  <NavIcon name="close" class="size-4" />
                </button>
              </div>
            </div>
            <div class="mt-2 text-right text-xs text-slate-500">
              Subtotal: <span class="font-mono font-medium text-slate-800">$ {{ formatMoney(linea.subtotal) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-2 flex justify-end text-sm">
          <span class="text-slate-500 mr-2">Total conceptos:</span>
          <span class="font-mono font-semibold text-slate-900">$ {{ formatMoney(totalConceptos) }}</span>
        </div>
      </div>

      <!-- ── Medios de pago (ambos modos) ───────────────────────────── -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-medium text-slate-700">Medios de pago</h3>
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="addMedio"
          >
            <NavIcon name="plus" class="size-3.5" /> Agregar medio
          </button>
        </div>

        <div v-if="form.medios_pago.length === 0" class="rounded-lg border border-dashed border-slate-300 py-4 text-center text-sm text-slate-400">
          Sin medios de pago. Agrega al menos uno.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(medio, idx) in form.medios_pago"
            :key="idx"
            class="rounded-lg border border-black/10 bg-slate-50 p-3"
          >
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div class="sm:col-span-4">
                <FormSelect v-model="medio.medio_pago" label="Medio" :options="mediosPagoOptions" />
              </div>
              <div class="sm:col-span-3">
                <FormInput
                  v-model.number="medio.valor"
                  label="Valor"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>
              <div class="sm:col-span-4">
                <FormInput
                  v-model="medio.referencia"
                  label="Referencia"
                  placeholder="Opcional"
                  help="Nro. transacción, cheque, etc."
                />
              </div>
              <div class="flex items-end sm:col-span-1">
                <button
                  type="button"
                  class="mb-px flex h-9 w-full items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                  title="Eliminar medio"
                  @click="removeMedio(idx)"
                >
                  <NavIcon name="close" class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-2 flex justify-end text-sm">
          <span class="text-slate-500 mr-2">Total medios:</span>
          <span class="font-mono font-semibold text-slate-900">$ {{ formatMoney(totalMedios) }}</span>
        </div>
      </div>

      <!-- Errores de formulario -->
      <div v-if="formError && !Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        {{ formError }}
      </div>
      <div v-if="Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <p class="font-medium">{{ formError }}</p>
        <ul class="mt-1 list-inside list-disc space-y-0.5">
          <li v-for="(msgs, field) in fieldErrors" :key="field">
            {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
          </li>
        </ul>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showFormModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="formLoading"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="submitForm"
      >
        {{ formLoading ? 'Guardando...' : 'Crear recibo' }}
      </button>
    </template>
  </ModalBase>

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
      </dl>

      <!-- Conceptos de pago -->
      <div v-if="detailRecibo.conceptos_pago?.length">
        <h3 class="mb-2 text-sm font-semibold text-slate-700">Conceptos de pago</h3>
        <div class="overflow-auto rounded-lg border border-black/10">
          <table class="w-full text-xs">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-slate-500">Concepto</th>
                <th class="px-3 py-2 text-left font-medium text-slate-500">Producto</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Cant.</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Unitario</th>
                <th class="px-3 py-2 text-right font-medium text-slate-500">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              <tr v-for="cp in detailRecibo.conceptos_pago" :key="cp.id" class="hover:bg-slate-50">
                <td class="px-3 py-2 text-slate-800">{{ cp.nombre }}</td>
                <td class="px-3 py-2 text-slate-600">{{ cp.producto ?? '—' }}</td>
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
                <td class="px-3 py-2 text-slate-800 capitalize">{{ mp.medio_pago?.replace('_', ' ') }}</td>
                <td class="px-3 py-2 text-slate-600">{{ mp.referencia ?? '—' }}</td>
                <td class="px-3 py-2 text-right font-mono font-medium text-slate-900">$ {{ formatMoney(mp.valor) }}</td>
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
        <NavIcon name="download" class="size-4" /> PDF
      </button>
      <button
        v-if="detailRecibo?.status === 1 && canAnular"
        type="button"
        class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="openAnularDesdeDetalle"
      >
        Anular
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Anular ────────────────────────────────────────────────────── -->
  <ModalBase
    v-model="showAnularModal"
    title="Anular recibo de pago"
    description="Esta acción no se puede deshacer. El recibo quedará sin efecto contable."
  >
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas que deseas anular el recibo
        <strong>{{ targetRecibo?.numero_recibo }}</strong>
        por <strong>$ {{ formatMoney(targetRecibo?.valor_total) }}</strong>?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        Solo pueden anularse recibos en estado Creado. Los recibos cerrados (en cierre de caja) no pueden anularse.
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
        :disabled="actionLoading"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="confirmAnular"
      >
        {{ actionLoading ? 'Anulando...' : 'Anular recibo' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard     from '@/components/dashboard/StatCard.vue'
import DataTable    from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge  from '@/components/activos/StatusBadge.vue'
import FormInput    from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect   from '@/components/forms/FormSelect.vue'
import NavIcon      from '@/components/icons/NavIcon.vue'
import ModalBase    from '@/components/ModalBase.vue'
import reciboPagoService  from '@/services/reciboPagoService.js'
import conceptoPagoService from '@/services/conceptoPagoService.js'
import sedeService  from '@/services/sedeService.js'
import { authService } from '@/services/authService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate = ref(true)
const canAnular = ref(true)
const canPdf    = ref(true)

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'numero_recibo',       label: 'N.° Recibo' },
  { key: 'fecha_recibo',        label: 'Fecha' },
  { key: 'valor_total_formatted', label: 'Total' },
  { key: 'status_text',         label: 'Estado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const recibos   = ref([])
const loading   = ref(false)
const error     = ref('')
const apiError  = ref('')

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, creados: 0, cerrados: 0, anulados: 0 })
const filters    = reactive({ search: '', status: '', fecha_inicio: '', fecha_fin: '', vigentes: true })

const statusFilterOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '0', label: 'En proceso' },
  { value: '1', label: 'Creado' },
  { value: '2', label: 'Cerrado' },
  { value: '3', label: 'Anulado' },
]

const mediosPagoOptions = [
  { value: 'efectivo',        label: 'Efectivo' },
  { value: 'transferencia',   label: 'Transferencia' },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'cheque',          label: 'Cheque' },
  { value: 'consignacion',    label: 'Consignación' },
]

function statusBadgeVariant(status) {
  const map = { 0: 'mantenimiento', 1: 'disponible', 2: 'activo', 3: 'inactivo' }
  return map[status] ?? 'inactivo'
}

function formatMoney(val) {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadRecibos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: pagination.perPage }
    if (filters.search)       params.search       = filters.search
    if (filters.status !== '') params.status       = filters.status
    if (filters.fecha_inicio) params.fecha_inicio  = filters.fecha_inicio
    if (filters.fecha_fin)    params.fecha_fin     = filters.fecha_fin
    if (filters.vigentes)     params.vigentes      = true

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

// ─── Datos auxiliares para el formulario ─────────────────────────────────────
const sedeOptions     = ref([])
const conceptoOptions = ref([])
const currentUserId   = ref(null)

async function loadFormData() {
  try {
    const [sedesRes, conceptosRes, userRes] = await Promise.all([
      sedeService.getAll({ per_page: 100, status: 1 }),
      conceptoPagoService.getAll({ per_page: 100 }),
      authService.getUser(),
    ])
    sedeOptions.value = (sedesRes.data ?? []).map(s => ({ value: s.id, label: s.nombre }))
    conceptoOptions.value = (conceptosRes.data ?? []).map(c => ({
      value: c.id,
      label: c.nombre,
      _valor: c.valor,
      _tipo: c.tipo,
    }))
    currentUserId.value = userRes?.id ?? null
  } catch {
    // No bloquea la vista si falla la carga de datos auxiliares
  }
}

// ─── Modal Crear ──────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const formLoading   = ref(false)
const formError     = ref('')
const fieldErrors   = ref({})

const form = reactive({
  sede_id:        null,
  cajero_id:      null,
  estudiante_id:  '',
  matricula_id:   '',
  origen:         1,
  fecha_recibo:   new Date().toISOString().substring(0, 10),
  conceptos_pago: [],
  medios_pago:    [],
})

function resetForm() {
  form.sede_id        = null
  form.cajero_id      = currentUserId.value
  form.estudiante_id  = ''
  form.matricula_id   = ''
  form.origen         = 1
  form.fecha_recibo   = new Date().toISOString().substring(0, 10)
  form.conceptos_pago = []
  form.medios_pago    = []
  formError.value     = ''
  fieldErrors.value   = {}
}

function openCreate() {
  resetForm()
  showFormModal.value = true
}

// Gestión de líneas de conceptos
function addConcepto() {
  form.conceptos_pago.push({
    concepto_pago_id: null,
    tipo:             0,
    producto:         '',
    cantidad:         1,
    unitario:         0,
    subtotal:         0,
    id_relacional:    null,
    observaciones:    null,
  })
}

function removeConcepto(idx) {
  form.conceptos_pago.splice(idx, 1)
}

function onConceptoChange(idx, conceptoId) {
  const opt = conceptoOptions.value.find(o => o.value === conceptoId || o.value === Number(conceptoId))
  if (opt) {
    form.conceptos_pago[idx].tipo     = opt._tipo ?? 0
    form.conceptos_pago[idx].unitario = Number(opt._valor ?? 0)
    recalcLinea(idx)
  }
}

function recalcLinea(idx) {
  const l = form.conceptos_pago[idx]
  l.subtotal = (Number(l.cantidad) || 0) * (Number(l.unitario) || 0)
}

const totalConceptos = computed(() =>
  form.conceptos_pago.reduce((acc, l) => acc + (Number(l.subtotal) || 0), 0)
)

// Gestión de medios de pago
function addMedio() {
  form.medios_pago.push({ medio_pago: 'efectivo', valor: 0, referencia: '' })
}

function removeMedio(idx) {
  form.medios_pago.splice(idx, 1)
}

const totalMedios = computed(() =>
  form.medios_pago.reduce((acc, m) => acc + (Number(m.valor) || 0), 0)
)

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}
  formLoading.value = true

  try {
    const payload = {
      sede_id:           form.sede_id,
      cajero_id:         form.cajero_id ?? currentUserId.value,
      origen:            form.origen,
      fecha_recibo:      form.fecha_recibo,
      fecha_transaccion: form.fecha_recibo,
      valor_total:       totalConceptos.value,
      descuento_total:   0,
      conceptos_pago:    form.conceptos_pago.map(l => ({
        concepto_pago_id: Number(l.concepto_pago_id),
        tipo:             l.tipo,
        valor:            l.subtotal,
        producto:         l.producto || null,
        cantidad:         Number(l.cantidad),
        unitario:         Number(l.unitario),
        subtotal:         Number(l.subtotal),
        id_relacional:    null,
        observaciones:    null,
      })),
      medios_pago: form.medios_pago.map(m => ({
        medio_pago: m.medio_pago,
        valor:      Number(m.valor),
        referencia: m.referencia || null,
      })),
    }
    if (form.estudiante_id) payload.estudiante_id = Number(form.estudiante_id)
    if (form.matricula_id)  payload.matricula_id  = Number(form.matricula_id)

    await reciboPagoService.create(payload, { _silent: true })
    notifySuccess('Recibo de pago creado correctamente.')
    showFormModal.value = false
    await Promise.all([loadRecibos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors  ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailRecibo    = ref(null)
const detailLoading   = ref(false)

async function openDetail(recibo) {
  detailRecibo.value  = recibo
  showDetailModal.value = true
  detailLoading.value = true
  try {
    const res = await reciboPagoService.getById(recibo.id, { with: 'sede,cajero,conceptosPago,mediosPago' })
    detailRecibo.value = res.data
  } catch {
    // Mantiene los datos del listado
  } finally {
    detailLoading.value = false
  }
}

// ─── Modal Anular ─────────────────────────────────────────────────────────────
const showAnularModal = ref(false)
const targetRecibo    = ref(null)
const actionLoading   = ref(false)
const actionError     = ref('')

function openAnular(recibo) {
  targetRecibo.value  = recibo
  actionError.value   = ''
  showAnularModal.value = true
}

function openAnularDesdeDetalle() {
  targetRecibo.value    = detailRecibo.value
  actionError.value     = ''
  showDetailModal.value = false
  showAnularModal.value = true
}

async function confirmAnular() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await reciboPagoService.anular(targetRecibo.value.id)
    notifySuccess(`Recibo ${targetRecibo.value.numero_recibo} anulado correctamente.`)
    showAnularModal.value = false
    await Promise.all([loadRecibos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al anular el recibo de pago.'
  } finally {
    actionLoading.value = false
  }
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
async function descargarPdf(recibo) {
  try {
    const response = await reciboPagoService.getPdf(recibo.id)
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const a   = document.createElement('a')
    a.href    = url
    a.download = `recibo-${recibo.numero_recibo}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // Silencio; el toast global de api.js cubre el error
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadFormData(),
    loadRecibos(1),
  ])
  if (!apiError.value) {
    await loadStatistics()
  }
})
</script>
