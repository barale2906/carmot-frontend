<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-productos-heading">
      <h2 id="stats-productos-heading" class="sr-only">Resumen de productos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard title="Total productos" :value="stats.total" description="En el catálogo LP" icon="financiero" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activos" :value="stats.activos" description="Disponibles para listas de precios" icon="activos" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Eliminados" :value="stats.eliminados" description="En papelera (soft delete)" icon="pendientes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- API no disponible -->
    <section v-if="apiError" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
      <p class="text-sm text-amber-800">{{ apiError }}</p>
      <p class="mt-2 text-xs text-amber-700">
        Verifica que el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/lp/productos</code>
        esté disponible.
      </p>
    </section>

    <template v-else>

      <!-- Filtros y acciones -->
      <section aria-labelledby="filtros-productos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-productos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre, código o descripción..."
              help="Filtra productos del catálogo por texto libre."
              @input="onSearchInput"
            />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect
              v-model="filters.tipo_producto_id"
              label="Tipo:"
              help="Filtra por categoría de producto LP."
              :options="tiposFilterOptions"
            />
          </div>
          <div class="w-full sm:w-[180px]">
            <FormSelect
              v-model="filters.referencia_tipo"
              label="Referencia:"
              help="Filtra si el producto está ligado a curso o módulo."
              :options="referenciaTipoFilterOptions"
            />
          </div>
          <div class="w-full sm:w-[160px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              help="Activo o inactivo en el catálogo."
              :options="statusOptions"
            />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              v-if="viewTrashed"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="eye" class="size-4" /> Ver activos
            </button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="track_changes" class="size-4" /> Ver eliminados
            </button>
            <button
              v-if="!viewTrashed && canCreate"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openCreate"
            >
              <NavIcon name="plus" class="size-4" /> Nuevo producto
            </button>
          </div>
        </div>
      </section>

      <!-- Tabla -->
      <section aria-labelledby="listado-productos-heading">
        <SectionHeader
          id="listado-productos-heading"
          :title="viewTrashed ? 'Productos eliminados' : 'Catálogo de productos LP'"
          :description="viewTrashed
            ? 'Productos en papelera. Solo visible para auditoría.'
            : 'Ítems tarificables vinculados a cursos y módulos académicos. Prerequisito para crear listas de precios.'"
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando productos...</span>
        </div>
        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadProductos(1)">Reintentar</button>
        </div>

        <DataTable v-else :columns="tableColumns" :data="productos" row-key="id" aria-label="Catálogo de productos LP" actions-first>
          <template #cell="{ column, value, row }">

            <template v-if="column.key === 'nombre'">
              <span class="font-medium text-slate-900">{{ value }}</span>
              <span v-if="row.deleted_at" class="ml-2 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">Eliminado</span>
            </template>

            <template v-else-if="column.key === 'codigo'">
              <code v-if="value" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value }}</code>
              <span v-else class="text-slate-400">—</span>
            </template>

            <template v-else-if="column.key === 'tipo_nombre'">
              <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {{ row.tipo_producto?.nombre ?? value ?? '—' }}
              </span>
            </template>

            <template v-else-if="column.key === 'referencia_tipo'">
              <template v-if="row.referencias?.length">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="ref in row.referencias.slice(0, 2)"
                    :key="ref.id"
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                    :class="ref.referencia_tipo === 'curso' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'"
                  >{{ ref.referencia_tipo }}</span>
                  <span v-if="row.referencias.length > 2" class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    +{{ row.referencias.length - 2 }}
                  </span>
                </div>
              </template>
              <span
                v-else-if="value"
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                :class="value === 'curso' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'"
              >{{ value }}</span>
              <span v-else class="text-slate-400">Sin referencia</span>
            </template>

            <template v-else-if="column.key === 'status_text'">
              <StatusBadge :label="value ?? (row.status === 1 ? 'Activo' : 'Inactivo')" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
            </template>

            <template v-else>{{ value ?? '—' }}</template>
          </template>

          <template #actions="{ row }">
            <button type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Ver detalle" @click="openDetail(row)">
              <NavIcon name="eye" class="size-4" />
            </button>
            <button v-if="!row.deleted_at && canEdit" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Editar" @click="openEdit(row)">
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button v-if="!row.deleted_at && canDelete" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500" title="Eliminar" @click="openEliminar(row)">
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} productos</p>
          <div class="flex gap-2">
            <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
            <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
          </div>
        </div>
      </section>
    </template>
  </div>

  <!-- ── Modal: Crear / Editar ─────────────────────────────────────────────── -->
  <ModalBase
    v-model="showFormModal"
    :title="editingProducto ? 'Editar producto' : 'Nuevo producto'"
    :description="editingProducto
      ? 'Modifica los datos del producto en el catálogo LP.'
      : 'Registra un nuevo ítem tarificable. Puede vincularse a un curso o módulo académico.'"
    size="xl"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitForm">
      <div class="max-h-[72vh] overflow-y-auto pr-1 flex flex-col gap-5">

        <!-- Tipo de producto -->
        <div>
          <FormSelect
            v-model="form.tipo_producto_id"
            label="Tipo de producto *"
            :options="tiposOptions"
            :required="true"
            hint="Categoría del producto. Determina si puede financiarse en cuotas."
            help="Tipo que define reglas como financiación en listas de precios."
            :error="fieldErrors.tipo_producto_id?.[0]"
          />
          <!-- Indicador de financiabilidad -->
          <div v-if="form.tipo_producto_id" class="mt-2 flex items-center gap-2">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="isFinanciable(form.tipo_producto_id) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
            >
              {{ isFinanciable(form.tipo_producto_id) ? '✓ Financiable — permite pago en cuotas' : '× No financiable — solo pago al contado' }}
            </span>
          </div>
        </div>

        <!-- Nombre y Código -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre *"
            placeholder="Ej: Inglés Avanzado - Matrícula"
            hint="Máximo 255 caracteres."
            help="Nombre visible del producto en listas de precios y cobros."
            :required="true"
            maxlength="255"
            :error="fieldErrors.nombre?.[0]"
          />
          <FormInput
            v-model="form.codigo"
            label="Código"
            placeholder="Ej: PROD-ING-ADV"
            hint="Opcional. Único. Máximo 100 caracteres."
            help="Código interno opcional para búsquedas e integraciones."
            maxlength="100"
            :error="fieldErrors.codigo?.[0]"
          />
        </div>

        <!-- Referencias académicas (múltiples) -->
        <div class="flex flex-col gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
          <div>
            <p class="text-sm font-medium text-slate-900">Referencias académicas</p>
            <p class="mt-0.5 text-xs text-slate-500">
              Vincula este producto a uno o más cursos y/o módulos. Opcional para productos complementarios (diplomas, materiales, etc.).
            </p>
          </div>

          <!-- Lista de referencias seleccionadas -->
          <div v-if="form.referencias.length" class="flex flex-wrap gap-2">
            <span
              v-for="(ref, idx) in form.referencias"
              :key="ref._key"
              class="inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium"
              :class="ref.referencia_tipo === 'curso' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'"
            >
              <span class="capitalize">{{ ref.referencia_tipo }}</span>
              <span class="mx-0.5 text-slate-400">·</span>
              <span>{{ labelReferencia(ref) }}</span>
              <button
                type="button"
                class="ml-0.5 flex rounded-full p-0.5 transition-colors hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1"
                :class="ref.referencia_tipo === 'curso' ? 'focus:ring-violet-500' : 'focus:ring-amber-500'"
                :aria-label="`Quitar ${ref.referencia_tipo} ${labelReferencia(ref)}`"
                @click="quitarReferencia(idx)"
              >
                <NavIcon name="close" class="size-3" />
              </button>
            </span>
          </div>
          <div v-else class="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2.5 text-center">
            <p class="text-xs text-slate-400">Sin referencias — producto complementario o de uso general.</p>
          </div>

          <!-- Fila para agregar una referencia -->
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_auto]">
            <FormSelect
              v-model="addRefTipo"
              label="Tipo *"
              :options="[{ value: 'curso', label: 'Curso' }, { value: 'modulo', label: 'Módulo' }]"
              help="Tipo de entidad académica a vincular."
            />
            <div>
              <div v-if="cursosLoading || modulosLoading" class="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-slate-400 italic mt-0">
                Cargando...
              </div>
              <FormSelect
                v-else
                v-model="addRefId"
                :label="addRefTipo === 'curso' ? 'Curso *' : 'Módulo *'"
                :placeholder="addRefTipo === 'curso' ? 'Selecciona un curso' : 'Selecciona un módulo'"
                :options="addRefTipo === 'curso' ? cursosOptions : modulosOptions"
                help="Entidad académica a vincular al producto."
              />
            </div>
            <div class="flex items-end">
              <button
                type="button"
                :disabled="!addRefTipo || !addRefId"
                class="flex h-9 items-center gap-1.5 rounded-lg bg-[#213360] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1a294d] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="agregarReferencia"
              >
                <NavIcon name="plus" class="size-3.5" />
                Agregar
              </button>
            </div>
          </div>
          <p v-if="refError" class="text-xs text-red-600">{{ refError }}</p>
        </div>

        <!-- Descripción y Estado -->
        <FormTextarea
          v-model="form.descripcion"
          label="Descripción"
          placeholder="Descripción opcional del producto..."
          :rows="2"
          help="Detalle opcional para quienes gestionan el catálogo."
          :error="fieldErrors.descripcion?.[0]"
        />

        <FormSelect
          v-model="form.status"
          label="Estado"
          help="Activo: disponible en selectores; inactivo: oculto en altas nuevas."
          :options="[{ value: 1, label: 'Activo' }, { value: 0, label: 'Inactivo' }]"
        />

        <!-- Error general -->
        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <p class="font-medium">{{ formError }}</p>
          <ul v-if="Object.keys(fieldErrors).length" class="mt-1 list-inside list-disc space-y-0.5">
            <li v-for="(msgs, field) in fieldErrors" :key="field">{{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}</li>
          </ul>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showFormModal = false">Cancelar</button>
      <button type="button" :disabled="formLoading" class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="submitForm">
        <span v-if="formLoading">Guardando...</span>
        <span v-else>{{ editingProducto ? 'Guardar cambios' : 'Crear producto' }}</span>
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Eliminar ──────────────────────────────────────────────────── -->
  <ModalBase v-model="showEliminarModal" title="Eliminar producto" description="Esta acción moverá el producto a la papelera.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">¿Estás seguro de que deseas eliminar <strong>{{ targetProducto?.nombre }}</strong>?</p>
      <p class="mt-2 text-xs text-slate-500">Si el producto tiene precios activos en listas de precios vigentes, eliminar puede causar inconsistencias. Considera inactivarlo primero.</p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showEliminarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500" @click="confirmEliminar">
        {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Detalle ───────────────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle del producto">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>
    <div v-if="detailProducto" class="space-y-3 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 font-medium text-slate-900">{{ detailProducto.nombre }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Código</dt>
          <dd class="mt-0.5">
            <code v-if="detailProducto.codigo" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ detailProducto.codigo }}</code>
            <span v-else class="text-slate-400">—</span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="detailProducto.status_text ?? (detailProducto.status === 1 ? 'Activo' : 'Inactivo')" :variant="detailProducto.status === 1 ? 'activo' : 'inactivo'" />
          </dd>
        </div>
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Tipo de producto</dt>
          <dd class="mt-0.5">
            <span v-if="detailProducto.tipo_producto" class="inline-flex flex-col gap-0.5">
              <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {{ detailProducto.tipo_producto.nombre }}
              </span>
              <span class="text-xs text-slate-500">
                {{ detailProducto.tipo_producto.es_financiable ? 'Financiable — permite cuotas' : 'No financiable — solo contado' }}
              </span>
            </span>
            <span v-else class="text-slate-400">—</span>
          </dd>
        </div>
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">
            Referencias académicas
            <span v-if="referenciasCargadas(detailProducto).length" class="ml-1 font-normal text-slate-400">({{ referenciasCargadas(detailProducto).length }})</span>
          </dt>
          <dd class="mt-1.5">
            <div v-if="referenciasCargadas(detailProducto).length" class="flex flex-wrap gap-1.5">
              <span
                v-for="ref in referenciasCargadas(detailProducto)"
                :key="ref.id ?? (ref.referencia_tipo + '-' + ref.referencia_id)"
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                :class="ref.referencia_tipo === 'curso' ? 'bg-violet-100 text-violet-800' : 'bg-amber-100 text-amber-800'"
              >
                <span>{{ ref.referencia_tipo }}</span>
                <span class="text-inherit/60">·</span>
                <span>{{ ref.referencia?.nombre ?? `#${ref.referencia_id}` }}</span>
              </span>
            </div>
            <span v-else class="text-slate-400">Sin referencia académica</span>
          </dd>
        </div>
        <div v-if="detailProducto.listas_precios?.length" class="col-span-2">
          <dt class="font-medium text-slate-500 mb-2">Listas de precios ({{ detailProducto.listas_precios.length }})</dt>
          <dd class="space-y-1.5">
            <div
              v-for="lista in detailProducto.listas_precios"
              :key="lista.id"
              class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-xs"
            >
              <span class="font-medium text-slate-900">{{ lista.nombre }}</span>
              <span class="text-slate-500">{{ lista.codigo }}</span>
            </div>
          </dd>
        </div>
        <div v-if="detailProducto.descripcion" class="col-span-2">
          <dt class="font-medium text-slate-500">Descripción</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailProducto.descripcion }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Creado</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailProducto.created_at ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Última modificación</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailProducto.updated_at ?? '—' }}</dd>
        </div>
        <div v-if="detailProducto.deleted_at" class="col-span-2">
          <dt class="font-medium text-red-500">Eliminado el</dt>
          <dd class="mt-0.5 text-red-700">{{ detailProducto.deleted_at }}</dd>
        </div>
      </dl>
    </div>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import productoLpService        from '@/services/productoLpService.js'
