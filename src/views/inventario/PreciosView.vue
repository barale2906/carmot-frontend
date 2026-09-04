<template>
  <div class="flex flex-col gap-6">

    <!-- Tabs de sección -->
    <div class="flex gap-1 rounded-xl border border-black/10 bg-white p-1.5">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        :class="activeTab === tab.id
          ? 'bg-[#213360] text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Listas de precios                                                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'listas'">

      <!-- Filtros y acciones -->
      <section aria-labelledby="filtros-listas-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-listas-heading" class="sr-only">Filtros de listas de precios</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch v-model="listasFilters.search" label="Buscar:" placeholder="Nombre de la lista..." @input="onListasSearchInput" />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect v-model="listasFilters.status" label="Estado:" :options="statusFilterOptions" @change="loadListas(1)" />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button v-if="canListasCrear" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openCreateLista">
              <NavIcon name="plus" class="size-4" /> Nueva lista
            </button>
            <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearListasFilters">Limpiar</button>
          </div>
        </div>
      </section>

      <!-- Tabla de listas -->
      <section aria-labelledby="listado-listas-heading">
        <SectionHeader id="listado-listas-heading" title="Listas de precios de inventario" description="Agrupa precios de productos por período y población. Flujo: En Proceso → Aprobada → Activa." class="mb-4" />

        <div v-if="listasLoading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando listas...</span>
        </div>
        <div v-else-if="listasError" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ listasError }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadListas(1)">Reintentar</button>
        </div>

        <div v-else class="overflow-x-auto rounded-[14px] border border-black/10 bg-white">
          <table class="w-full text-sm" aria-label="Listas de precios de inventario">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50 text-left">
                <th class="px-4 py-3"></th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Vigencia</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Poblaciones</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Precios</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-if="!listas.length">
                <td colspan="6" class="px-4 py-12 text-center text-sm text-slate-400">No hay listas de precios para los filtros seleccionados.</td>
              </tr>
              <tr v-for="lista in listas" :key="lista.id" class="transition-colors hover:bg-slate-50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <!-- Editar (solo En Proceso) -->
                    <button v-if="canListasEditar && lista.status === 1" type="button" title="Editar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="openEditLista(lista)">
                      <NavIcon name="edit" class="size-4" />
                    </button>
                    <!-- Aprobar (En Proceso → Aprobada) -->
                    <button v-if="canListasAprobar && lista.status === 1" type="button" title="Aprobar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleAprobar(lista)">
                      <NavIcon name="check" class="size-4" />
                    </button>
                    <!-- Activar (Aprobada → Activa) -->
                    <button v-if="canListasAprobar && lista.status === 2" type="button" title="Activar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleActivar(lista)">
                      <NavIcon name="check" class="size-4" />
                    </button>
                    <!-- Inactivar -->
                    <button v-if="canListasInactivar && lista.status !== 0" type="button" title="Inactivar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="handleInactivar(lista)">
                      <NavIcon name="trash" class="size-4" />
                    </button>
                    <!-- Clonar -->
                    <button v-if="canListasClonar" type="button" title="Clonar lista" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-purple-100 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="openClonar(lista)">
                      <NavIcon name="copy" class="size-4" />
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <p class="font-medium text-slate-900">{{ lista.nombre }}</p>
                  <p v-if="lista.descripcion" class="mt-0.5 text-xs text-slate-400">{{ lista.descripcion }}</p>
                </td>
                <td class="px-4 py-3 text-slate-600">
                  <span v-if="lista.fecha_inicio">{{ lista.fecha_inicio }} → {{ lista.fecha_fin ?? '∞' }}</span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-4 py-3">
                  <div v-if="lista.poblaciones?.length" class="flex flex-wrap gap-1">
                    <span v-for="p in lista.poblaciones" :key="p.id" class="inline-flex rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{{ p.nombre }}</span>
                  </div>
                  <span v-else class="text-xs text-slate-400">—</span>
                </td>
                <td class="px-4 py-3 text-center font-mono text-slate-700">{{ lista.precios_count ?? '—' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(lista.status)">
                    {{ lista.status_text ?? statusText(lista.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="listasPagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">Mostrando {{ listasPagination.from }}–{{ listasPagination.to }} de {{ listasPagination.total }}</p>
          <div class="flex gap-2">
            <button type="button" :disabled="listasPagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadListas(listasPagination.currentPage - 1)">Anterior</button>
            <button type="button" :disabled="listasPagination.currentPage === listasPagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="loadListas(listasPagination.currentPage + 1)">Siguiente</button>
          </div>
        </div>

      </section>

      <!-- Modal: Crear / Editar lista -->
      <ModalBase v-model="showListaForm" :title="editingLista ? 'Editar lista de precios' : 'Nueva lista de precios'" description="Lista de precios de inventario. Estado inicial: En Proceso.">
        <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleListaSubmit">
          <FormInput v-model="listaForm.nombre" label="Nombre" placeholder="Ej: Lista Uniformes 2026-I" required :error="listaFormErrors.nombre?.[0]" />
          <div class="grid grid-cols-2 gap-4">
            <FormInput v-model="listaForm.fecha_inicio" label="Inicio de vigencia" type="date" :error="listaFormErrors.fecha_inicio?.[0]" />
            <FormInput v-model="listaForm.fecha_fin" label="Fin de vigencia" type="date" :error="listaFormErrors.fecha_fin?.[0]" />
          </div>
          <FormTextarea v-model="listaForm.descripcion" label="Descripción" placeholder="Descripción opcional..." :rows="2" :error="listaFormErrors.descripcion?.[0]" />
          <!-- Poblaciones -->
          <FormCheckboxGroup
            v-model="listaForm.poblaciones"
            label="Poblaciones"
            search-placeholder="Buscar población..."
            :options="poblacionOptions"
            :error="listaFormErrors.poblaciones?.[0]"
          >
            <template #before-search>
              <div v-if="poblacionesElegidasDisplay.length" class="mb-2">
                <p class="mb-1.5 text-xs font-medium text-slate-600">Poblaciones elegidas ({{ poblacionesElegidasDisplay.length }})</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="item in poblacionesElegidasDisplay"
                    :key="item.id"
                    class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {{ item.nombre }}
                    <button
                      type="button"
                      class="ml-0.5 rounded-full text-blue-500 transition-colors hover:text-blue-700 focus:outline-none"
                      :aria-label="`Quitar ${item.nombre}`"
                      @click="quitarPoblacionSeleccionada(item.id)"
                    >×</button>
                  </span>
                </div>
              </div>
            </template>
          </FormCheckboxGroup>
          <p v-if="poblacionesLoading" class="mt-1 text-xs text-slate-400">Cargando poblaciones...</p>
          <div v-if="listaFormError" class="rounded-lg border border-red-200 bg-red-50 p-3">
            <p class="text-sm text-red-700">{{ listaFormError }}</p>
          </div>
        </form>
        <template #footer>
          <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showListaForm = false">Cancelar</button>
          <button type="button" :disabled="listaSaving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleListaSubmit">
            {{ listaSaving ? 'Guardando...' : (editingLista ? 'Guardar cambios' : 'Crear lista') }}
          </button>
        </template>
      </ModalBase>

      <!-- Modal: Clonar lista -->
      <ModalBase v-model="showClonarForm" title="Clonar lista de precios" description="Crea una copia de la lista con sus precios en estado En Proceso.">
        <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleClonar">
          <FormInput v-model="clonarForm.nombre" label="Nombre de la nueva lista" placeholder="Ej: Lista Uniformes 2026-II" required :error="clonarFormErrors.nombre?.[0]" />
          <div class="grid grid-cols-2 gap-4">
            <FormInput v-model="clonarForm.fecha_inicio" label="Inicio de vigencia" type="date" :error="clonarFormErrors.fecha_inicio?.[0]" />
            <FormInput v-model="clonarForm.fecha_fin" label="Fin de vigencia" type="date" :error="clonarFormErrors.fecha_fin?.[0]" />
          </div>
          <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input v-model="clonarForm.copiar_precios" type="checkbox" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Copiar precios de la lista origen
          </label>
          <div v-if="clonarFormError" class="rounded-lg border border-red-200 bg-red-50 p-3">
            <p class="text-sm text-red-700">{{ clonarFormError }}</p>
          </div>
        </form>
        <template #footer>
          <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showClonarForm = false">Cancelar</button>
          <button type="button" :disabled="clonarSaving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleClonar">
            {{ clonarSaving ? 'Clonando...' : 'Clonar lista' }}
          </button>
        </template>
      </ModalBase>

    </template>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB: Precios por producto                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'precios'">

      <!-- Filtros y acciones -->
      <section aria-labelledby="filtros-precios-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-precios-heading" class="sr-only">Filtros de precios</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre de producto..." @input="onSearchInput" />
          </div>
          <div class="w-full sm:w-[240px]">
            <InvProductoBuscador
              :key="filtroBuscadorKey"
              label="Producto:"
              placeholder="Buscar producto..."
              @select="p => { filters.producto_id = p.id; onFilterChange() }"
              @clear="() => { filters.producto_id = ''; onFilterChange() }"
            />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button v-if="canCreate" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openCreate">
              <NavIcon name="plus" class="size-4" /> Nuevo precio
            </button>
            <button type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="clearFilters">Limpiar filtros</button>
          </div>
        </div>
      </section>

      <!-- Tabla de precios -->
      <section aria-labelledby="listado-precios-heading">
        <SectionHeader id="listado-precios-heading" title="Precios de productos de inventario" description="Lista de precios asociada a las listas activas. El precio se resuelve automáticamente al crear una venta según la sede y lista vigente." class="mb-4" />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando precios...</span>
        </div>
        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadPrecios(1)">Reintentar</button>
        </div>

        <DataTable v-else :columns="tableColumns" :data="precios" row-key="id" aria-label="Listado de precios de inventario" actions-first>
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'producto'">
              <span class="font-medium text-slate-900">{{ row.producto?.nombre ?? '—' }}</span>
            </template>
            <template v-else-if="column.key === 'lista_precio'">
              {{ row.listaPrecio?.nombre ?? row.lista_precio?.nombre ?? '—' }}
            </template>
            <template v-else-if="column.key === 'precio'">
              <span class="font-mono font-medium text-slate-900">{{ formatCurrency(value) }}</span>
            </template>
            <template v-else>{{ value ?? '—' }}</template>
          </template>
          <template #actions="{ row }">
            <button v-if="canEditar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Editar" @click="openEdit(row)">
              <NavIcon name="edit" class="size-4" />
            </button>
            <button v-if="canEliminar" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40" title="Eliminar" :disabled="!!deleting[row.id]" @click="handleDelete(row)">
              <NavIcon name="trash" class="size-4" />
            </button>
          </template>
        </DataTable>

        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }}</p>
          <div class="flex gap-2">
            <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
            <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
          </div>
        </div>

      </section>

      <!-- Modal: Crear / Editar precio -->
      <ModalBase v-model="showForm" :title="editingItem ? 'Editar precio' : 'Nuevo precio'" description="Precio de inventario vinculado a una lista de precios activa de inventario.">
        <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
          <InvProductoBuscador
            label="Producto"
            placeholder="Buscar producto (simple, kit o grupo)..."
            :selected-product="selectedProducto"
            @select="onProductoSelect"
            @clear="onProductoClear"
          />
          <p v-if="formErrors.producto_id?.[0]" class="mt-1 text-xs text-red-600">{{ formErrors.producto_id[0] }}</p>

          <!-- Aviso + listado de variantes cuando se elige un grupo -->
          <template v-if="selectedProducto?.tipo === 'grupo'">
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p class="text-xs font-medium text-blue-800">
                Producto grupo — el precio se asignará a todas sus variantes.
              </p>
              <div v-if="loadingVariantes" class="mt-1.5 text-xs text-blue-600">Cargando variantes...</div>
              <div v-else-if="grupoVariantes.length" class="mt-2 flex flex-wrap gap-1">
                <span
                  v-for="v in grupoVariantes"
                  :key="v.id"
                  class="inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                >{{ v.nombre }}</span>
              </div>
              <p v-else class="mt-1.5 text-xs text-blue-500">Este grupo no tiene variantes registradas.</p>
            </div>
          </template>

          <FormSelect v-model="form.lista_precio_id" label="Lista de precios" placeholder="Selecciona..." :options="listaPrecioOptions" required :error="formErrors.lista_precio_id?.[0]" />
          <FormInput v-model="form.precio" label="Precio" type="number" min="0" step="0.01" placeholder="0.00" required :error="formErrors.precio?.[0]" />
          <FormTextarea v-model="form.observaciones" label="Observaciones" placeholder="Observaciones opcionales..." :rows="2" :error="formErrors.observaciones?.[0]" />
          <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
            <p class="text-sm text-red-700">{{ formError }}</p>
          </div>
        </form>
        <template #footer>
          <button type="button" class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showForm = false">Cancelar</button>
          <button type="button" :disabled="saving" class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" @click="handleSubmit">
            {{ saving ? 'Guardando...' : (editingItem ? 'Guardar cambios' : 'Crear precio') }}
          </button>
        </template>
      </ModalBase>

    </template>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import invPrecioService       from '@/services/invPrecioService.js'
import invListaPrecioService  from '@/services/invListaPrecioService.js'
import { authService }        from '@/services/authService.js'
import { useNotification }    from '@/composables/useNotification'
import { usePoblacionSelector } from '@/composables/usePoblacion.js'
import { useConfirm }          from '@/composables/useConfirm.js'
import SectionHeader          from '@/components/activos/SectionHeader.vue'
import DataTable              from '@/components/activos/DataTable.vue'
import NavIcon                from '@/components/icons/NavIcon.vue'
import FormInputSearch        from '@/components/forms/FormInputSearch.vue'
import FormInput              from '@/components/forms/FormInput.vue'
import FormTextarea           from '@/components/forms/FormTextarea.vue'
import FormSelect             from '@/components/forms/FormSelect.vue'
import FormCheckboxGroup      from '@/components/forms/FormCheckboxGroup.vue'
import InvProductoBuscador    from '@/components/inventario/InvProductoBuscador.vue'
import invProductoService     from '@/services/invProductoService.js'
import ModalBase              from '@/components/ModalBase.vue'

const { success: notifySuccess, error: notifyError } = useNotification()
const { confirm } = useConfirm()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const userPermissions = ref([])
const hasPermission = (p) => userPermissions.value.includes(p)

const canCreate        = computed(() => hasPermission('inv_preciosCrear'))
const canEditar        = computed(() => hasPermission('inv_preciosEditar'))
const canEliminar      = computed(() => hasPermission('inv_preciosEliminar'))
const canListasCrear   = computed(() => hasPermission('inv_listasCrear'))
const canListasEditar  = computed(() => hasPermission('inv_listasEditar'))
const canListasAprobar = computed(() => hasPermission('inv_listasAprobar'))
const canListasInactivar = computed(() => hasPermission('inv_listasInactivar'))
const canListasClonar  = computed(() => hasPermission('inv_listasClonar'))

async function loadPermissions() {
  try {
    const user = await authService.getUser()
    userPermissions.value = user?.permissions ?? user?.all_permissions ?? []
  } catch { /* permisos vacíos */ }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
const formatCurrency = (v) => v != null
  ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)
  : '—'

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'listas', label: 'Listas de precios' },
  { id: 'precios', label: 'Precios por producto' },
]
const activeTab = ref('listas')

// ─── Estado de listas de precios ──────────────────────────────────────────────
const listas              = ref([])
const listasLoading       = ref(false)
const listasError         = ref('')
const listasPagination    = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const listasFilters       = reactive({ search: '', status: '' })
const { poblacionesOptions: poblacionOptions, poblacionesLoading: poblacionesLoading, loadPoblaciones } = usePoblacionSelector()

const statusFilterOptions = [
  { value: '',  label: 'Todos' },
  { value: '1', label: 'En Proceso' },
  { value: '2', label: 'Aprobada' },
  { value: '3', label: 'Activa' },
  { value: '0', label: 'Inactiva' },
]

function statusText(status) {
  return { 0: 'Inactiva', 1: 'En Proceso', 2: 'Aprobada', 3: 'Activa' }[status] ?? '—'
}

function statusClass(status) {
  return {
    0: 'bg-slate-100 text-slate-600',
    1: 'bg-blue-50 text-blue-700',
    2: 'bg-amber-50 text-amber-700',
    3: 'bg-green-50 text-green-700',
  }[status] ?? 'bg-slate-100 text-slate-600'
}

let listasSearchTimer = null
function onListasSearchInput() {
  clearTimeout(listasSearchTimer)
  listasSearchTimer = setTimeout(() => loadListas(1), 400)
}
function clearListasFilters() {
  listasFilters.search = ''
  listasFilters.status = ''
  loadListas(1)
}

async function loadListas(page = 1) {
  listasLoading.value = true
  listasError.value   = ''
  try {
    const params = { page, per_page: 15 }
    if (listasFilters.search) params.search = listasFilters.search
    if (listasFilters.status !== '') params.status = listasFilters.status
    const res = await invListaPrecioService.getAll(params)
    listas.value = res.data ?? []
    if (res.meta) {
      listasPagination.currentPage = res.meta.current_page
      listasPagination.lastPage    = res.meta.last_page
      listasPagination.total       = res.meta.total
      listasPagination.from        = res.meta.from ?? 0
      listasPagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    listasError.value = e?.response?.data?.message ?? 'Error al cargar las listas de precios.'
  } finally {
    listasLoading.value = false
  }
}

/** Objetos completos de las poblaciones seleccionadas en el formulario (para chips). */
const poblacionesElegidasDisplay = computed(() =>
  (listaForm.poblaciones ?? []).map((id) => {
    const opt = poblacionOptions.value.find((o) => Number(o.value) === Number(id))
    return { id, nombre: opt?.label ?? `#${id}` }
  }),
)

function quitarPoblacionSeleccionada(id) {
  listaForm.poblaciones = (listaForm.poblaciones ?? []).filter((x) => Number(x) !== Number(id))
}

// ─── Acciones de lista ────────────────────────────────────────────────────────
async function handleAprobar(lista) {
  if (!await confirm(`¿Aprobar la lista "${lista.nombre}"?`, { title: 'Aprobar lista', confirmLabel: 'Aprobar', danger: false })) return
  try {
    await invListaPrecioService.aprobar(lista.id)
    notifySuccess('Lista aprobada.')
    loadListas(listasPagination.currentPage)
    loadSelectores()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo aprobar la lista.')
  }
}

async function handleActivar(lista) {
  if (!await confirm(`¿Activar la lista "${lista.nombre}"?`, { title: 'Activar lista', confirmLabel: 'Activar', danger: false })) return
  try {
    await invListaPrecioService.activar(lista.id)
    notifySuccess('Lista activada.')
    loadListas(listasPagination.currentPage)
    loadSelectores()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo activar la lista.')
  }
}

async function handleInactivar(lista) {
  if (!await confirm(`¿Inactivar la lista "${lista.nombre}"?`, { title: 'Inactivar lista', confirmLabel: 'Inactivar' })) return
  try {
    await invListaPrecioService.inactivar(lista.id)
    notifySuccess('Lista inactivada.')
    loadListas(listasPagination.currentPage)
    loadSelectores()
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo inactivar la lista.')
  }
}

// ─── Modal: Crear / Editar lista ──────────────────────────────────────────────
const showListaForm    = ref(false)
const editingLista     = ref(null)
const listaSaving      = ref(false)
const listaFormError   = ref('')
const listaFormErrors  = ref({})
const emptyListaForm   = { nombre: '', fecha_inicio: '', fecha_fin: '', descripcion: '', poblaciones: [] }
const listaForm        = reactive({ ...emptyListaForm })

function openCreateLista() {
  editingLista.value = null
  Object.assign(listaForm, { ...emptyListaForm, poblaciones: [] })
  listaFormError.value  = ''
  listaFormErrors.value = {}
  showListaForm.value   = true
}

function openEditLista(lista) {
  editingLista.value = lista
  Object.assign(listaForm, {
    nombre:       lista.nombre       ?? '',
    fecha_inicio: lista.fecha_inicio ?? '',
    fecha_fin:    lista.fecha_fin    ?? '',
    descripcion:  lista.descripcion  ?? '',
    poblaciones:  lista.poblaciones?.map(p => p.id) ?? [],
  })
  listaFormError.value  = ''
  listaFormErrors.value = {}
  showListaForm.value   = true
}

async function handleListaSubmit() {
  listaFormError.value  = ''
  listaFormErrors.value = {}
  listaSaving.value     = true
  const payload = {
    nombre:       listaForm.nombre.trim(),
    fecha_inicio: listaForm.fecha_inicio || null,
    fecha_fin:    listaForm.fecha_fin    || null,
    descripcion:  listaForm.descripcion.trim() || null,
    poblaciones:  listaForm.poblaciones,
  }
  try {
    if (editingLista.value) {
      await invListaPrecioService.update(editingLista.value.id, payload)
      notifySuccess('Lista actualizada.')
    } else {
      await invListaPrecioService.create(payload)
      notifySuccess('Lista creada.')
    }
    showListaForm.value = false
    loadListas(listasPagination.currentPage)
    loadSelectores()
  } catch (e) {
    if (e?.response?.status === 422) {
      listaFormErrors.value = e.response.data?.errors ?? {}
      listaFormError.value  = e.response.data?.message ?? 'Verifica los datos.'
    } else {
      listaFormError.value = e?.response?.data?.message ?? 'Ocurrió un error.'
    }
  } finally {
    listaSaving.value = false
  }
}

// ─── Modal: Clonar lista ──────────────────────────────────────────────────────
const showClonarForm   = ref(false)
const clonarOrigen     = ref(null)
const clonarSaving     = ref(false)
const clonarFormError  = ref('')
const clonarFormErrors = ref({})
const clonarForm       = reactive({ nombre: '', fecha_inicio: '', fecha_fin: '', copiar_precios: true })

function openClonar(lista) {
  clonarOrigen.value    = lista
  Object.assign(clonarForm, { nombre: `${lista.nombre} (copia)`, fecha_inicio: '', fecha_fin: '', copiar_precios: true })
  clonarFormError.value  = ''
  clonarFormErrors.value = {}
  showClonarForm.value   = true
}

async function handleClonar() {
  clonarFormError.value  = ''
  clonarFormErrors.value = {}
  clonarSaving.value     = true
  try {
    const res = await invListaPrecioService.clonar(clonarOrigen.value.id, {
      nombre:        clonarForm.nombre.trim(),
      fecha_inicio:  clonarForm.fecha_inicio || null,
      fecha_fin:     clonarForm.fecha_fin    || null,
      copiar_precios: clonarForm.copiar_precios,
    })
    notifySuccess(`Lista clonada con ${res.precios_copiados ?? 0} precio(s) copiado(s).`)
    showClonarForm.value = false
    loadListas(1)
    loadSelectores()
  } catch (e) {
    if (e?.response?.status === 422) {
      clonarFormErrors.value = e.response.data?.errors ?? {}
      clonarFormError.value  = e.response.data?.message ?? 'Verifica los datos.'
    } else {
      clonarFormError.value = e?.response?.data?.message ?? 'Ocurrió un error al clonar.'
    }
  } finally {
    clonarSaving.value = false
  }
}

// ─── Estado de precios por producto ───────────────────────────────────────────
const precios     = ref([])
const loading     = ref(false)
const error       = ref('')
const deleting    = ref({})
const pagination  = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })
const filters           = reactive({ search: '', producto_id: '' })
const listaPrecioOptions = ref([])
const listaPrecioRaw     = ref([])
const filtroBuscadorKey  = ref(0)

