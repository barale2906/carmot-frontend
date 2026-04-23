<template>
  <div class="space-y-6">
    <!-- Cabecera de sección -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-medium text-slate-900">Matrículas</h2>
        <p class="mt-0.5 text-sm text-slate-500">
          Gestiona las inscripciones de estudiantes en cursos y ciclos académicos.
        </p>
      </div>
      <button
        v-if="canCrear"
        type="button"
        class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        @click="openCreate"
      >
        <NavIcon name="plus" class="size-4" />
        Nueva matrícula
      </button>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Total" :value="stats.total" icon="users" color="slate" />
      <StatCard label="Activas" :value="stats.activas" icon="check-circle" color="green" />
      <StatCard label="Anuladas" :value="stats.anuladas" icon="x-circle" color="red" />
      <StatCard label="Ingresos (monto total)" :value="formatCOP(stats.montoTotal)" icon="currency-dollar" color="blue" />
    </div>

    <!-- Error de API -->
    <div
      v-if="apiError"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ apiError }}
    </div>

    <!-- Filtros y acciones -->
    <div class="space-y-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormInputSearch
          v-model="filters.search"
          label="Buscar"
          placeholder="Buscar por estudiante, curso o ciclo..."
          help="Filtra matrículas por estudiante, curso o ciclo en la tabla."
          span="full"
          class="lg:col-span-2"
        />
        <FormSelect
          v-model="filters.status"
          label="Estado"
          help="Activo, inactivo o anulado en el listado."
          :options="[
            { value: '', label: 'Todos los estados' },
            { value: '1', label: 'Activo' },
            { value: '0', label: 'Inactivo' },
            { value: '2', label: 'Anulado' },
          ]"
        />
        <FormSelect
          v-model="filters.curso_id"
          label="Curso"
          help="Limita las matrículas a un curso concreto."
          :options="[{ value: '', label: 'Todos los cursos' }, ...cursosOptions]"
        />
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <FormSelect
          v-model="filters.ciclo_id"
          label="Ciclo"
          help="Limita las matrículas a un ciclo académico."
          :options="[{ value: '', label: 'Todos los ciclos' }, ...ciclosOptions]"
        />
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            v-model="filters.only_trashed"
            type="checkbox"
            class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Ver eliminadas
        </label>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="text-xs text-blue-600 hover:underline"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <DataTable
      :columns="columns"
      :rows="matriculas"
      :loading="loading"
      :meta="pagination"
      empty-message="No hay matrículas registradas."
      @page-change="onPageChange"
    >
      <!-- Estudiante -->
      <template #cell-estudiante="{ row }">
        <div>
          <p class="font-medium text-slate-900">{{ row.estudiante?.name ?? '—' }}</p>
          <p v-if="row.estudiante?.documento" class="text-xs text-slate-500">
            Doc: {{ row.estudiante.documento }}
          </p>
        </div>
      </template>

      <!-- Curso / Ciclo -->
      <template #cell-curso="{ row }">
        <div>
          <p class="text-sm text-slate-700">{{ row.curso?.nombre ?? '—' }}</p>
          <p class="text-xs text-slate-500">{{ row.ciclo?.nombre ?? '' }}</p>
        </div>
      </template>

      <!-- Fecha matrícula -->
      <template #cell-fecha_matricula="{ row }">
        <span class="text-sm text-slate-700">{{ formatDate(row.fecha_matricula) }}</span>
      </template>

      <!-- Monto -->
      <template #cell-monto="{ row }">
        <span class="font-medium text-slate-800">{{ formatCOP(row.monto) }}</span>
      </template>

      <!-- Estado -->
      <template #cell-status="{ row }">
        <StatusBadge :variant="statusVariant(row.status)" :label="row.status_text" />
        <span
          v-if="row.deleted_at"
          class="ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600"
        >
          Eliminada
        </span>
      </template>

      <!-- Acciones -->
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <!-- Papelera: restaurar / eliminar permanente -->
          <template v-if="row.deleted_at">
            <button
              v-if="canInactivar"
              type="button"
              class="text-xs text-emerald-600 hover:underline"
              @click="openRestore(row)"
            >
              Restaurar
            </button>
            <button
              v-if="canInactivar"
              type="button"
              class="text-xs text-red-600 hover:underline"
              @click="openForceDelete(row)"
            >
              Eliminar def.
            </button>
          </template>
          <!-- Registros normales -->
          <template v-else>
            <button
              type="button"
              class="text-xs text-blue-600 hover:underline"
              @click="openDetail(row)"
            >
              Ver detalle
            </button>
            <button
              v-if="canEditar"
              type="button"
              class="text-xs text-slate-600 hover:underline"
              @click="openEdit(row)"
            >
              Editar
            </button>
            <button
              v-if="canInactivar"
              type="button"
              class="text-xs text-red-500 hover:underline"
              @click="openDelete(row)"
            >
              Eliminar
            </button>
          </template>
        </div>
      </template>
    </DataTable>

    <!-- ====================== MODAL DETALLE ====================== -->
    <ModalBase
      :open="modals.detail"
      title="Detalle de Matrícula"
      size="lg"
      @close="modals.detail = false"
    >
      <template v-if="selected">
        <div class="space-y-5">
          <!-- Estado -->
          <div class="flex items-center justify-between">
            <StatusBadge :variant="statusVariant(selected.status)" :label="selected.status_text" size="md" />
            <span class="text-xs text-slate-400">ID #{{ selected.id }}</span>
          </div>

          <!-- Grid de datos -->
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Estudiante</p>
              <p class="mt-0.5 text-slate-800">{{ selected.estudiante?.name ?? '—' }}</p>
              <p v-if="selected.estudiante?.email" class="text-xs text-slate-500">{{ selected.estudiante.email }}</p>
              <p v-if="selected.estudiante?.documento" class="text-xs text-slate-500">Doc: {{ selected.estudiante.documento }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Curso</p>
              <p class="mt-0.5 text-slate-800">{{ selected.curso?.nombre ?? '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Ciclo</p>
              <p class="mt-0.5 text-slate-800">{{ selected.ciclo?.nombre ?? '—' }}</p>
              <p v-if="selected.ciclo?.fecha_inicio" class="text-xs text-slate-500">
                {{ formatDate(selected.ciclo.fecha_inicio) }} – {{ formatDate(selected.ciclo.fecha_fin) }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Monto acordado</p>
              <p class="mt-0.5 text-lg font-semibold text-blue-700">{{ formatCOP(selected.monto) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Fecha de matrícula</p>
              <p class="mt-0.5 text-slate-800">{{ formatDate(selected.fecha_matricula) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Fecha de inicio de clases</p>
              <p class="mt-0.5 text-slate-800">{{ formatDate(selected.fecha_inicio) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Registrada por</p>
              <p class="mt-0.5 text-slate-800">{{ selected.matriculado_por?.name ?? '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Asesor comercial</p>
              <p class="mt-0.5 text-slate-800">{{ selected.comercial?.name ?? '—' }}</p>
            </div>
          </div>

          <!-- Observaciones -->
          <div v-if="selected.observaciones">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Observaciones</p>
            <p class="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {{ selected.observaciones }}
            </p>
          </div>

          <!-- Recibos vinculados -->
          <div v-if="selected.recibosPago?.length">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Recibos de pago</p>
            <ul class="mt-1 divide-y divide-black/5 rounded-lg border border-black/10 bg-white text-sm">
              <li
                v-for="recibo in selected.recibosPago"
                :key="recibo.id"
                class="flex items-center justify-between px-3 py-2"
              >
                <span class="text-slate-700">#{{ recibo.id }} – {{ formatDate(recibo.fecha) }}</span>
                <span class="font-medium text-slate-800">{{ formatCOP(recibo.total ?? 0) }}</span>
              </li>
            </ul>
          </div>

          <!-- Timestamps -->
          <div class="border-t border-black/5 pt-3 text-xs text-slate-400">
            Creada: {{ selected.created_at }} · Actualizada: {{ selected.updated_at }}
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            v-if="canEditar && selected && !selected.deleted_at"
            type="button"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="modals.detail = false; openEdit(selected)"
          >
            Editar
          </button>
          <button
            type="button"
            class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="modals.detail = false"
          >
            Cerrar
          </button>
        </div>
      </template>
    </ModalBase>

    <!-- ====================== MODAL CREAR ====================== -->
    <ModalBase
      :open="modals.create"
      title="Nueva Matrícula"
      size="xl"
      @close="closeCreate"
    >
      <form id="form-create" class="space-y-6" @submit.prevent="submitCreate">
        <!-- Sección: Datos académicos -->
        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Datos académicos
          </legend>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Sede (solo para lookup de precio, no se envía) -->
            <FormSelect
              v-model="createSedeId"
              label="Sede (para consulta de precio)"
              :options="[{ value: '', label: 'Seleccionar sede...' }, ...sedesOptions]"
              hint="La sede define la región para calcular el precio vigente."
              help="Sede usada solo para buscar el precio de lista vigente por región."
              @update:model-value="onSedeChange"
            />
            <FormSelect
              v-model="form.curso_id"
              label="Curso *"
              :options="[{ value: '', label: 'Seleccionar curso...' }, ...cursosFormOptions]"
              help="Programa al que se inscribe el estudiante."
              :error="fieldErrors.curso_id?.[0]"
              required
              @update:model-value="onCursoChange"
            />
            <FormSelect
              v-model="form.ciclo_id"
              label="Ciclo *"
              :options="[{ value: '', label: ciclosLoading ? 'Cargando ciclos...' : 'Seleccionar ciclo...' }, ...ciclosFormOptions]"
              :error="fieldErrors.ciclo_id?.[0]"
              :disabled="!form.curso_id"
              hint="Filtra automáticamente por sede y curso seleccionados."
              help="Cohorte académica concreta dentro del curso."
              required
              @update:model-value="onCicloChange"
            />
          </div>
        </fieldset>

        <!-- Sección: Personas -->
        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Personas
          </legend>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Búsqueda de estudiante -->
            <div class="flex flex-col gap-2 md:col-span-2">
              <div class="flex flex-wrap items-center gap-1">
                <label class="text-sm font-medium text-slate-900">
                  Estudiante *
                </label>
                <FormFieldHelp text="Persona que queda matriculada; búscala por nombre o documento." />
              </div>
              <div class="relative">
                <input
                  v-model="estudianteSearch"
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  class="w-full rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @focus="showEstudianteDropdown = true"
                />
                <ul
                  v-if="showEstudianteDropdown && filteredEstudiantes.length > 0"
                  class="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg"
                >
                  <li
                    v-for="est in filteredEstudiantes"
                    :key="est.id"
                    class="cursor-pointer px-3 py-2.5 text-sm hover:bg-blue-50"
                    :class="{ 'bg-blue-50 font-medium': form.estudiante_id === est.id }"
                    @mousedown.prevent="selectEstudiante(est)"
                  >
                    <span class="text-slate-800">{{ est.name }}</span>
                    <span v-if="est.email" class="ml-2 text-xs text-slate-500">{{ est.email }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="estudianteSeleccionado" class="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                <NavIcon name="user" class="size-4 text-blue-600" />
                <span class="text-sm text-blue-800">{{ estudianteSeleccionado.name }}</span>
                <button
                  type="button"
                  class="ml-auto text-blue-400 hover:text-blue-700"
                  @click="clearEstudiante"
                >
                  <NavIcon name="x-mark" class="size-4" />
                </button>
              </div>
              <p v-if="fieldErrors.estudiante_id?.[0]" class="text-xs text-red-600">
                {{ fieldErrors.estudiante_id[0] }}
              </p>
            </div>

            <FormSelect
              v-model="form.comercial_id"
              label="Asesor comercial *"
              :options="[{ value: '', label: 'Seleccionar asesor...' }, ...comercialesOptions]"
              help="Responsable comercial asociado a la venta o seguimiento."
              :error="fieldErrors.comercial_id?.[0]"
              required
            />
            <FormSelect
              v-model="form.matriculado_por_id"
              label="Registrado por *"
              :options="[{ value: '', label: 'Seleccionar usuario...' }, ...comercialesOptions]"
              :error="fieldErrors.matriculado_por_id?.[0]"
              hint="Por defecto: usuario con sesión activa."
              help="Usuario del sistema que registra la matrícula en el acto."
              required
            />
          </div>
        </fieldset>

        <!-- Sección: Precio (auto-cargado) -->
        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Precio y forma de pago
          </legend>

          <!-- Consultando precio -->
          <div v-if="precioLoading" class="flex items-center gap-2 text-sm text-slate-500">
            <span class="size-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></span>
            Consultando precio vigente...
          </div>

          <!-- Panel de precio disponible -->
          <div v-else-if="precioConsultado" class="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs font-medium text-blue-600">Lista de precios activa</p>
                <p class="text-sm font-medium text-slate-800">
                  {{ precioConsultado.lista_precio?.nombre }}
                  <span class="ml-1 text-xs text-slate-500">· {{ precioConsultado.lista_precio?.codigo }}</span>
                </p>
              </div>
              <button
                type="button"
                class="text-xs text-blue-500 hover:underline"
                @click="precioConsultado = null"
              >
                Ingresar manual
              </button>
            </div>

            <!-- Opciones de precio -->
            <div class="grid grid-cols-2 gap-3">
              <label
                class="cursor-pointer rounded-xl border-2 p-3 transition-colors"
                :class="formaPago === 'contado' ? 'border-blue-500 bg-white' : 'border-transparent bg-white/60'"
              >
                <input
                  v-model="formaPago"
                  type="radio"
                  value="contado"
                  class="sr-only"
                />
                <p class="text-xs font-semibold text-slate-500">Pago al contado</p>
                <p class="text-xl font-bold text-slate-900">
                  {{ formatCOP(precioConsultado.precio_contado) }}
                </p>
                <p class="text-xs text-slate-400">Pago único</p>
              </label>

              <label
                v-if="precioConsultado.precio_total"
                class="cursor-pointer rounded-xl border-2 p-3 transition-colors"
                :class="formaPago === 'financiado' ? 'border-blue-500 bg-white' : 'border-transparent bg-white/60'"
              >
                <input
                  v-model="formaPago"
                  type="radio"
                  value="financiado"
                  class="sr-only"
                />
                <p class="text-xs font-semibold text-slate-500">Pago financiado</p>
                <p class="text-xl font-bold text-slate-900">
                  {{ formatCOP(precioConsultado.matricula) }}
                </p>
                <p class="text-xs text-slate-400">
                  inicial + {{ precioConsultado.numero_cuotas }}×{{ formatCOP(precioConsultado.valor_cuota) }}
                  <br />Total: {{ formatCOP(precioConsultado.precio_total) }}
                </p>
              </label>
            </div>
          </div>

          <!-- Aviso sin precio configurado -->
          <div
            v-else-if="sinPrecioConfigurado"
            class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            No se encontró una lista de precios vigente para esta sede y curso. Ingresa el monto manualmente.
          </div>

          <!-- Monto final -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              v-model="form.monto"
              label="Monto acordado *"
              type="number"
              step="0.01"
              min="0"
              :error="fieldErrors.monto?.[0]"
              hint="Puede ajustar el monto sugerido."
              help="Valor total acordado con el estudiante para esta matrícula."
              required
            />
            <FormSelect
              v-model="form.status"
              label="Estado inicial"
              help="Activo inscribe al ciclo; inactivo deja la matrícula sin efecto inmediato."
              :options="[
                { value: '1', label: 'Activo (inscribe al ciclo)' },
                { value: '0', label: 'Inactivo' },
              ]"
            />
          </div>
        </fieldset>

        <!-- Sección: Fechas -->
        <fieldset class="space-y-4">
          <legend class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fechas
          </legend>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              v-model="form.fecha_matricula"
              label="Fecha de matrícula *"
              type="date"
              help="Día en que se formaliza el registro de la matrícula."
              :error="fieldErrors.fecha_matricula?.[0]"
              required
            />
            <FormInput
              v-model="form.fecha_inicio"
              label="Fecha de inicio de clases *"
              type="date"
              :min="form.fecha_matricula"
              :error="fieldErrors.fecha_inicio?.[0]"
              hint="Debe ser igual o posterior a la fecha de matrícula."
              help="Primer día de clases previsto para el estudiante."
              required
            />
          </div>
        </fieldset>

        <FormTextarea
          v-model="form.observaciones"
          label="Observaciones"
          placeholder="Notas adicionales sobre la matrícula..."
          :rows="3"
          maxlength="5000"
          help="Notas internas opcionales; no alteran el precio ni el estado por sí solas."
        />
        <p v-if="fieldErrors.observaciones?.[0]" class="text-xs text-red-600">
          {{ fieldErrors.observaciones[0] }}
        </p>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="closeCreate"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-create"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <span v-if="saving" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Registrar matrícula
          </button>
        </div>
      </template>
    </ModalBase>

    <!-- ====================== MODAL EDITAR ====================== -->
    <ModalBase
      :open="modals.edit"
      title="Editar Matrícula"
      size="xl"
      @close="closeEdit"
    >
      <form id="form-edit" class="space-y-6" @submit.prevent="submitEdit">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormSelect
            v-model="form.curso_id"
            label="Curso"
            help="Programa académico de la matrícula."
            :options="[{ value: '', label: 'Seleccionar curso...' }, ...cursosFormOptions]"
            :error="fieldErrors.curso_id?.[0]"
          />
          <FormSelect
            v-model="form.ciclo_id"
            label="Ciclo"
            help="Cohorte o periodo dentro del curso."
            :options="[{ value: '', label: 'Seleccionar ciclo...' }, ...editCiclosOptions]"
            :error="fieldErrors.ciclo_id?.[0]"
          />
          <FormSelect
            v-model="form.estudiante_id"
            label="Estudiante"
            help="Persona matriculada."
            :options="[{ value: '', label: 'Seleccionar estudiante...' }, ...estudiantesOptions]"
            :error="fieldErrors.estudiante_id?.[0]"
          />
          <FormSelect
            v-model="form.comercial_id"
            label="Asesor comercial"
            help="Asesor asociado a la operación."
            :options="[{ value: '', label: 'Seleccionar asesor...' }, ...comercialesOptions]"
            :error="fieldErrors.comercial_id?.[0]"
          />
          <FormSelect
            v-model="form.matriculado_por_id"
            label="Registrado por"
            help="Usuario que registró la matrícula."
            :options="[{ value: '', label: 'Seleccionar usuario...' }, ...comercialesOptions]"
            :error="fieldErrors.matriculado_por_id?.[0]"
          />
          <FormInput
            v-model="form.monto"
            label="Monto"
            type="number"
            step="0.01"
            min="0"
            help="Valor acordado de la matrícula."
            :error="fieldErrors.monto?.[0]"
          />
          <FormInput
            v-model="form.fecha_matricula"
            label="Fecha de matrícula"
            type="date"
            help="Fecha de formalización del registro."
            :error="fieldErrors.fecha_matricula?.[0]"
          />
          <FormInput
            v-model="form.fecha_inicio"
            label="Fecha de inicio de clases"
            type="date"
            :min="form.fecha_matricula"
            help="Inicio previsto de clases."
            :error="fieldErrors.fecha_inicio?.[0]"
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            help="Activo, inactivo o anulado según política institucional."
            :options="[
              { value: '0', label: 'Inactivo' },
              { value: '1', label: 'Activo' },
              { value: '2', label: 'Anulado' },
            ]"
            :error="fieldErrors.status?.[0]"
          />
        </div>

        <FormTextarea
          v-model="form.observaciones"
          label="Observaciones"
          placeholder="Notas adicionales sobre la matrícula..."
          :rows="3"
          maxlength="5000"
          help="Notas internas opcionales sobre esta matrícula."
        />
        <p v-if="fieldErrors.observaciones?.[0]" class="text-xs text-red-600">
          {{ fieldErrors.observaciones[0] }}
        </p>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="closeEdit"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-edit"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <span v-if="saving" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Guardar cambios
          </button>
        </div>
      </template>
    </ModalBase>

    <!-- ====================== MODAL CONFIRMAR ELIMINAR ====================== -->
    <ModalBase
      :open="modals.delete"
      title="Eliminar matrícula"
      size="sm"
      @close="modals.delete = false"
    >
      <p class="text-sm text-slate-600">
        ¿Estás seguro de que deseas eliminar la matrícula de
        <strong>{{ selected?.estudiante?.name }}</strong>
        en el curso <strong>{{ selected?.curso?.nombre }}</strong>?
        <br />
        <span class="text-xs text-slate-400 mt-1 block">
          Si la matrícula está activa, el contador de inscritos del ciclo se decrementará automáticamente.
        </span>
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="modals.delete = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            @click="confirmDelete"
          >
            <span v-if="saving" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Eliminar
          </button>
        </div>
      </template>
    </ModalBase>

    <!-- ====================== MODAL RESTAURAR ====================== -->
    <ModalBase
      :open="modals.restore"
      title="Restaurar matrícula"
      size="sm"
      @close="modals.restore = false"
    >
      <p class="text-sm text-slate-600">
        ¿Restaurar la matrícula de
        <strong>{{ selected?.estudiante?.name }}</strong>?
        Si su estado es Activo, el contador de inscritos del ciclo se incrementará.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="modals.restore = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            @click="confirmRestore"
          >
            <span v-if="saving" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Restaurar
          </button>
        </div>
      </template>
    </ModalBase>

    <!-- ====================== MODAL FORZAR ELIMINACIÓN ====================== -->
    <ModalBase
      :open="modals.forceDelete"
      title="Eliminar permanentemente"
      size="sm"
      @close="modals.forceDelete = false"
    >
      <div class="space-y-3">
        <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠ Esta operación es <strong>irreversible</strong>. El registro no podrá recuperarse.
        </div>
        <p class="text-sm text-slate-600">
          ¿Eliminar permanentemente la matrícula de
          <strong>{{ selected?.estudiante?.name }}</strong>?
          Asegúrate de que no tenga recibos de pago asociados.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="modals.forceDelete = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            @click="confirmForceDelete"
          >
            <span v-if="saving" class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Eliminar definitivamente
          </button>
        </div>
      </template>
    </ModalBase>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

import DataTable from '@/components/activos/DataTable.vue'
import ModalBase from '@/components/ModalBase.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import NavIcon from '@/components/icons/NavIcon.vue'

import matriculaService from '@/services/matriculaService.js'
import cicloService from '@/services/cicloService.js'
import sedeService from '@/services/sedeService.js'
import userService from '@/services/userService.js'
import precioProductoService from '@/services/precioProductoService.js'
import productoLpService from '@/services/productoLpService.js'
import { authService } from '@/services/authService.js'

const route = useRoute()

// ─────────────── Permisos ───────────────
const canCrear    = ref(true)
const canEditar   = ref(true)
const canInactivar = ref(true)

// ─────────────── Estado global ───────────────
const loading  = ref(false)
const saving   = ref(false)
const apiError = ref('')

// ─────────────── Estadísticas ───────────────
const stats = reactive({
  total:      0,
  activas:    0,
  anuladas:   0,
  montoTotal: 0
})

// ─────────────── Datos de tabla ───────────────
const matriculas  = ref([])
const pagination  = ref(null)
const selected    = ref(null)

// ─────────────── Filtros ───────────────
const filters = reactive({
  search:      '',
  status:      '',
  curso_id:    '',
  ciclo_id:    '',
  only_trashed: false
})
let searchTimer = null

const hasActiveFilters = computed(() =>
  filters.search || filters.status || filters.curso_id || filters.ciclo_id || filters.only_trashed
)

// ─────────────── Datos de referencia (filtros + formularios) ───────────────
const cursosRef   = ref([])
const ciclosRef   = ref([])
const estudiantesRef = ref([])
const comercialesRef = ref([])
const sedesRef    = ref([])

// ─────────────── Modales ───────────────
const modals = reactive({
  create:      false,
  edit:        false,
  detail:      false,
  delete:      false,
  restore:     false,
  forceDelete: false
})

// ─────────────── Formulario ───────────────
const EMPTY_FORM = () => ({
  curso_id:           '',
  ciclo_id:           '',
  estudiante_id:      '',
  matriculado_por_id: '',
  comercial_id:       '',
  fecha_matricula:    today(),
  fecha_inicio:       '',
  monto:              '',
  observaciones:      '',
  status:             '1'
})

const form        = reactive(EMPTY_FORM())
const fieldErrors = ref({})

// ─────────────── Create form: estado específico ───────────────
const createSedeId           = ref('')
const createSedeSeleccionada  = ref(null)
const ciclosFormOptions       = ref([])
const ciclosLoading           = ref(false)
const estudianteSearch        = ref('')
const showEstudianteDropdown  = ref(false)
const estudianteSeleccionado  = ref(null)
const formaPago               = ref('contado')
const precioConsultado        = ref(null)
const precioLoading           = ref(false)
const sinPrecioConfigurado    = ref(false)

// ─────────────── Edit form: ciclos ───────────────
const editCiclosOptions = ref([])

// ─────────────── Columnas de la tabla ───────────────
const columns = [
  { key: 'estudiante',       label: 'Estudiante',      slot: true },
  { key: 'curso',            label: 'Curso / Ciclo',   slot: true },
  { key: 'fecha_matricula',  label: 'Fecha matrícula', slot: true },
  { key: 'monto',            label: 'Monto',           slot: true },
  { key: 'status',           label: 'Estado',          slot: true }
]

// ─────────────── Computed options ───────────────
const cursosOptions = computed(() =>
  cursosRef.value.map((c) => ({ value: String(c.id), label: c.nombre }))
)

const cursosFormOptions = computed(() =>
  cursosRef.value.map((c) => ({ value: String(c.id), label: c.nombre }))
)

const ciclosOptions = computed(() =>
  ciclosRef.value.map((c) => ({ value: String(c.id), label: c.nombre }))
)

const estudiantesOptions = computed(() =>
  estudiantesRef.value.map((e) => ({
    value: String(e.id),
    label: e.name + (e.email ? ` (${e.email})` : '')
  }))
)

const filteredEstudiantes = computed(() => {
  const q = estudianteSearch.value.trim().toLowerCase()
  if (!q) return estudiantesRef.value.slice(0, 20)
  return estudiantesRef.value
    .filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.documento?.toLowerCase().includes(q)
    )
    .slice(0, 20)
})

const sedesOptions = computed(() =>
  sedesRef.value.map((s) => ({ value: String(s.id), label: s.nombre }))
)

const comercialesOptions = computed(() =>
  comercialesRef.value.map((u) => ({ value: String(u.id), label: u.name }))
)

// ─────────────── Helpers ───────────────
function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

function formatCOP(val) {
  if (val === null || val === undefined || val === '') return '—'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

function statusVariant(status) {
  switch (Number(status)) {
    case 1: return 'activo'
    case 2: return 'baja'
    default: return 'inactivo'
  }
}

// ─────────────── Carga inicial ───────────────
async function loadData() {
  loading.value = true
  apiError.value = ''
  try {
    const params = {
      with:           'curso,ciclo,estudiante',
      sort_by:        'fecha_matricula',
      sort_direction: 'desc',
      per_page:       15,
      page:           pagination.value?.current_page ?? 1
    }
    if (filters.search)       params.search      = filters.search
    if (filters.status !== '') params.status     = filters.status
    if (filters.curso_id)     params.curso_id    = filters.curso_id
    if (filters.ciclo_id)     params.ciclo_id    = filters.ciclo_id
    if (filters.only_trashed) params.only_trashed = true

    const res = filters.only_trashed
      ? await matriculaService.getTrashed(params)
      : await matriculaService.getAll(params)

    matriculas.value = res.data ?? []
    pagination.value = res.meta ?? null
  } catch (e) {
    apiError.value = e?.response?.data?.message ?? 'Error al cargar las matrículas.'
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await matriculaService.getStatistics()
    const d = res.data
    stats.total      = d.totales?.total ?? 0
    stats.activas    = d.por_status?.activas ?? 0
    stats.anuladas   = d.por_status?.anuladas ?? 0
    stats.montoTotal = d.monto_total ?? 0
  } catch { /* no bloquear UI */ }
}

async function loadFilters() {
  try {
    const res = await matriculaService.getFilters()
    cursosRef.value      = res.data?.cursos ?? []
    ciclosRef.value      = res.data?.ciclos ?? []
    estudiantesRef.value = res.data?.estudiantes ?? []
  } catch { /* silencioso */ }
}

async function loadSedes() {
  try {
    const res = await sedeService.getAll({ status: 1, sort_by: 'nombre', sort_direction: 'asc', per_page: 100, with: 'poblacion' })
    sedesRef.value = res.data ?? []
  } catch { /* silencioso */ }
}

async function loadComerciales() {
  try {
    const res = await userService.getAll({ role: 'comercial', with: 'roles', per_page: 100, sort_by: 'name', sort_direction: 'asc' })
    comercialesRef.value = res.data ?? []
  } catch {
    // Si falla (403), intentar con admin
    try {
      const res = await userService.getAll({ role: 'admin', with: 'roles', per_page: 100 })
      comercialesRef.value = res.data ?? []
    } catch { /* silencioso */ }
  }
}

// ─────────────── Watchers de filtros ───────────────
watch(
  () => [filters.status, filters.curso_id, filters.ciclo_id, filters.only_trashed],
  () => {
    if (pagination.value) pagination.value.current_page = 1
    loadData()
  }
)

watch(
  () => filters.search,
  () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      if (pagination.value) pagination.value.current_page = 1
      loadData()
    }, 350)
  }
)

function clearFilters() {
  filters.search      = ''
  filters.status      = ''
  filters.curso_id    = ''
  filters.ciclo_id    = ''
  filters.only_trashed = false
}

function onPageChange(page) {
  if (pagination.value) pagination.value.current_page = page
  loadData()
}

// ─────────────── Modales: detalle ───────────────
async function openDetail(row) {
  selected.value   = row
  modals.detail    = true
  // Recargar con relaciones completas
  try {
    const res = await matriculaService.getById(row.id, {
      with: 'curso,ciclo,estudiante,matriculadoPor,comercial,recibosPago'
    })
    selected.value = res.data
  } catch { /* usar lo que hay */ }
}

// ─────────────── Modales: crear ───────────────
async function openCreate() {
  Object.assign(form, EMPTY_FORM())
  fieldErrors.value        = {}
  createSedeId.value       = ''
  createSedeSeleccionada.value = null
  ciclosFormOptions.value  = []
  estudianteSearch.value   = ''
  estudianteSeleccionado.value = null
  showEstudianteDropdown.value = false
  formaPago.value          = 'contado'
  precioConsultado.value   = null
  sinPrecioConfigurado.value = false

  // Pre-llenar con el usuario actual
  try {
    const user = await authService.getUser()
    form.matriculado_por_id = String(user.id)
    // Si hay comerciales, pre-seleccionar el primero si el usuario es comercial
  } catch { /* silencioso */ }

  modals.create = true
}

function closeCreate() {
  modals.create = false
  fieldErrors.value = {}
}

// ─── Reacciones del formulario de creación ───
async function onSedeChange(sedeId) {
  createSedeSeleccionada.value = sedesRef.value.find((s) => String(s.id) === String(sedeId)) ?? null
  await loadCiclosForm()
  await lookupPrice()
}

async function onCursoChange(cursoId) {
  form.ciclo_id = ''
  precioConsultado.value = null
  sinPrecioConfigurado.value = false
  if (cursoId) {
    await loadCiclosForm()
    await lookupPrice()
  }
}

async function onCicloChange(cicloId) {
  if (!cicloId) return
  const ciclo = ciclosFormOptions.value.find((o) => String(o.value) === String(cicloId))?._raw
  if (ciclo?.fecha_inicio && !form.fecha_inicio) {
    form.fecha_inicio = ciclo.fecha_inicio
  }
}

async function loadCiclosForm() {
  if (!form.curso_id) return
  ciclosLoading.value = true
  try {
    const params = { status: 1, sort_by: 'nombre', sort_direction: 'asc', per_page: 100, with: 'sede,curso' }
    if (createSedeSeleccionada.value?.id) params.sede_id = createSedeSeleccionada.value.id
    params.curso_id = form.curso_id
    const res = await cicloService.getAll(params)
    const raw = res.data ?? []
    ciclosFormOptions.value = raw.map((c) => ({
      value:  String(c.id),
      label:  `${c.nombre} (${formatDate(c.fecha_inicio)} – ${formatDate(c.fecha_fin)})`,
      _raw:   c
    }))
  } catch {
    ciclosFormOptions.value = []
  } finally {
    ciclosLoading.value = false
  }
}

async function lookupPrice() {
  precioConsultado.value   = null
  sinPrecioConfigurado.value = false
  if (!form.curso_id || !createSedeSeleccionada.value?.poblacion_id) return

  precioLoading.value = true
  try {
    // 1. Obtener producto LP del curso
    const prodRes = await productoLpService.getAll({
      referencia_tipo: 'curso',
      referencia_id:   form.curso_id,
      status:          1,
      with:            'tipoProducto'
    })
    const producto = prodRes.data?.[0]
    if (!producto) {
      sinPrecioConfigurado.value = true
      return
    }

    // 2. Consultar precio vigente
    const precioRes = await precioProductoService.obtenerPrecio({
      producto_id:   producto.id,
      poblacion_id:  createSedeSeleccionada.value.poblacion_id
    })
    precioConsultado.value = precioRes.data
    // Pre-llenar monto según forma de pago
    applyFormaPago()
  } catch (e) {
    if (e?.response?.status === 404) {
      sinPrecioConfigurado.value = true
    }
  } finally {
    precioLoading.value = false
  }
}

function applyFormaPago() {
  if (!precioConsultado.value) return
  form.monto = formaPago.value === 'contado'
    ? precioConsultado.value.precio_contado
    : (precioConsultado.value.matricula ?? precioConsultado.value.precio_contado)
}

watch(formaPago, applyFormaPago)

// ─── Estudiante selector ───
function selectEstudiante(est) {
  estudianteSeleccionado.value = est
  form.estudiante_id           = String(est.id)
  estudianteSearch.value       = ''
  showEstudianteDropdown.value = false
}

function clearEstudiante() {
  estudianteSeleccionado.value = null
  form.estudiante_id           = ''
}

// ─── Cerrar dropdown al hacer clic fuera ───
function handleBodyClick() {
  showEstudianteDropdown.value = false
}

// ─────────────── Modales: editar ───────────────
async function openEdit(row) {
  selected.value    = row
  fieldErrors.value = {}

  Object.assign(form, {
    curso_id:           String(row.curso_id ?? ''),
    ciclo_id:           String(row.ciclo_id ?? ''),
    estudiante_id:      String(row.estudiante_id ?? ''),
    matriculado_por_id: String(row.matriculado_por_id ?? ''),
    comercial_id:       String(row.comercial_id ?? ''),
    fecha_matricula:    row.fecha_matricula ?? '',
    fecha_inicio:       row.fecha_inicio ?? '',
    monto:              row.monto ?? '',
    observaciones:      row.observaciones ?? '',
    status:             String(row.status ?? '1')
  })

  // Cargar ciclos para el curso seleccionado
  editCiclosOptions.value = ciclosRef.value
    .filter((c) => !form.curso_id || String(c.curso_id) === String(form.curso_id))
    .map((c) => ({ value: String(c.id), label: c.nombre }))

  if (!editCiclosOptions.value.length) {
    try {
      const res = await cicloService.getAll({ curso_id: form.curso_id, status: 1, per_page: 100 })
      editCiclosOptions.value = (res.data ?? []).map((c) => ({ value: String(c.id), label: c.nombre }))
    } catch { /* silencioso */ }
  }

  modals.edit = true
}

function closeEdit() {
  modals.edit       = false
  fieldErrors.value = {}
}

// ─────────────── Modales: delete/restore/forceDelete ───────────────
function openDelete(row) {
  selected.value  = row
  modals.delete   = true
}

function openRestore(row) {
  selected.value  = row
  modals.restore  = true
}

function openForceDelete(row) {
  selected.value      = row
  modals.forceDelete  = true
}

// ─────────────── Acciones CRUD ───────────────
async function submitCreate() {
  if (!form.estudiante_id) {
    fieldErrors.value = { ...fieldErrors.value, estudiante_id: ['Debes seleccionar un estudiante.'] }
    return
  }

  saving.value      = true
  fieldErrors.value = {}
  try {
    const payload = {
      curso_id:           Number(form.curso_id),
      ciclo_id:           Number(form.ciclo_id),
      estudiante_id:      Number(form.estudiante_id),
      matriculado_por_id: Number(form.matriculado_por_id),
      comercial_id:       Number(form.comercial_id),
      fecha_matricula:    form.fecha_matricula,
      fecha_inicio:       form.fecha_inicio,
      monto:              Number(form.monto),
      status:             Number(form.status)
    }
    if (form.observaciones) payload.observaciones = form.observaciones

    await matriculaService.create(payload)
    modals.create = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
    } else {
      apiError.value = e?.response?.data?.message ?? 'Error al registrar la matrícula.'
      modals.create  = false
    }
  } finally {
    saving.value = false
  }
}

async function submitEdit() {
  saving.value      = true
  fieldErrors.value = {}
  try {
    const payload = {}
    if (form.curso_id)           payload.curso_id            = Number(form.curso_id)
    if (form.ciclo_id)           payload.ciclo_id            = Number(form.ciclo_id)
    if (form.estudiante_id)      payload.estudiante_id       = Number(form.estudiante_id)
    if (form.matriculado_por_id) payload.matriculado_por_id  = Number(form.matriculado_por_id)
    if (form.comercial_id)       payload.comercial_id        = Number(form.comercial_id)
    if (form.fecha_matricula)    payload.fecha_matricula      = form.fecha_matricula
    if (form.fecha_inicio)       payload.fecha_inicio         = form.fecha_inicio
    if (form.monto !== '')       payload.monto               = Number(form.monto)
    if (form.status !== '')      payload.status              = Number(form.status)
    payload.observaciones = form.observaciones || null

    await matriculaService.update(selected.value.id, payload)
    modals.edit = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
    } else {
      apiError.value = e?.response?.data?.message ?? 'Error al actualizar la matrícula.'
      modals.edit    = false
    }
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  saving.value = true
  try {
    await matriculaService.delete(selected.value.id)
    modals.delete = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    apiError.value = e?.response?.data?.message ?? 'Error al eliminar la matrícula.'
    modals.delete  = false
  } finally {
    saving.value = false
  }
}

async function confirmRestore() {
  saving.value = true
  try {
    await matriculaService.restore(selected.value.id)
    modals.restore = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    apiError.value = e?.response?.data?.message ?? 'Error al restaurar la matrícula.'
    modals.restore = false
  } finally {
    saving.value = false
  }
}

async function confirmForceDelete() {
  saving.value = true
  try {
    await matriculaService.forceDelete(selected.value.id)
    modals.forceDelete = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    apiError.value     = e?.response?.data?.message ?? 'No se pudo eliminar permanentemente. Verifique que no tenga recibos asociados.'
    modals.forceDelete = false
  } finally {
    saving.value = false
  }
}

// ─────────────── Montaje ───────────────
onUnmounted(() => {
  document.removeEventListener('click', handleBodyClick)
  clearTimeout(searchTimer)
})

onMounted(async () => {
  document.addEventListener('click', handleBodyClick)

  await Promise.allSettled([
    loadData(),
    loadStatistics(),
    loadFilters(),
    loadSedes(),
    loadComerciales(),
  ])

  // Si viene desde el dashboard con ?action=create, abrir el modal directamente
  if (route.query.action === 'create' && canCrear.value) {
    openCreate()
  }
})
</script>
