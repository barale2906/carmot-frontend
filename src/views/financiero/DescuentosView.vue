<template>
  <div class="flex flex-col gap-6">

    <!-- ── Estadísticas ─────────────────────────────────────────────────────── -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-descuentos-heading">
      <h2 id="stats-descuentos-heading" class="sr-only">Resumen de descuentos y sobrecargos</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard title="Total"      :value="stats.total"      description="Ajustes registrados"      icon="financiero"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activos"    :value="stats.activos"    description="Vigentes y aplicables"    icon="activos"       icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="En proceso" :value="stats.enProceso"  description="Pendientes de aprobación" icon="pendientes"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Sobrecargos" :value="stats.sobrecargos" description="Recargos configurados"  icon="track_changes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- ── API no disponible ─────────────────────────────────────────────────── -->
    <section v-if="apiError" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
      <p class="text-sm text-amber-800">{{ apiError }}</p>
      <p class="mt-2 text-xs text-amber-700">
        Verifica que el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/descuentos</code>
        esté disponible.
      </p>
    </section>

    <template v-else>

      <!-- ── Filtros y acciones ─────────────────────────────────────────────── -->
      <section aria-labelledby="filtros-descuentos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-descuentos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">

          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre del ajuste..."
              help="Filtra por nombre del descuento o sobrecargo."
              @input="onSearchInput"
            />
          </div>

          <div class="w-full sm:w-[190px]">
            <FormSelect
              v-model="filters.tipo_movimiento"
              label="Tipo:"
              help="Filtra por tipo de movimiento."
              :options="tipoMovimientoOptions"
            />
          </div>

          <div class="w-full sm:w-[190px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              help="Filtra por estado del ajuste."
              :options="statusFilterOptions"
            />
          </div>

          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              v-if="canCreate"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openCreate"
            >
              <NavIcon name="plus" class="size-4" /> Nuevo ajuste
            </button>
          </div>
        </div>
      </section>

      <!-- ── Tabla ──────────────────────────────────────────────────────────── -->
      <section aria-labelledby="listado-descuentos-heading">
        <SectionHeader
          id="listado-descuentos-heading"
          title="Descuentos y sobrecargos"
          description="Ajustes de precio configurados. Los descuentos reducen el valor; los sobrecargos lo incrementan (recargos por medio de pago o mora automática)."
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando ajustes...</span>
        </div>

        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadDescuentos(1)">Reintentar</button>
        </div>

        <DataTable
          v-else
          :columns="tableColumns"
          :data="descuentos"
          row-key="id"
          aria-label="Listado de descuentos y sobrecargos"
          actions-first
        >
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'tipo_movimiento_text'">
              <span
                class="inline-flex rounded px-2 py-0.5 text-xs font-medium"
                :class="row.es_sobrecargo ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'"
              >
                {{ value }}
              </span>
            </template>

            <template v-else-if="column.key === 'status_text'">
              <StatusBadge :label="value ?? '—'" :variant="statusBadgeVariant(row.status)" />
            </template>

            <template v-else-if="column.key === 'valor'">
              <span class="font-mono text-sm">
                {{ row.tipo === 'porcentual' ? `${value}%` : `$ ${formatMoney(value)}` }}
              </span>
            </template>

            <template v-else>{{ value ?? '—' }}</template>
          </template>

          <template #actions="{ row }">
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Ver / editar"
              @click="openDetail(row)"
            >
              <NavIcon name="eye" class="size-4" />
            </button>

            <button
              v-if="row.status === 1 && canAprobar"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Aprobar"
              @click="openAprobar(row)"
            >
              <NavIcon name="activos" class="size-4" />
            </button>

            <button
              v-if="row.status === 2 && canAprobar"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Activar"
              @click="openActivar(row)"
            >
              <NavIcon name="check" class="size-4" />
            </button>

            <button
              v-if="row.status !== 0 && canDelete"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Inactivar"
              @click="openInactivar(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} ajustes
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

  <!-- ── Modal: Crear ajuste ───────────────────────────────────────────────── -->
  <ModalBase v-model="showCreateModal" title="Nuevo descuento / sobrecargo" size="lg">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <form class="space-y-4 pb-2" @submit.prevent="submitCreate">

      <!-- Tipo de movimiento -->
      <FormSelect
        v-model="createForm.tipo_movimiento"
        label="Tipo de ajuste *"
        help="Descuento: reduce el precio. Sobrecargo: lo incrementa."
        :options="tipoMovimientoCrearOptions"
        required
      />

      <FormInputSearch
        v-model="createForm.nombre"
        label="Nombre *"
        placeholder="Ej: Pronto Pago 10%"
        help="Identificador descriptivo del ajuste."
        required
      />

      <!-- Tipo de valor (solo porcentual para sobrecargos) -->
      <FormSelect
        v-if="createForm.tipo_movimiento === 'descuento'"
        v-model="createForm.tipo"
        label="Tipo de valor *"
        help="Porcentual: se calcula sobre una base. Valor fijo: monto fijo en pesos."
        :options="tipoValorOptions"
        required
      />

      <FormInput
        v-model.number="createForm.valor"
        :label="createForm.tipo === 'porcentual' ? 'Porcentaje (%) *' : 'Valor fijo ($) *'"
        type="number"
        min="0"
        step="0.01"
        :help="createForm.tipo === 'porcentual' ? 'Ej: 10 para el 10%.' : 'Monto fijo en pesos.'"
        required
      />

      <!-- Aplicación -->
      <FormSelect
        v-model="createForm.aplicacion"
        label="Aplicación *"
        help="Base sobre la que se calcula el ajuste."
        :options="aplicacionOptions"
        required
      />

      <!-- Activación -->
      <FormSelect
        v-model="createForm.tipo_activacion"
        label="Tipo de activación *"
        help="Disparador que hace efectivo el ajuste."
        :options="activacionOptions"
        required
      />

      <!-- Campos condicionales de descuento -->
      <FormInput
        v-if="createForm.tipo_movimiento === 'descuento' && createForm.tipo_activacion === 'pago_anticipado'"
        v-model.number="createForm.dias_anticipacion"
        label="Días de anticipación *"
        type="number"
        min="1"
        help="Cuántos días antes del vencimiento debe pagarse para aplicar el descuento."
        required
      />

      <FormInputSearch
        v-if="createForm.tipo_movimiento === 'descuento' && createForm.tipo_activacion === 'codigo_promocional'"
        v-model="createForm.codigo_descuento"
        label="Código promocional *"
        placeholder="Ej: REF2026"
        help="El cliente ingresa este código para activar el descuento."
        required
      />

      <!-- Campos condicionales de sobrecargo por medio de pago -->
      <div v-if="createForm.tipo_movimiento === 'sobrecargo' && createForm.tipo_activacion === 'medio_pago'">
        <label class="mb-1 block text-sm font-medium text-slate-700">Medios de pago *</label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="mp in mediosPagoOpciones"
            :key="mp.value"
            class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
            :class="createForm.medios_pago.includes(mp.value)
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
          >
            <input
              type="checkbox"
              class="sr-only"
              :value="mp.value"
              :checked="createForm.medios_pago.includes(mp.value)"
              @change="toggleMedioPago(mp.value)"
            />
            {{ mp.label }}
          </label>
        </div>
        <p class="mt-1 text-xs text-slate-500">Selecciona los medios a los que aplica este recargo.</p>

        <div class="mt-3">
          <FormInputSearch
            v-model="createForm.marca_tarjeta_input"
            label="Marcas de tarjeta (opcional)"
            placeholder="Ej: Visa (Enter para agregar)"
            help="Déjalo vacío para que aplique a cualquier marca. Presiona Enter para añadir."
            @keydown.enter.prevent="agregarMarcaTarjeta"
          />
          <div v-if="createForm.marca_tarjeta.length" class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="(marca, i) in createForm.marca_tarjeta"
              :key="i"
              class="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {{ marca }}
              <button type="button" class="text-slate-400 hover:text-red-500 focus:outline-none" @click="quitarMarcaTarjeta(i)">×</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Permite acumulación (solo descuentos) -->
      <div v-if="createForm.tipo_movimiento === 'descuento'" class="flex items-center gap-3">
        <input
          id="permite_acumulacion"
          v-model="createForm.permite_acumulacion"
          type="checkbox"
          class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <label for="permite_acumulacion" class="text-sm text-slate-700">Permite acumulación con otros descuentos</label>
      </div>

      <!-- Rango de vigencia -->
      <div class="grid gap-4 sm:grid-cols-2">
        <FormInput
          v-model="createForm.fecha_inicio"
          label="Fecha inicio *"
          type="date"
          help="Primer día en que el ajuste puede aplicarse."
          required
        />
        <FormInput
          v-model="createForm.fecha_fin"
          label="Fecha fin *"
          type="date"
          help="Último día en que el ajuste puede aplicarse."
          required
        />
      </div>

      <!-- Error general -->
      <div v-if="createError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ createError }}
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showCreateModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="createLoading"
        class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="submitCreate"
      >
        {{ createLoading ? 'Guardando...' : 'Crear ajuste' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Detalle ───────────────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle del ajuste" size="lg">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <div v-if="detailItem" class="space-y-4 pb-2">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 font-semibold text-slate-900">{{ detailItem.nombre }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Tipo</dt>
          <dd class="mt-0.5">
            <span
              class="inline-flex rounded px-2 py-0.5 text-xs font-medium"
              :class="detailItem.es_sobrecargo ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ detailItem.tipo_movimiento_text ?? detailItem.tipo_movimiento }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Valor</dt>
          <dd class="mt-0.5 font-mono text-slate-900">
            {{ detailItem.tipo === 'porcentual' ? `${detailItem.valor}%` : `$ ${formatMoney(detailItem.valor)}` }}
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="statusLabel(detailItem.status)" :variant="statusBadgeVariant(detailItem.status)" />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Aplicación</dt>
          <dd class="mt-0.5 capitalize text-slate-900">{{ aplicacionLabel(detailItem.aplicacion) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Activación</dt>
          <dd class="mt-0.5 capitalize text-slate-900">{{ activacionLabel(detailItem.tipo_activacion) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Vigencia</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailItem.fecha_inicio }} — {{ detailItem.fecha_fin }}</dd>
        </div>
        <div v-if="detailItem.dias_anticipacion">
          <dt class="font-medium text-slate-500">Días anticipación</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailItem.dias_anticipacion }}</dd>
        </div>
        <div v-if="detailItem.codigo_descuento">
          <dt class="font-medium text-slate-500">Código</dt>
          <dd class="mt-0.5 font-mono text-slate-900">{{ detailItem.codigo_descuento }}</dd>
        </div>
        <div v-if="detailItem.medios_pago?.length">
          <dt class="font-medium text-slate-500">Medios de pago</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailItem.medios_pago.join(', ') }}</dd>
        </div>
        <div v-if="detailItem.marca_tarjeta?.length">
          <dt class="font-medium text-slate-500">Marcas</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailItem.marca_tarjeta.join(', ') }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Acumulable</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailItem.permite_acumulacion ? 'Sí' : 'No' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Vigente</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailItem.esta_vigente ? 'Sí' : 'No' }}</dd>
        </div>
      </dl>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showDetailModal = false"
      >Cerrar</button>
      <button
        v-if="detailItem?.status === 1 && canAprobar"
        type="button"
        :disabled="actionLoading"
        class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
        @click="openAprobarDesdeDetalle"
      >
        Aprobar
      </button>
      <button
        v-if="detailItem?.status === 2 && canAprobar"
        type="button"
        :disabled="actionLoading"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="openActivarDesdeDetalle"
      >
        Activar
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Aprobar ────────────────────────────────────────────────────── -->
  <ModalBase
    v-model="showAprobarModal"
    title="Aprobar ajuste"
    description="El ajuste pasará a estado Aprobado y se activará automáticamente en la fecha de inicio."
  >
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas que deseas aprobar <strong>{{ targetItem?.nombre }}</strong>?
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showAprobarModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="actionLoading"
        class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
        @click="confirmAprobar"
      >
        {{ actionLoading ? 'Aprobando...' : 'Aprobar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Activar ───────────────────────────────────────────────────── -->
  <ModalBase
    v-model="showActivarModal"
    title="Activar ajuste"
    description="El ajuste pasará a estado Activo y comenzará a aplicarse en los recibos de pago."
  >
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas que deseas activar <strong>{{ targetItem?.nombre }}</strong>?
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showActivarModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="actionLoading"
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="confirmActivar"
      >
        {{ actionLoading ? 'Activando...' : 'Activar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Inactivar ──────────────────────────────────────────────────── -->
  <ModalBase
    v-model="showInactivarModal"
    title="Inactivar ajuste"
    description="El ajuste quedará inactivo y dejará de aplicarse en nuevos recibos."
  >
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas que deseas inactivar <strong>{{ targetItem?.nombre }}</strong>?
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showInactivarModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="actionLoading"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
        @click="confirmInactivar"
      >
        {{ actionLoading ? 'Inactivando...' : 'Inactivar' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard        from '@/components/dashboard/StatCard.vue'
import DataTable       from '@/components/activos/DataTable.vue'
import SectionHeader   from '@/components/activos/SectionHeader.vue'
import StatusBadge     from '@/components/activos/StatusBadge.vue'
import FormInput       from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect      from '@/components/forms/FormSelect.vue'
import NavIcon         from '@/components/icons/NavIcon.vue'
import ModalBase       from '@/components/ModalBase.vue'
import descuentoService from '@/services/descuentoService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate  = ref(true)
const canAprobar = ref(true)
const canDelete  = ref(true)

// ─── Opciones estáticas ───────────────────────────────────────────────────────
const tipoMovimientoOptions = [
  { value: '',           label: 'Todos' },
  { value: 'descuento',  label: 'Descuentos' },
  { value: 'sobrecargo', label: 'Sobrecargos' },
]
const tipoMovimientoCrearOptions = [
  { value: 'descuento',  label: 'Descuento (reduce el precio)' },
  { value: 'sobrecargo', label: 'Sobrecargo (incrementa el precio)' },
]
const statusFilterOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '0', label: 'Inactivo' },
  { value: '1', label: 'En proceso' },
  { value: '2', label: 'Aprobado' },
  { value: '3', label: 'Activo' },
]
const tipoValorOptions = [
  { value: 'porcentual',  label: 'Porcentual (%)' },
  { value: 'valor_fijo',  label: 'Valor fijo ($)' },
]
const mediosPagoOpciones = [
  { value: 'efectivo',        label: 'Efectivo' },
  { value: 'transferencia',   label: 'Transferencia' },
  { value: 'tarjeta_debito',  label: 'Tarjeta débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta crédito' },
  { value: 'cheque',          label: 'Cheque' },
  { value: 'consignacion',    label: 'Consignación' },
]

const APLICACION_LABELS = {
  valor_total:    'Precio total',
  matricula:      'Cuota de matrícula',
  cuota:          'Cuotas mensuales',
  valor_recibo:   'Total del recibo',
  saldo_cartera:  'Saldo de cartera',
}
const ACTIVACION_LABELS = {
  pago_anticipado:      'Pago anticipado',
  promocion_matricula:  'Promoción matrícula',
  codigo_promocional:   'Código promocional',
  medio_pago:           'Medio de pago',
  mora_automatica:      'Mora automática',
}

const aplicacionOptions = computed(() => {
  if (createForm.tipo_movimiento === 'sobrecargo') {
    return [
      { value: 'valor_recibo',  label: 'Total del recibo' },
      { value: 'saldo_cartera', label: 'Saldo de cartera (mora)' },
    ]
  }
  return [
    { value: 'valor_total', label: 'Precio total' },
    { value: 'matricula',   label: 'Cuota de matrícula' },
    { value: 'cuota',       label: 'Cuotas mensuales' },
  ]
})

const activacionOptions = computed(() => {
  if (createForm.tipo_movimiento === 'sobrecargo') {
    return [
      { value: 'medio_pago',      label: 'Medio de pago (cajero)' },
      { value: 'mora_automatica', label: 'Mora automática (cron)' },
    ]
  }
  return [
    { value: 'pago_anticipado',     label: 'Pago anticipado' },
    { value: 'promocion_matricula', label: 'Promoción matrícula' },
    { value: 'codigo_promocional',  label: 'Código promocional' },
  ]
})

// ─── Columnas ─────────────────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',               label: 'Nombre' },
  { key: 'tipo_movimiento_text', label: 'Tipo' },
  { key: 'valor',                label: 'Valor' },
  { key: 'tipo_activacion',      label: 'Activación' },
  { key: 'status_text',          label: 'Estado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const descuentos = ref([])
const loading    = ref(false)
const error      = ref('')
const apiError   = ref('')

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, activos: 0, enProceso: 0, sobrecargos: 0 })
const filters    = reactive({ search: '', tipo_movimiento: '', status: '' })

// ─── Helpers de etiquetas ─────────────────────────────────────────────────────
function aplicacionLabel(val) { return APLICACION_LABELS[val] ?? val ?? '—' }
function activacionLabel(val) { return ACTIVACION_LABELS[val] ?? val ?? '—' }

function statusLabel(s) {
  const map = { 0: 'Inactivo', 1: 'En proceso', 2: 'Aprobado', 3: 'Activo' }
  return map[s] ?? '—'
}

function statusBadgeVariant(s) {
  const map = { 0: 'inactivo', 1: 'pendiente', 2: 'disponible', 3: 'activo' }
  return map[s] ?? 'inactivo'
}

function formatMoney(val) {
  if (val == null) return '0'
  return Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadDescuentos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: pagination.perPage }
    if (filters.search)          params.search          = filters.search
    if (filters.tipo_movimiento) params.tipo_movimiento = filters.tipo_movimiento
    if (filters.status !== '')   params.status          = filters.status

    const res = await descuentoService.getAll(params)
    descuentos.value = res.data ?? []
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
      apiError.value = 'El servicio de descuentos no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los ajustes.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [activos, enProceso, sobrecargos] = await Promise.all([
      descuentoService.getAll({ per_page: 1, page: 1, status: 3 }),
      descuentoService.getAll({ per_page: 1, page: 1, status: 1 }),
      descuentoService.getAll({ per_page: 1, page: 1, tipo_movimiento: 'sobrecargo' }),
    ])
    stats.activos     = activos.meta?.total     ?? 0
    stats.enProceso   = enProceso.meta?.total   ?? 0
    stats.sobrecargos = sobrecargos.meta?.total ?? 0
    stats.total       = stats.activos + stats.enProceso + (descuentos.value.length ? pagination.total : 0)
  } catch { /* informativo */ }
}