const tableColumns = [
  { key: 'producto',     label: 'Producto' },
  { key: 'lista_precio', label: 'Lista de precios' },
  { key: 'precio',       label: 'Precio' },
]

async function loadSelectores() {
  try {
    // Traemos todas y excluimos solo las Inactivas (status=0)
    const res = await invListaPrecioService.getAll({ per_page: 200 })
    const lista = res.data ?? res ?? []
    const statusLabel = { 1: 'En Proceso', 2: 'Aprobada', 3: 'Activa' }
    listaPrecioRaw.value    = Array.isArray(lista) ? lista.filter(l => l.status !== 0) : []
    listaPrecioOptions.value = listaPrecioRaw.value
      .map(l => ({ value: l.id, label: `${l.nombre} (${statusLabel[l.status] ?? l.status})` }))
  } catch { /* no bloquea */ }
}

async function loadPrecios(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 20 }
    if (filters.search)      params.search      = filters.search
    if (filters.producto_id) params.producto_id = filters.producto_id
    const res = await invPrecioService.getAll(params)
    precios.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los precios.'
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadPrecios(1), 400) }
function onFilterChange() { loadPrecios(1) }
function clearFilters() { filters.search = ''; filters.producto_id = ''; filtroBuscadorKey.value++; loadPrecios(1) }
function goToPage(p) { if (p >= 1 && p <= pagination.lastPage) loadPrecios(p) }