import productoReferenciaService from '@/services/productoReferenciaService.js'
import cursoService              from '@/services/cursoService.js'
import moduloService             from '@/services/moduloService.js'
import { useTipoProductoSelector } from '@/composables/useTipoProducto.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()
const { tiposOptions, tiposFilterOptions, loadTipos, isFinanciable } = useTipoProductoSelector()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate = ref(true)
const canEdit   = ref(true)
const canDelete = ref(true)

// ─── Opciones estáticas ───────────────────────────────────────────────────────
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 1,  label: 'Activos' },
  { value: 0,  label: 'Inactivos' }
]

const referenciaTipoFilterOptions = [
  { value: '',       label: 'Todos' },
  { value: 'curso',  label: 'Curso' },
  { value: 'modulo', label: 'Módulo' }
]

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',          label: 'Nombre' },
  { key: 'codigo',          label: 'Código' },
  { key: 'tipo_nombre',     label: 'Tipo' },
  { key: 'referencia_tipo', label: 'Referencia' },
  { key: 'status_text',     label: 'Estado' },
]

// ─── Datos de referencia académica ────────────────────────────────────────────
const cursos        = ref([])
const modulos       = ref([])
const cursosLoading = ref(false)
const modulosLoading = ref(false)

const cursosOptions  = computed(() => cursos.value.map((c) => ({ value: c.id, label: c.nombre })))
const modulosOptions = computed(() => modulos.value.map((m) => ({ value: m.id, label: m.nombre })))