// ─── Filtros y búsqueda ───────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadDescuentos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadDescuentos(page)
}

watch(() => filters.tipo_movimiento, () => loadDescuentos(1))
watch(() => filters.status,          () => loadDescuentos(1))

// ─── Crear ajuste ─────────────────────────────────────────────────────────────
const showCreateModal = ref(false)
const createLoading   = ref(false)
const createError     = ref('')

const createForm = reactive({
  tipo_movimiento:     'descuento',
  nombre:              '',
  tipo:                'porcentual',
  valor:               null,
  aplicacion:          'cuota',
  tipo_activacion:     'pago_anticipado',
  permite_acumulacion: false,
  fecha_inicio:        '',
  fecha_fin:           '',
  // descuento
  dias_anticipacion:   null,
  codigo_descuento:    '',
  // sobrecargo
  medios_pago:         [],
  marca_tarjeta:       [],
  marca_tarjeta_input: '',
})

function resetCreateForm() {
  Object.assign(createForm, {
    tipo_movimiento:     'descuento',
    nombre:              '',
    tipo:                'porcentual',
    valor:               null,
    aplicacion:          'cuota',
    tipo_activacion:     'pago_anticipado',
    permite_acumulacion: false,
    fecha_inicio:        '',
    fecha_fin:           '',
    dias_anticipacion:   null,
    codigo_descuento:    '',
    medios_pago:         [],
    marca_tarjeta:       [],
    marca_tarjeta_input: '',
  })
  createError.value = ''
}

