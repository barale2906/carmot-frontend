<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-dias-heading">
      <h2 id="stats-dias-heading" class="sr-only">Resumen del calendario laboral</h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-4" role="list">
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.totales?.activos ?? '—'"
            description="Días que afectan el calendario"
            icon="calendario"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Festivos"
            :value="stats.por_tipo?.festivo ?? 0"
            description="Festivos activos registrados"
            icon="pendientes"
            icon-variant="red"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Generales"
            :value="stats.alcance?.generales ?? '—'"
            description="Aplican a todas las sedes"
            icon="activos"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Por sede"
            :value="stats.alcance?.por_sede ?? '—'"
            description="Cierres o festivos locales"
            icon="location"
            icon-variant="slate"
          />
        </li>
      </ul>
    </section>

    <!-- Filtros y acciones -->
    <section aria-labelledby="filtros-dias-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-dias-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <!-- Selector de año -->
        <div class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-900">Año:</span>
          <div class="flex h-9 items-center rounded-lg bg-[#f3f3f5]">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-l-lg text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Año anterior"
              @click="cambiarAnio(-1)"
            >
              <NavIcon name="expand_more" class="size-4 rotate-90" />
            </button>
            <span class="w-14 text-center text-sm font-medium text-slate-900">{{ anio }}</span>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-r-lg text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Año siguiente"
              @click="cambiarAnio(1)"
            >
              <NavIcon name="expand_more" class="size-4 -rotate-90" />
            </button>
          </div>
        </div>

        <div class="w-full sm:w-[200px]">
          <FormSelect
            v-model="filters.sede_id"
            label="Sede:"
            placeholder="Todas las sedes"
            help="Con una sede se muestran sus días y los generales."
            :options="sedeOptions"
            @change="recargar"
          />
        </div>

        <!-- Filtros exclusivos de la vista de lista -->
        <template v-if="vista === 'lista'">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre u observaciones..."
              @input="onSearchInput"
            />
          </div>
          <div class="w-full sm:w-[160px]">
            <FormSelect
              v-model="filters.tipo"
              label="Tipo:"
              placeholder="Todos"
              :options="filterTipoOptions"
              @change="loadDias(1)"
            />
          </div>
          <div class="w-full sm:w-[140px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              placeholder="Todos"
              :options="statusOptions"
              @change="loadDias(1)"
            />
          </div>
        </template>

        <!-- Alternar vista calendario / lista -->
        <div class="flex h-9 rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Tipo de vista">
          <button
            v-for="opcion in VISTAS"
            :key="opcion.value"
            type="button"
            class="rounded-md px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="vista === opcion.value ? 'bg-[#213360] text-white' : 'text-slate-600 hover:bg-slate-100'"
            :aria-pressed="vista === opcion.value"
            @click="cambiarVista(opcion.value)"
          >
            {{ opcion.label }}
          </button>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button
          v-if="can('co_diaNoLaborableCrear')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="openCreate()"
        >
          <NavIcon name="plus" class="size-4" />
          Nuevo día
        </button>
        <button
          v-if="can('co_diaNoLaborableCrear')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="openRango"
        >
          <NavIcon name="calendar_today" class="size-4" />
          Registrar rango
        </button>
        <button
          v-if="can('co_diaNoLaborableCrear')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="openFestivos"
        >
          <NavIcon name="event_note" class="size-4" />
          Generar festivos {{ anio }}
        </button>
        <button
          v-if="can('co_diaNoLaborableInactivar')"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="openTrashed"
        >
          <NavIcon name="trash" class="size-4" />
          Papelera
        </button>
      </div>
    </section>

    <CiclosRecalculadosAviso :ciclos="ciclosRecalculados" @close="ciclosRecalculados = []" />

    <div
      v-if="actionError"
      class="flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4"
    >
      <NavIcon name="pendientes" class="mt-0.5 size-4 shrink-0 text-red-500" />
      <p class="text-sm text-red-700">{{ actionError }}</p>
      <button
        type="button"
        class="ml-auto shrink-0 text-sm font-medium text-red-700 underline"
        @click="actionError = ''"
      >
        Cerrar
      </button>
    </div>

    <!-- Vista calendario -->
    <section v-if="vista === 'calendario'" aria-labelledby="calendario-dias-heading">
      <SectionHeader
        id="calendario-dias-heading"
        :title="`Calendario ${anio}`"
        :description="calendarioDescripcion"
        class="mb-4"
      />

      <div
        v-if="calendarioLoading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando calendario...</span>
      </div>

      <div v-else-if="calendarioError" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ calendarioError }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadCalendario">
          Reintentar
        </button>
      </div>

      <template v-else>
        <div
          v-if="!calendarioDias.length && can('co_diaNoLaborableCrear')"
          class="mb-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-dashed border-slate-300 bg-slate-50 px-4 py-3"
        >
          <p class="text-sm text-slate-600">No hay días no laborables registrados en {{ anio }}.</p>
          <button
            type="button"
            class="text-sm font-medium text-[#213360] underline"
            @click="openFestivos"
          >
            Generar los festivos de Colombia
          </button>
        </div>

        <CalendarioAnualNoLaborables
          :anio="anio"
          :dias="calendarioDias"
          :tipos="tipos"
          :can-create="can('co_diaNoLaborableCrear')"
          :can-edit="can('co_diaNoLaborableEditar')"
          @select-dia="openEdit"
          @select-fecha="openCreate"
        />
      </template>
    </section>

    <!-- Vista lista -->
    <section v-else aria-labelledby="listado-dias-heading">
      <SectionHeader
        id="listado-dias-heading"
        :title="`Días no laborables ${anio}`"
        description="Solo los días activos afectan el cálculo de fechas de ciclos y clases."
        class="mb-4"
      />

      <div
        v-if="loading"
        class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16"
      >
        <span class="text-sm text-slate-500">Cargando días...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadDias(1)">
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="dias"
        row-key="id"
        aria-label="Listado de días no laborables"
        actions-first
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'fecha'">
            <span class="font-medium text-slate-900">{{ formatFechaLarga(value) }}</span>
          </template>
          <template v-else-if="column.key === 'tipo'">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="ESTILOS_TIPO_DIA[value]?.badge ?? ESTILOS_TIPO_DIA.otro.badge"
            >
              {{ row.tipo_text ?? value }}
            </span>
          </template>
          <template v-else-if="column.key === 'sede'">
            <span v-if="row.todas_las_sedes" class="text-slate-500">Todas las sedes</span>
            <span v-else>{{ row.sede?.nombre ?? '—' }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status === 1 ? 'Activo' : 'Inactivo')"
              :variant="row.status === 1 ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
        </template>

        <template #actions="{ row }">
          <button
            v-if="can('co_diaNoLaborableEditar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar"
            @click="openEdit(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
          <button
            v-if="can('co_diaNoLaborableInactivar')"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            title="Eliminar"
            :disabled="!!deleting[row.id]"
            @click="handleDelete(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} días
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadDias(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="loadDias(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- Modal: Crear / Editar día -->
    <ModalBase
      v-model="showForm"
      :title="editingDia ? 'Editar día no laborable' : 'Nuevo día no laborable'"
      description="Los ciclos afectados se recalculan automáticamente al guardar."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="calendario" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleSubmit">
        <FormInput
          v-model="form.fecha"
          label="Fecha"
          type="date"
          required
          :error="formErrors.fecha?.[0]"
        />
        <FormInput
          v-model="form.nombre"
          label="Nombre"
          placeholder="Ej: Aniversario del instituto"
          required
          :error="formErrors.nombre?.[0]"
        />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="form.tipo"
            label="Tipo"
            :options="tipoOptions"
            required
            :error="formErrors.tipo?.[0]"
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            help="Solo los días activos afectan el calendario."
            :options="statusFormOptions"
            :error="formErrors.status?.[0]"
          />
        </div>
        <FormSelect
          v-model="form.sede_id"
          label="Alcance"
          placeholder="Todas las sedes"
          help="Sin sede aplica a todas. Con sede, solo a esa (cierres locales, festivos municipales)."
          :options="sedeOptions"
          :error="formErrors.sede_id?.[0]"
        />
        <FormTextarea
          v-model="form.observaciones"
          label="Observaciones"
          placeholder="Opcional"
          :rows="2"
        />

        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ formError }}</p>
        </div>
      </form>

      <template #footer>
        <button
          v-if="editingDia && can('co_diaNoLaborableInactivar')"
          type="button"
          class="mr-auto rounded-lg px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="deleteFromForm"
        >
          Eliminar
        </button>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showForm = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleSubmit"
        >
          {{ saving ? 'Guardando...' : (editingDia ? 'Guardar cambios' : 'Registrar día') }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Registrar rango -->
    <ModalBase
      v-model="showRango"
      title="Registrar rango de días"
      description="Crea un día no laborable por cada fecha del rango (máximo 366). Las fechas ya registradas se omiten."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="calendar_today" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleRango">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="rangoForm.fecha_inicio"
            label="Desde"
            type="date"
            required
            :error="rangoErrors.fecha_inicio?.[0]"
          />
          <FormInput
            v-model="rangoForm.fecha_fin"
            label="Hasta"
            type="date"
            required
            :min="rangoForm.fecha_inicio || undefined"
            :error="rangoErrors.fecha_fin?.[0]"
          />
        </div>
        <FormInput
          v-model="rangoForm.nombre"
          label="Nombre"
          placeholder="Ej: Vacaciones colectivas"
          required
          :error="rangoErrors.nombre?.[0]"
        />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="rangoForm.tipo"
            label="Tipo"
            :options="tipoOptions"
            required
            :error="rangoErrors.tipo?.[0]"
          />
          <FormSelect
            v-model="rangoForm.sede_id"
            label="Alcance"
            placeholder="Todas las sedes"
            :options="sedeOptions"
            :error="rangoErrors.sede_id?.[0]"
          />
        </div>
        <p v-if="rangoTotalDias" class="text-xs text-slate-500">
          El rango abarca {{ rangoTotalDias }} {{ rangoTotalDias === 1 ? 'día' : 'días' }} (incluye fines de semana).
        </p>

        <div v-if="rangoError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ rangoError }}</p>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showRango = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleRango"
        >
          {{ saving ? 'Registrando...' : 'Registrar rango' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Generar festivos -->
    <ModalBase
      v-model="showFestivos"
      title="Generar festivos de Colombia"
      description="Crea los 18 festivos nacionales del año (Ley Emiliani y los que dependen de la Pascua)."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="event_note" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="handleFestivos">
        <FormInput
          v-model="festivosForm.anio"
          label="Año"
          type="number"
          min="2000"
          max="2100"
          required
          :error="festivosErrors.anio?.[0]"
        />
        <FormSelect
          v-model="festivosForm.sede_id"
          label="Alcance"
          placeholder="Todas las sedes"
          :options="sedeOptions"
          :error="festivosErrors.sede_id?.[0]"
        />
        <p class="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Puede ejecutarse varias veces sin duplicar. Cada festivo queda como un día normal que se puede editar
          o eliminar; un festivo eliminado no se vuelve a crear al generar el año otra vez (hay que restaurarlo
          desde la papelera).
        </p>

        <div v-if="festivosError" class="rounded-lg border border-red-200 bg-red-50 p-3">
          <p class="text-sm text-red-700">{{ festivosError }}</p>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showFestivos = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="saving"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          @click="handleFestivos"
        >
          {{ saving ? 'Generando...' : 'Generar festivos' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Resultado de alta masiva (rango / festivos) -->
    <ModalBase
      v-model="showResultado"
      title="Resultado del registro"
      :description="resultado.message"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-emerald-600">
          <NavIcon name="check" class="size-5" />
        </span>
      </template>

      <div class="flex flex-col gap-4 pb-2">
        <div v-if="resultado.creados.length">
          <p class="mb-2 text-sm font-medium text-slate-900">Creados ({{ resultado.creados.length }})</p>
          <ul class="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-100">
            <li v-for="dia in resultado.creados" :key="dia.id" class="flex justify-between gap-3 px-3 py-2 text-xs">
              <span class="text-slate-700">{{ formatFechaLarga(dia.fecha) }}</span>
              <span class="text-right text-slate-500">{{ dia.nombre }}</span>
            </li>
          </ul>
        </div>
        <div v-if="resultado.omitidos.length">
          <p class="mb-2 text-sm font-medium text-slate-900">Omitidos ({{ resultado.omitidos.length }})</p>
          <ul class="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50">
            <li v-for="item in resultado.omitidos" :key="item.fecha" class="flex justify-between gap-3 px-3 py-2 text-xs">
              <span class="text-amber-900">{{ formatFechaLarga(item.fecha) }}</span>
              <span class="text-right text-amber-800">{{ item.motivo }}</span>
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showResultado = false"
        >
          Entendido
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Papelera -->
    <ModalBase
      v-model="showTrashed"
      title="Papelera de días no laborables"
      description="Días eliminados. Restaurarlos vuelve a recalcular los ciclos afectados."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-slate-500">
          <NavIcon name="trash" class="size-5" />
        </span>
      </template>

      <div v-if="trashedLoading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-500">Cargando papelera...</span>
      </div>

      <div v-else-if="!trashedDias.length" class="py-6 text-center text-sm text-slate-400">
        No hay días eliminados.
      </div>

      <ul v-else class="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
        <li
          v-for="item in trashedDias"
          :key="item.id"
          class="flex items-center justify-between gap-3 py-3"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-900">{{ item.nombre }}</p>
            <p class="text-xs text-slate-400">
              {{ formatFechaLarga(item.fecha) }} · {{ item.sede?.nombre ?? 'Todas las sedes' }}
            </p>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              :disabled="restoringId === item.id"
              class="rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              @click="handleRestore(item)"
            >
              Restaurar
            </button>
            <button
              type="button"
              :disabled="forceDeleting === item.id"
              class="rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-800 transition-colors hover:bg-red-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              @click="handleForceDelete(item)"
            >
              Eliminar definitivo
            </button>
          </div>
        </li>
      </ul>

      <p v-if="trashedError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ trashedError }}</p>

      <template #footer>
        <button
          type="button"
          class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showTrashed = false"
        >
          Cerrar
        </button>
      </template>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import diaNoLaborableService       from '@/services/diaNoLaborableService.js'
import sedeService                 from '@/services/sedeService.js'
import StatCard                    from '@/components/dashboard/StatCard.vue'
import SectionHeader               from '@/components/activos/SectionHeader.vue'
import DataTable                   from '@/components/activos/DataTable.vue'
import StatusBadge                 from '@/components/activos/StatusBadge.vue'
import NavIcon                     from '@/components/icons/NavIcon.vue'
import FormInputSearch             from '@/components/forms/FormInputSearch.vue'
import FormInput                   from '@/components/forms/FormInput.vue'
import FormSelect                  from '@/components/forms/FormSelect.vue'
import FormTextarea                from '@/components/forms/FormTextarea.vue'
import ModalBase                   from '@/components/ModalBase.vue'
import CalendarioAnualNoLaborables from '@/components/configuracion/CalendarioAnualNoLaborables.vue'
import CiclosRecalculadosAviso     from '@/components/configuracion/CiclosRecalculadosAviso.vue'
import { useNotification }         from '@/composables/useNotification'
import { usePermisos }             from '@/composables/usePermisos'
import { useConfirm }              from '@/composables/useConfirm'
import { ESTILOS_TIPO_DIA, formatFechaLarga } from '@/utils/calendario.js'

const { success: notifySuccess } = useNotification()
const { can, loadPermisos }      = usePermisos()
const { confirm }                = useConfirm()

const VISTAS = [
  { value: 'calendario', label: 'Calendario' },
  { value: 'lista',      label: 'Lista' }
]

// Respaldo si /filters/options no responde: mismos tipos que define el backend
const TIPOS_POR_DEFECTO = {
  festivo:       'Festivo',
  vacaciones:    'Vacaciones',
  institucional: 'Institucional',
  otro:          'Otro'
}

const statusOptions = [
  { value: '',  label: 'Todos' },
  { value: '1', label: 'Activo' },
  { value: '0', label: 'Inactivo' }
]

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]

const tableColumns = [
  { key: 'fecha',         label: 'Fecha' },
  { key: 'nombre',        label: 'Nombre' },
  { key: 'tipo',          label: 'Tipo' },
  { key: 'sede',          label: 'Alcance' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'status',        label: 'Estado' }
]

// ─── Estado general ───────────────────────────────────────────────────────────
const anio               = ref(new Date().getFullYear())
const vista              = ref('calendario')
const filters            = reactive({ sede_id: '', search: '', tipo: '', status: '' })
const tipos              = ref({ ...TIPOS_POR_DEFECTO })
const sedes              = ref([])
const stats              = reactive({ totales: null, por_tipo: null, alcance: null })
const ciclosRecalculados = ref([])
const actionError        = ref('')

const tipoOptions       = computed(() => Object.entries(tipos.value).map(([value, label]) => ({ value, label })))
const filterTipoOptions = computed(() => [{ value: '', label: 'Todos' }, ...tipoOptions.value])
const sedeOptions       = computed(() => [
  { value: '', label: 'Todas las sedes' },
  ...sedes.value.map((s) => ({ value: String(s.id), label: s.nombre }))
])

const calendarioDescripcion = computed(() => {
  const base = filters.sede_id
    ? 'Días de la sede seleccionada más los generales.'
    : 'Días de todas las sedes.'
  return `${base} Pulsa un día marcado para editarlo o uno libre para registrarlo.`
})

async function loadMasterData() {
  const [sedesRes, filtrosRes] = await Promise.allSettled([
    sedeService.getAll({ per_page: 100, sort_by: 'nombre' }),
    diaNoLaborableService.getFilters()
  ])
  if (sedesRes.status === 'fulfilled')  sedes.value = sedesRes.value.data ?? []
  if (filtrosRes.status === 'fulfilled' && filtrosRes.value.data?.tipos) tipos.value = filtrosRes.value.data.tipos
}

async function loadStatistics() {
  try {
    const res = await diaNoLaborableService.getStatistics()
    const d   = res.data ?? {}
    stats.totales  = d.totales  ?? null
    stats.por_tipo = d.por_tipo ?? null
    stats.alcance  = d.alcance  ?? null
  } catch { /* informativo */ }
}

function recargar() {
  if (vista.value === 'calendario') loadCalendario()
  else loadDias(1)
}

function cambiarAnio(delta) {
  anio.value += delta
  recargar()
}

function cambiarVista(valor) {
  if (vista.value === valor) return
  vista.value = valor
  recargar()
}

/** Tras cualquier cambio en el calendario: refresca datos y muestra los ciclos afectados. */
function afterCambio(res) {
  ciclosRecalculados.value = res?.meta?.ciclos_recalculados ?? []
  recargar()
  loadStatistics()
}

// ─── Calendario anual ─────────────────────────────────────────────────────────
const calendarioDias    = ref([])
const calendarioLoading = ref(false)
const calendarioError   = ref('')

async function loadCalendario() {
  calendarioLoading.value = true
  calendarioError.value   = ''
  try {
    const params = { anio: anio.value }
    if (filters.sede_id) params.sede_id = filters.sede_id
    const res = await diaNoLaborableService.getCalendario(params)
    calendarioDias.value = res.data ?? []
  } catch (e) {
    calendarioError.value = e?.response?.data?.message ?? 'Error al cargar el calendario.'
  } finally {
    calendarioLoading.value = false
  }
}

// ─── Lista paginada ───────────────────────────────────────────────────────────
const dias       = ref([])
const loading    = ref(false)
const error      = ref('')
const deleting   = ref({})
const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 })

async function loadDias(page = 1) {
  loading.value = true
  error.value   = ''
  try {
    const params = { page, per_page: 15, anio: anio.value }
    if (filters.sede_id)       params.sede_id = filters.sede_id
    if (filters.search)        params.search  = filters.search
    if (filters.tipo)          params.tipo    = filters.tipo
    if (filters.status !== '') params.status  = filters.status
    const res = await diaNoLaborableService.getAll(params)
    dias.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage    = res.meta.last_page
      pagination.total       = res.meta.total
      pagination.from        = res.meta.from ?? 0
      pagination.to          = res.meta.to   ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los días no laborables.'
  } finally {
    loading.value = false
  }
}

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadDias(1), 400)
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────
async function handleDelete(row) {
  const ok = await confirm(
    `¿Eliminar "${row.nombre}" (${formatFechaLarga(row.fecha)})? Los ciclos afectados se recalcularán.`,
    { title: 'Eliminar día no laborable', confirmLabel: 'Eliminar' }
  )
  if (!ok) return false
  deleting.value    = { ...deleting.value, [row.id]: true }
  actionError.value = ''
  try {
    const res = await diaNoLaborableService.delete(row.id)
    notifySuccess('Día no laborable eliminado.')
    afterCambio(res)
    return true
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'No se pudo eliminar el día.'
    return false
  } finally {
    const next = { ...deleting.value }
    delete next[row.id]
    deleting.value = next
  }
}

async function deleteFromForm() {
  if (await handleDelete(editingDia.value)) showForm.value = false
}

// ─── Formulario Crear / Editar ────────────────────────────────────────────────
const showForm   = ref(false)
const editingDia = ref(null)
const saving     = ref(false)
const formError  = ref('')
const formErrors = ref({})

const form = reactive({ fecha: '', nombre: '', tipo: 'festivo', sede_id: '', observaciones: '', status: 1 })

function resetFormErrors() {
  formError.value  = ''
  formErrors.value = {}
}

/** @param {string} [fecha] fecha pre-seleccionada desde el calendario */
function openCreate(fecha = '') {
  editingDia.value   = null
  form.fecha         = typeof fecha === 'string' ? fecha : ''
  form.nombre        = ''
  form.tipo          = 'festivo'
  form.sede_id       = filters.sede_id
  form.observaciones = ''
  form.status        = 1
  resetFormErrors()
  showForm.value     = true
}

function openEdit(row) {
  editingDia.value   = row
  form.fecha         = String(row.fecha ?? '').slice(0, 10)
  form.nombre        = row.nombre ?? ''
  form.tipo          = row.tipo ?? 'otro'
  form.sede_id       = row.sede_id ? String(row.sede_id) : ''
  form.observaciones = row.observaciones ?? ''
  form.status        = row.status ?? 1
  resetFormErrors()
  showForm.value     = true
}

async function handleSubmit() {
  resetFormErrors()
  saving.value = true
  const payload = {
    fecha:         form.fecha,
    nombre:        form.nombre.trim(),
    tipo:          form.tipo,
    sede_id:       form.sede_id ? Number(form.sede_id) : null,
    observaciones: form.observaciones?.trim() || null,
    status:        Number(form.status)
  }
  try {
    const res = editingDia.value
      ? await diaNoLaborableService.update(editingDia.value.id, payload, { _silent: true })
      : await diaNoLaborableService.create(payload, { _silent: true })
    notifySuccess(editingDia.value ? 'Día no laborable actualizado.' : 'Día no laborable registrado.')
    showForm.value = false
    afterCambio(res)
  } catch (e) {
    formErrors.value = e?.response?.status === 422 ? (e.response.data?.errors ?? {}) : {}
    formError.value  = e?.response?.data?.message ?? 'Ocurrió un error. Intenta de nuevo.'
  } finally {
    saving.value = false
  }
}

// ─── Alta masiva: rango y festivos ────────────────────────────────────────────
const showResultado = ref(false)
const resultado     = reactive({ message: '', creados: [], omitidos: [] })

function mostrarResultado(res) {
  resultado.message  = res?.message ?? ''
  resultado.creados  = res?.data?.creados  ?? []
  resultado.omitidos = res?.data?.omitidos ?? []
  showResultado.value = true
  afterCambio(res)
}

const showRango   = ref(false)
const rangoError  = ref('')
const rangoErrors = ref({})
const rangoForm   = reactive({ fecha_inicio: '', fecha_fin: '', nombre: '', tipo: 'vacaciones', sede_id: '' })

const rangoTotalDias = computed(() => {
  if (!rangoForm.fecha_inicio || !rangoForm.fecha_fin) return 0
  const dias = (new Date(rangoForm.fecha_fin) - new Date(rangoForm.fecha_inicio)) / 86_400_000 + 1
  return dias > 0 ? dias : 0
})

function openRango() {
  Object.assign(rangoForm, { fecha_inicio: '', fecha_fin: '', nombre: '', tipo: 'vacaciones', sede_id: filters.sede_id })
  rangoError.value  = ''
  rangoErrors.value = {}
  showRango.value   = true
}

async function handleRango() {
  rangoError.value  = ''
  rangoErrors.value = {}
  saving.value      = true
  try {
    const res = await diaNoLaborableService.createRango({
      fecha_inicio: rangoForm.fecha_inicio,
      fecha_fin:    rangoForm.fecha_fin,
      nombre:       rangoForm.nombre.trim(),
      tipo:         rangoForm.tipo,
      sede_id:      rangoForm.sede_id ? Number(rangoForm.sede_id) : null
    }, { _silent: true })
    showRango.value = false
    mostrarResultado(res)
  } catch (e) {
    rangoErrors.value = e?.response?.status === 422 ? (e.response.data?.errors ?? {}) : {}
    rangoError.value  = e?.response?.data?.message ?? 'No se pudo registrar el rango.'
  } finally {
    saving.value = false
  }
}

const showFestivos   = ref(false)
const festivosError  = ref('')
const festivosErrors = ref({})
const festivosForm   = reactive({ anio: '', sede_id: '' })

function openFestivos() {
  festivosForm.anio    = anio.value
  festivosForm.sede_id = ''
  festivosError.value  = ''
  festivosErrors.value = {}
  showFestivos.value   = true
}

async function handleFestivos() {
  festivosError.value  = ''
  festivosErrors.value = {}
  saving.value         = true
  try {
    const res = await diaNoLaborableService.generarFestivos({
      anio:    Number(festivosForm.anio),
      sede_id: festivosForm.sede_id ? Number(festivosForm.sede_id) : null
    }, { _silent: true })
    showFestivos.value = false
    mostrarResultado(res)
  } catch (e) {
    festivosErrors.value = e?.response?.status === 422 ? (e.response.data?.errors ?? {}) : {}
    festivosError.value  = e?.response?.data?.message ?? 'No se pudieron generar los festivos.'
  } finally {
    saving.value = false
  }
}

// ─── Papelera ─────────────────────────────────────────────────────────────────
const showTrashed    = ref(false)
const trashedDias    = ref([])
const trashedLoading = ref(false)
const trashedError   = ref('')
const restoringId    = ref(null)
const forceDeleting  = ref(null)

async function openTrashed() {
  showTrashed.value    = true
  trashedLoading.value = true
  trashedError.value   = ''
  try {
    const res = await diaNoLaborableService.getTrashed({ per_page: 100, sort_direction: 'desc' })
    trashedDias.value = res.data ?? []
  } catch {
    trashedDias.value = []
  } finally {
    trashedLoading.value = false
  }
}

async function handleRestore(item) {
  restoringId.value  = item.id
  trashedError.value = ''
  try {
    const res = await diaNoLaborableService.restore(item.id, { _silent: true })
    notifySuccess(`"${item.nombre}" restaurado.`)
    trashedDias.value = trashedDias.value.filter((d) => d.id !== item.id)
    afterCambio(res)
  } catch (e) {
    trashedError.value = e?.response?.data?.message ?? 'No se pudo restaurar el día.'
  } finally {
    restoringId.value = null
  }
}

async function handleForceDelete(item) {
  const ok = await confirm(
    `¿Eliminar permanentemente "${item.nombre}"? Esta acción no se puede deshacer.`,
    { title: 'Eliminar definitivamente', confirmLabel: 'Eliminar' }
  )
  if (!ok) return
  forceDeleting.value = item.id
  trashedError.value  = ''
  try {
    await diaNoLaborableService.forceDelete(item.id)
    notifySuccess(`"${item.nombre}" eliminado permanentemente.`)
    trashedDias.value = trashedDias.value.filter((d) => d.id !== item.id)
    loadStatistics()
  } catch (e) {
    trashedError.value = e?.response?.data?.message ?? 'No se pudo eliminar el día permanentemente.'
  } finally {
    forceDeleting.value = null
  }
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadPermisos()
  loadMasterData()
  loadStatistics()
  loadCalendario()
})
</script>