async function loadCursos() {
  if (cursos.value.length) return
  cursosLoading.value = true
  try {
    const res = await cursoService.getAll({ status: 1, sort_by: 'nombre', sort_direction: 'asc', per_page: 200 })
    cursos.value = res.data ?? []
  } catch { cursos.value = [] }
  finally { cursosLoading.value = false }
}

async function loadModulos() {
  if (modulos.value.length) return
  modulosLoading.value = true
  try {
    const res = await moduloService.getAll({ status: 1, sort_by: 'nombre', sort_direction: 'asc', per_page: 200 })
    modulos.value = res.data ?? []
  } catch { modulos.value = [] }
  finally { modulosLoading.value = false }
}

// ─── Estado del listado ───────────────────────────────────────────────────────
const productos   = ref([])
const loading     = ref(false)
const error       = ref('')
const apiError    = ref('')
const viewTrashed = ref(false)

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, activos: 0, eliminados: 0 })
const filters    = reactive({ search: '', tipo_producto_id: '', referencia_tipo: '', status: '' })

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadProductos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page:       pagination.perPage,
      sort_by:        'nombre',
      sort_direction: 'asc',
      with:           'tipoProducto,referencias'
    }
    if (viewTrashed.value)               params.only_trashed      = true
    if (filters.search)                  params.search            = filters.search
    if (filters.tipo_producto_id !== '') params.tipo_producto_id  = filters.tipo_producto_id
    if (filters.referencia_tipo)         params.referencia_tipo   = filters.referencia_tipo
    if (filters.status !== '')           params.status            = filters.status

    const res = await productoLpService.getAll(params)
    productos.value = res.data ?? []
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
      apiError.value = 'El servicio de productos LP no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los productos.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [activos, eliminados] = await Promise.all([
      productoLpService.getAll({ per_page: 1, page: 1, status: 1 }),
      productoLpService.getAll({ per_page: 1, page: 1, only_trashed: true })
    ])
    stats.activos    = activos.meta?.total    ?? 0
    stats.eliminados = eliminados.meta?.total ?? 0
    stats.total      = stats.activos + stats.eliminados
  } catch {
    // Informativo
  }
}