async function handleDelete(row) {
  if (!await confirm('¿Eliminar este precio? Esta acción no se puede deshacer.', { title: 'Eliminar precio', confirmLabel: 'Eliminar' })) return
  deleting.value = { ...deleting.value, [row.id]: true }
  try {
    await invPrecioService.delete(row.id)
    notifySuccess('Precio eliminado.')
    loadPrecios(pagination.currentPage)
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo eliminar el precio.')
  } finally {
    const n = { ...deleting.value }
    delete n[row.id]
    deleting.value = n
  }
}

// ─── Modal: Crear / Editar precio ─────────────────────────────────────────────
const showForm         = ref(false)
const editingItem      = ref(null)
const saving           = ref(false)
const formError        = ref('')
const formErrors       = ref({})
const emptyForm        = { producto_id: '', lista_precio_id: '', precio: '', observaciones: '' }
const form             = reactive({ ...emptyForm })
const selectedProducto = ref(null)   // objeto completo del producto elegido
const grupoVariantes   = ref([])     // variantes del grupo seleccionado
const loadingVariantes = ref(false)

async function onProductoSelect(p) {
  form.producto_id    = p.id
  selectedProducto.value = p
  grupoVariantes.value   = []
  if (p.tipo === 'grupo') {
    loadingVariantes.value = true
    try {
      const res = await invProductoService.getVariantes(p.id)
      grupoVariantes.value = res.data ?? res ?? []
    } catch { grupoVariantes.value = [] }
    finally { loadingVariantes.value = false }
  }
}

