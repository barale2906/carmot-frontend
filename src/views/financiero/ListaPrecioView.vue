<template>
  <div class="flex flex-col gap-6">

    <!-- ── Estadísticas ───────────────────────────────────────────────────────── -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-lp-heading">
      <h2 id="stats-lp-heading" class="sr-only">Resumen de listas de precios</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-5" role="list">
        <li role="listitem">
          <StatCard title="Total"       :value="stats.total"      description="Listas registradas"       icon="financiero"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="En proceso"  :value="stats.enProceso"  description="En construcción"          icon="pendientes"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Aprobadas"   :value="stats.aprobadas"  description="Listas para activar"      icon="disponible"    icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activas"     :value="stats.activas"    description="Listas en uso"            icon="activos"       icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Inactivas"   :value="stats.inactivas"  description="Fuera de circulación"     icon="track_changes" icon-variant="blue" />
        </li>
      </ul>
    </section>

    <!-- ── API no disponible ──────────────────────────────────────────────────── -->
    <section v-if="apiError" class="rounded-[14px] border border-amber-200 bg-amber-50 p-6">
      <p class="text-sm text-amber-800">{{ apiError }}</p>
      <p class="mt-2 text-xs text-amber-700">
        Verifica que el endpoint
        <code class="rounded bg-amber-200 px-1">/api/financiero/lp/listas-precios</code>
        esté disponible.
      </p>
    </section>

    <template v-else>

      <!-- ── Filtros y acciones ─────────────────────────────────────────────── -->
      <section aria-labelledby="filtros-lp-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-lp-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre o código..."
              @input="onSearchInput"
            />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect v-model="filters.status" label="Estado:" :options="statusFilterOptions" />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button
              v-if="viewTrashed"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="eye" class="size-4" /> Ver activas
            </button>
            <button
              v-else
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="toggleTrashed"
            >
              <NavIcon name="track_changes" class="size-4" /> Ver eliminadas
            </button>
            <button
              v-if="!viewTrashed && canCreate"
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openCreate"
            >
              <NavIcon name="plus" class="size-4" /> Nueva lista
            </button>
          </div>
        </div>
      </section>

      <!-- ── Tabla ───────────────────────────────────────────────────────────── -->
      <section aria-labelledby="listado-lp-heading">
        <SectionHeader
          id="listado-lp-heading"
          :title="viewTrashed ? 'Listas eliminadas' : 'Listas de precios'"
          :description="viewTrashed
            ? 'Listas eliminadas. Solo visible para auditoría.'
            : 'Define la tarificación por período, población y producto. Una lista activa determina el costo de matrícula.'"
          class="mb-4"
        />

        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando listas de precios...</span>
        </div>
        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadListas(1)">Reintentar</button>
        </div>

        <DataTable
          v-else
          :columns="tableColumns"
          :data="listas"
          row-key="id"
          aria-label="Listado de listas de precios"
        >
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'nombre'">
              <span class="font-medium text-slate-900">{{ value }}</span>
              <span v-if="row.deleted_at" class="ml-2 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">Eliminada</span>
            </template>

            <template v-else-if="column.key === 'codigo'">
              <code v-if="value" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ value }}</code>
              <span v-else class="text-slate-400">—</span>
            </template>

            <template v-else-if="column.key === 'status_text'">
              <StatusBadge :label="value ?? statusLabel(row.status)" :variant="statusBadgeVariant(row.status)" />
            </template>

            <template v-else-if="column.key === 'poblaciones'">
              <span class="text-sm text-slate-700">
                {{ row.poblaciones?.length ?? 0 }} región{{ (row.poblaciones?.length ?? 0) !== 1 ? 'es' : '' }}
              </span>
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
              v-if="!row.deleted_at && canEdit"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Editar"
              @click="openEdit(row)"
            >
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button
              v-if="!row.deleted_at && canDelete"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar"
              @click="openEliminar(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">
            Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} listas
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

  <!-- ══ Modal: Crear / Editar lista ════════════════════════════════════════════ -->
  <ModalBase
    v-model="showFormModal"
    :title="editingLista ? 'Editar lista de precios' : 'Nueva lista de precios'"
    :description="wizardStepDescription"
    size="full"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <!-- Indicador de pasos (asistente) -->
    <nav class="mb-4" aria-label="Pasos del asistente">
      <ol class="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
        <li
          v-for="(step, idx) in WIZARD_STEPS"
          :key="step.id"
          class="flex min-w-0 flex-1 items-center gap-2"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
            :class="formWizardStep === step.id
              ? 'bg-[#213360] text-white ring-2 ring-[#213360] ring-offset-2'
              : formWizardStep > step.id
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 bg-slate-100 text-slate-500'"
            :aria-current="formWizardStep === step.id ? 'step' : undefined"
          >
            <NavIcon v-if="formWizardStep > step.id" name="check" class="size-4" />
            <span v-else>{{ step.id }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-xs font-semibold leading-tight sm:text-sm"
              :class="formWizardStep === step.id ? 'text-[#213360]' : 'text-slate-600'"
            >{{ step.label }}</p>
            <p v-if="formWizardStep === step.id" class="text-[11px] leading-snug text-slate-500">{{ step.hint }}</p>
          </div>
          <div
            v-if="idx < WIZARD_STEPS.length - 1"
            class="mx-1 hidden h-0.5 w-6 shrink-0 bg-slate-200 sm:block"
            aria-hidden="true"
          />
        </li>
      </ol>
    </nav>

    <form class="flex max-h-[min(68vh,600px)] flex-col overflow-hidden" @submit.prevent="submitForm">
      <div class="min-h-0 flex-1 overflow-y-auto pr-1 pb-2">
        <!-- ── Paso 1: Lista y poblaciones ─────────────────────────────────── -->
        <section
          v-show="formWizardStep === 1"
          class="flex flex-col gap-5"
          :aria-labelledby="'wizard-step-1-title'"
        >
          <h3 id="wizard-step-1-title" class="sr-only">Paso 1: Lista y regiones</h3>
          <p class="text-sm text-slate-600">
            Define el nombre, vigencia y las <strong>poblaciones</strong> a las que aplica la lista (requerido por el sistema).
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              v-model="form.nombre"
              label="Nombre *"
              placeholder="Ej: Lista 2026 - Primer Semestre"
              :required="true"
              maxlength="255"
              :error="fieldErrors.nombre?.[0]"
            />
            <FormInput
              v-model="form.codigo"
              label="Código"
              placeholder="Ej: LP-2026-S1"
              hint="Opcional. Único, máximo 100 caracteres."
              maxlength="100"
              :error="fieldErrors.codigo?.[0]"
            />
            <FormInput
              v-model="form.fecha_inicio"
              label="Fecha inicio *"
              type="date"
              :required="true"
              :error="fieldErrors.fecha_inicio?.[0]"
            />
            <FormInput
              v-model="form.fecha_fin"
              label="Fecha fin *"
              type="date"
              :required="true"
              hint="Debe ser igual o posterior a la fecha inicio."
              :error="fieldErrors.fecha_fin?.[0]"
            />
          </div>

          <FormTextarea
            v-model="form.descripcion"
            label="Descripción"
            placeholder="Descripción opcional de la lista..."
            :rows="2"
            :error="fieldErrors.descripcion?.[0]"
          />

          <div>
            <FormCheckboxGroup
              v-model="form.poblaciones"
              label="Poblaciones * (regiones que aplica)"
              search-placeholder="Buscar región..."
              hint="Selecciona las regiones geográficas para las que aplica esta lista. Al editar, se reemplazan completamente."
              :required="true"
              :options="poblacionesOptions"
              :error="fieldErrors.poblaciones?.[0] ?? fieldErrors['poblaciones.0']?.[0]"
            >
              <template #before-search>
                <div
                  v-if="form.poblaciones.length"
                  class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p class="mb-1.5 text-xs font-medium text-slate-600">Regiones elegidas ({{ form.poblaciones.length }})</p>
                  <ul class="flex flex-wrap gap-2" role="list">
                    <li
                      v-for="item in poblacionesElegidasDisplay"
                      :key="'pob-badge-' + item.id"
                      role="listitem"
                      class="max-w-full"
                    >
                      <span
                        class="inline-flex max-w-full items-center gap-0.5 rounded-full border border-[#213360]/25 bg-[#213360]/10 py-0.5 pl-2 pr-0.5 text-xs font-medium text-[#213360]"
                        :title="item.description || undefined"
                      >
                        <span class="min-w-0 truncate">{{ item.label }}</span>
                        <button
                          type="button"
                          class="flex shrink-0 rounded-full p-0.5 text-[#213360] transition-colors hover:bg-[#213360]/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          :aria-label="'Quitar región: ' + item.label"
                          @click="quitarPoblacionSeleccionada(item.id)"
                        >
                          <NavIcon name="close" class="size-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    </li>
                  </ul>
                </div>
              </template>
            </FormCheckboxGroup>
            <p v-if="poblacionesLoading" class="mt-1 text-xs text-slate-400">Cargando regiones...</p>
          </div>
        </section>

        <!-- ── Paso 2: Productos y precios ───────────────────────────────────── -->
        <section
          v-show="formWizardStep === 2"
          class="flex flex-col gap-4"
          :aria-labelledby="'wizard-step-2-title'"
        >
          <h3 id="wizard-step-2-title" class="sr-only">Paso 2: Productos y precios</h3>
          <p class="text-sm text-slate-600">
            Primero elige productos <strong>ya existentes</strong> en el catálogo LP y define su precio en esta lista.
            Si falta alguno en catálogo, puedes darlo de alta con curso o módulo en el bloque inferior.
          </p>

          <div class="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <div class="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900">Catálogo LP</p>
                <p class="mt-0.5 max-w-prose text-xs text-slate-600">
                  Productos dados de alta en el sistema. «Añadir precio» crea una fila en esta elaboración para completar importes debajo.
                </p>
              </div>
              <span v-if="productosLoading" class="shrink-0 text-xs text-slate-500">Cargando catálogo…</span>
              <span v-else class="shrink-0 text-xs text-slate-600">{{ productos.length }} producto(s)</span>
            </div>
            <p
              v-if="productosLoadError"
              class="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {{ productosLoadError }}
            </p>
            <div class="mb-3">
              <FormInput
                v-model="productosStep2Filter"
                label="Buscar por nombre o código"
                placeholder="Ej: curso, MOD-…"
                maxlength="120"
              />
            </div>
            <div
              v-if="productosLoading && !productos.length"
              class="rounded-lg border border-dashed border-slate-200 bg-white py-6 text-center text-xs text-slate-500"
            >
              Cargando productos del catálogo…
            </div>
            <div
              v-else-if="!productos.length && !productosLoadError"
              class="rounded-lg border border-dashed border-slate-200 bg-white py-4 text-center text-xs text-slate-500"
            >
              No hay productos en el catálogo (no eliminados). Usa el registro rápido más abajo o crea productos desde Financiero → Productos LP.
            </div>
            <ul
              v-else-if="productosCatalogFiltrados.length"
              class="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-black/10 bg-white p-2 text-sm"
            >
              <li
                v-for="p in productosCatalogFiltrados"
                :key="p.id"
                class="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium text-slate-800">{{ p.nombre }}</p>
                  <p class="text-[11px] text-slate-500">
                    <span v-if="p.codigo">Código {{ p.codigo }} · </span>
                    <span>{{ p.tipo_producto?.nombre ?? '—' }}</span>
                    <span v-if="Number(p.status) !== 1" class="text-amber-700"> · Estado no activo</span>
                  </p>
                </div>
                <button
                  v-if="puedeEditarPreciosEnForm"
                  type="button"
                  :disabled="formPrecioLines.some((l) => Number(l.producto_id) === p.id)"
                  class="shrink-0 rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#213360] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @click="addPrecioLineForProducto(p.id)"
                >
                  {{ formPrecioLines.some((l) => Number(l.producto_id) === p.id) ? 'En elaboración' : 'Añadir precio' }}
                </button>
              </li>
            </ul>
            <p
              v-else-if="productos.length && !productosCatalogFiltrados.length"
              class="py-3 text-center text-xs text-slate-500"
            >
              Ningún producto coincide con el filtro.
            </p>
          </div>

      <div class="rounded-xl border border-black/10 bg-slate-50/90 p-4">
        <div class="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-slate-900">Productos y precios</p>
            <p class="mt-1 max-w-prose text-xs text-slate-500">
              El producto se elige en <strong>Catálogo LP</strong> con «Añadir precio». Los importes y cuotas se revisan en la <strong>tabla</strong> inferior (desplazamiento horizontal si hay muchas columnas). Financiable: total y cuotas; cuota de referencia según backend.
            </p>
            <p v-if="editingLista && !puedeEditarPreciosEnForm" class="mt-2 text-xs text-amber-800">
              Solo se pueden editar precios desde aquí cuando la lista está En proceso o Aprobada.
            </p>
          </div>
        </div>

        <div v-if="!formPrecioLines.length" class="rounded-lg border border-dashed border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
          Sin productos en esta elaboración. Usa <strong>Catálogo LP</strong> con «Añadir precio», o guarda la lista y complétalo desde el detalle.
        </div>

        <div v-else class="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
          <table class="w-full min-w-[960px] border-collapse text-left text-sm" aria-label="Líneas de precio por producto">
            <thead class="sticky top-0 z-[1] bg-slate-100 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
              <tr class="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-10">#</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[10rem]">Producto</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7.5rem]" title="Valor total = matrícula + total financiado. Solo se ajustan matrícula y total al salir de cada campo.">
                  Valor total *
                </th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Matr. *</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7.5rem]">Total fin. *</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[5rem]">Cuotas *</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Cuota ref.</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[8rem]">Obs.</th>
                <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-20 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(line, idx) in formPrecioLines"
                :key="line._key"
                class="border-b border-slate-100 align-top transition-colors hover:bg-slate-50/90"
              >
                <td class="px-2 py-2 align-middle text-xs font-medium text-slate-500">{{ idx + 1 }}</td>
                <td class="px-2 py-2 align-middle max-w-[14rem]">
                  <p class="truncate font-medium text-slate-900" :title="labelProducto(line.producto_id)">
                    {{ labelProducto(line.producto_id) }}
                  </p>
                  <p v-if="productoDetalleLinea(line)" class="truncate text-xs text-slate-500" :title="productoDetalleLinea(line)">
                    {{ productoDetalleLinea(line) }}
                  </p>
                  <p
                    v-if="formLineEsFinanciable(line) && !precioFinanciableLineaCoherente(line)"
                    class="mt-1 text-[11px] leading-snug text-amber-800"
                  >
                    Revisa: valor total = matrícula + total financiado.
                  </p>
                </td>
                <td class="px-2 py-2 align-middle">
                  <FormInput
                    v-model="line.precio_contado"
                    label=""
                    type="number"
                    min="0"
                    placeholder="0"
                    :disabled="!puedeEditarPreciosEnForm"
                    @blur="onBlurLineaPrecioContado(line)"
                  />
                </td>
                <td class="px-2 py-2 align-middle">
                  <FormInput
                    v-model="line.matricula"
                    label=""
                    type="number"
                    min="0"
                    placeholder="0"
                    :disabled="!puedeEditarPreciosEnForm"
                    @blur="onBlurLineaMatricula(line)"
                  />
                </td>
                <td class="px-2 py-2 align-middle">
                  <template v-if="formLineEsFinanciable(line)">
                    <FormInput
                      v-model="line.precio_total"
                      label=""
                      type="number"
                      min="0"
                      placeholder="0"
                      :disabled="!puedeEditarPreciosEnForm"
                      @blur="onBlurLineaPrecioTotal(line)"
                    />
                  </template>
                  <span v-else class="block py-2 text-center text-xs text-slate-400">—</span>
                </td>
                <td class="px-2 py-2 align-middle">
                  <FormInput
                    v-if="formLineEsFinanciable(line)"
                    v-model="line.numero_cuotas"
                    label=""
                    type="number"
                    min="1"
                    step="1"
                    placeholder="6"
                    :disabled="!puedeEditarPreciosEnForm"
                  />
                  <span v-else class="block py-2 text-center text-xs text-slate-400">—</span>
                </td>
                <td class="px-2 py-2 align-middle text-xs text-slate-700">
                  <span v-if="formLineEsFinanciable(line)" class="block max-w-[6.5rem] leading-snug">
                    {{ valorCuotaPreviewLine(line) }}
                  </span>
                  <span v-else class="block text-center text-slate-400">—</span>
                </td>
                <td class="px-2 py-2 align-middle min-w-[8rem]">
                  <textarea
                    v-model="line.observaciones"
                    rows="2"
                    placeholder="Opcional"
                    class="w-full min-h-[2.5rem] resize-y rounded-lg border-0 bg-[#f3f3f5] px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    :disabled="!puedeEditarPreciosEnForm"
                  />
                </td>
                <td class="px-2 py-2 align-middle text-right">
                  <button
                    v-if="puedeEditarPreciosEnForm"
                    type="button"
                    class="text-xs font-medium text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500"
                    @click="removeFormPrecioLine(idx)"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Alta rápida de producto LP (guía LP: PASO 2) -->
        <div class="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-3">
          <button
            type="button"
            class="text-left text-sm font-medium text-[#213360] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="toggleQuickProduct"
          >
            {{ quickProductOpen ? '▼ Ocultar alta de producto en catálogo' : '▸ Registrar producto en catálogo (curso / módulo)' }}
          </button>
          <div v-show="quickProductOpen" class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormSelect
              v-model="quickTipoProductoId"
              label="Tipo de producto *"
              placeholder="Tipo"
              :options="tiposProductoOptions"
              span="full"
            />
            <FormSelect
              v-model="quickRefTipo"
              label="Referencia *"
              :options="referenciaTipoOptions"
            />
            <FormSelect
              v-if="quickRefTipo === 'curso'"
              v-model="quickRefId"
              label="Curso *"
              placeholder="Seleccione curso"
              :options="cursosOptions"
              span="full"
            />
            <FormSelect
              v-else
              v-model="quickRefId"
              label="Módulo *"
              placeholder="Seleccione módulo"
              :options="modulosOptions"
              span="full"
            />
            <FormInput
              v-model="quickNombre"
              span="full"
              label="Nombre del producto *"
              placeholder="Ej: Inglés Avanzado - Matrícula"
              maxlength="255"
            />
            <div class="sm:col-span-2 flex flex-wrap gap-2">
              <button
                type="button"
                :disabled="quickProductLoading"
                class="inline-flex items-center gap-1 rounded-lg bg-[#213360] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="crearProductoDesdeReferencia"
              >
                {{ quickProductLoading ? 'Creando…' : 'Crear producto y refrescar listas' }}
              </button>
            </div>
          </div>
        </div>
      </div>
        </section>

        <!-- ── Paso 3: Descuentos ────────────────────────────────────────────── -->
        <section
          v-show="formWizardStep === 3"
          class="flex flex-col gap-4"
          aria-labelledby="wizard-step-3-title"
        >
          <h3 id="wizard-step-3-title" class="sr-only">Paso 3: Descuentos</h3>
          <p class="text-sm text-slate-600">
            Paso final opcional: descuentos vinculados a esta lista. Al crear, los de la cola se registran al pulsar <strong>Guardar</strong>.
            En edición puedes añadir descuentos ahora o aprobar los que estén en proceso.
          </p>
      <div class="rounded-xl border border-black/10 bg-slate-50/90 p-4">
        <div class="mb-3">
          <p class="text-sm font-semibold text-slate-900">Descuentos vinculados</p>
          <p class="mt-1 max-w-prose text-xs text-slate-500">
            Misma idea que <strong>productos y precios</strong>: tabla con desplazamiento horizontal. Al crear, la cola se envía al guardar con
            <code class="rounded bg-slate-100 px-1">listas_precios</code>. En edición puedes registrar uno nuevo o aprobar los en proceso.
          </p>
        </div>

        <!-- Cola (solo creación) -->
        <template v-if="!editingLista">
          <div v-if="descuentosPendientes.length" class="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
            <table class="w-full min-w-[960px] border-collapse text-left text-sm" aria-label="Descuentos en cola">
              <thead class="sticky top-0 z-[1] bg-slate-100 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
                <tr class="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-10">#</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[9rem]">Nombre</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Tipo</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Valor</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7rem]">Aplicación</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[8rem]">Activación</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7rem]">Días / código</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Desde</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Hasta</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-14 text-center">Acum.</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[8rem]">Alcance</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-20 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(d, di) in descuentosPendientes"
                  :key="'pd-' + di"
                  class="border-b border-slate-100 align-top transition-colors hover:bg-slate-50/90"
                >
                  <td class="px-2 py-2 align-middle text-xs font-medium text-slate-500">{{ di + 1 }}</td>
                  <td class="px-2 py-2 align-middle font-medium text-slate-900">{{ d.nombre }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoTipoOptions, d.tipo) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ formatValorDescuentoCelda(d) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoAplicacionOptions, d.aplicacion) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoActivacionOptions, d.tipo_activacion) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ descuentoExtraActivacion(d) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d.fecha_inicio }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d.fecha_fin }}</td>
                  <td class="px-2 py-2 align-middle text-center text-xs text-slate-600">{{ descuentoAcumulacionSiNo(d) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d._alcanceTexto }}</td>
                  <td class="px-2 py-2 align-middle text-right">
                    <button type="button" class="text-xs font-medium text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500" @click="descuentosPendientes.splice(di, 1)">Quitar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="rounded-lg border border-dashed border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            Sin descuentos en cola. Completa la fila <strong>Definir descuento</strong> y pulsa <strong>Añadir a la cola</strong>.
          </div>
        </template>

        <!-- Listado en edición -->
        <div v-if="editingLista" class="mt-3">
          <p v-if="descuentosLoading" class="text-xs text-slate-400">Cargando descuentos…</p>
          <div v-else-if="descuentosLista.length" class="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
            <table class="w-full min-w-[960px] border-collapse text-left text-sm" aria-label="Descuentos de la lista">
              <thead class="sticky top-0 z-[1] bg-slate-100 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
                <tr class="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-10">#</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[9rem]">Nombre</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Tipo</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Valor</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7rem]">Aplicación</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[8rem]">Activación</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7rem]">Días / código</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Desde</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Hasta</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-14 text-center">Acum.</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[10rem]">Alcance</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Estado</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-24 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(d, di) in descuentosLista"
                  :key="d.id"
                  class="border-b border-slate-100 align-top transition-colors hover:bg-slate-50/90"
                >
                  <td class="px-2 py-2 align-middle text-xs font-medium text-slate-500">{{ di + 1 }}</td>
                  <td class="px-2 py-2 align-middle">
                    <p class="max-w-[14rem] truncate font-medium text-slate-900" :title="d.nombre">{{ d.nombre }}</p>
                    <p v-if="d.productos?.length" class="mt-0.5 line-clamp-2 text-[11px] text-slate-500" :title="nombresProductosDescuento(d)">
                      {{ nombresProductosDescuento(d) }}
                    </p>
                  </td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoTipoOptions, d.tipo) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ formatValorDescuentoCelda(d) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoAplicacionOptions, d.aplicacion) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoActivacionOptions, d.tipo_activacion) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ descuentoExtraActivacion(d) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d.fecha_inicio }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d.fecha_fin }}</td>
                  <td class="px-2 py-2 align-middle text-center text-xs text-slate-600">{{ descuentoAcumulacionSiNo(d) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">
                    <span v-if="d.productos?.length">{{ d.productos.length }} producto(s)</span>
                    <span v-else>Todos</span>
                  </td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d.status_text ?? d.tipo_activacion_text ?? d.tipo_activacion }}</td>
                  <td class="px-2 py-2 align-middle text-right">
                    <button
                      v-if="d.status === 1"
                      type="button"
                      class="rounded border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      :disabled="descuentoActionLoading === d.id"
                      @click="aprobarDescuentoDesdeForm(d)"
                    >
                      {{ descuentoActionLoading === d.id ? '…' : 'Aprobar' }}
                    </button>
                    <span v-else class="text-xs text-slate-400">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="mt-2 rounded-lg border border-dashed border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            Sin descuentos asociados a esta lista.
          </p>
        </div>

        <!-- Alta: una fila editable en tabla (como líneas de precio) -->
        <div class="mt-4 rounded-lg border border-black/10 bg-white shadow-sm">
          <p class="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Definir descuento</p>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[960px] border-collapse text-left text-sm" aria-label="Formulario nuevo descuento">
              <thead class="bg-slate-50">
                <tr class="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[10rem]">Nombre *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[6.5rem]">Tipo *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[6.5rem]">Valor *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[7rem]">Aplicación *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[8rem]">Activación *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[7rem]">Días / código *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[6.5rem]">Desde *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 min-w-[6.5rem]">Hasta *</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2 w-16 text-center" title="Permite acumulación con otros descuentos">Acum.</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-100 align-top">
                  <td class="px-2 py-2 align-middle">
                    <FormInput v-model="descuentoDraft.nombre" label="" placeholder="Ej: Pronto pago 10%" maxlength="255" />
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormSelect v-model="descuentoDraft.tipo" label="" :options="descuentoTipoOptions" />
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormInput v-model="descuentoDraft.valor" label="" type="number" min="0" step="0.01" placeholder="0" />
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormSelect v-model="descuentoDraft.aplicacion" label="" :options="descuentoAplicacionOptions" />
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormSelect v-model="descuentoDraft.tipo_activacion" label="" :options="descuentoActivacionOptions" />
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormInput
                      v-if="descuentoDraft.tipo_activacion === 'pago_anticipado'"
                      v-model="descuentoDraft.dias_anticipacion"
                      label=""
                      type="number"
                      min="1"
                      placeholder="Días"
                    />
                    <FormInput
                      v-else-if="descuentoDraft.tipo_activacion === 'codigo_promocional'"
                      v-model="descuentoDraft.codigo_descuento"
                      label=""
                      placeholder="Código"
                      maxlength="50"
                    />
                    <span v-else class="block py-2 text-center text-xs text-slate-400">—</span>
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormInput v-model="descuentoDraft.fecha_inicio" label="" type="date" />
                  </td>
                  <td class="px-2 py-2 align-middle">
                    <FormInput v-model="descuentoDraft.fecha_fin" label="" type="date" />
                  </td>
                  <td class="px-2 py-2 align-middle text-center">
                    <input
                      v-model="descuentoDraft.permite_acumulacion"
                      type="checkbox"
                      class="rounded border-slate-300 text-[#213360] focus:ring-blue-500"
                      aria-label="Permite acumulación con otros descuentos"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="space-y-3 border-t border-slate-100 px-3 py-3">
            <FormSelect
              v-model="descuentoDraft.descuentoAlcanceProductos"
              label="Alcance del descuento sobre productos LP *"
              :options="descuentoAlcanceProductosSelectOptions"
              span="full"
            />
            <p class="-mt-1 text-xs text-slate-500">{{ textoHintAlcanceDescuento }}</p>
            <template v-if="descuentoDraft.descuentoAlcanceProductos === 'seleccion'">
              <FormCheckboxGroup
                v-if="descuentoProductoCheckboxOptions.length"
                v-model="descuentoDraft.producto_ids"
                span="full"
                label="Productos de esta lista *"
                search-placeholder="Buscar producto…"
                :options="descuentoProductoCheckboxOptions"
              />
              <p
                v-else
                class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                Añade al menos un producto con precio en el paso 2 para poder limitar el descuento a ítems concretos de esta lista.
              </p>
            </template>
          </div>
          <div class="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-3">
            <button
              v-if="!editingLista"
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="encolarDescuento"
            >
              Añadir a la cola
            </button>
            <button
              v-else
              type="button"
              :disabled="descuentoRegistroLoading || !editingLista?.id"
              class="rounded-lg bg-[#213360] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="registrarDescuentoEnLista"
            >
              {{ descuentoRegistroLoading ? 'Registrando…' : 'Registrar descuento en esta lista' }}
            </button>
          </div>
        </div>
      </div>
        </section>

        <!-- Error general -->
        <div v-if="formError" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <p class="font-medium">{{ formError }}</p>
          <ul v-if="Object.keys(fieldErrors).length" class="mt-1 list-inside list-disc space-y-0.5">
            <li v-for="(msgs, field) in fieldErrors" :key="field">
              <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
            </li>
          </ul>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="closeListaFormModal"
        >Cancelar</button>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            v-if="formWizardStep > 1"
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="wizardPrev"
          >
            ← Anterior
          </button>
          <button
            v-if="formWizardStep < 3"
            type="button"
            class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="wizardNext"
          >
            Siguiente →
          </button>
          <button
            v-if="formWizardStep === 3"
            type="button"
            :disabled="formLoading || form.poblaciones.length === 0"
            class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="submitForm"
          >
            <span v-if="formLoading">Guardando...</span>
            <span v-else>{{ editingLista ? 'Guardar cambios' : 'Crear lista' }}</span>
          </button>
        </div>
      </div>
    </template>
  </ModalBase>

  <!-- ══ Modal: Detalle ═════════════════════════════════════════════════════════
       Muestra info completa + precios de productos + acciones del ciclo de vida -->
  <ModalBase v-model="showDetailModal" title="Detalle de lista de precios" size="xl">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <div v-if="detailLista" class="max-h-[72vh] overflow-y-auto pb-4">

      <!-- Info general -->
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 text-base font-semibold text-slate-900">{{ detailLista.nombre }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Código</dt>
          <dd class="mt-0.5">
            <code v-if="detailLista.codigo" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">{{ detailLista.codigo }}</code>
            <span v-else class="text-slate-400">—</span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado actual</dt>
          <dd class="mt-0.5">
            <StatusBadge
              :label="detailLista.status_text ?? statusLabel(detailLista.status)"
              :variant="statusBadgeVariant(detailLista.status)"
            />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Vigencia inicio</dt>
          <dd class="mt-0.5 font-medium text-slate-900">{{ detailLista.fecha_inicio ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Vigencia fin</dt>
          <dd class="mt-0.5 font-medium text-slate-900">{{ detailLista.fecha_fin ?? '—' }}</dd>
        </div>
        <div v-if="detailLista.descripcion" class="col-span-2">
          <dt class="font-medium text-slate-500">Descripción</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailLista.descripcion }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Creado</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailLista.created_at ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Modificado</dt>
          <dd class="mt-0.5 text-slate-700">{{ detailLista.updated_at ?? '—' }}</dd>
        </div>
        <div v-if="detailLista.deleted_at" class="col-span-2">
          <dt class="font-medium text-red-500">Eliminada el</dt>
          <dd class="mt-0.5 text-red-700">{{ detailLista.deleted_at }}</dd>
        </div>
      </dl>

      <!-- Poblaciones -->
      <div class="mt-5">
        <p class="text-sm font-medium text-slate-500">Regiones / Poblaciones</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="pob in (detailLista.poblaciones ?? [])"
            :key="pob.id"
            class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
          >{{ pob.nombre }}</span>
          <span v-if="!(detailLista.poblaciones?.length)" class="text-sm text-slate-400">Sin poblaciones asignadas</span>
        </div>
      </div>

      <!-- Flujo de estado -->
      <div v-if="!detailLista.deleted_at" class="mt-5 rounded-lg border border-black/10 bg-slate-50 p-4">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Ciclo de vida</p>
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-for="step in STATUS_STEPS"
            :key="step.value"
            class="flex items-center gap-2"
          >
            <span
              class="rounded-full px-3 py-1 text-xs font-medium"
              :class="detailLista.status === step.value
                ? step.activeClass
                : 'bg-slate-100 text-slate-400'"
            >
              {{ step.label }}
            </span>
            <span v-if="step.value < 3" class="text-slate-300 text-xs">→</span>
          </span>
        </div>

        <!-- Botones de transición -->
        <div class="mt-4 flex flex-wrap gap-2">
          <!-- Aprobar: solo desde En Proceso -->
          <button
            v-if="detailLista.status === 1 && canAprobar"
            type="button"
            :disabled="actionLoading"
            class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openAprobar(detailLista)"
          >
            <NavIcon name="check" class="size-3.5" />
            Aprobar lista
          </button>
          <!-- Activar: solo desde Aprobada -->
          <button
            v-if="detailLista.status === 2 && canAprobar"
            type="button"
            :disabled="actionLoading"
            class="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
            @click="openActivar(detailLista)"
          >
            <NavIcon name="check" class="size-3.5" />
            Activar lista
          </button>
          <!-- Inactivar: desde cualquier estado activo -->
          <button
            v-if="[1, 2, 3].includes(detailLista.status) && canInactivar"
            type="button"
            :disabled="actionLoading"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openInactivar(detailLista)"
          >
            <NavIcon name="close" class="size-3.5" />
            Inactivar
          </button>
        </div>
      </div>

      <!-- ── Precios de productos ─────────────────────────────────────────────── -->
      <div class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-900">Precios de productos</p>
          <button
            v-if="canAddPrecio && !detailLista.deleted_at && [1, 2].includes(detailLista.status)"
            type="button"
            class="flex items-center gap-1 rounded-lg bg-[#213360] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="openPrecioCreate"
          >
            <NavIcon name="plus" class="size-3.5" /> Agregar producto
          </button>
        </div>

        <div v-if="preciosLoading" class="py-6 text-center text-sm text-slate-400">Cargando precios...</div>
        <div v-else-if="!detailPrecios.length" class="rounded-lg border border-dashed border-black/20 bg-slate-50 py-8 text-center">
          <p class="text-sm text-slate-500">Sin precios cargados.</p>
          <p v-if="[1, 2].includes(detailLista.status)" class="mt-1 text-xs text-slate-400">Agrega un producto con su precio para continuar el proceso.</p>
        </div>

        <div v-else class="overflow-hidden rounded-lg border border-black/10">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Producto</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Valor total</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Matrícula</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Cuotas</th>
                <th class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Vlr. cuota</th>
                <th class="w-16 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-black/5">
              <tr v-for="precio in detailPrecios" :key="precio.id" class="hover:bg-slate-50">
                <td class="px-3 py-2.5">
                  <p class="font-medium text-slate-900">{{ precio.producto?.nombre ?? '—' }}</p>
                  <p class="text-xs text-slate-500">
                    {{ precio.producto?.tipo_producto?.nombre ?? '' }}
                    <span v-if="precio.producto?.tipo_producto?.es_financiable" class="ml-1 rounded bg-emerald-100 px-1 py-0.5 text-xs text-emerald-700">Financiable</span>
                  </p>
                </td>
                <td class="px-3 py-2.5 text-right font-medium text-slate-900">{{ formatCOP(precio.precio_contado) }}</td>
                <td class="px-3 py-2.5 text-right text-slate-700">{{ formatCOP(precio.matricula) }}</td>
                <td class="px-3 py-2.5 text-right text-slate-700">{{ precio.numero_cuotas ?? '—' }}</td>
                <td class="px-3 py-2.5 text-right text-slate-700">{{ precio.valor_cuota ? formatCOP(precio.valor_cuota) : '—' }}</td>
                <td class="px-3 py-2.5 text-right">
                  <div class="flex justify-end gap-1">
                    <button
                      v-if="canEditPrecio && [1, 2].includes(detailLista.status)"
                      type="button"
                      class="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Editar precio"
                      @click="openPrecioEdit(precio)"
                    >
                      <NavIcon name="pencil" class="size-3.5" />
                    </button>
                    <button
                      v-if="canDeletePrecio && [1, 2].includes(detailLista.status)"
                      type="button"
                      class="rounded p-1 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      title="Quitar de la lista"
                      @click="openEliminarPrecio(precio)"
                    >
                      <NavIcon name="close" class="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Descuentos vinculados (detalle) -->
        <div class="mt-6 border-t border-black/10 pt-5">
          <p class="mb-2 text-sm font-semibold text-slate-900">Descuentos vinculados</p>
          <div v-if="detailDescuentosLoading" class="py-4 text-center text-xs text-slate-400">Cargando descuentos…</div>
          <div v-else-if="detailDescuentos.length" class="overflow-x-auto rounded-lg border border-black/10 bg-white shadow-sm">
            <table class="w-full min-w-[880px] border-collapse text-left text-sm" aria-label="Descuentos del detalle de lista">
              <thead class="sticky top-0 z-[1] bg-slate-100 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
                <tr class="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 w-10">#</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[9rem]">Nombre</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[5.5rem]">Tipo</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[5.5rem]">Valor</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6.5rem]">Aplicación</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[7rem]">Activación</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Extra</th>
                  <th scope="col" class="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(d, di) in detailDescuentos"
                  :key="d.id"
                  class="border-b border-slate-100 align-top transition-colors hover:bg-slate-50/90"
                >
                  <td class="px-2 py-2 align-middle text-xs font-medium text-slate-500">{{ di + 1 }}</td>
                  <td class="px-2 py-2 align-middle font-medium text-slate-900">{{ d.nombre }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoTipoOptions, d.tipo) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ formatValorDescuentoCelda(d) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoAplicacionOptions, d.aplicacion) }}</td>
                  <td class="px-2 py-2 align-middle text-slate-700">{{ labelDescuentoOption(descuentoActivacionOptions, d.tipo_activacion) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ descuentoExtraActivacion(d) }}</td>
                  <td class="px-2 py-2 align-middle text-xs text-slate-600">{{ d.status_text ?? '' }}<template v-if="d.tipo_activacion_text || d.tipo_activacion"><span class="text-slate-400"> · </span>{{ d.tipo_activacion_text ?? d.tipo_activacion }}</template></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="rounded-lg border border-dashed border-slate-200 bg-slate-50 py-4 text-center text-xs text-slate-500">
            Sin descuentos asociados a esta lista.
          </p>
        </div>
      </div>
    </div>
  </ModalBase>

  <!-- ══ Modal: Precio de producto (crear / editar) ════════════════════════════ -->
  <ModalBase
    v-model="showPrecioModal"
    :title="editingPrecio ? 'Editar precio de producto' : 'Agregar producto a la lista'"
    :description="editingPrecio
      ? 'Modifica los valores de precio para este producto.'
      : 'Selecciona un producto del catálogo y define su precio en esta lista.'"
    size="lg"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="financiero" class="size-5" />
      </span>
    </template>

    <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitPrecio">
      <!-- Selector de producto -->
      <div v-if="!editingPrecio">
        <FormSelect
          v-model="precioForm.producto_id"
          label="Producto *"
          placeholder="Seleccione producto"
          :options="productosDisponiblesOptions"
          :required="true"
          span="full"
          :error="precioFieldErrors.producto_id?.[0]"
        />
        <p v-if="productosLoading" class="mt-1 text-xs text-slate-400">Cargando productos...</p>
      </div>
      <div v-else class="rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <p class="font-medium text-slate-700">{{ editingPrecio.producto?.nombre }}</p>
        <p class="text-xs text-slate-500">{{ editingPrecio.producto?.tipo_producto?.nombre }}</p>
      </div>

      <!-- Info financiabilidad -->
      <div v-if="productoSeleccionado" class="flex items-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-3 py-2">
        <span
          class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
          :class="productoSeleccionado.tipo_producto?.es_financiable
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-slate-100 text-slate-600'"
        >
          {{ productoSeleccionado.tipo_producto?.es_financiable ? 'Financiable — habilita campos de cuotas' : 'No financiable — solo valor total' }}
        </span>
      </div>

      <!-- Campos de precio -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          v-model="precioForm.precio_contado"
          label="Valor total *"
          type="number"
          min="0"
          placeholder="0"
          hint="Fijo al definirlo: matrícula + total financiado. Al salir se reparte en esos dos campos (financiable)."
          :required="true"
          :error="precioFieldErrors.precio_contado?.[0]"
          @blur="onBlurPrecioFormContado"
        />
        <FormInput
          v-model="precioForm.matricula"
          label="Matrícula *"
          type="number"
          min="0"
          placeholder="0"
          hint="Máximo igual al valor total. Si es financiable: al salir se recalcula el total financiado (valor total − matrícula)."
          :required="true"
          :error="precioFieldErrors.matricula?.[0]"
          @blur="onBlurPrecioFormMatricula"
        />

        <!-- Solo para financiables -->
        <template v-if="precioEsFinanciable">
          <FormInput
            v-model="precioForm.precio_total"
            label="Precio total financiado *"
            type="number"
            min="0"
            placeholder="0"
            hint="No mayor al valor total − matrícula. Al salir se ajusta la matrícula para cuadrar el valor total (no se cambia el valor total)."
            :required="true"
            :error="precioFieldErrors.precio_total?.[0]"
            @blur="onBlurPrecioFormPrecioTotal"
          />
          <FormInput
            v-model="precioForm.numero_cuotas"
            label="Número de cuotas *"
            type="number"
            min="1"
            step="1"
            placeholder="Ej: 6"
            hint="Entero ≥ 1 (no se admite 0 ni negativos)."
            :required="true"
            :error="precioFieldErrors.numero_cuotas?.[0]"
          />
          <p
            v-if="
              precioForm.precio_contado !== '' &&
                precioForm.matricula !== '' &&
                precioForm.precio_total !== '' &&
                !preciosFinanciablesCoherentes(
                  precioForm.precio_contado,
                  precioForm.matricula,
                  precioForm.precio_total
                )
            "
            class="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900"
          >
            El valor total debe coincidir con matrícula + precio total financiado. Pasa el foco por matrícula o total para recalcular sin cambiar el valor total.
          </p>
          <!-- Valor cuota calculado (read-only) -->
          <div class="flex flex-col gap-2 sm:col-span-2">
            <label class="text-sm font-medium text-slate-900">Valor cuota <span class="text-slate-400 font-normal">(calculado)</span></label>
            <div class="rounded-lg border-0 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
              {{ valorCuotaCalculado !== null ? formatCOP(valorCuotaCalculado) : '—' }}
            </div>
            <p class="text-xs text-slate-500">Calculado: redondear₁₀₀((precio_total − matrícula) / cuotas). El servidor recalcula automáticamente.</p>
          </div>
        </template>
      </div>

      <FormTextarea
        v-model="precioForm.observaciones"
        label="Observaciones"
        placeholder="Notas sobre este precio..."
        :rows="2"
        :error="precioFieldErrors.observaciones?.[0]"
      />

      <!-- Error general -->
      <div v-if="precioFormError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
        <p class="font-medium">{{ precioFormError }}</p>
        <ul v-if="Object.keys(precioFieldErrors).length" class="mt-1 list-inside list-disc space-y-0.5">
          <li v-for="(msgs, field) in precioFieldErrors" :key="field">
            <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
          </li>
        </ul>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="showPrecioModal = false"
      >Cancelar</button>
      <button
        type="button"
        :disabled="precioLoading"
        class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="submitPrecio"
      >
        <span v-if="precioLoading">Guardando...</span>
        <span v-else>{{ editingPrecio ? 'Guardar cambios' : 'Agregar precio' }}</span>
      </button>
    </template>
  </ModalBase>

  <!-- ══ Modal: Confirmar Aprobar ═══════════════════════════════════════════════ -->
  <ModalBase v-model="showAprobarModal" title="Aprobar lista de precios" description="Cambia el estado a Aprobada. Se podrá activar posteriormente.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas la aprobación de <strong>{{ targetLista?.nombre }}</strong>?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        Una vez aprobada, la lista puede ser activada manual o automáticamente al llegar su <code>fecha_inicio</code>.
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showAprobarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="confirmAprobar">
        {{ actionLoading ? 'Aprobando...' : 'Aprobar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ══ Modal: Confirmar Activar ═══════════════════════════════════════════════ -->
  <ModalBase v-model="showActivarModal" title="Activar lista de precios" description="Cambia el estado a Activa. Comenzará a aplicar en cobros y matrículas.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas la activación de <strong>{{ targetLista?.nombre }}</strong>?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        Solo puede haber una lista activa por población y período. El sistema detectará solapamientos.
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showActivarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500" @click="confirmActivar">
        {{ actionLoading ? 'Activando...' : 'Activar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ══ Modal: Confirmar Inactivar ════════════════════════════════════════════ -->
  <ModalBase v-model="showInactivarModal" title="Inactivar lista de precios" description="Cambia el estado a Inactiva. No se podrá reactivar automáticamente.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Confirmas la inactivación de <strong>{{ targetLista?.nombre }}</strong>?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        La lista dejará de aplicar para nuevos cobros inmediatamente.
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showInactivarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-500" @click="confirmInactivar">
        {{ actionLoading ? 'Inactivando...' : 'Inactivar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ══ Modal: Eliminar lista ══════════════════════════════════════════════════ -->
  <ModalBase v-model="showEliminarModal" title="Eliminar lista de precios" description="Esta acción moverá la lista a la papelera (soft delete).">
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Eliminar <strong>{{ targetLista?.nombre }}</strong>?
      </p>
      <p class="mt-2 text-xs text-slate-500">
        Si la lista tiene precios o recibos vinculados, la eliminación puede fallar.
      </p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showEliminarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500" @click="confirmEliminar">
        {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ══ Modal: Eliminar precio ═════════════════════════════════════════════════ -->
  <ModalBase v-model="showEliminarPrecioModal" title="Quitar producto de la lista" description="Elimina este precio de la lista. El producto del catálogo no se verá afectado.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">
        ¿Quitar <strong>{{ targetPrecio?.producto?.nombre }}</strong> de esta lista?
      </p>
      <div v-if="precioActionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ precioActionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showEliminarPrecioModal = false">Cancelar</button>
      <button type="button" :disabled="precioActionLoading" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500" @click="confirmEliminarPrecio">
        {{ precioActionLoading ? 'Quitando...' : 'Quitar' }}
      </button>
    </template>
  </ModalBase>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import StatCard       from '@/components/dashboard/StatCard.vue'
import DataTable      from '@/components/activos/DataTable.vue'
import SectionHeader  from '@/components/activos/SectionHeader.vue'
import StatusBadge    from '@/components/activos/StatusBadge.vue'
import FormInput      from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect     from '@/components/forms/FormSelect.vue'
import FormTextarea   from '@/components/forms/FormTextarea.vue'
import FormCheckboxGroup from '@/components/forms/FormCheckboxGroup.vue'
import NavIcon        from '@/components/icons/NavIcon.vue'
import ModalBase      from '@/components/ModalBase.vue'
import listaPrecioService  from '@/services/listaPrecioService.js'
import precioProductoService from '@/services/precioProductoService.js'
import productoLpService  from '@/services/productoLpService.js'
import descuentoService   from '@/services/descuentoService.js'
import tipoProductoService from '@/services/tipoProductoService.js'
import cursoService       from '@/services/cursoService.js'
import moduloService      from '@/services/moduloService.js'
import { usePoblacionSelector } from '@/composables/usePoblacion.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess, warning: notifyWarning } = useNotification()
const { poblacionesOptions, poblacionesLoading, loadPoblaciones } = usePoblacionSelector()

// ─── Ciclo de vida de estado ──────────────────────────────────────────────────
const STATUS_STEPS = [
  { value: 1, label: 'En Proceso',  activeClass: 'bg-amber-100 text-amber-800 font-semibold' },
  { value: 2, label: 'Aprobada',    activeClass: 'bg-blue-100 text-blue-800 font-semibold' },
  { value: 3, label: 'Activa',      activeClass: 'bg-green-100 text-green-800 font-semibold' },
]

function statusLabel(status) {
  return { 0: 'Inactiva', 1: 'En Proceso', 2: 'Aprobada', 3: 'Activa' }[status] ?? '—'
}

function statusBadgeVariant(status) {
  return { 0: 'inactivo', 1: 'mantenimiento', 2: 'disponible', 3: 'activo' }[status] ?? 'inactivo'
}

function formatCOP(val) {
  if (val == null || val === '') return '—'
  const num = parseFloat(val)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(num)
}

/** Etiqueta legible para selects de descuento (tablas paso 3 / detalle). */
function labelDescuentoOption(options, value) {
  if (value == null || value === '') return '—'
  const o = options.find((x) => x.value === value)
  return o?.label ?? String(value)
}

function formatValorDescuentoCelda(d) {
  const v = d?.valor
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  if (d?.tipo === 'porcentual' && Number.isFinite(n)) return `${n}%`
  if (Number.isFinite(n)) return formatCOP(n)
  return '—'
}

function descuentoExtraActivacion(o) {
  const ta = o?.tipo_activacion
  if (ta === 'pago_anticipado') {
    const di = o.dias_anticipacion
    if (di != null && di !== '') return `${di} días`
    return '—'
  }
  if (ta === 'codigo_promocional') return o.codigo_descuento?.trim() || '—'
  return '—'
}

function descuentoAcumulacionSiNo(o) {
  return o?.permite_acumulacion ? 'Sí' : 'No'
}

/** Tolerancia (COP): valor total (precio_contado) = matrícula + total financiado */
const PRECIO_COHERENCIA_TOL = 0.5

function parseMontoCampo(v) {
  if (v === '' || v == null) return NaN
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function montoCampoAString(n) {
  if (!Number.isFinite(n)) return ''
  return String(Math.round(n))
}

/** Cumple valor total ≈ matrícula + precio total financiado (producto financiable). */
function preciosFinanciablesCoherentes(contado, matricula, precioTotal) {
  const c = parseMontoCampo(contado)
  const m = parseMontoCampo(matricula)
  const t = parseMontoCampo(precioTotal)
  if (!Number.isFinite(c) || !Number.isFinite(m) || !Number.isFinite(t)) return true
  return Math.abs(c - (m + t)) <= PRECIO_COHERENCIA_TOL
}

/** Mensaje vacío si OK; texto de error si no cumple o faltan números. */
function mensajeCoherenciaPreciosFinanciable(contado, matricula, precioTotal) {
  const c = parseMontoCampo(contado)
  const m = parseMontoCampo(matricula)
  const t = parseMontoCampo(precioTotal)
  if (!Number.isFinite(c) || !Number.isFinite(m) || !Number.isFinite(t)) {
    return 'Indica valores numéricos en valor total, matrícula y precio total financiado.'
  }
  if (Math.abs(c - (m + t)) <= PRECIO_COHERENCIA_TOL) return ''
  return `El valor total debe ser igual a matrícula + precio total financiado (${formatCOP(m)} + ${formatCOP(t)} = ${formatCOP(m + t)}; valor total indicado ${formatCOP(c)}).`
}

/**
 * Valor total (precio_contado) fijo: 0 ≤ matrícula ≤ valor total; total financiado = valor total − matrícula.
 * Al salir de valor total o matrícula.
 */
function sincronizarPrecioTotalDesdeContadoYMatricula(target) {
  const c = parseMontoCampo(target.precio_contado)
  if (!Number.isFinite(c) || c < 0) return
  let m = parseMontoCampo(target.matricula)
  if (!Number.isFinite(m)) m = 0
  m = Math.min(Math.max(0, m), c)
  target.matricula = montoCampoAString(m)
  target.precio_total = montoCampoAString(c - m)
}

/**
 * Valor total fijo: 0 ≤ total financiado ≤ valor total; matrícula = valor total − total (nunca se altera precio_contado).
 * Al salir del total financiado.
 */
function sincronizarMatriculaDesdeContadoYTotal(target) {
  const c = parseMontoCampo(target.precio_contado)
  if (!Number.isFinite(c) || c < 0) return
  let t = parseMontoCampo(target.precio_total)
  if (!Number.isFinite(t)) t = 0
  t = Math.min(Math.max(0, t), c)
  target.precio_total = montoCampoAString(t)
  target.matricula = montoCampoAString(c - t)
}

function onBlurLineaPrecioContado(line) {
  if (formLineEsFinanciable(line)) sincronizarPrecioTotalDesdeContadoYMatricula(line)
}
function onBlurLineaMatricula(line) {
  if (formLineEsFinanciable(line)) sincronizarPrecioTotalDesdeContadoYMatricula(line)
}
function onBlurLineaPrecioTotal(line) {
  if (formLineEsFinanciable(line)) sincronizarMatriculaDesdeContadoYTotal(line)
}

function onBlurPrecioFormContado() {
  if (precioEsFinanciable.value) sincronizarPrecioTotalDesdeContadoYMatricula(precioForm)
}
function onBlurPrecioFormMatricula() {
  if (precioEsFinanciable.value) sincronizarPrecioTotalDesdeContadoYMatricula(precioForm)
}
function onBlurPrecioFormPrecioTotal() {
  if (precioEsFinanciable.value) sincronizarMatriculaDesdeContadoYTotal(precioForm)
}

function precioFinanciableLineaCoherente(line) {
  if (!formLineEsFinanciable(line)) return true
  if (line.precio_contado === '' || line.matricula === '' || line.precio_total === '') return true
  return preciosFinanciablesCoherentes(line.precio_contado, line.matricula, line.precio_total)
}

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCreate    = ref(true)
const canEdit      = ref(true)
const canDelete    = ref(true)
const canAprobar   = ref(true)
const canInactivar = ref(true)
const canAddPrecio    = ref(true)
const canEditPrecio   = ref(true)
const canDeletePrecio = ref(true)

// ─── Elaboración lista: precios + descuentos (mismo modal crear/editar) ─────
const formPrecioLines = ref([])
const initialPrecioIds = ref([])
/** Filtro del catálogo LP y selects del paso 2 */
const productosStep2Filter = ref('')
const productosLoadError = ref('')

const descuentosPendientes = ref([])
const descuentosLista = ref([])
const descuentosLoading = ref(false)
const descuentoRegistroLoading = ref(false)
const descuentoActionLoading = ref(null)

const descuentoDraft = reactive({
  nombre: '',
  tipo: 'porcentual',
  valor: '',
  aplicacion: 'valor_total',
  tipo_activacion: 'pago_anticipado',
  dias_anticipacion: '15',
  codigo_descuento: '',
  fecha_inicio: '',
  fecha_fin: '',
  permite_acumulacion: false,
  /** 'todos' = sin array productos (aplica a todo el catálogo en la lista); 'seleccion' = payload.productos */
  descuentoAlcanceProductos: 'todos',
  producto_ids: []
})

const descuentoTipoOptions = [
  { value: 'porcentual', label: 'Porcentual' },
  { value: 'valor_fijo', label: 'Valor fijo' }
]
const descuentoAplicacionOptions = [
  { value: 'valor_total', label: 'Valor total' },
  { value: 'matricula', label: 'Matrícula' },
  { value: 'cuota', label: 'Cuota' }
]
const descuentoActivacionOptions = [
  { value: 'pago_anticipado', label: 'Pago anticipado' },
  { value: 'promocion_matricula', label: 'Promoción matrícula' },
  { value: 'codigo_promocional', label: 'Código promocional' }
]

const descuentoAlcanceProductosOptions = [
  {
    value: 'todos',
    label: 'Todos los productos de la lista',
    hint: 'No se envía filtro por producto; el descuento aplica a cualquier ítem LP de las listas enlazadas.'
  },
  {
    value: 'seleccion',
    label: 'Solo productos LP seleccionados',
    hint: 'Equivale a enviar productos: [id, …] en la API. Elige entre los productos con precio definido en el paso 2.'
  }
]

const descuentoAlcanceProductosSelectOptions = computed(() =>
  descuentoAlcanceProductosOptions.map((o) => ({ value: o.value, label: o.label }))
)

const textoHintAlcanceDescuento = computed(() => {
  const o = descuentoAlcanceProductosOptions.find((x) => x.value === descuentoDraft.descuentoAlcanceProductos)
  return o?.hint ?? ''
})

const quickProductOpen = ref(false)
const quickTipoProductoId = ref('')
const quickRefTipo = ref('curso')
const quickRefId = ref('')
const quickNombre = ref('')
const quickProductLoading = ref(false)
const tiposProductoOptions = ref([])
const cursosOptions = ref([])
const modulosOptions = ref([])

const referenciaTipoOptions = [
  { value: 'curso', label: 'Curso' },
  { value: 'modulo', label: 'Módulo' }
]

function newPrecioLineKey() {
  return `lp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyPrecioLine() {
  return {
    _key: newPrecioLineKey(),
    precioId: null,
    producto_id: '',
    precio_contado: '',
    matricula: '',
    precio_total: '',
    numero_cuotas: '',
    observaciones: ''
  }
}

/** Añade una fila de precio con un producto del catálogo ya elegido */
function addPrecioLineForProducto(productoId) {
  const id = Number(productoId)
  if (!id) return
  const ya = formPrecioLines.value.some((l) => Number(l.producto_id) === id)
  if (ya) {
    notifyWarning('Ese producto ya tiene una fila en esta elaboración.')
    return
  }
  const line = emptyPrecioLine()
  line.producto_id = id
  formPrecioLines.value.push(line)
}

function removeFormPrecioLine(idx) {
  formPrecioLines.value.splice(idx, 1)
}

function formLineEsFinanciable(line) {
  const id = Number(line.producto_id)
  if (!id) return false
  const p = productos.value.find((x) => x.id === id)
  return p?.tipo_producto?.es_financiable === true
}

const productosCatalogFiltrados = computed(() => {
  const q = productosStep2Filter.value.trim().toLowerCase()
  let list = productos.value
  if (q) {
    list = list.filter(
      (p) =>
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.codigo && String(p.codigo).toLowerCase().includes(q))
    )
  }
  return [...list].sort((a, b) => String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es'))
})

function valorCuotaPreviewLine(line) {
  if (!formLineEsFinanciable(line)) return '—'
  const total = parseFloat(line.precio_total)
  const mat = parseFloat(line.matricula || 0)
  const cuotas = parseInt(line.numero_cuotas, 10)
  if (!total || !cuotas || isNaN(total) || isNaN(cuotas) || cuotas <= 0) return '—'
  const v = Math.round((total - mat) / cuotas / 100) * 100
  return formatCOP(v)
}

const productoIdsParaDescuento = computed(() => {
  const ids = formPrecioLines.value
    .map((l) => (l.producto_id ? Number(l.producto_id) : null))
    .filter(Boolean)
  return [...new Set(ids)]
})

function labelProducto(id) {
  const p = productos.value.find((x) => x.id === id)
  return p ? p.nombre : `Producto #${id}`
}

function productoDetalleLinea(line) {
  const id = Number(line.producto_id)
  if (!id) return ''
  const p = productos.value.find((x) => x.id === id)
  if (!p) return ''
  const parts = []
  if (p.codigo) parts.push(`Código ${p.codigo}`)
  if (p.tipo_producto?.nombre) parts.push(String(p.tipo_producto.nombre))
  return parts.join(' · ')
}

const descuentoProductoCheckboxOptions = computed(() =>
  productoIdsParaDescuento.value.map((id) => ({ value: id, label: labelProducto(id) }))
)

function resetDescuentoDraft() {
  descuentoDraft.nombre = ''
  descuentoDraft.tipo = 'porcentual'
  descuentoDraft.valor = ''
  descuentoDraft.aplicacion = 'valor_total'
  descuentoDraft.tipo_activacion = 'pago_anticipado'
  descuentoDraft.dias_anticipacion = '15'
  descuentoDraft.codigo_descuento = ''
  descuentoDraft.fecha_inicio = ''
  descuentoDraft.fecha_fin = ''
  descuentoDraft.permite_acumulacion = false
  descuentoDraft.descuentoAlcanceProductos = 'todos'
  descuentoDraft.producto_ids = []
}

function textoAlcanceDescuentoPayload(payload) {
  if (Array.isArray(payload.productos) && payload.productos.length) {
    return `Solo ${payload.productos.length} producto(s) LP`
  }
  return 'Todos los productos de la lista'
}

function nombresProductosDescuento(d) {
  const list = d.productos ?? []
  if (!list.length) return ''
  const labels = list.slice(0, 3).map((p) => p.nombre ?? `#${p.id}`)
  const extra = list.length > 3 ? ` (+${list.length - 3})` : ''
  return labels.join(', ') + extra
}

/** Listas enlazadas al descuento (API puede devolver snake o camel). */
function listasDelDescuento(d) {
  return d.listas_precios ?? d.listasPrecios ?? []
}

watch(
  () => descuentoDraft.descuentoAlcanceProductos,
  (v) => {
    if (v === 'todos') descuentoDraft.producto_ids = []
  }
)

function validateDescuentoDraft() {
  if (!descuentoDraft.nombre?.trim()) return 'Indica el nombre del descuento.'
  if (descuentoDraft.valor === '' || descuentoDraft.valor == null) return 'Indica el valor del descuento.'
  if (!descuentoDraft.fecha_inicio || !descuentoDraft.fecha_fin) return 'Indica vigencia del descuento.'
  if (descuentoDraft.tipo_activacion === 'pago_anticipado') {
    const d = parseInt(descuentoDraft.dias_anticipacion, 10)
    if (!d || d < 1) return 'Indica días de anticipación (mínimo 1).'
  }
  if (descuentoDraft.tipo_activacion === 'codigo_promocional' && !descuentoDraft.codigo_descuento?.trim()) {
    return 'Indica el código promocional.'
  }
  if (descuentoDraft.descuentoAlcanceProductos === 'seleccion') {
    if (!descuentoDraft.producto_ids?.length) {
      return 'Selecciona al menos un producto LP o elige «Todos los productos de la lista».'
    }
  }
  return null
}

function buildDescuentoPayload(listaIds) {
  const payload = {
    nombre: descuentoDraft.nombre.trim(),
    tipo: descuentoDraft.tipo,
    valor: parseFloat(descuentoDraft.valor) || 0,
    aplicacion: descuentoDraft.aplicacion,
    tipo_activacion: descuentoDraft.tipo_activacion,
    permite_acumulacion: !!descuentoDraft.permite_acumulacion,
    fecha_inicio: descuentoDraft.fecha_inicio,
    fecha_fin: descuentoDraft.fecha_fin
  }
  if (descuentoDraft.tipo_activacion === 'pago_anticipado') {
    payload.dias_anticipacion = parseInt(descuentoDraft.dias_anticipacion, 10) || 1
  }
  if (descuentoDraft.tipo_activacion === 'codigo_promocional') {
    payload.codigo_descuento = descuentoDraft.codigo_descuento.trim()
  }
  if (listaIds?.length) payload.listas_precios = listaIds
  if (descuentoDraft.descuentoAlcanceProductos === 'seleccion' && descuentoDraft.producto_ids?.length) {
    payload.productos = descuentoDraft.producto_ids.map((id) => Number(id)).filter((n) => !Number.isNaN(n) && n > 0)
  }
  return payload
}

function encolarDescuento() {
  formError.value = ''
  const err = validateDescuentoDraft()
  if (err) {
    formError.value = err
    return
  }
  const payload = buildDescuentoPayload([])
  descuentosPendientes.value.push({ ...payload, _alcanceTexto: textoAlcanceDescuentoPayload(payload) })
  resetDescuentoDraft()
  notifySuccess('Descuento añadido a la cola. Se creará al guardar la lista.')
}

async function registrarDescuentoEnLista() {
  if (!editingLista.value?.id) return
  formError.value = ''
  const err = validateDescuentoDraft()
  if (err) {
    formError.value = err
    return
  }
  descuentoRegistroLoading.value = true
  try {
    const payload = buildDescuentoPayload([editingLista.value.id])
    await descuentoService.create(payload, { _silent: true })
    resetDescuentoDraft()
    notifySuccess('Descuento registrado.')
    await loadDescuentosLista(editingLista.value.id)
  } catch (e) {
    formError.value = e?.response?.data?.message ?? 'No se pudo registrar el descuento.'
  } finally {
    descuentoRegistroLoading.value = false
  }
}

async function aprobarDescuentoDesdeForm(d) {
  descuentoActionLoading.value = d.id
  try {
    await descuentoService.aprobar(d.id)
    notifySuccess('Descuento aprobado.')
    await loadDescuentosLista(editingLista.value.id)
  } catch (e) {
    formError.value = e?.response?.data?.message ?? 'No se pudo aprobar el descuento.'
  } finally {
    descuentoActionLoading.value = null
  }
}

async function loadDescuentosLista(listaId) {
  if (!listaId) {
    descuentosLista.value = []
    return
  }
  descuentosLoading.value = true
  try {
    const res = await descuentoService.getAll({
      relations: 'listasPrecios,productos',
      per_page: 200,
      sort_by: 'created_at',
      sort_direction: 'desc'
    })
    const all = res.data ?? []
    descuentosLista.value = all.filter((disc) =>
      listasDelDescuento(disc).some((lp) => lp.id === listaId)
    )
  } catch {
    descuentosLista.value = []
  } finally {
    descuentosLoading.value = false
  }
}

function validateFormPrecioLines() {
  for (let i = 0; i < formPrecioLines.value.length; i++) {
    const line = formPrecioLines.value[i]
    const hasProducto = !!line.producto_id
    const hasAny =
      hasProducto ||
      line.precio_contado !== '' ||
      line.matricula !== '' ||
      line.precio_total !== '' ||
      line.numero_cuotas !== '' ||
      (line.observaciones && line.observaciones.trim())
    if (!hasAny) continue
    if (!hasProducto) return `Línea ${i + 1}: selecciona un producto LP o vacía la fila.`
    if (line.precio_contado === '' || line.matricula === '') {
      return `Línea ${i + 1}: valor total y matrícula son obligatorios.`
    }
    if (formLineEsFinanciable(line)) {
      if (line.precio_total === '' || line.numero_cuotas === '' || line.numero_cuotas == null) {
        return `Línea ${i + 1}: producto financiable requiere precio total y número de cuotas.`
      }
      const nc = parseInt(String(line.numero_cuotas), 10)
      if (!Number.isFinite(nc) || nc < 1) {
        return `Línea ${i + 1}: el número de cuotas debe ser un entero mayor o igual a 1 (no 0).`
      }
      const coh = mensajeCoherenciaPreciosFinanciable(line.precio_contado, line.matricula, line.precio_total)
      if (coh) return `Línea ${i + 1}: ${coh}`
    }
  }
  return null
}

function buildPrecioPayloadForUpdate(line) {
  const payload = {
    precio_contado: parseFloat(line.precio_contado) || 0,
    matricula: parseFloat(line.matricula) || 0
  }
  if (formLineEsFinanciable(line)) {
    payload.precio_total = parseFloat(line.precio_total) || 0
    payload.numero_cuotas = parseInt(line.numero_cuotas, 10) || null
  }
  if (line.observaciones?.trim()) payload.observaciones = line.observaciones.trim()
  return payload
}

function buildPrecioPayloadForCreate(line, listaId) {
  return {
    ...buildPrecioPayloadForUpdate(line),
    lista_precio_id: listaId,
    producto_id: Number(line.producto_id)
  }
}

function extractListaIdFromResponse(body) {
  if (!body) return null
  return body.data?.id ?? body.id ?? null
}

async function crearPreciosTrasLista(listaId) {
  for (const line of formPrecioLines.value) {
    if (!line.producto_id) continue
    const hasAny =
      line.precio_contado !== '' ||
      line.matricula !== '' ||
      line.precio_total !== '' ||
      line.numero_cuotas !== '' ||
      (line.observaciones && line.observaciones.trim())
    if (!hasAny) continue
    await precioProductoService.create(buildPrecioPayloadForCreate(line, listaId), { _silent: true })
  }
}

async function syncPreciosLista(listaId) {
  const currentIds = new Set(
    formPrecioLines.value.filter((l) => l.precioId).map((l) => l.precioId)
  )
  for (const id of initialPrecioIds.value) {
    if (!currentIds.has(id)) {
      await precioProductoService.delete(id)
    }
  }
  for (const line of formPrecioLines.value) {
    if (!line.producto_id) continue
    const hasAny =
      line.precio_contado !== '' ||
      line.matricula !== '' ||
      line.precio_total !== '' ||
      line.numero_cuotas !== '' ||
      (line.observaciones && line.observaciones.trim())
    if (!hasAny) continue
    if (line.precioId) {
      await precioProductoService.update(line.precioId, buildPrecioPayloadForUpdate(line), { _silent: true })
    } else {
      await precioProductoService.create(buildPrecioPayloadForCreate(line, listaId), { _silent: true })
    }
  }
}

async function crearDescuentosTrasLista(listaId) {
  for (const raw of descuentosPendientes.value) {
    const { _alcanceTexto: _a, ...payload } = raw
    await descuentoService.create({ ...payload, listas_precios: [listaId] }, { _silent: true })
  }
  descuentosPendientes.value = []
}

async function loadPreciosParaFormulario(listaId) {
  formPrecioLines.value = []
  initialPrecioIds.value = []
  try {
    const res = await precioProductoService.getAll({
      lista_precio_id: listaId,
      with: 'producto.tipoProducto',
      per_page: 200
    })
    const rows = (res.data ?? []).map((p) => ({
      _key: newPrecioLineKey(),
      precioId: p.id,
      producto_id: p.producto_id,
      precio_contado: p.precio_contado != null ? String(p.precio_contado) : '',
      matricula: p.matricula != null ? String(p.matricula) : '',
      precio_total: p.precio_total != null ? String(p.precio_total) : '',
      numero_cuotas: p.numero_cuotas != null && p.numero_cuotas !== '' ? String(p.numero_cuotas) : '',
      observaciones: p.observaciones ?? ''
    }))
    formPrecioLines.value = rows
    initialPrecioIds.value = rows.map((r) => r.precioId).filter(Boolean)
    for (const pr of res.data ?? []) {
      const prod = pr.producto
      if (prod?.id && !productos.value.some((x) => x.id === prod.id)) {
        productos.value.push({
          ...prod,
          tipo_producto: prod.tipo_producto ?? prod.tipoProducto
        })
      }
    }
  } catch {
    formPrecioLines.value = []
  }
}

async function toggleQuickProduct() {
  quickProductOpen.value = !quickProductOpen.value
  if (quickProductOpen.value && !tiposProductoOptions.value.length) {
    await loadQuickRefs()
  }
}

async function loadQuickRefs() {
  try {
    const [tipos, cursos, modulos] = await Promise.all([
      tipoProductoService.getAll({ status: 1, per_page: 100, sort_by: 'nombre' }),
      cursoService.getAll({ status: 1, per_page: 100, sort_by: 'nombre', with: '' }),
      moduloService.getAll({ status: 1, per_page: 100, sort_by: 'nombre', with: '' })
    ])
    tiposProductoOptions.value = (tipos.data ?? []).map((t) => ({
      value: t.id,
      label: `${t.nombre}${t.es_financiable ? ' (financiable)' : ''}`
    }))
    cursosOptions.value = (cursos.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))
    modulosOptions.value = (modulos.data ?? []).map((m) => ({ value: m.id, label: m.nombre }))
  } catch {
    tiposProductoOptions.value = []
    cursosOptions.value = []
    modulosOptions.value = []
  }
}

async function crearProductoDesdeReferencia() {
  formError.value = ''
  if (!quickTipoProductoId.value) {
    formError.value = 'Selecciona un tipo de producto.'
    return
  }
  if (!quickRefId.value) {
    formError.value = quickRefTipo.value === 'curso' ? 'Selecciona un curso.' : 'Selecciona un módulo.'
    return
  }
  if (!quickNombre.value?.trim()) {
    formError.value = 'Indica el nombre del producto.'
    return
  }
  quickProductLoading.value = true
  try {
    const res = await productoLpService.create(
      {
        tipo_producto_id: Number(quickTipoProductoId.value),
        nombre: quickNombre.value.trim(),
        referencia_tipo: quickRefTipo.value,
        referencia_id: Number(quickRefId.value)
      },
      { _silent: true }
    )
    const nuevo = res.data ?? res
    if (nuevo?.id) {
      const merged = {
        ...nuevo,
        tipo_producto: nuevo.tipo_producto ?? nuevo.tipoProducto
      }
      if (!productos.value.some((p) => p.id === merged.id)) {
        productos.value.unshift(merged)
      }
    }
    notifySuccess('Producto creado en el catálogo LP.')
    quickNombre.value = ''
    quickRefId.value = ''
    await loadProductos(true)
  } catch (e) {
    formError.value = e?.response?.data?.message ?? 'No se pudo crear el producto.'
  } finally {
    quickProductLoading.value = false
  }
}

// ─── Filtros de estado ────────────────────────────────────────────────────────
const statusFilterOptions = [
  { value: '',  label: 'Todos' },
  { value: 1,   label: 'En Proceso' },
  { value: 2,   label: 'Aprobadas' },
  { value: 3,   label: 'Activas' },
  { value: 0,   label: 'Inactivas' },
]

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre',       label: 'Nombre' },
  { key: 'codigo',       label: 'Código' },
  { key: 'fecha_inicio', label: 'Desde' },
  { key: 'fecha_fin',    label: 'Hasta' },
  { key: 'status_text',  label: 'Estado' },
  { key: 'poblaciones',  label: 'Regiones' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const listas     = ref([])
const loading    = ref(false)
const error      = ref('')
const apiError   = ref('')
const viewTrashed = ref(false)

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats      = reactive({ total: 0, enProceso: 0, aprobadas: 0, activas: 0, inactivas: 0 })
const filters    = reactive({ search: '', status: '' })

// ─── Carga del listado ────────────────────────────────────────────────────────
async function loadListas(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value   = ''
  try {
    const params = {
      page,
      per_page:       pagination.perPage,
      sort_by:        'created_at',
      sort_direction: 'desc',
      with:           'poblaciones'
    }
    if (viewTrashed.value)    params.only_trashed = true
    if (filters.search)       params.search       = filters.search
    if (filters.status !== '') params.status       = filters.status

    const res = await listaPrecioService.getAll(params)
    listas.value = res.data ?? []
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
      apiError.value = 'El servicio de listas de precios no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar las listas de precios.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const [s1, s2, s3, s0, trash] = await Promise.all([
      listaPrecioService.getAll({ per_page: 1, status: 1 }),
      listaPrecioService.getAll({ per_page: 1, status: 2 }),
      listaPrecioService.getAll({ per_page: 1, status: 3 }),
      listaPrecioService.getAll({ per_page: 1, status: 0 }),
      listaPrecioService.getAll({ per_page: 1, only_trashed: true }),
    ])
    stats.enProceso = s1.meta?.total ?? 0
    stats.aprobadas = s2.meta?.total ?? 0
    stats.activas   = s3.meta?.total ?? 0
    stats.inactivas = s0.meta?.total ?? 0
    stats.total     = stats.enProceso + stats.aprobadas + stats.activas + stats.inactivas + (trash.meta?.total ?? 0)
  } catch {
    // Informativo
  }
}

// ─── Filtros / paginación ─────────────────────────────────────────────────────
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadListas(1), 400)
}

function toggleTrashed() { viewTrashed.value = !viewTrashed.value }
function goToPage(page) { if (page >= 1 && page <= pagination.lastPage) loadListas(page) }

watch(() => filters.status, () => loadListas(1))
watch(viewTrashed,           () => loadListas(1))

// ─── Modal: Crear / Editar lista ──────────────────────────────────────────────
const showFormModal = ref(false)
const editingLista  = ref(null)

const puedeEditarPreciosEnForm = computed(() => {
  if (!editingLista.value) return true
  return [1, 2].includes(Number(editingLista.value.status))
})

const formLoading   = ref(false)
const formError     = ref('')
const fieldErrors   = ref({})

const form = reactive({
  nombre:      '',
  codigo:      '',
  fecha_inicio: '',
  fecha_fin:    '',
  descripcion: '',
  poblaciones: []
})

/** Nombres de las poblaciones seleccionadas en el paso 1 (para badges). */
const poblacionesElegidasDisplay = computed(() => {
  const opts = poblacionesOptions.value ?? []
  const byNum = new Map(opts.map((o) => [Number(o.value), o]))
  return (form.poblaciones ?? []).map((id) => {
    const n = Number(id)
    const o =
      byNum.get(n) ??
      opts.find((x) => x.value === id || Number(x.value) === n)
    return {
      id,
      label: o?.label ?? `Población #${id}`,
      description: o?.description ?? ''
    }
  })
})

function quitarPoblacionSeleccionada(id) {
  const n = Number(id)
  form.poblaciones = (form.poblaciones ?? []).filter((x) => Number(x) !== n)
}

/** Pasos del asistente (crear / editar lista) — alineado con la guía LP */
const WIZARD_STEPS = [
  {
    id: 1,
    label: 'Lista y regiones',
    hint: 'Nombre, código, fechas de vigencia y poblaciones donde aplica la tarifa.'
  },
  {
    id: 2,
    label: 'Productos y precios',
    hint: 'Catálogo LP para elegir producto; aquí importes y cuotas si aplica.'
  },
  {
    id: 3,
    label: 'Descuentos',
    hint: 'Opcional: revisa y define descuentos en tabla (cola al crear o registro al editar).'
  }
]

const formWizardStep = ref(1)

const wizardStepDescription = computed(() => {
  const step = WIZARD_STEPS.find((s) => s.id === formWizardStep.value)
  const base = `Paso ${formWizardStep.value} de ${WIZARD_STEPS.length}.`
  const hint = step?.hint ?? ''
  const modo = editingLista.value
    ? ' Estás editando una lista existente; guarda en el último paso.'
    : ' Al guardar en el último paso se crea la lista y se envían precios y descuentos en cola.'
  return `${base} ${hint}${modo}`
})

function validateWizardStep1() {
  if (!form.nombre?.trim()) return 'Indica el nombre de la lista.'
  if (!form.fecha_inicio || !form.fecha_fin) return 'Completa las fechas de vigencia.'
  if (!form.poblaciones?.length) return 'Selecciona al menos una población.'
  return null
}

function wizardNext() {
  formError.value = ''
  if (formWizardStep.value === 1) {
    const err = validateWizardStep1()
    if (err) {
      formError.value = err
      return
    }
    formWizardStep.value = 2
    return
  }
  if (formWizardStep.value === 2) {
    const err = validateFormPrecioLines()
    if (err) {
      formError.value = err
      return
    }
    formWizardStep.value = 3
  }
}

function wizardPrev() {
  formError.value = ''
  if (formWizardStep.value > 1) formWizardStep.value -= 1
}

function closeListaFormModal() {
  showFormModal.value = false
}

watch(showFormModal, (open) => {
  if (!open) formWizardStep.value = 1
})

watch(formWizardStep, (step) => {
  if (step === 2) void loadProductos(true)
})

function resetForm() {
  form.nombre       = ''
  form.codigo       = ''
  form.fecha_inicio  = ''
  form.fecha_fin     = ''
  form.descripcion  = ''
  form.poblaciones  = []
  formError.value   = ''
  fieldErrors.value = {}
  formPrecioLines.value = []
  initialPrecioIds.value = []
  descuentosPendientes.value = []
  descuentosLista.value = []
  quickProductOpen.value = false
  productosStep2Filter.value = ''
  productosLoadError.value = ''
  resetDescuentoDraft()
  formWizardStep.value = 1
}

async function openCreate() {
  editingLista.value = null
  resetForm()
  showFormModal.value = true
  await Promise.all([loadPoblaciones(), loadProductos(true)])
}

async function openEdit(lista) {
  editingLista.value = lista
  resetForm()
  form.nombre        = lista.nombre        ?? ''
  form.codigo        = lista.codigo        ?? ''
  form.fecha_inicio   = lista.fecha_inicio  ?? ''
  form.fecha_fin      = lista.fecha_fin     ?? ''
  form.descripcion   = lista.descripcion   ?? ''
  form.poblaciones   = (lista.poblaciones ?? []).map((p) => p.id)
  showFormModal.value = true
  await Promise.all([
    loadPoblaciones(),
    loadProductos(true),
    loadPreciosParaFormulario(lista.id),
    loadDescuentosLista(lista.id)
  ])
}

async function submitForm() {
  formError.value   = ''
  fieldErrors.value = {}
  const precioErr = validateFormPrecioLines()
  if (precioErr) {
    formError.value = precioErr
    formWizardStep.value = 2
    return
  }
  formLoading.value = true
  try {
    const payload = {
      nombre:       form.nombre.trim(),
      fecha_inicio:  form.fecha_inicio,
      fecha_fin:     form.fecha_fin,
      poblaciones:  form.poblaciones,
    }
    if (form.codigo.trim())       payload.codigo      = form.codigo.trim()
    if (form.descripcion?.trim()) payload.descripcion = form.descripcion.trim()

    if (editingLista.value) {
      const listaId = editingLista.value.id
      await listaPrecioService.update(listaId, payload, { _silent: true })
      if (puedeEditarPreciosEnForm.value) {
        await syncPreciosLista(listaId)
      }
      notifySuccess(`La lista "${form.nombre}" fue actualizada correctamente.`)
    } else {
      const res = await listaPrecioService.create(payload, { _silent: true })
      const listaId = extractListaIdFromResponse(res)
      if (!listaId) throw new Error('La API no devolvió el id de la lista.')
      await crearPreciosTrasLista(listaId)
      await crearDescuentosTrasLista(listaId)
      notifySuccess(`La lista "${form.nombre}" fue creada con sus precios y descuentos en cola.`)
    }
    showFormModal.value = false
    await Promise.all([loadListas(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors  ?? {}
      formError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
      const keys = Object.keys(fieldErrors.value)
      const paso1Keys = ['nombre', 'codigo', 'fecha_inicio', 'fecha_fin', 'descripcion', 'poblaciones']
      if (keys.some((k) => paso1Keys.includes(k) || k.startsWith('poblaciones.'))) {
        formWizardStep.value = 1
      } else if (
        keys.some((k) =>
          String(k).includes('precio') ||
          String(k).includes('producto') ||
          String(k).includes('lista_precio')
        )
      ) {
        formWizardStep.value = 2
      }
    } else {
      formError.value = e?.response?.data?.message ?? e?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal: Detalle con precios ───────────────────────────────────────────────
const showDetailModal = ref(false)
const detailLista     = ref(null)
const detailPrecios   = ref([])
const preciosLoading  = ref(false)
const detailDescuentos = ref([])
const detailDescuentosLoading = ref(false)

async function loadDetailDescuentos(listaId) {
  detailDescuentosLoading.value = true
  detailDescuentos.value = []
  try {
    const res = await descuentoService.getAll({
      relations: 'listasPrecios,productos',
      per_page: 200,
      sort_by: 'created_at',
      sort_direction: 'desc'
    })
    const all = res.data ?? []
    detailDescuentos.value = all.filter((disc) =>
      listasDelDescuento(disc).some((lp) => lp.id === listaId)
    )
  } catch {
    detailDescuentos.value = []
  } finally {
    detailDescuentosLoading.value = false
  }
}

async function openDetail(lista) {
  detailLista.value  = lista
  detailPrecios.value = []
  detailDescuentos.value = []
  showDetailModal.value = true
  await Promise.all([
    loadDetailFull(lista.id),
    loadPrecios(lista.id),
    loadDetailDescuentos(lista.id)
  ])
}

async function loadDetailFull(id) {
  try {
    const res = await listaPrecioService.getById(id, { with: 'poblaciones,preciosProductos' })
    detailLista.value = res.data ?? detailLista.value
  } catch {
    // Mantiene datos del listado
  }
}

async function loadPrecios(listaId) {
  preciosLoading.value = true
  try {
    const res = await precioProductoService.getAll({
      lista_precio_id: listaId,
      with:            'producto.tipoProducto',
      per_page:        100
    })
    detailPrecios.value = res.data ?? []
  } catch {
    detailPrecios.value = []
  } finally {
    preciosLoading.value = false
  }
}

// ─── Modal: Precio (crear / editar) ──────────────────────────────────────────
const showPrecioModal    = ref(false)
const editingPrecio      = ref(null)
const precioLoading      = ref(false)
const precioFormError    = ref('')
const precioFieldErrors  = ref({})
const productos          = ref([])
const productosLoading   = ref(false)

const precioForm = reactive({
  producto_id:    '',
  precio_contado: '',
  matricula:      '',
  precio_total:   '',
  numero_cuotas:  '',
  observaciones:  ''
})

// Producto seleccionado (objeto completo con tipo_producto)
const productoSeleccionado = computed(() => {
  if (!precioForm.producto_id) return null
  return productos.value.find((p) => p.id === Number(precioForm.producto_id)) ?? null
})

const precioEsFinanciable = computed(() =>
  productoSeleccionado.value?.tipo_producto?.es_financiable === true ||
  editingPrecio.value?.producto?.tipo_producto?.es_financiable === true
)

const valorCuotaCalculado = computed(() => {
  if (!precioEsFinanciable.value) return null
  const total  = parseFloat(precioForm.precio_total)
  const mat    = parseFloat(precioForm.matricula || 0)
  const cuotas = parseInt(precioForm.numero_cuotas)
  if (!total || !cuotas || isNaN(total) || isNaN(cuotas) || cuotas <= 0) return null
  return Math.round((total - mat) / cuotas / 100) * 100
})

// Productos disponibles (excluye los ya asignados a esta lista)
const productosAsignadosIds = computed(() =>
  detailPrecios.value
    .filter((p) => !editingPrecio.value || p.id !== editingPrecio.value.id)
    .map((p) => p.producto_id)
)

const productosDisponiblesOptions = computed(() =>
  productos.value
    .filter((p) => !productosAsignadosIds.value.includes(p.id))
    .map((p) => ({
      value: p.id,
      label: `${p.nombre}${p.tipo_producto ? ` (${p.tipo_producto.nombre})` : ''}`
    }))
)

async function loadProductos(force = false) {
  if (!force && productos.value.length) return
  productosLoading.value = true
  productosLoadError.value = ''
  try {
    // GET /financiero/lp/productos — todas las páginas; ver docs/guia/producto.md
    productos.value = await productoLpService.fetchProductosAllPages(
      {
        sort_by: 'nombre',
        sort_direction: 'asc',
        with: 'tipoProducto',
        per_page: 100
      },
      { _silent: true }
    )
  } catch (e) {
    productos.value = []
    productosLoadError.value =
      e?.response?.data?.message ?? 'No se pudo cargar el catálogo de productos LP. Revisa permisos o la conexión.'
  } finally {
    productosLoading.value = false
  }
}

function resetPrecioForm() {
  precioForm.producto_id    = ''
  precioForm.precio_contado = ''
  precioForm.matricula      = ''
  precioForm.precio_total   = ''
  precioForm.numero_cuotas  = ''
  precioForm.observaciones  = ''
  precioFormError.value     = ''
  precioFieldErrors.value   = {}
}

async function openPrecioCreate() {
  editingPrecio.value = null
  resetPrecioForm()
  showPrecioModal.value = true
  await loadProductos()
}

async function openPrecioEdit(precio) {
  editingPrecio.value = precio
  resetPrecioForm()
  precioForm.producto_id    = precio.producto_id   ?? ''
  precioForm.precio_contado = precio.precio_contado ?? ''
  precioForm.matricula      = precio.matricula      ?? ''
  precioForm.precio_total   = precio.precio_total   ?? ''
  precioForm.numero_cuotas =
    precio.numero_cuotas != null && precio.numero_cuotas !== '' ? String(precio.numero_cuotas) : ''
  precioForm.observaciones  = precio.observaciones  ?? ''
  showPrecioModal.value = true
}

async function submitPrecio() {
  precioFormError.value   = ''
  precioFieldErrors.value = {}
  if (precioEsFinanciable.value) {
    const nc = parseInt(String(precioForm.numero_cuotas), 10)
    if (!Number.isFinite(nc) || nc < 1) {
      precioFormError.value = 'El número de cuotas debe ser un entero mayor o igual a 1 (no 0).'
      return
    }
    const coh = mensajeCoherenciaPreciosFinanciable(
      precioForm.precio_contado,
      precioForm.matricula,
      precioForm.precio_total
    )
    if (coh) {
      precioFormError.value = coh
      return
    }
  }
  precioLoading.value     = true
  try {
    const payload = {
      precio_contado: parseFloat(precioForm.precio_contado) || 0,
      matricula:      parseFloat(precioForm.matricula)      || 0,
    }
    if (precioEsFinanciable.value) {
      payload.precio_total   = parseFloat(precioForm.precio_total)  || 0
      payload.numero_cuotas  = parseInt(String(precioForm.numero_cuotas), 10)
    }
    if (precioForm.observaciones?.trim()) payload.observaciones = precioForm.observaciones.trim()

    if (editingPrecio.value) {
      await precioProductoService.update(editingPrecio.value.id, payload, { _silent: true })
      notifySuccess('Precio actualizado correctamente.')
    } else {
      payload.lista_precio_id = detailLista.value.id
      payload.producto_id     = Number(precioForm.producto_id)
      await precioProductoService.create(payload, { _silent: true })
      notifySuccess('Precio agregado a la lista correctamente.')
    }
    showPrecioModal.value = false
    await loadPrecios(detailLista.value.id)
  } catch (e) {
    if (e?.response?.status === 422) {
      precioFieldErrors.value = e.response.data?.errors  ?? {}
      precioFormError.value   = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else {
      precioFormError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    precioLoading.value = false
  }
}

// ─── Modal: Aprobar / Activar / Inactivar ─────────────────────────────────────
const showAprobarModal   = ref(false)
const showActivarModal   = ref(false)
const showInactivarModal = ref(false)
const targetLista        = ref(null)
const actionLoading      = ref(false)
const actionError        = ref('')

function openAprobar(lista) {
  targetLista.value = lista; actionError.value = ''; showAprobarModal.value = true
}
function openActivar(lista) {
  targetLista.value = lista; actionError.value = ''; showActivarModal.value = true
}
function openInactivar(lista) {
  targetLista.value = lista; actionError.value = ''; showInactivarModal.value = true
}

async function runAction(serviceFn, modalRef, successMsg) {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await serviceFn(targetLista.value.id)
    notifySuccess(successMsg)
    modalRef.value = false
    showDetailModal.value = false
    await Promise.all([loadListas(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al ejecutar la acción.'
  } finally {
    actionLoading.value = false
  }
}

const confirmAprobar   = () => runAction(
  (id) => listaPrecioService.aprobar(id),
  showAprobarModal,
  `La lista "${targetLista.value?.nombre}" fue aprobada.`
)
const confirmActivar   = () => runAction(
  (id) => listaPrecioService.activar(id),
  showActivarModal,
  `La lista "${targetLista.value?.nombre}" fue activada.`
)
const confirmInactivar = () => runAction(
  (id) => listaPrecioService.inactivar(id),
  showInactivarModal,
  `La lista "${targetLista.value?.nombre}" fue inactivada.`
)

// ─── Modal: Eliminar lista ────────────────────────────────────────────────────
const showEliminarModal = ref(false)

function openEliminar(lista) {
  targetLista.value   = lista
  actionError.value   = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value   = ''
  try {
    await listaPrecioService.delete(targetLista.value.id)
    notifySuccess(`La lista "${targetLista.value.nombre}" fue eliminada.`)
    showEliminarModal.value = false
    await Promise.all([loadListas(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar la lista de precios.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal: Eliminar precio ───────────────────────────────────────────────────
const showEliminarPrecioModal = ref(false)
const targetPrecio            = ref(null)
const precioActionLoading     = ref(false)
const precioActionError       = ref('')

function openEliminarPrecio(precio) {
  targetPrecio.value        = precio
  precioActionError.value   = ''
  showEliminarPrecioModal.value = true
}

async function confirmEliminarPrecio() {
  precioActionLoading.value = true
  precioActionError.value   = ''
  try {
    await precioProductoService.delete(targetPrecio.value.id)
    notifySuccess(`Producto "${targetPrecio.value.producto?.nombre}" removido de la lista.`)
    showEliminarPrecioModal.value = false
    await loadPrecios(detailLista.value.id)
  } catch (e) {
    precioActionError.value = e?.response?.data?.message ?? 'Error al eliminar el precio.'
  } finally {
    precioActionLoading.value = false
  }
}

// ─── Ciclo de vida del componente ─────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadListas(1),
    loadStatistics(),
  ])
})
</script>