// ─── Filtros y búsqueda ───────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadProductos(1), 400)
}

function toggleTrashed() { viewTrashed.value = !viewTrashed.value }
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadProductos(page) }

watch(() => filters.tipo_producto_id, () => loadProductos(1))
watch(() => filters.referencia_tipo,   () => loadProductos(1))
watch(() => filters.status,            () => loadProductos(1))
watch(viewTrashed,                     () => loadProductos(1))

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal    = ref(false)
const editingProducto  = ref(null)
const formLoading      = ref(false)
const formError        = ref('')
const fieldErrors      = ref({})

/** Genera una clave temporal única para identificar items en la lista local */
function newRefKey() {
  return `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const form = reactive({
  tipo_producto_id: null,
  nombre:           '',
  codigo:           '',
  descripcion:      '',
  referencias:      [],  // [{ _key, referencia_tipo, referencia_id }]
  status:           1
})

// ─── Estado del bloque "agregar referencia" ───────────────────────────────────
const addRefTipo  = ref('curso')
const addRefId    = ref(null)
const refError    = ref('')

/** Etiqueta legible de una referencia para los badges del formulario */
function labelReferencia(ref) {
  if (!ref.referencia_id) return '—'
  const lista = ref.referencia_tipo === 'curso' ? cursos.value : modulos.value
  const item  = lista.find((x) => Number(x.id) === Number(ref.referencia_id))
  return item?.nombre ?? `#${ref.referencia_id}`
}