function onProductoClear() {
  form.producto_id     = ''
  selectedProducto.value = null
  grupoVariantes.value   = []
}

function openCreate() {
  editingItem.value      = null
  selectedProducto.value = null
  grupoVariantes.value   = []
  Object.assign(form, emptyForm)
  formError.value  = ''
  formErrors.value = {}
  showForm.value   = true
}

function openEdit(row) {
  editingItem.value      = row
  selectedProducto.value = row.producto ?? null
  grupoVariantes.value   = []
  Object.assign(form, {
    producto_id:     row.producto_id     ?? '',
    lista_precio_id: row.lista_precio_id ?? '',
    precio:          row.precio          ?? '',
    observaciones:   row.observaciones   ?? '',
  })
  formError.value  = ''
  formErrors.value = {}
  showForm.value   = true
}

async function handleSubmit() {
  formError.value  = ''
  formErrors.value = {}
  saving.value     = true
  const precio       = Number(form.precio)
  const lista_id    = form.lista_precio_id
  const observaciones = form.observaciones.trim() || null

  try {
    if (editingItem.value) {
      // Editar: siempre actualización directa del registro
      await invPrecioService.update(editingItem.value.id, { precio, observaciones })
      notifySuccess('Precio actualizado.')
    } else if (selectedProducto.value?.tipo === 'grupo' && grupoVariantes.value.length) {
      // Grupo → sincronizar: requiere lista En Proceso (status=1)
      const listaSeleccionada = listaPrecioRaw.value.find(l => Number(l.id) === Number(lista_id))
      if (listaSeleccionada?.status !== 1) {
        formError.value = 'Para asignar precio a un grupo, la lista debe estar en estado "En Proceso".'
        saving.value = false
        return
      }
      // Primero cargamos los precios existentes en la lista para no borrar otros productos.
      const existingRes = await invPrecioService.getAll({ lista_precio_id: lista_id, per_page: 200 })
      const existingItems = (existingRes.data ?? []).map(p => ({
        producto_id:  p.producto_id,
        precio:       Number(p.precio),
        observaciones: p.observaciones ?? null,
      }))
      // Las variantes del grupo reemplazan sus entradas previas (mismo producto_id); el resto se conserva.
      const varianteIds = new Set(grupoVariantes.value.map(v => v.id))
      const itemsBase   = existingItems.filter(p => !varianteIds.has(p.producto_id))
      const itemsGrupo  = [{ producto_id: selectedProducto.value.id, precio, observaciones }]
      await invPrecioService.sincronizar(lista_id, [...itemsBase, ...itemsGrupo])
      notifySuccess(`Precio asignado al grupo y sus ${grupoVariantes.value.length} variante(s).`)
    } else {
      // Simple/Kit: POST /precios hace updateOrCreate en el backend
      await invPrecioService.create({ producto_id: form.producto_id, lista_precio_id: lista_id, precio, observaciones })
      notifySuccess('Precio guardado.')
    }
    showForm.value = false
    loadPrecios(pagination.currentPage)
  } catch (e) {
    if (e?.response?.status === 422) {
      formErrors.value = e.response.data?.errors ?? {}
      formError.value  = e.response.data?.message ?? 'Verifica los datos.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error.'
    }
  } finally {
    saving.value = false
  }
}

// ─── Cargar datos al montar y al cambiar de tab ───────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'listas' && !listas.value.length) loadListas(1)
  if (tab === 'precios' && !precios.value.length) { loadPrecios(1); loadSelectores() }
})

onMounted(() => {
  loadPermissions()
  loadListas(1)
  loadPoblaciones()
  loadSelectores()
})
</script>
