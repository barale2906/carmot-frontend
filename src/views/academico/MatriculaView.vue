<template>
  <div class="flex flex-col gap-6">

    <!-- ── Estadísticas ───────────────────────────────────────────────────── -->
    <section aria-labelledby="stats-matriculas-heading">
      <h2 id="stats-matriculas-heading" class="sr-only">Resumen de matrículas</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard
            title="Total"
            :value="stats.total"
            description="Matrículas registradas"
            icon="estudiantes"
            icon-variant="slate"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activas"
            :value="stats.activas"
            description="Estudiantes inscritos actualmente"
            icon="academico"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Anuladas"
            :value="stats.anuladas"
            description="Matrículas anuladas"
            icon="pendientes"
            icon-variant="red"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Ingresos totales"
            :value="formatCOP(stats.montoTotal)"
            description="Suma de montos acordados"
            icon="cartera"
            icon-variant="amber"
          />
        </li>
      </ul>
    </section>

    <!-- ── Filtros y acciones ─────────────────────────────────────────────── -->
    <section
      aria-labelledby="filtros-matriculas-heading"
      class="rounded-[14px] border border-black/10 bg-white p-6"
    >
      <h2 id="filtros-matriculas-heading" class="sr-only">Filtros y acciones</h2>

      <!-- Error de carga -->
      <div
        v-if="apiError"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ apiError }}
        <button
          type="button"
          class="ml-2 font-medium underline hover:no-underline"
          @click="loadData"
        >
          Reintentar
        </button>
      </div>

      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Estudiante, curso o ciclo..."
            help="Filtra matrículas por nombre de estudiante, curso o ciclo."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[160px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            :options="statusFilterOptions"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.curso_id"
            label="Curso:"
            :options="[{ value: '', label: 'Todos los cursos' }, ...cursosOptions]"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.ciclo_id"
            label="Ciclo:"
            :options="[{ value: '', label: 'Todos los ciclos' }, ...ciclosOptions]"
          />
        </div>
        <div class="flex w-full items-end gap-3 sm:w-auto">
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
            Limpiar
          </button>
          <button
            v-if="canCrear"
            type="button"
            class="ml-auto flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nueva matrícula
          </button>
        </div>
      </div>
    </section>

    <!-- ── Tabla de matrículas ────────────────────────────────────────────── -->
    <section aria-labelledby="listado-matriculas-heading">
      <SectionHeader
        id="listado-matriculas-heading"
        title="Listado de matrículas"
        description="Haz clic en 'Ver' para revisar el detalle completo de cada matrícula."
        class="mb-4"
      />

      <div
        v-if="loading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando matrículas...</span>
      </div>

      <div
        v-else-if="!matriculas.length"
        class="flex flex-col items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <svg
          class="mb-3 size-10 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p class="text-sm text-slate-400">
          {{ hasActiveFilters ? 'No se encontraron matrículas con esos filtros.' : 'No hay matrículas registradas aún.' }}
        </p>
      </div>

      <DataTable
        v-else
        :columns="columns"
        :data="matriculas"
        row-key="id"
        aria-label="Listado de matrículas"
        actions-first
      >
        <template #cell="{ column, row }">
          <!-- Estudiante -->
          <template v-if="column.key === 'estudiante'">
            <div>
              <p class="font-medium text-slate-900">{{ row.estudiante?.name ?? '—' }}</p>
              <p v-if="row.estudiante?.documento" class="text-xs text-slate-500">
                Doc: {{ row.estudiante.documento }}
              </p>
            </div>
          </template>

          <!-- Curso / Ciclo -->
          <template v-else-if="column.key === 'curso'">
            <div>
              <p class="text-sm text-slate-700">{{ row.curso?.nombre ?? '—' }}</p>
              <p class="text-xs text-slate-500">{{ row.ciclo?.nombre ?? '' }}</p>
            </div>
          </template>

          <!-- Fecha matrícula -->
          <template v-else-if="column.key === 'fecha_matricula'">
            <span class="text-sm text-slate-700">{{ formatDate(row.fecha_matricula) }}</span>
          </template>

          <!-- Monto -->
          <template v-else-if="column.key === 'monto'">
            <span class="font-medium text-slate-800">{{ formatCOP(row.monto) }}</span>
          </template>

          <!-- Estado -->
          <template v-else-if="column.key === 'status'">
            <div class="flex flex-wrap items-center gap-1">
              <StatusBadge
                :variant="statusVariant(row.status)"
                :label="row.status_text ?? '—'"
              />
              <span
                v-if="row.deleted_at"
                class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                Eliminada
              </span>
            </div>
          </template>

          <!-- Fallback -->
          <template v-else>
            {{ row[column.key] ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <!-- Papelera: restaurar / eliminar permanente -->
          <template v-if="row.deleted_at">
            <button
              v-if="canInactivar"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Restaurar"
              @click="openRestore(row)"
            >
              <NavIcon name="track_changes" class="size-4" />
            </button>
            <button
              v-if="canInactivar"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar permanentemente"
              @click="openForceDelete(row)"
            >
              <NavIcon name="trash" class="size-4" />
            </button>
          </template>

          <!-- Registros normales -->
          <template v-else>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Ver detalle"
              @click="openDetail(row)"
            >
              <NavIcon name="eye" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              title="Imprimir hoja de matrícula"
              :disabled="printing === row.id"
              @click="handlePrintRow(row)"
            >
              <span
                v-if="printing === row.id"
                class="block size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
              />
              <NavIcon v-else name="print" class="size-4" />
            </button>
            <button
              v-if="canEditar"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Editar"
              @click="openEdit(row)"
            >
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button
              v-if="canInactivar"
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar"
              @click="openDelete(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
        </template>
      </DataTable>

      <!-- Paginación manual -->
      <div
        v-if="pagination && pagination.last_page > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} matrículas
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.current_page === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="onPageChange(pagination.current_page - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.current_page === pagination.last_page"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="onPageChange(pagination.current_page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- ── Wizard: nueva matrícula ────────────────────────────────────────── -->
    <MatriculaWizardModal
      :open="wizardOpen"
      :cursos="cursosRef"
      :sedes="sedesRef"
      :comerciales="comercialesRef"
      @close="wizardOpen = false"
      @saved="onWizardSaved"
    />

    <!-- ── Modal: Hoja de matrícula imprimible ────────────────────────────── -->
    <MatriculaPrintModal
      :open="printModalOpen"
      :data="printData"
      :sedes="sedesRef"
      @close="printModalOpen = false"
    />

    <!-- ── Modal: Detalle ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="modals.detail"
      title="Detalle de matrícula"
      description="Información completa del registro de matrícula."
      size="lg"
    >
      <template v-if="selected">
        <div class="space-y-5 pb-2">
          <!-- Estado -->
          <div class="flex items-center justify-between">
            <StatusBadge
              :variant="statusVariant(selected.status)"
              :label="selected.status_text ?? '—'"
            />
            <span class="text-xs text-slate-400">ID #{{ selected.id }}</span>
          </div>

          <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Estudiante</dt>
              <dd class="mt-0.5 font-medium text-slate-800">{{ selected.estudiante?.name ?? '—' }}</dd>
              <dd v-if="selected.estudiante?.email" class="text-xs text-slate-500">
                {{ selected.estudiante.email }}
              </dd>
              <dd v-if="selected.estudiante?.documento" class="text-xs text-slate-500">
                Doc: {{ selected.estudiante.documento }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Curso</dt>
              <dd class="mt-0.5 font-medium text-slate-800">{{ selected.curso?.nombre ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">Ciclo</dt>
              <dd class="mt-0.5 font-medium text-slate-800">{{ selected.ciclo?.nombre ?? '—' }}</dd>
              <dd v-if="selected.ciclo?.fecha_inicio" class="text-xs text-slate-500">
                {{ formatDate(selected.ciclo.fecha_inicio) }} –
                {{ formatDate(selected.ciclo.fecha_fin) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Monto acordado
              </dt>
              <dd class="mt-0.5 text-lg font-bold text-blue-700">
                {{ formatCOP(selected.monto) }}
              </dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Fecha de matrícula
              </dt>
              <dd class="mt-0.5 text-slate-800">{{ formatDate(selected.fecha_matricula) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Inicio de clases
              </dt>
              <dd class="mt-0.5 text-slate-800">{{ formatDate(selected.fecha_inicio) }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Registrada por
              </dt>
              <dd class="mt-0.5 text-slate-800">{{ selected.matriculado_por?.name ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-slate-400">
                Asesor comercial
              </dt>
              <dd class="mt-0.5 text-slate-800">{{ selected.comercial?.name ?? '—' }}</dd>
            </div>
          </dl>

          <div v-if="selected.observaciones">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Observaciones</p>
            <p class="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {{ selected.observaciones }}
            </p>
          </div>

          <div v-if="selected.recibosPago?.length">
            <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Recibos de pago</p>
            <ul
              class="mt-1 divide-y divide-black/5 rounded-lg border border-black/10 bg-white text-sm"
            >
              <li
                v-for="recibo in selected.recibosPago"
                :key="recibo.id"
                class="flex items-center justify-between px-3 py-2"
              >
                <span class="text-slate-700">#{{ recibo.id }} – {{ formatDate(recibo.fecha) }}</span>
                <span class="font-medium text-slate-800">
                  {{ formatCOP(recibo.total ?? 0) }}
                </span>
              </li>
            </ul>
          </div>

          <p class="border-t border-black/5 pt-3 text-xs text-slate-400">
            Creada: {{ selected.created_at }} · Actualizada: {{ selected.updated_at }}
          </p>
        </div>
      </template>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="modals.detail = false"
        >
          Cerrar
        </button>
        <button
          v-if="canEditar && selected && !selected.deleted_at"
          type="button"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="modals.detail = false; openEdit(selected)"
        >
          Editar
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Editar ──────────────────────────────────────────────────── -->
    <ModalBase
      v-model="modals.edit"
      title="Editar matrícula"
      description="Modifica los datos de la matrícula seleccionada."
      size="xl"
    >
      <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitEdit">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          help="Notas internas opcionales."
        />
        <p v-if="fieldErrors.observaciones?.[0]" class="text-xs text-red-600">
          {{ fieldErrors.observaciones[0] }}
        </p>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="closeEdit"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="submitEdit"
        >
          <span
            v-if="saving"
            class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {{ saving ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar ────────────────────────────────────────────────── -->
    <ModalBase
      v-model="modals.delete"
      title="Eliminar matrícula"
      description="La matrícula se moverá a la papelera. Podrás restaurarla en cualquier momento."
      size="sm"
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar la matrícula de
          <strong>{{ selected?.estudiante?.name }}</strong>
          en el curso <strong>{{ selected?.curso?.nombre }}</strong>?
        </p>
        <p class="mt-1 text-xs text-slate-400">
          Si la matrícula está activa, el contador de inscritos del ciclo se decrementará.
        </p>
        <div
          v-if="actionError"
          class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="modals.delete = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmDelete"
        >
          <span
            v-if="saving"
            class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {{ saving ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Restaurar ───────────────────────────────────────────────── -->
    <ModalBase
      v-model="modals.restore"
      title="Restaurar matrícula"
      description="La matrícula volverá a estar disponible en el sistema."
      size="sm"
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Restaurar la matrícula de
          <strong>{{ selected?.estudiante?.name }}</strong>?
          Si su estado es Activo, el contador de inscritos del ciclo se incrementará.
        </p>
        <div
          v-if="actionError"
          class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="modals.restore = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
          @click="confirmRestore"
        >
          <span
            v-if="saving"
            class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {{ saving ? 'Restaurando...' : 'Restaurar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar permanente ────────────────────────────────────── -->
    <ModalBase
      v-model="modals.forceDelete"
      title="Eliminar permanentemente"
      description="Esta acción no se puede deshacer. El registro será eliminado definitivamente."
      size="sm"
    >
      <div class="pb-2">
        <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          ⚠ Esta operación es <strong>irreversible</strong>.
        </div>
        <p class="mt-3 text-sm text-slate-700">
          ¿Eliminar permanentemente la matrícula de
          <strong>{{ selected?.estudiante?.name }}</strong>?
          Asegúrate de que no tenga recibos de pago asociados.
        </p>
        <div
          v-if="actionError"
          class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="modals.forceDelete = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmForceDelete"
        >
          <span
            v-if="saving"
            class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {{ saving ? 'Eliminando...' : 'Eliminar definitivamente' }}
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import DataTable    from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge  from '@/components/activos/StatusBadge.vue'
import StatCard     from '@/components/dashboard/StatCard.vue'
import ModalBase    from '@/components/ModalBase.vue'
import NavIcon      from '@/components/icons/NavIcon.vue'
import FormInput    from '@/components/forms/FormInput.vue'
import FormSelect   from '@/components/forms/FormSelect.vue'
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import MatriculaWizardModal from '@/components/academico/MatriculaWizardModal.vue'
import MatriculaPrintModal  from '@/components/academico/MatriculaPrintModal.vue'
import { buildPrintDataFromRecord, fetchAllPoblaciones } from '@/composables/useMatriculaWizard.js'

import matriculaService from '@/services/matriculaService.js'
import cicloService     from '@/services/cicloService.js'
import sedeService      from '@/services/sedeService.js'
import userService      from '@/services/userService.js'
import { useNotification } from '@/composables/useNotification'
import { nombreCompleto } from '@/utils/formatters.js'

const route = useRoute()
const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Permisos ─────────────────────────────────────────────────────────────────
const canCrear    = ref(true)
const canEditar   = ref(true)
const canInactivar = ref(true)

// ─── Estado general ───────────────────────────────────────────────────────────
const loading   = ref(false)
const saving    = ref(false)
const apiError  = ref('')
const actionError = ref('')

// ─── Estadísticas ─────────────────────────────────────────────────────────────
const stats = reactive({ total: 0, activas: 0, anuladas: 0, montoTotal: 0 })

// ─── Tabla ────────────────────────────────────────────────────────────────────
const matriculas = ref([])
const pagination = ref(null)
const selected   = ref(null)

const columns = [
  { key: 'estudiante',      label: 'Estudiante'      },
  { key: 'curso',           label: 'Curso / Ciclo'   },
  { key: 'fecha_matricula', label: 'Fecha matrícula', format: 'date' },
  { key: 'monto',           label: 'Monto',           format: 'currency' },
  { key: 'status',          label: 'Estado'          }
]

// ─── Filtros ──────────────────────────────────────────────────────────────────
const filters = reactive({
  search:      '',
  status:      '',
  curso_id:    '',
  ciclo_id:    '',
  only_trashed: false
})
let searchTimer = null

const hasActiveFilters = computed(() =>
  !!filters.search || !!filters.status || !!filters.curso_id ||
  !!filters.ciclo_id || filters.only_trashed
)

const statusFilterOptions = [
  { value: '',  label: 'Todos los estados' },
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' },
  { value: '2', label: 'Anulado' }
]

// ─── Datos de referencia ──────────────────────────────────────────────────────
const cursosRef      = ref([])
const ciclosRef      = ref([])
const estudiantesRef = ref([])
const comercialesRef = ref([])
const sedesRef       = ref([])

// ─── Modales ──────────────────────────────────────────────────────────────────
const wizardOpen = ref(false)
const printModalOpen = ref(false)
const printData = ref(null)
const printing = ref(null)
const modals = reactive({ edit: false, detail: false, delete: false, restore: false, forceDelete: false })

// ─── Catálogos para reimprimir desde el listado (carga perezosa, una sola vez) ─
const printLookups = { catalogs: {}, poblaciones: [] }
let printLookupsPromise = null

async function ensurePrintLookups() {
  if (!printLookupsPromise) {
    printLookupsPromise = Promise.all([
      matriculaService.getFilters(),
      fetchAllPoblaciones()
    ]).then(([filtersRes, poblaciones]) => {
      printLookups.catalogs    = filtersRes?.data ?? {}
      printLookups.poblaciones = poblaciones
    })
  }
  return printLookupsPromise
}

// ─── Formulario de edición ────────────────────────────────────────────────────
const EMPTY_FORM = () => ({
  curso_id:           '',
  ciclo_id:           '',
  estudiante_id:      '',
  matriculado_por_id: '',
  comercial_id:       '',
  fecha_matricula:    '',
  fecha_inicio:       '',
  monto:              '',
  observaciones:      '',
  status:             '1'
})

const form        = reactive(EMPTY_FORM())
const fieldErrors = ref({})
const editCiclosOptions = ref([])

// ─── Computed: opciones de selectores ────────────────────────────────────────
const cursosOptions = computed(() =>
  cursosRef.value.map(c => ({ value: String(c.id), label: c.nombre }))
)

const cursosFormOptions = computed(() =>
  cursosRef.value.map(c => ({ value: String(c.id), label: c.nombre }))
)

const ciclosOptions = computed(() =>
  ciclosRef.value.map(c => ({ value: String(c.id), label: c.nombre }))
)

const estudiantesOptions = computed(() =>
  estudiantesRef.value.map(e => ({
    value: String(e.id),
    label: nombreCompleto(e) + (e.email ? ` (${e.email})` : '')
  }))
)

const comercialesOptions = computed(() =>
  comercialesRef.value.map(u => ({ value: String(u.id), label: nombreCompleto(u) }))
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

function formatCOP(val) {
  if (val === null || val === undefined || val === '') return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(val)
}

function statusVariant(status) {
  switch (Number(status)) {
    case 1:  return 'activo'
    case 2:  return 'baja'
    default: return 'inactivo'
  }
}

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadData(page = pagination.value?.current_page ?? 1) {
  loading.value  = true
  apiError.value = ''
  try {
    const params = {
      with:           'curso,ciclo,estudiante',
      sort_by:        'fecha_matricula',
      sort_direction: 'desc',
      per_page:       15,
      page
    }
    if (filters.search)        params.search       = filters.search
    if (filters.status !== '') params.status        = filters.status
    if (filters.curso_id)      params.curso_id      = filters.curso_id
    if (filters.ciclo_id)      params.ciclo_id      = filters.ciclo_id
    if (filters.only_trashed)  params.only_trashed  = true

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
    const d   = res.data
    stats.total      = d.totales?.total      ?? 0
    stats.activas    = d.por_status?.activas  ?? 0
    stats.anuladas   = d.por_status?.anuladas ?? 0
    stats.montoTotal = d.monto_total          ?? 0
  } catch { /* informativo — no bloquea la vista */ }
}

async function loadFilters() {
  try {
    const res = await matriculaService.getFilters()
    cursosRef.value      = res.data?.cursos      ?? []
    ciclosRef.value      = res.data?.ciclos       ?? []
    estudiantesRef.value = res.data?.estudiantes  ?? []
  } catch { /* silencioso */ }
}

async function loadSedes() {
  try {
    const res = await sedeService.getActivas({ with: 'poblacion' })
    sedesRef.value = res.data ?? []
  } catch { /* silencioso */ }
}

async function loadComerciales() {
  try {
    const res = await userService.getAll({
      with:           'roles',
      per_page:       200,
      sort_by:        'name',
      sort_direction: 'asc'
    })
    // Excluir usuarios cuyo único rol sea alumno
    comercialesRef.value = (res.data ?? []).filter(
      u => !u.roles?.length || !u.roles.every(r => r === 'alumno' || r?.name === 'alumno')
    )
  } catch { /* silencioso */ }
}

// ─── Watchers de filtros ──────────────────────────────────────────────────────
watch(
  () => [filters.status, filters.curso_id, filters.ciclo_id, filters.only_trashed],
  () => loadData(1)
)

watch(
  () => filters.search,
  () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => loadData(1), 400)
  }
)

function clearFilters() {
  filters.search      = ''
  filters.status      = ''
  filters.curso_id    = ''
  filters.ciclo_id    = ''
  filters.only_trashed = false
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadData(1), 400)
}

function onPageChange(page) {
  loadData(page)
}

// ─── Wizard: crear ────────────────────────────────────────────────────────────
function openCreate() {
  wizardOpen.value = true
}

function onWizardSaved(printSnapshot) {
  wizardOpen.value     = false
  printData.value      = printSnapshot
  printModalOpen.value = true
  Promise.all([loadData(1), loadStatistics()])
}

// ─── Imprimir hoja de matrícula desde el listado ──────────────────────────────
async function handlePrintRow(row) {
  printing.value = row.id
  try {
    await ensurePrintLookups()
    const res = await matriculaService.getById(row.id, {
      with: 'curso,ciclo,estudiante,matriculadoPor,comercial'
    })
    const record = res.data

    // El endpoint de matrículas no resuelve la relación anidada `ciclo.sede`;
    // se consulta el ciclo por separado para obtener el nombre de la sede.
    if (record.ciclo?.id) {
      try {
        const cicloRes = await cicloService.getById(record.ciclo.id, { with: 'sede' })
        record.ciclo.sede = cicloRes.data?.sede ?? null
      } catch { /* se imprime sin sede si la consulta falla */ }
    }

    printData.value      = buildPrintDataFromRecord(record, printLookups)
    printModalOpen.value = true
  } catch (e) {
    notifyError(e?.response?.data?.message ?? 'No se pudo cargar la información para imprimir.')
  } finally {
    printing.value = null
  }
}

// ─── Modal: detalle ───────────────────────────────────────────────────────────
async function openDetail(row) {
  selected.value    = row
  modals.detail     = true
  try {
    const res = await matriculaService.getById(row.id, {
      with: 'curso,ciclo,estudiante,matriculadoPor,comercial,recibosPago'
    })
    selected.value = res.data
  } catch { /* usar datos del listado si falla */ }
}

// ─── Modal: editar ────────────────────────────────────────────────────────────
async function openEdit(row) {
  selected.value    = row
  fieldErrors.value = {}

  Object.assign(form, {
    curso_id:           String(row.curso_id          ?? ''),
    ciclo_id:           String(row.ciclo_id           ?? ''),
    estudiante_id:      String(row.estudiante_id      ?? ''),
    matriculado_por_id: String(row.matriculado_por_id ?? ''),
    comercial_id:       String(row.comercial_id       ?? ''),
    fecha_matricula:    row.fecha_matricula ?? '',
    fecha_inicio:       row.fecha_inicio   ?? '',
    monto:              row.monto          ?? '',
    observaciones:      row.observaciones  ?? '',
    status:             String(row.status  ?? '1')
  })

  editCiclosOptions.value = ciclosRef.value
    .filter(c => !form.curso_id || String(c.curso_id) === String(form.curso_id))
    .map(c => ({ value: String(c.id), label: c.nombre }))

  if (!editCiclosOptions.value.length && form.curso_id) {
    try {
      const res = await cicloService.getAll({ curso_id: form.curso_id, status: 1, per_page: 100 })
      editCiclosOptions.value = (res.data ?? []).map(c => ({ value: String(c.id), label: c.nombre }))
    } catch { /* silencioso */ }
  }

  modals.edit = true
}

function closeEdit() {
  modals.edit       = false
  fieldErrors.value = {}
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
    if (form.fecha_matricula)    payload.fecha_matricula     = form.fecha_matricula
    if (form.fecha_inicio)       payload.fecha_inicio        = form.fecha_inicio
    if (form.monto !== '')       payload.monto               = Number(form.monto)
    if (form.status !== '')      payload.status              = Number(form.status)
    payload.observaciones = form.observaciones || null

    await matriculaService.update(selected.value.id, payload)
    notifySuccess('La matrícula fue actualizada correctamente.')
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

// ─── Modales de acción (eliminar / restaurar / forzar) ───────────────────────
function openDelete(row) {
  selected.value   = row
  actionError.value = ''
  modals.delete    = true
}

function openRestore(row) {
  selected.value    = row
  actionError.value = ''
  modals.restore    = true
}

function openForceDelete(row) {
  selected.value      = row
  actionError.value   = ''
  modals.forceDelete  = true
}

async function confirmDelete() {
  saving.value      = true
  actionError.value = ''
  try {
    await matriculaService.delete(selected.value.id)
    notifySuccess(`Matrícula de ${selected.value.estudiante?.name ?? 'estudiante'} eliminada.`)
    modals.delete = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar la matrícula.'
  } finally {
    saving.value = false
  }
}

async function confirmRestore() {
  saving.value      = true
  actionError.value = ''
  try {
    await matriculaService.restore(selected.value.id)
    notifySuccess(`Matrícula de ${selected.value.estudiante?.name ?? 'estudiante'} restaurada.`)
    modals.restore = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar la matrícula.'
  } finally {
    saving.value = false
  }
}

async function confirmForceDelete() {
  saving.value      = true
  actionError.value = ''
  try {
    await matriculaService.forceDelete(selected.value.id)
    notifySuccess('Matrícula eliminada permanentemente.')
    modals.forceDelete = false
    await Promise.all([loadData(), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ??
      'No se pudo eliminar permanentemente. Verifica que no tenga recibos asociados.'
  } finally {
    saving.value = false
  }
}

// ─── Montaje ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadData(),
    loadStatistics(),
    loadFilters(),
    loadSedes(),
    loadComerciales()
  ])

  if (route.query.action === 'create' && canCrear.value) {
    openCreate()
  }
})
</script>