/** Extrae el array normalizado de referencias para el modal de detalle */
function referenciasCargadas(producto) {
  if (!producto) return []
  // La API puede devolver la relación como 'referencias' (modelo LpProductoReferencia[])
  // o como 'cursos'/'modulos' en el producto detalle
  if (Array.isArray(producto.referencias) && producto.referencias.length) {
    return producto.referencias
  }
  // Fallback: construir desde cursos/modulos si se cargó con esas relaciones
  const refs = []
  for (const c of (producto.cursos ?? [])) {
    refs.push({ referencia_tipo: 'curso', referencia_id: c.id, referencia: c })
  }
  for (const m of (producto.modulos ?? [])) {
    refs.push({ referencia_tipo: 'modulo', referencia_id: m.id, referencia: m })
  }
  if (refs.length) return refs
  // Último recurso: campo legacy de referencia única
  if (producto.referencia_id && producto.referencia_tipo) {
    return [{
      referencia_tipo: producto.referencia_tipo,
      referencia_id:   producto.referencia_id,
      referencia:      producto.referencia ?? null
    }]
  }
  return []
}

function agregarReferencia() {
  refError.value = ''
  if (!addRefTipo.value || !addRefId.value) {
    refError.value = 'Selecciona el tipo y la entidad académica a vincular.'
    return
  }
  const id   = Number(addRefId.value)
  const tipo = addRefTipo.value
  const yaExiste = form.referencias.some(
    (r) => r.referencia_tipo === tipo && Number(r.referencia_id) === id
  )
  if (yaExiste) {
    refError.value = `Ese ${tipo} ya fue añadido a las referencias.`
    return
  }
  form.referencias.push({ _key: newRefKey(), referencia_tipo: tipo, referencia_id: id })
  addRefId.value = null
}