// Cuando cambia tipo_movimiento, resetear los campos dependientes
watch(() => createForm.tipo_movimiento, (val) => {
  createForm.tipo          = 'porcentual'
  createForm.aplicacion    = val === 'sobrecargo' ? 'valor_recibo'  : 'cuota'
  createForm.tipo_activacion = val === 'sobrecargo' ? 'medio_pago'  : 'pago_anticipado'
  createForm.permite_acumulacion = val === 'sobrecargo' ? false      : false
  createForm.medios_pago   = []
  createForm.marca_tarjeta = []
})

function openCreate() {
  resetCreateForm()
  showCreateModal.value = true
}

function toggleMedioPago(val) {
  const idx = createForm.medios_pago.indexOf(val)
  if (idx === -1) createForm.medios_pago.push(val)
  else            createForm.medios_pago.splice(idx, 1)
}

function agregarMarcaTarjeta() {
  const marca = createForm.marca_tarjeta_input.trim()
  if (marca && !createForm.marca_tarjeta.includes(marca)) {
    createForm.marca_tarjeta.push(marca)
  }
  createForm.marca_tarjeta_input = ''
}

function quitarMarcaTarjeta(i) {
  createForm.marca_tarjeta.splice(i, 1)
}

async function submitCreate() {
  createError.value = ''
  if (!createForm.nombre.trim()) {
    createError.value = 'El nombre es obligatorio.'
    return
  }
  if (!createForm.valor || Number(createForm.valor) <= 0) {
    createError.value = 'El valor debe ser mayor a cero.'
    return
  }
  if (createForm.tipo_movimiento === 'sobrecargo' && createForm.tipo_activacion === 'medio_pago' && !createForm.medios_pago.length) {
    createError.value = 'Selecciona al menos un medio de pago.'
    return
  }

  const payload = {
    tipo_movimiento:     createForm.tipo_movimiento,
    nombre:              createForm.nombre,
    tipo:                createForm.tipo_movimiento === 'sobrecargo' ? 'porcentual' : createForm.tipo,
    valor:               Number(createForm.valor),
    aplicacion:          createForm.aplicacion,
    tipo_activacion:     createForm.tipo_activacion,
    permite_acumulacion: createForm.tipo_movimiento === 'sobrecargo' ? false : createForm.permite_acumulacion,
    fecha_inicio:        createForm.fecha_inicio,
    fecha_fin:           createForm.fecha_fin,
  }

  if (createForm.tipo_movimiento === 'descuento') {
    if (createForm.tipo_activacion === 'pago_anticipado' && createForm.dias_anticipacion) {
      payload.dias_anticipacion = createForm.dias_anticipacion
    }
    if (createForm.tipo_activacion === 'codigo_promocional' && createForm.codigo_descuento) {
      payload.codigo_descuento = createForm.codigo_descuento
    }
  }

  if (createForm.tipo_movimiento === 'sobrecargo') {
    if (createForm.tipo_activacion === 'medio_pago') {
      payload.medios_pago  = createForm.medios_pago
      payload.marca_tarjeta = createForm.marca_tarjeta
    }
  }

  createLoading.value = true
  try {
    await descuentoService.create(payload, { _silent: true })
    notifySuccess('Ajuste creado correctamente. Recuerda aprobarlo para que se active.')
    showCreateModal.value = false
    await Promise.all([loadDescuentos(1), loadStatistics()])
  } catch (e) {
    createError.value = e?.response?.data?.message ?? Object.values(e?.response?.data?.errors ?? {}).flat().join(' · ') ?? 'Error al crear el ajuste.'
  } finally {
    createLoading.value = false
  }
}

