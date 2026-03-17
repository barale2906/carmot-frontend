<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-cursos-heading">
      <h2 id="stats-cursos-heading" class="sr-only">Resumen de cursos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total cursos"
            :value="stats.total"
            description="Registrados en el sistema"
            icon="academico"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="Disponibles para matricular"
            icon="activos"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Eliminados"
            :value="stats.eliminados"
            description="En papelera (soft delete)"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Barra de filtros y acciones -->
    <section aria-labelledby="filtros-cursos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-cursos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del curso..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            :options="statusOptions"
          />
        </div>
        <div class="w-full sm:w-[200px]">
          <FormSelect
            v-model="filters.tipo"
            label="Tipo:"
            :options="tipoOptions"
          />
        </div>
        <div class="flex w-full items-end gap-2 sm:w-auto">
          <button
            v-if="viewTrashed"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="toggleTrashed"
          >
            <NavIcon name="eye" class="size-4" />
            Ver activos
          </button>
          <button
            v-else
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="toggleTrashed"
          >
            <NavIcon name="track_changes" class="size-4" />
            Ver eliminados
          </button>
          <button
            v-if="!viewTrashed"
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo curso
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de cursos -->
    <section aria-labelledby="listado-cursos-heading">
      <SectionHeader
        id="listado-cursos-heading"
        :title="viewTrashed ? 'Cursos eliminados' : 'Listado de cursos'"
        :description="viewTrashed
          ? 'Cursos en papelera. Puedes restaurarlos o eliminarlos permanentemente.'
          : 'Haz clic en el ícono de ojo para ver el detalle completo de cada curso.'"
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando cursos...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadCursos(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="cursos"
        row-key="id"
        aria-label="Listado de cursos"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'status'">
            <StatusBadge
              :label="row.status_text ?? (row.status ? 'Activo' : 'Inactivo')"
              :variant="row.status ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'tipo'">
            <span class="text-slate-700">{{ row.tipo_text ?? (row.tipo === 1 ? 'Técnico Laboral' : 'Curso Práctico') }}</span>
          </template>
          <template v-else-if="column.key === 'duracion'">
            <span class="font-medium text-slate-900">{{ value != null ? `${value}h` : '—' }}</span>
          </template>
          <template v-else-if="column.key === 'modulos_count'">
            <span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {{ value ?? row.modulos?.length ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'referidos_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? row.referidos?.length ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'estudiantes_count'">
            <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {{ value ?? row.estudiantes?.length ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ formatDate(value) }}
          </template>
          <template v-else>
            {{ value ?? '—' }}
          </template>
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
          <template v-if="!row.deleted_at">
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Editar"
              @click="openEdit(row)"
            >
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar"
              @click="openEliminar(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Restaurar"
              @click="openRestaurar(row)"
            >
              <NavIcon name="track_changes" class="size-4" />
            </button>
            <button
              type="button"
              class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Eliminar permanentemente"
              @click="openForceDelete(row)"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </template>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} cursos
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.currentPage === 1"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="goToPage(pagination.currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            :disabled="pagination.currentPage === pagination.lastPage"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="goToPage(pagination.currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>

    <!-- ── Modal: Crear / Editar ────────────────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      :title="editingCurso ? 'Editar curso' : 'Nuevo curso'"
      :description="editingCurso
        ? 'Modifica los datos del curso. Si actualizas los módulos, la duración se recalculará automáticamente.'
        : 'Completa los campos para crear un nuevo curso. Puedes asociar módulos (duración calculada) o definir la duración manualmente.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="academico" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Ej: Técnico en Soldadura"
            hint="Máximo 255 caracteres. Debe ser único."
            :required="true"
            maxlength="255"
            span="full"
          />
          <FormSelect
            v-model="form.tipo"
            label="Tipo"
            :options="tipoFormOptions"
            :required="true"
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            :options="statusFormOptions"
          />
        </div>

        <!-- Selector de módulos (combobox: escribe para filtrar) -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-900">Módulos</label>

          <div
            class="relative"
            @mousedown.prevent="moduloDropdownMousedown"
          >
            <div class="relative">
              <span
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              >
                <NavIcon name="search" class="size-4" />
              </span>
              <input
                ref="moduloComboboxInputRef"
                v-model="moduloSearch"
                type="text"
                placeholder="Escribe para buscar y agregar módulo..."
                :disabled="modulosLoading"
                autocomplete="off"
                class="w-full rounded-lg border-0 bg-[#f3f3f5] py-2 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                @focus="showModuloDropdown = true; moduloHighlightedIndex = -1"
                @blur="handleModuloComboboxBlur"
                @keydown="handleModuloComboboxKeydown"
              />
              <span
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              >
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>

            <!-- Lista desplegable filtrada -->
            <Transition
              enter-active-class="transition duration-100 ease-out"
              leave-active-class="transition duration-75 ease-in"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <ul
                v-if="showModuloDropdown && !modulosLoading"
                class="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-lg"
                role="listbox"
              >
                <li
                  v-if="modulosDisponiblesFiltrados.length === 0"
                  class="px-3 py-2 text-sm text-slate-500"
                >
                  Sin módulos que coincidan
                </li>
                <li
                  v-for="(mod, idx) in modulosDisponiblesFiltrados"
                  v-else
                  :key="mod.id"
                  :id="`modulo-option-${idx}`"
                  role="option"
                  :aria-selected="moduloHighlightedIndex === idx"
                  :class="[
                    'cursor-pointer px-3 py-2 text-sm transition-colors',
                    moduloHighlightedIndex === idx ? 'bg-blue-100 text-blue-900' : 'text-slate-900 hover:bg-blue-50 hover:text-blue-900'
                  ]"
                  @mousedown.prevent="selectModulo(mod)"
                >
                  {{ mod.duracion != null ? `${mod.duracion}h — ` : '' }}{{ mod.nombre }}
                </li>
              </ul>
            </Transition>
          </div>

          <!-- Badges de módulos seleccionados -->
          <div v-if="form.moduloIds.length" class="flex flex-wrap gap-1.5 rounded-lg border border-black/10 bg-slate-50 p-2">
            <span
              v-for="id in form.moduloIds"
              :key="id"
              class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
            >
              <button
                type="button"
                class="flex items-center gap-1 rounded-full pr-0.5 text-left transition-colors hover:bg-blue-200 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                :title="`Ver estructura de ${getModuloNombre(id)}`"
                @click="openModuloArbol(id)"
              >
                {{ getModuloNombre(id) }}{{ getModuloDuracion(id) != null ? ` (${getModuloDuracion(id)}h)` : '' }}
                <NavIcon name="eye" class="size-3.5 shrink-0 text-blue-600" />
              </button>
              <button
                type="button"
                class="flex size-3.5 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-blue-200 hover:text-blue-900 focus:outline-none"
                :aria-label="`Quitar ${getModuloNombre(id)}`"
                @click.stop="removeModulo(id)"
              >
                <svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          <p v-else class="text-xs text-slate-400">
            Sin módulos asignados. Si no agregas módulos, debes indicar la duración manualmente.
          </p>
          <p class="text-xs text-slate-500">
            La duración del curso se calcula automáticamente como la suma de las duraciones de los módulos seleccionados.
          </p>
        </div>

        <!-- Duración: siempre editable. Con módulos muestra la sumatoria como referencia. -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <FormInput
              v-model="form.duracion"
              label="Duración (horas)"
              type="number"
              placeholder="0"
              :hint="form.moduloIds.length
                ? `Suma de módulos: ${duracionCalculada}h. Puedes ajustar el valor manualmente.`
                : 'Obligatorio cuando no hay módulos. Mayor o igual a 0.'"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </div>
        <div v-if="fieldErrors && Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <ul class="list-inside list-disc space-y-1">
            <li v-for="(msgs, field) in fieldErrors" :key="field">
              <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
            </li>
          </ul>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showFormModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="formLoading"
          class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="submitForm"
        >
          <span v-if="formLoading">Guardando...</span>
          <span v-else>{{ editingCurso ? 'Guardar cambios' : 'Crear curso' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar ─────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showEliminarModal"
      title="Eliminar curso"
      description="Esta acción moverá el curso a la papelera. Podrás restaurarlo en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar
          <strong>{{ targetCurso?.nombre }}</strong>?
        </p>
        <p class="mt-2 text-xs text-slate-500">
          No se puede eliminar si el curso tiene referidos o estudiantes asociados.
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showEliminarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmEliminar"
        >
          {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Restaurar ────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showRestaurarModal"
      title="Restaurar curso"
      description="El curso volverá a estar disponible en el sistema."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar <strong>{{ targetCurso?.nombre }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showRestaurarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500"
          @click="confirmRestaurar"
        >
          {{ actionLoading ? 'Restaurando...' : 'Restaurar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Eliminar permanentemente ──────────────────────────────────── -->
    <ModalBase
      v-model="showForceDeleteModal"
      title="Eliminar permanentemente"
      description="Esta acción es irreversible. El curso se borrará de forma definitiva."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas eliminar permanentemente
          <strong>{{ targetCurso?.nombre }}</strong>?
        </p>
        <p class="mt-2 text-xs text-amber-600">
          Esta acción no se puede deshacer. No se puede eliminar si el curso tiene referidos o estudiantes asociados.
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showForceDeleteModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmForceDelete"
        >
          {{ actionLoading ? 'Eliminando...' : 'Eliminar permanentemente' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Detalle ──────────────────────────────────────────────────── -->
    <ModalBase
      v-model="showDetailModal"
      title="Detalle del curso"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="academico" class="size-5" />
        </span>
      </template>
      <div v-if="detailCurso" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailCurso.nombre }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailCurso.status_text ?? (detailCurso.status ? 'Activo' : 'Inactivo')"
                :variant="detailCurso.status ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Tipo</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailCurso.tipo_text ?? (detailCurso.tipo === 1 ? 'Técnico Laboral' : 'Curso Práctico') }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Duración</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailCurso.duracion != null ? `${detailCurso.duracion}h` : '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Módulos</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailCurso.modulos_count ?? detailCurso.modulos?.length ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Referidos</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailCurso.referidos_count ?? detailCurso.referidos?.length ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estudiantes</dt>
            <dd class="mt-0.5 text-slate-900">
              {{ detailCurso.estudiantes_count ?? detailCurso.estudiantes?.length ?? 0 }}
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailCurso.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailCurso.updated_at) }}</dd>
          </div>
          <div v-if="detailCurso.modulos?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Módulos del curso</dt>
            <dd class="mt-2 space-y-2">
              <button
                v-for="mod in detailCurso.modulos"
                :key="mod.id"
                type="button"
                class="flex w-full items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm transition-colors hover:bg-slate-100 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="openModuloArbol(mod.id, mod.nombre)"
              >
                <span class="font-medium text-slate-900">{{ mod.nombre }}</span>
                <span class="flex items-center gap-2">
                  <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    {{ mod.duracion != null ? `${mod.duracion}h` : '—' }}
                  </span>
                  <NavIcon name="eye" class="size-4 text-slate-500" />
                </span>
              </button>
            </dd>
          </div>
          <div v-if="detailCurso.referidos?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Referidos asociados</dt>
            <dd class="mt-2 space-y-2">
              <div
                v-for="ref in detailCurso.referidos"
                :key="ref.id"
                class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-900">{{ ref.nombre }}</span>
                <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {{ ref.celular ?? '—' }} · {{ ref.ciudad ?? '—' }}
                </span>
              </div>
            </dd>
          </div>
          <div v-if="detailCurso.estudiantes?.length" class="col-span-2">
            <dt class="font-medium text-slate-500">Estudiantes inscritos</dt>
            <dd class="mt-2 space-y-2">
              <div
                v-for="est in detailCurso.estudiantes"
                :key="est.id"
                class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
              >
                <span class="font-medium text-slate-900">{{ est.name ?? est.email }}</span>
                <span class="text-slate-500">{{ est.email }}</span>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </ModalBase>

    <!-- ── Modal: Árbol del módulo ────────────────────────────────────────────── -->
    <ModalBase
      v-model="showArbolModal"
      :title="moduloArbolNombre ? `Estructura: ${moduloArbolNombre}` : 'Estructura del módulo'"
      description="Tópicos y temas que componen este módulo."
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="schema" class="size-5" />
        </span>
      </template>
      <div class="max-h-[60vh] overflow-y-auto">
        <ModuloArbol v-if="moduloArbolId" :modulo-id="moduloArbolId" />
      </div>
    </ModalBase>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import cursoService from '@/services/cursoService.js'
import moduloService from '@/services/moduloService.js'
import ModuloArbol from '@/components/academico/ModuloArbol.vue'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

// ─── Estado principal ─────────────────────────────────────────────────────────
const cursos = ref([])
const loading = ref(false)
const error = ref('')
const viewTrashed = ref(false)

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const stats = reactive({ total: 0, activos: 0, eliminados: 0 })

const filters = reactive({
  search: '',
  status: '',
  tipo: ''
})

let searchTimer = null

// ─── Opciones de filtros (desde API o fallback) ───────────────────────────────
const filterOptions = reactive({
  status_options: [
    { value: '', label: 'Todos' },
    { value: '1', label: 'Activos' },
    { value: '0', label: 'Inactivos' }
  ],
  tipo_options: [
    { value: '', label: 'Todos' },
    { value: '0', label: 'Curso Práctico' },
    { value: '1', label: 'Técnico Laboral' }
  ]
})

const statusOptions = computed(() => filterOptions.status_options)
const tipoOptions = computed(() => filterOptions.tipo_options)

const statusFormOptions = [
  { value: 1, label: 'Activo' },
  { value: 0, label: 'Inactivo' }
]

const tipoFormOptions = [
  { value: 0, label: 'Curso Práctico' },
  { value: 1, label: 'Técnico Laboral' }
]

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'duracion', label: 'Duración' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'modulos_count', label: 'Módulos' },
  { key: 'referidos_count', label: 'Referidos' },
  { key: 'estudiantes_count', label: 'Estudiantes' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Creado' }
]

// ─── Watchers de filtros ──────────────────────────────────────────────────────
watch(() => filters.status, () => loadCursos(1))
watch(() => filters.tipo, () => loadCursos(1))
watch(viewTrashed, () => loadCursos(1))

// ─── Carga de datos ───────────────────────────────────────────────────────────
async function loadCursos(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const fetcher = viewTrashed.value ? cursoService.getTrashed : cursoService.getAll
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'referidos,estudiantes,modulos',
      sort_by: 'nombre',
      sort_direction: 'asc'
    }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status
    if (filters.tipo !== '') params.tipo = filters.tipo

    const res = await fetcher(params)
    cursos.value = res.data ?? []

    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from ?? 0
      pagination.to = res.meta.to ?? 0
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los cursos.'
  } finally {
    loading.value = false
  }
}

async function loadFilters() {
  try {
    const res = await cursoService.getFilters()
    const data = res.data ?? {}
    if (data.status_options && typeof data.status_options === 'object') {
      filterOptions.status_options = [
        { value: '', label: 'Todos' },
        ...Object.entries(data.status_options).map(([value, label]) => ({ value, label }))
      ]
    }
    if (data.tipo_options && typeof data.tipo_options === 'object') {
      filterOptions.tipo_options = [
        { value: '', label: 'Todos' },
        ...Object.entries(data.tipo_options).map(([value, label]) => ({ value, label }))
      ]
    }
  } catch {
    // Usar valores por defecto
  }
}

async function loadStatistics() {
  try {
    const res = await cursoService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo — no bloquea la vista
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadCursos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadCursos(page)
}

function toggleTrashed() {
  viewTrashed.value = !viewTrashed.value
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingCurso = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  nombre: '',
  duracion: 0,
  tipo: 0,
  status: 1,
  moduloIds: []
})

// ─── Catálogo de módulos ───────────────────────────────────────────────────────
const todosLosModulos = ref([])
const modulosLoading = ref(false)
const moduloSearch = ref('')
const showModuloDropdown = ref(false)
const moduloComboboxInputRef = ref(null)
const moduloHighlightedIndex = ref(-1)
/** Módulos del curso al editar (desde API) para mostrar nombres aunque no estén en catálogo */
const modulosDelCurso = ref([])

async function loadModulosCatalogo() {
  modulosLoading.value = true
  moduloSearch.value = ''
  try {
    const all = []
    let page = 1
    let lastPage = 1
    do {
      const res = await moduloService.getAll({
        page,
        per_page: 100,
        status: 1,
        sort_by: 'nombre',
        sort_direction: 'asc'
      })
      const data = res.data ?? []
      all.push(...data)
      lastPage = res.meta?.last_page ?? 1
      page++
    } while (page <= lastPage)
    todosLosModulos.value = all
  } catch {
    // No bloquea el formulario
  } finally {
    modulosLoading.value = false
  }
}

/** Módulos aún no seleccionados (para el dropdown) */
const modulosDisponibles = computed(() =>
  todosLosModulos.value.filter((m) => !form.moduloIds.includes(m.id))
)

/** Módulos disponibles filtrados por búsqueda */
const modulosDisponiblesFiltrados = computed(() => {
  const term = (moduloSearch.value ?? '').trim().toLowerCase()
  if (!term) return modulosDisponibles.value
  return modulosDisponibles.value.filter((m) =>
    (m.nombre ?? '').toLowerCase().includes(term)
  )
})

function getModuloNombre(id) {
  const fromCatalog = todosLosModulos.value.find((m) => m.id === id)
  const fromCurso = modulosDelCurso.value.find((m) => m.id === id)
  return fromCatalog?.nombre ?? fromCurso?.nombre ?? `#${id}`
}

function getModuloDuracion(id) {
  const fromCatalog = todosLosModulos.value.find((m) => m.id === id)
  const fromCurso = modulosDelCurso.value.find((m) => m.id === id)
  return fromCatalog?.duracion ?? fromCurso?.duracion ?? null
}

/** Duración calculada como suma de las duraciones de los módulos seleccionados */
const duracionCalculada = computed(() =>
  form.moduloIds.reduce((sum, id) => {
    const d = getModuloDuracion(id)
    return sum + (d != null ? Number(d) : 0)
  }, 0)
)

watch(
  () => form.moduloIds.length,
  () => {
    form.duracion = duracionCalculada.value
  }
)

watch(moduloSearch, () => {
  moduloHighlightedIndex.value = -1
})

function addModulo(rawId) {
  const id = Number(rawId)
  if (id && !form.moduloIds.includes(id)) {
    form.moduloIds.push(id)
  }
}

function selectModulo(mod) {
  addModulo(mod.id)
  moduloSearch.value = ''
  moduloHighlightedIndex.value = -1
  showModuloDropdown.value = true
  nextTick(() => moduloComboboxInputRef.value?.focus())
}

function moduloDropdownMousedown() {
  moduloComboboxInputRef.value?.focus()
}

function handleModuloComboboxBlur() {
  setTimeout(() => {
    if (document.activeElement !== moduloComboboxInputRef.value) {
      showModuloDropdown.value = false
      moduloHighlightedIndex.value = -1
    }
  }, 150)
}

function handleModuloComboboxKeydown(e) {
  const list = modulosDisponiblesFiltrados.value
  const len = list.length

  if (e.key === 'Escape') {
    showModuloDropdown.value = false
    moduloSearch.value = ''
    moduloHighlightedIndex.value = -1
    e.preventDefault()
    return
  }

  if (!showModuloDropdown.value || len === 0) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      showModuloDropdown.value = true
      moduloHighlightedIndex.value = len > 0 ? (e.key === 'ArrowDown' ? 0 : len - 1) : -1
      e.preventDefault()
    }
    return
  }

  if (e.key === 'ArrowDown') {
    moduloHighlightedIndex.value = moduloHighlightedIndex.value < len - 1 ? moduloHighlightedIndex.value + 1 : 0
    nextTick(() => document.getElementById(`modulo-option-${moduloHighlightedIndex.value}`)?.scrollIntoView({ block: 'nearest' }))
    e.preventDefault()
    return
  }

  if (e.key === 'ArrowUp') {
    moduloHighlightedIndex.value = moduloHighlightedIndex.value > 0 ? moduloHighlightedIndex.value - 1 : len - 1
    nextTick(() => document.getElementById(`modulo-option-${moduloHighlightedIndex.value}`)?.scrollIntoView({ block: 'nearest' }))
    e.preventDefault()
    return
  }

  if (e.key === 'Enter' && moduloHighlightedIndex.value >= 0 && list[moduloHighlightedIndex.value]) {
    selectModulo(list[moduloHighlightedIndex.value])
    e.preventDefault()
  }
}

function removeModulo(id) {
  const idx = form.moduloIds.indexOf(id)
  if (idx !== -1) form.moduloIds.splice(idx, 1)
}

function resetForm() {
  form.nombre = ''
  form.duracion = 0
  form.tipo = 0
  form.status = 1
  form.moduloIds.splice(0)
  moduloSearch.value = ''
  modulosDelCurso.value = []
  formError.value = ''
  fieldErrors.value = {}
}

async function openCreate() {
  editingCurso.value = null
  resetForm()
  await loadModulosCatalogo()
  showFormModal.value = true
}

async function openEdit(curso) {
  editingCurso.value = curso
  form.nombre = curso.nombre ?? ''
  form.duracion = curso.duracion ?? 0
  form.tipo = curso.tipo ?? 0
  form.status = curso.status ?? 1
  form.moduloIds.splice(0)
  modulosDelCurso.value = []
  formError.value = ''
  fieldErrors.value = {}

  // Cargar catálogo y curso con módulos en paralelo
  const [, courseRes] = await Promise.all([
    loadModulosCatalogo(),
    cursoService.getById(curso.id, { with: 'modulos' }).catch(() => null)
  ])

  const data = courseRes?.data ?? courseRes ?? {}
  const apiModulos = Array.isArray(data.modulos) ? data.modulos : []
  const rowModulos = Array.isArray(curso.modulos) ? curso.modulos : []
  const modulos = apiModulos.length > 0 ? apiModulos : rowModulos
  const moduloIds = modulos.map((m) => m.id).filter((id) => id != null)

  modulosDelCurso.value = modulos
  form.moduloIds.splice(0, form.moduloIds.length, ...moduloIds)
  if (moduloIds.length === 0 && data.duracion != null) {
    form.duracion = data.duracion
  }

  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}

  const moduloIdsCopy = [...form.moduloIds]
  const duracionVal = Number(form.duracion) >= 0 ? Number(form.duracion) : 0

  const payload = {
    nombre: form.nombre.trim(),
    tipo: Number(form.tipo),
    status: Number(form.status)
  }

  if (moduloIdsCopy.length > 0) {
    payload.modulo_ids = moduloIdsCopy
    // Backend calcula duracion automáticamente; no enviar duracion
  } else {
    payload.duracion = duracionVal
    if (editingCurso.value) {
      payload.modulo_ids = []
    }
  }

  formLoading.value = true
  try {
    if (editingCurso.value) {
      await cursoService.update(editingCurso.value.id, payload, { _silent: true })
      notifySuccess(`El curso "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await cursoService.create(payload, { _silent: true })
      notifySuccess(`El curso "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadCursos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else if (e?.response?.status === 403) {
      formError.value = 'No tienes permisos para realizar esta acción.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetCurso = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openEliminar(curso) {
  targetCurso.value = curso
  actionError.value = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await cursoService.delete(targetCurso.value.id)
    notifySuccess(`El curso "${targetCurso.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadCursos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el curso.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(curso) {
  targetCurso.value = curso
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await cursoService.restore(targetCurso.value.id)
    notifySuccess(`El curso "${targetCurso.value.nombre}" fue restaurado.`)
    showRestaurarModal.value = false
    await Promise.all([loadCursos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el curso.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Force Delete ──────────────────────────────────────────────────────
const showForceDeleteModal = ref(false)

function openForceDelete(curso) {
  targetCurso.value = curso
  actionError.value = ''
  showForceDeleteModal.value = true
}

async function confirmForceDelete() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await cursoService.forceDelete(targetCurso.value.id)
    notifySuccess(`El curso "${targetCurso.value.nombre}" fue eliminado permanentemente.`)
    showForceDeleteModal.value = false
    await Promise.all([loadCursos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar permanentemente el curso.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Árbol del módulo ───────────────────────────────────────────────────
const showArbolModal = ref(false)
const moduloArbolId = ref(null)
const moduloArbolNombre = ref('')

function openModuloArbol(id, nombre) {
  moduloArbolId.value = Number(id)
  moduloArbolNombre.value = nombre ?? getModuloNombre(id) ?? ''
  showArbolModal.value = true
}

watch(showArbolModal, (visible) => {
  if (!visible) {
    moduloArbolId.value = null
    moduloArbolNombre.value = ''
  }
})

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailCurso = ref(null)

async function openDetail(curso) {
  detailCurso.value = curso
  showDetailModal.value = true
  try {
    const res = await cursoService.getById(curso.id, { with: 'referidos,estudiantes,modulos' })
    detailCurso.value = res.data
  } catch {
    // Mantener datos del listado si falla el detalle
  }
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadFilters()
  loadCursos()
  loadStatistics()
})
</script>