function quitarReferencia(idx) {
  form.referencias.splice(idx, 1)
}

function resetForm() {
  form.tipo_producto_id = null
  form.nombre           = ''
  form.codigo           = ''
  form.descripcion      = ''
  form.referencias      = []
  form.status           = 1
  addRefTipo.value      = 'curso'
  addRefId.value        = null
  refError.value        = ''
  formError.value       = ''
  fieldErrors.value     = {}
}

async function openCreate() {
  editingProducto.value = null
  resetForm()
  await Promise.allSettled([loadTipos(), loadCursos(), loadModulos()])
  showFormModal.value = true
}

async function openEdit(producto) {
  editingProducto.value = producto
  resetForm()
  await Promise.allSettled([loadTipos(), loadCursos(), loadModulos()])

  form.tipo_producto_id = producto.tipo_producto_id ?? producto.tipo_producto?.id ?? null
  form.nombre           = producto.nombre     ?? ''
  form.codigo           = producto.codigo     ?? ''
  form.descripcion      = producto.descripcion ?? ''
  form.status           = producto.status      ?? 1

  // Cargar referencias existentes del producto
  try {
    const res = await productoReferenciaService.getAll(
      { lp_producto_id: producto.id, per_page: 100 },
      { _silent: true }
    )
    form.referencias = (res.data ?? []).map((r) => ({
      _key:           newRefKey(),
      referencia_tipo: r.referencia_tipo,
      referencia_id:   r.referencia_id
    }))
  } catch {
    // Fallback: intentar cargar desde producto si trae la relación
    form.referencias = referenciasCargadas(producto).map((r) => ({
      _key:           newRefKey(),
      referencia_tipo: r.referencia_tipo,
      referencia_id:   r.referencia_id
    }))
  }

  showFormModal.value = true
}

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    const payload = {
      tipo_producto_id: form.tipo_producto_id ? Number(form.tipo_producto_id) : undefined,
      nombre:           form.nombre.trim() || undefined,
      status:           Number(form.status)
    }
    if (form.codigo?.trim())      payload.codigo      = form.codigo.trim()
    if (form.descripcion?.trim()) payload.descripcion = form.descripcion.trim()

    // Limpiar undefined
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])

    let productoId

    if (editingProducto.value) {
      await productoLpService.update(editingProducto.value.id, payload, { _silent: true })
      productoId = editingProducto.value.id
    } else {
      const res  = await productoLpService.create(payload, { _silent: true })
      productoId = res.data?.id ?? res?.id
      if (!productoId) throw new Error('La API no devolvió el id del producto creado.')
    }

    // Sincronizar referencias (reemplaza todo lo anterior)
    const referencias = form.referencias.map((r) => ({
      referencia_id:   Number(r.referencia_id),
      referencia_tipo: r.referencia_tipo
    }))
    await productoReferenciaService.sync(
      { lp_producto_id: productoId, referencias },
      { _silent: true }
    )

    notifySuccess(
      editingProducto.value
        ? `El producto "${form.nombre}" fue actualizado correctamente.`
        : `El producto "${form.nombre}" fue creado correctamente.`
    )

    showFormModal.value = false
    await Promise.all([loadProductos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors  ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? e?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetProducto    = ref(null)
const actionLoading     = ref(false)
const actionError       = ref('')

function openEliminar(producto) {
  targetProducto.value    = producto
  actionError.value       = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await productoLpService.delete(targetProducto.value.id)
    notifySuccess(`El producto "${targetProducto.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadProductos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el producto.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailProducto  = ref(null)

async function openDetail(producto) {
  detailProducto.value  = producto
  showDetailModal.value = true
  try {
    const res = await productoLpService.getById(
      producto.id,
      { with: 'tipoProducto,referencias.referencia,listasPrecios' }
    )
    detailProducto.value = res.data
  } catch {
    // Mantiene datos del listado
  }
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadProductos(1),
    loadStatistics(),
    loadTipos(),
  ])
})
</script>