// ─── Detalle ──────────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailItem      = ref(null)

function openDetail(item) {
  detailItem.value    = item
  showDetailModal.value = true
}

// ─── Aprobar ──────────────────────────────────────────────────────────────────
const showAprobarModal = ref(false)
const targetItem       = ref(null)
const actionLoading    = ref(false)
const actionError      = ref('')

function openAprobar(item) {
  targetItem.value    = item
  actionError.value   = ''
  showAprobarModal.value = true
}

function openAprobarDesdeDetalle() {
  targetItem.value      = detailItem.value
  actionError.value     = ''
  showDetailModal.value  = false
  showAprobarModal.value = true
}

async function confirmAprobar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await descuentoService.aprobar(targetItem.value.id)
    notifySuccess(`"${targetItem.value.nombre}" aprobado. Se activará en la fecha de inicio.`)
    showAprobarModal.value = false
    await Promise.all([loadDescuentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al aprobar el ajuste.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Activar ──────────────────────────────────────────────────────────────────
const showActivarModal = ref(false)

function openActivar(item) {
  targetItem.value     = item
  actionError.value    = ''
  showActivarModal.value = true
}

function openActivarDesdeDetalle() {
  targetItem.value      = detailItem.value
  actionError.value     = ''
  showDetailModal.value  = false
  showActivarModal.value = true
}

async function confirmActivar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await descuentoService.activar(targetItem.value.id)
    notifySuccess(`"${targetItem.value.nombre}" activado. Ya aplica en los recibos de pago.`)
    showActivarModal.value = false
    await Promise.all([loadDescuentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al activar el ajuste.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Inactivar ────────────────────────────────────────────────────────────────
const showInactivarModal = ref(false)

function openInactivar(item) {
  targetItem.value      = item
  actionError.value     = ''
  showInactivarModal.value = true
}

async function confirmInactivar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await descuentoService.delete(targetItem.value.id)
    notifySuccess(`"${targetItem.value.nombre}" inactivado correctamente.`)
    showInactivarModal.value = false
    await Promise.all([loadDescuentos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al inactivar el ajuste.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await loadDescuentos(1)
  if (!apiError.value) {
    await loadStatistics()
  }
})
</script>
