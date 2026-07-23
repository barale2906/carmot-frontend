<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section v-if="stats.total > 0 || !apiError" aria-labelledby="stats-ciclos-heading">
      <h2 id="stats-ciclos-heading" class="sr-only">Resumen de ciclos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard title="Total ciclos" :value="stats.total" description="Registrados en el sistema" icon="academico" icon-variant="blue" />
        </li>
        <li role="listitem">
          <StatCard title="Activos" :value="stats.activos" description="En curso" icon="activos" icon-variant="blue" />
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
        La gestión de ciclos estará disponible cuando el backend exponga el endpoint
        <code class="rounded bg-amber-200 px-1">/api/academico/ciclos</code>.
      </p>
    </section>

    <!-- Contenido principal -->
    <template v-else>
      <!-- Barra de filtros y acciones -->
      <section aria-labelledby="filtros-ciclos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
        <h2 id="filtros-ciclos-heading" class="sr-only">Filtros y acciones</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.search"
              label="Buscar:"
              placeholder="Nombre del ciclo..."
              help="Filtra ciclos por nombre en el listado."
              @input="onSearchInput"
            />
          </div>
          <div class="w-full sm:w-[180px]">
            <FormSelect
              v-model="filters.status"
              label="Estado:"
              help="Activo o inactivo en el catálogo de ciclos."
              :options="statusOptions"
            />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect
              v-model="filters.sede_id"
              label="Sede:"
              help="Filtra ciclos dictados en una sede."
              :options="filterSedeOptions"
            />
          </div>
          <div class="flex w-full items-end gap-2 sm:w-auto">
            <button v-if="viewTrashed" type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="toggleTrashed">
              <NavIcon name="eye" class="size-4" /> Ver activos
            </button>
            <button v-else type="button" class="flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="toggleTrashed">
              <NavIcon name="track_changes" class="size-4" /> Ver eliminados
            </button>
            <button v-if="!viewTrashed" type="button" class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" @click="openCreate">
              <NavIcon name="plus" class="size-4" /> Nuevo ciclo
            </button>
          </div>
        </div>
      </section>

      <!-- Tabla de ciclos -->
      <section aria-labelledby="listado-ciclos-heading">
        <SectionHeader
          id="listado-ciclos-heading"
          :title="viewTrashed ? 'Ciclos eliminados' : 'Listado de ciclos'"
          :description="viewTrashed
            ? 'Ciclos en papelera. Puedes restaurarlos o eliminarlos permanentemente.'
            : 'Haz clic en el ícono de ojo para ver el detalle completo de cada ciclo.'"
          class="mb-4"
        />
        <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
          <span class="text-sm text-slate-500">Cargando ciclos...</span>
        </div>
        <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
          <p class="text-sm text-red-700">{{ error }}</p>
          <button type="button" class="mt-3 text-sm font-medium text-red-700 underline" @click="loadCiclos(1)">Reintentar</button>
        </div>
        <DataTable v-else :columns="tableColumns" :data="ciclos" row-key="id" aria-label="Listado de ciclos" actions-first>
          <template #cell="{ column, value, row }">
            <template v-if="column.key === 'status'">
              <StatusBadge :label="row.status_text ?? (row.status === 1 ? 'Activo' : 'Inactivo')" :variant="row.status === 1 ? 'activo' : 'inactivo'" />
            </template>
            <template v-else-if="column.key === 'sede'">{{ row.sede?.nombre ?? '—' }}</template>
            <template v-else-if="column.key === 'curso'">{{ row.curso?.nombre ?? '—' }}</template>
            <template v-else-if="column.key === 'fecha_inicio'">{{ formatDate(value) }}</template>
            <template v-else-if="column.key === 'fecha_fin'">{{ formatDate(value) }}</template>
            <template v-else-if="column.key === 'grupos_count'">
              <span v-if="value" class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">{{ value }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
            <template v-else>{{ value ?? '—' }}</template>
          </template>
          <template #actions="{ row }">
            <button type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Ver detalle" @click="openDetail(row)">
              <NavIcon name="eye" class="size-4" />
            </button>
            <button v-if="!row.deleted_at" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500" title="Aplazamientos" @click="openAplazar(row)">
              <NavIcon name="calendario" class="size-4" />
            </button>
            <button v-if="!row.deleted_at" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Editar" @click="openEdit(row)">
              <NavIcon name="pencil" class="size-4" />
            </button>
            <button v-if="!row.deleted_at" type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500" title="Eliminar" @click="openEliminar(row)">
              <NavIcon name="close" class="size-4" />
            </button>
            <button v-else type="button" class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500" title="Restaurar" @click="openRestaurar(row)">
              <NavIcon name="track_changes" class="size-4" />
            </button>
          </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.lastPage > 1" class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3">
          <p class="text-sm text-slate-500">Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} ciclos</p>
          <div class="flex gap-2">
            <button type="button" :disabled="pagination.currentPage === 1" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage - 1)">Anterior</button>
            <button type="button" :disabled="pagination.currentPage === pagination.lastPage" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="goToPage(pagination.currentPage + 1)">Siguiente</button>
          </div>
        </div>
      </section>
    </template>
  </div>

  <!-- ── Modal: Crear / Editar ────────────────────────────────────────────── -->
  <ModalBase
    v-model="showFormModal"
    :title="editingCiclo ? 'Editar ciclo' : 'Nuevo ciclo'"
    :description="editingCiclo
      ? 'Modifica los datos del ciclo académico.'
      : 'Completa los campos para crear un nuevo ciclo académico.'"
    size="xl"
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="academico" class="size-5" />
      </span>
    </template>

    <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitForm">
      <div class="max-h-[72vh] overflow-y-auto pr-1 flex flex-col gap-5">

        <!-- ── Información básica ─────────────────────────────────────────── -->
        <div class="flex flex-col gap-4">
          <FormInput
            v-model="form.nombre"
            label="Nombre"
            placeholder="Ej: Ciclo Inglés 2026-A"
            hint="Máximo 255 caracteres. Debe ser único."
            help="Nombre visible del ciclo académico."
            :required="true"
            maxlength="255"
          />
          <FormTextarea
            v-model="form.descripcion"
            label="Descripción"
            placeholder="Descripción opcional del ciclo..."
            hint="Máximo 1000 caracteres."
            help="Detalle opcional para coordinación y reportes."
            :rows="2"
          />
        </div>

        <!-- ── Sede y Curso ───────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            v-model="form.sede_id"
            label="Sede *"
            help="Sede donde se imparte el ciclo."
            :options="formSedeOptions"
            :required="true"
          />
          <FormSelect
            v-model="form.curso_id"
            label="Curso *"
            help="Programa académico base del ciclo."
            :options="formCursoOptions"
            :required="true"
          />
        </div>

        <!-- ── Fechas ─────────────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.fecha_inicio"
            label="Fecha inicio *"
            type="date"
            help="Primer día académico del ciclo. Necesario para calcular las fechas de cada grupo."
            :required="true"
          />
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-1">
              <label class="text-sm font-medium text-slate-900">Fecha fin</label>
              <FormFieldHelp text="Fin del ciclo: manual o calculada sumando duraciones de módulos según grupos." />
            </div>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="form.fecha_fin_automatica"
                type="checkbox"
                class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Calcular automáticamente según grupos
            </label>
            <FormInput
              v-if="!form.fecha_fin_automatica"
              v-model="form.fecha_fin"
              label="Fecha fin manual"
              type="date"
              help="Último día del ciclo si no usas cálculo automático."
            />
            <p v-else class="text-xs text-slate-500">El sistema sumará la duración de cada módulo según el orden de los grupos asignados.</p>
          </div>
        </div>

        <!-- ── Grupos disponibles ─────────────────────────────────────────── -->
        <div class="flex flex-col gap-3">
          <div>
            <p class="text-sm font-medium text-slate-900">Grupos a asignar</p>
            <p class="mt-0.5 text-xs text-slate-500">
              Selecciona los grupos que dictarán el ciclo. Pueden existir varios horarios (grupos) por módulo; márcalos todos los que apliquen. El orden se puede ajustar después de crear el ciclo.
            </p>
          </div>

          <!-- Esperando curso y fecha -->
          <div v-if="!form.curso_id || !form.fecha_inicio" class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
            <p class="text-sm text-slate-500">Selecciona el curso y la fecha de inicio para ver los grupos disponibles.</p>
          </div>

          <!-- Cargando -->
          <div v-else-if="prevLoading" class="flex items-center justify-center rounded-lg border border-black/10 bg-white py-6">
            <span class="text-sm text-slate-500">Consultando grupos disponibles...</span>
          </div>

          <!-- Error al cargar -->
          <div v-else-if="prevError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ prevError }}
            <button type="button" class="ml-2 underline" @click="previsualizarCalendario">Reintentar</button>
          </div>

          <!-- Sin módulos o sin grupos -->
          <div v-else-if="!prevData?.modulos?.length" class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
            <p class="text-sm text-slate-500">El curso no tiene módulos o grupos configurados.</p>
          </div>

          <!-- Lista de módulos con grupos -->
          <div v-else class="space-y-3">

            <!-- Aviso: orden canónico no definido -->
            <div v-if="modulosOrdenPendiente" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              ⚠️ Los módulos de este curso no tienen orden de ejecución definido (todos en posición 0). Define el orden en la vista de Cursos antes de crear el ciclo para que el calendario cíclico funcione correctamente.
            </div>

            <div
              v-for="modulo in prevData.modulos"
              :key="modulo.modulo_id"
              class="rounded-lg border border-black/10 bg-white p-3"
            >
              <!-- Cabecera del módulo -->
              <div class="mb-2.5 flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#213360] text-xs font-bold text-white">
                  {{ modulo.orden > 0 ? modulo.orden : '?' }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900">{{ modulo.modulo_nombre }}</p>
                  <p class="text-xs text-slate-500">{{ modulo.duracion }}h</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="moduloTieneGrupoSeleccionado(modulo) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'">
                  {{ moduloTieneGrupoSeleccionado(modulo) ? 'Con grupos' : 'Sin asignar' }}
                </span>
              </div>

              <!-- Grupos del módulo como checkboxes -->
              <div v-if="!modulo.grupos?.length" class="pl-8 text-xs italic text-slate-400">
                Sin grupos disponibles para este módulo.
              </div>
              <div v-else class="space-y-1 pl-8">
                <label
                  v-for="grupo in modulo.grupos"
                  :key="grupo.grupo_id"
                  class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-blue-50"
                  :class="gruposSeleccionados.includes(grupo.grupo_id) ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''"
                >
                  <input
                    type="checkbox"
                    :value="grupo.grupo_id"
                    v-model="gruposSeleccionados"
                    class="mt-0.5 size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-slate-900">{{ grupo.grupo_nombre }}</p>
                    <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span v-if="grupo.horas_semana">{{ grupo.horas_semana }}h/sem</span>
                      <span v-if="grupo.semanas_estimadas">· {{ grupo.semanas_estimadas }} sem</span>
                      <span>·</span>
                      <span>{{ formatDate(grupo.fecha_inicio) }}<template v-if="grupo.fecha_fin"> – {{ formatDate(grupo.fecha_fin) }}</template></span>
                      <span
                        class="rounded-full px-1.5 py-0.5 font-medium"
                        :class="grupo.con_fechas ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                      >{{ grupo.con_fechas ? 'Slot activo' : 'Estimado' }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- Resumen -->
            <div class="rounded-lg border px-3 py-2 text-xs"
              :class="gruposSeleccionados.length ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'">
              {{ gruposSeleccionados.length ? `${gruposSeleccionados.length} grupo(s) seleccionado(s). El orden definitivo se puede ajustar tras crear el ciclo.` : 'Ningún grupo seleccionado.' }}
            </div>
          </div>
        </div>

        <!-- ── Inscritos y Estado ─────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.inscritos"
            label="Inscritos"
            type="number"
            placeholder="0"
            min="0"
            hint="Número de estudiantes inscritos (opcional)."
            help="Conteo orientativo de cupos ocupados (opcional)."
          />
          <FormSelect
            v-model="form.status"
            label="Estado"
            help="Activo: visible para matrículas; inactivo: restringido."
            :options="[{ value: 1, label: 'Activo' }, { value: 2, label: 'Inactivo' }]"
          />
        </div>

        <!-- Errores -->
        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ formError }}</div>
        <div v-if="fieldErrors && Object.keys(fieldErrors).length" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <ul class="list-inside list-disc space-y-1">
            <li v-for="(msgs, field) in fieldErrors" :key="field">
              <strong>{{ field }}:</strong> {{ Array.isArray(msgs) ? msgs.join(', ') : msgs }}
            </li>
          </ul>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showFormModal = false">
        Cancelar
      </button>
      <button type="button" :disabled="formLoading" class="flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="submitForm">
        <span v-if="formLoading">Guardando...</span>
        <span v-else>{{ editingCiclo ? 'Guardar cambios' : 'Crear ciclo' }}</span>
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Eliminar ─────────────────────────────────────────────────── -->
  <ModalBase v-model="showEliminarModal" title="Eliminar ciclo" description="Esta acción moverá el ciclo a la papelera.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">¿Estás seguro de que deseas eliminar <strong>{{ targetCiclo?.nombre }}</strong>?</p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showEliminarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500" @click="confirmEliminar">
        {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Restaurar ────────────────────────────────────────────────── -->
  <ModalBase v-model="showRestaurarModal" title="Restaurar ciclo" description="El ciclo volverá a estar disponible en el sistema.">
    <div class="pb-2">
      <p class="text-sm text-slate-700">¿Deseas restaurar <strong>{{ targetCiclo?.nombre }}</strong>?</p>
      <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ actionError }}</div>
    </div>
    <template #footer>
      <button type="button" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" @click="showRestaurarModal = false">Cancelar</button>
      <button type="button" :disabled="actionLoading" class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-green-500" @click="confirmRestaurar">
        {{ actionLoading ? 'Restaurando...' : 'Restaurar' }}
      </button>
    </template>
  </ModalBase>

  <!-- ── Modal: Detalle del ciclo ────────────────────────────────────────── -->
  <ModalBase v-model="showDetailModal" title="Detalle del ciclo">
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="academico" class="size-5" />
      </span>
    </template>
    <div v-if="detailCiclo" class="space-y-3 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.nombre }}</dd>
        </div>
        <div v-if="detailCiclo.descripcion" class="col-span-2">
          <dt class="font-medium text-slate-500">Descripción</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.descripcion }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Sede</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.sede?.nombre ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Curso</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.curso?.nombre ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Fecha inicio</dt>
          <dd class="mt-0.5 text-slate-900">{{ formatDate(detailCiclo.fecha_inicio) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Fecha fin</dt>
          <dd class="mt-0.5 text-slate-900">{{ formatDate(detailCiclo.fecha_fin) }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Duración</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.duracion_dias ? `${detailCiclo.duracion_dias} días` : '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Total horas</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.total_horas ? `${detailCiclo.total_horas}h` : '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Horas/semana</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.horas_por_semana ? `${detailCiclo.horas_por_semana}h` : '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Inscritos</dt>
          <dd class="mt-0.5 text-slate-900">{{ detailCiclo.inscritos ?? 0 }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="detailCiclo.status_text ?? (detailCiclo.status === 1 ? 'Activo' : 'Inactivo')" :variant="detailCiclo.status === 1 ? 'activo' : 'inactivo'" />
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Etapa</dt>
          <dd class="mt-0.5">
            <span v-if="detailCiclo.en_curso" class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">En curso</span>
            <span v-else-if="detailCiclo.por_iniciar" class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Por iniciar</span>
            <span v-else-if="detailCiclo.finalizado" class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Finalizado</span>
            <span v-else class="text-slate-400">—</span>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Creado</dt>
          <dd class="mt-0.5 text-slate-900">{{ formatDate(detailCiclo.created_at) }}</dd>
        </div>

        <!-- Grupos del ciclo: reordenables y con generación de clases -->
        <div v-if="detailGrupos.length" class="col-span-2">
          <dt class="mb-2 flex items-center justify-between font-medium text-slate-500">
            <span>Plan de dictado ({{ detailGrupos.length }} grupos)</span>
            <span class="text-xs font-normal text-slate-400">Arrastra para reordenar</span>
          </dt>
          <dd class="space-y-2">
            <div
              v-for="(grupo, idx) in detailGrupos"
              :key="grupo.id"
              draggable="true"
              class="rounded-lg border border-black/10 bg-slate-50 text-sm transition-colors"
              :class="gruposDragIdx === idx ? 'opacity-40 border-blue-300 bg-blue-50' : 'hover:border-blue-200'"
              @dragstart="gruposDragIdx = idx"
              @dragover.prevent="onGrupoDragOver(idx)"
              @dragend="gruposDragIdx = null"
            >
              <!-- Fila principal -->
              <div class="flex items-center gap-2 px-3 py-2.5">
                <span class="cursor-grab text-slate-300 active:cursor-grabbing">
                  <svg class="size-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>
                </span>
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#213360] text-xs font-bold text-white">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-slate-900">{{ grupo.nombre }}</p>
                  <p class="text-xs text-slate-500">
                    <span v-if="grupo.modulo">{{ grupo.modulo.nombre }}</span>
                    <span v-if="grupo.jornada_nombre"> · {{ grupo.jornada_nombre }}</span>
                    <span v-if="grupo.profesor"> · {{ grupo.profesor.name }}</span>
                  </p>
                  <!-- Fechas del slot en el pivot -->
                  <p v-if="grupo.fecha_inicio_grupo" class="mt-0.5 text-xs text-blue-600">
                    {{ formatDate(grupo.fecha_inicio_grupo) }}
                    <template v-if="grupo.fecha_fin_grupo"> – {{ formatDate(grupo.fecha_fin_grupo) }}</template>
                  </p>
                </div>
                <!-- Acciones del grupo -->
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    :disabled="generandoClases[grupo.id]"
                    class="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    :title="`Generar clases programadas para ${grupo.nombre}`"
                    @click="generarClases(grupo)"
                  >
                    <NavIcon name="calendario" class="size-3.5" />
                    {{ generandoClases[grupo.id] ? '…' : 'Clases' }}
                  </button>
                  <button
                    type="button"
                    class="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Ver detalle"
                    @click="openGrupoDetalle(grupo)"
                  >
                    <NavIcon name="eye" class="size-4" />
                  </button>
                </div>
              </div>
              <!-- Resultado de generación de clases -->
              <div
                v-if="clasesResultado[grupo.id]"
                class="border-t border-black/5 px-3 py-1.5 text-xs"
                :class="clasesResultado[grupo.id].error ? 'text-red-600' : 'text-emerald-700'"
              >
                {{ clasesResultado[grupo.id].error ?? `${clasesResultado[grupo.id].count} clases generadas correctamente.` }}
              </div>
            </div>
          </dd>

          <!-- Botón guardar orden (visible cuando cambió el orden) -->
          <div v-if="gruposOrdenCambiado" class="mt-3 flex items-center gap-2">
            <button
              type="button"
              :disabled="reordenandoGrupos"
              class="flex h-8 items-center gap-1.5 rounded-lg bg-[#213360] px-3 text-xs font-medium text-white transition-colors hover:bg-[#1a294d] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="saveGruposOrden"
            >
              {{ reordenandoGrupos ? 'Guardando...' : 'Guardar nuevo orden' }}
            </button>
            <button
              type="button"
              class="h-8 rounded-lg px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="resetGruposOrden"
            >
              Descartar
            </button>
            <span v-if="reordenError" class="text-xs text-red-600">{{ reordenError }}</span>
          </div>
        </div>

        <!-- Cronograma del ciclo (carga bajo demanda) -->
        <div v-if="detailCiclo.grupos?.length" class="col-span-2">
          <dt class="mb-1 font-medium text-slate-500">Cronograma</dt>
          <dd>
            <button
              v-if="!cronogramaData && !cronogramaLoading"
              type="button"
              class="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="loadCronograma(detailCiclo.id)"
            >
              <NavIcon name="calendario" class="size-3.5" /> Ver cronograma
            </button>
            <span v-else-if="cronogramaLoading" class="text-xs text-slate-400">Cargando cronograma...</span>
            <div v-else-if="cronogramaData" class="space-y-1.5">
              <div
                v-for="entrada in cronogramaData.cronograma"
                :key="entrada.grupo_id"
                class="flex items-center justify-between rounded-lg border border-black/5 bg-slate-50 px-3 py-2 text-xs"
              >
                <div class="min-w-0">
                  <p class="font-medium text-slate-800">{{ entrada.grupo_nombre }}</p>
                  <p class="text-slate-500">{{ entrada.modulo?.nombre }}</p>
                </div>
                <div class="shrink-0 text-right text-slate-500">
                  <p>{{ formatDate(entrada.fecha_inicio_grupo) }} – {{ formatDate(entrada.fecha_fin_grupo) }}</p>
                  <p>{{ entrada.total_horas_semana }}h/sem · {{ entrada.semanas_estimadas }} sem</p>
                </div>
              </div>
              <div v-if="cronogramaData.resumen" class="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                {{ cronogramaData.resumen.total_grupos }} grupos ·
                {{ cronogramaData.resumen.duracion_total_dias }} días ·
                {{ cronogramaData.resumen.total_horas }}h totales
              </div>
            </div>
          </dd>
        </div>
      </dl>
    </div>
  </ModalBase>

  <!-- ── Modal: Aplazamientos del ciclo ────────────────────────────────── -->
  <AplazarCicloModal
    v-model="showAplazarModal"
    :ciclo="targetAplazarCiclo"
    @updated="loadCiclos(pagination.currentPage)"
  />

  <!-- ── Modal: Detalle del grupo ───────────────────────────────────────── -->
  <ModalBase
    v-model="showGrupoDetalleModal"
    :title="grupoDetalle ? `Grupo: ${grupoDetalle.nombre}` : 'Detalle del grupo'"
    description="Información completa del grupo dentro de este ciclo."
  >
    <template #icon>
      <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
        <NavIcon name="people" class="size-5" />
      </span>
    </template>
    <div v-if="grupoDetalle" class="space-y-3 pb-4">
      <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div class="col-span-2">
          <dt class="font-medium text-slate-500">Nombre</dt>
          <dd class="mt-0.5 text-slate-900">{{ grupoDetalle.nombre }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Módulo</dt>
          <dd class="mt-0.5 text-slate-900">{{ grupoDetalle.modulo?.nombre ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Profesor</dt>
          <dd class="mt-0.5 text-slate-900">{{ grupoDetalle.profesor?.name ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Jornada</dt>
          <dd class="mt-0.5 text-slate-900">{{ grupoDetalle.jornada_nombre ?? getJornadaLabel(grupoDetalle.jornada) ?? '—' }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Inscritos</dt>
          <dd class="mt-0.5 text-slate-900">{{ grupoDetalle.inscritos ?? 0 }}</dd>
        </div>
        <div>
          <dt class="font-medium text-slate-500">Estado</dt>
          <dd class="mt-0.5">
            <StatusBadge :label="grupoDetalle.status_text ?? (grupoDetalle.status === 1 ? 'Activo' : 'Inactivo')" :variant="grupoDetalle.status === 1 ? 'activo' : 'inactivo'" />
          </dd>
        </div>
        <div v-if="grupoDetalle.horarios?.length" class="col-span-2">
          <dt class="font-medium text-slate-500">Horarios</dt>
          <dd class="mt-2 space-y-1.5">
            <div
              v-for="h in grupoDetalle.horarios"
              :key="h.id"
              class="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm"
            >
              <span class="font-medium text-slate-900">{{ h.area?.nombre ?? '—' }}</span>
              <span class="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                {{ capitalizar(h.dia) }} {{ h.hora ? h.hora.slice(0, 5) : '' }}
                {{ h.duracion_horas ? `· ${h.duracion_horas}h` : '' }}
              </span>
            </div>
          </dd>
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
import FormTextarea from '@/components/forms/FormTextarea.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import AplazarCicloModal from '@/components/academico/AplazarCicloModal.vue'
import cicloService from '@/services/cicloService.js'
import sedeService from '@/services/sedeService.js'
import cursoService from '@/services/cursoService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess } = useNotification()

const JORNADAS = [
  { value: 0, label: 'Mañana' },
  { value: 1, label: 'Tarde' },
  { value: 2, label: 'Noche' },
  { value: 3, label: 'Fin de semana mañana' },
  { value: 4, label: 'Fin de semana tarde' }
]

function getJornadaLabel(val) {
  return JORNADAS.find((j) => j.value === val)?.label
}

function capitalizar(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Opciones de filtro y tabla ───────────────────────────────────────────────
const statusOptions = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '2', label: 'Inactivos' }
]

const tableColumns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'sede', label: 'Sede' },
  { key: 'curso', label: 'Curso' },
  { key: 'fecha_inicio', label: 'Inicio' },
  { key: 'fecha_fin', label: 'Fin' },
  { key: 'grupos_count', label: 'Grupos' },
  { key: 'status', label: 'Estado' },
]

// ─── Estado del listado ───────────────────────────────────────────────────────
const ciclos = ref([])
const loading = ref(false)
const error = ref('')
const apiError = ref('')
const viewTrashed = ref(false)

const pagination = reactive({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0, perPage: 15 })
const stats = reactive({ total: 0, activos: 0, eliminados: 0 })
const filters = reactive({ search: '', status: '', sede_id: '' })

// ─── Datos maestros ───────────────────────────────────────────────────────────
const sedes = ref([])
const cursos = ref([])

const filterSedeOptions = computed(() => [
  { value: '', label: 'Todas las sedes' },
  ...sedes.value.map((s) => ({ value: String(s.id), label: s.nombre }))
])
const formSedeOptions = computed(() => sedes.value.map((s) => ({ value: s.id, label: s.nombre })))
const formCursoOptions = computed(() => cursos.value.map((c) => ({ value: c.id, label: c.nombre })))

async function loadMasterData() {
  try {
    const [sedesRes, cursosRes] = await Promise.all([
      sedeService.getAll({ per_page: 200, sort_by: 'nombre', sort_direction: 'asc' }),
      cursoService.getAll({ per_page: 200, sort_by: 'nombre', sort_direction: 'asc', status: 1 })
    ])
    sedes.value = sedesRes.data ?? []
    cursos.value = cursosRes.data ?? []
  } catch {
    // No bloquea la vista
  }
}

// ─── Formulario (declarado aquí para que los watchers y funciones siguientes puedan referenciarlo) ──
const showFormModal = ref(false)
const editingCiclo = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  nombre: '',
  descripcion: '',
  sede_id: null,
  curso_id: null,
  fecha_inicio: '',
  fecha_fin: '',
  fecha_fin_automatica: true,
  inscritos: '',
  status: 1
})

// ─── Grupos disponibles: selección via previsualizar ─────────────────────────
// gruposSeleccionados: array de grupo_id (checkboxes — múltiples por módulo)
const gruposSeleccionados = ref([])

const modulosOrdenPendiente = computed(() => {
  const modulos = prevData.value?.modulos ?? []
  return modulos.length > 0 && modulos.every((m) => (m.orden ?? 0) === 0)
})

function moduloTieneGrupoSeleccionado(modulo) {
  return (modulo.grupos ?? []).some((g) => gruposSeleccionados.value.includes(g.grupo_id))
}

// ─── Watchers: recarga previsualización cuando cambian curso o fecha ──────────
watch([() => form.curso_id, () => form.fecha_inicio], ([cursoId, fechaInicio]) => {
  gruposSeleccionados.value = []
  prevData.value = null
  prevError.value = ''
  if (cursoId && fechaInicio) {
    previsualizarCalendario()
  }
})

watch(() => form.sede_id, () => {
  gruposSeleccionados.value = []
})

// ─── Listado de ciclos ────────────────────────────────────────────────────────
let searchTimer = null

watch(() => filters.status, () => loadCiclos(1))
watch(() => filters.sede_id, () => loadCiclos(1))
watch(viewTrashed, () => loadCiclos(1))

async function loadCiclos(page = 1) {
  if (apiError.value) return
  loading.value = true
  error.value = ''
  try {
    const fetcher = viewTrashed.value ? cicloService.getTrashed : cicloService.getAll
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'sede,curso',
      sort_by: 'nombre',
      sort_direction: 'asc'
    }
    if (filters.search) params.search = filters.search
    if (filters.status !== '') params.status = filters.status
    if (filters.sede_id) params.sede_id = filters.sede_id

    const res = await fetcher(params)
    ciclos.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from ?? 0
      pagination.to = res.meta.to ?? 0
    }
  } catch (e) {
    const status = e?.response?.status
    if (status === 404 || status >= 500) {
      apiError.value = 'El servicio de ciclos no está disponible en este momento.'
    } else {
      error.value = e?.response?.data?.message ?? 'Error al cargar los ciclos.'
    }
  } finally {
    loading.value = false
  }
}

async function loadStatistics() {
  if (apiError.value) return
  try {
    const res = await cicloService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.eliminados = totales.eliminados ?? 0
  } catch {
    // Informativo
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadCiclos(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadCiclos(page)
}

function toggleTrashed() {
  viewTrashed.value = !viewTrashed.value
}

// ─── Previsualización del calendario ─────────────────────────────────────────
const prevData    = ref(null)
const prevLoading = ref(false)
const prevError   = ref('')

async function previsualizarCalendario() {
  if (!form.curso_id || !form.fecha_inicio) return
  prevLoading.value = true
  prevData.value    = null
  prevError.value   = ''
  try {
    const res = await cicloService.previsualizar({ curso_id: form.curso_id, fecha_inicio: form.fecha_inicio })
    prevData.value = res.data
  } catch (e) {
    prevError.value = e?.response?.data?.message ?? 'Error al previsualizar el calendario.'
  } finally {
    prevLoading.value = false
  }
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
function resetForm() {
  form.nombre = ''
  form.descripcion = ''
  form.sede_id = null
  form.curso_id = null
  form.fecha_inicio = ''
  form.fecha_fin = ''
  form.fecha_fin_automatica = true
  form.inscritos = ''
  form.status = 1
  gruposSeleccionados.value = []
  prevData.value  = null
  prevError.value = ''
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingCiclo.value = null
  resetForm()
  loadMasterData()
  showFormModal.value = true
}

async function openEdit(ciclo) {
  editingCiclo.value = ciclo
  resetForm()
  await loadMasterData()

  form.nombre = ciclo.nombre ?? ''
  form.descripcion = ciclo.descripcion ?? ''
  form.sede_id = ciclo.sede_id ?? ciclo.sede?.id ?? null
  form.curso_id = ciclo.curso_id ?? ciclo.curso?.id ?? null
  form.fecha_inicio = ciclo.fecha_inicio ? ciclo.fecha_inicio.slice(0, 10) : ''
  form.fecha_fin = ciclo.fecha_fin ? ciclo.fecha_fin.slice(0, 10) : ''
  form.fecha_fin_automatica = ciclo.fecha_fin_automatica ?? true
  form.inscritos = ciclo.inscritos ?? ''
  form.status = ciclo.status ?? 1

  showFormModal.value = true

  // Previsualizar + pre-seleccionar grupos asignados (en paralelo)
  if (form.curso_id && form.fecha_inicio) {
    try {
      const [prevRes, cicloRes] = await Promise.all([
        cicloService.previsualizar({ curso_id: form.curso_id, fecha_inicio: form.fecha_inicio }),
        cicloService.getById(ciclo.id, { with: 'grupos' })
      ])
      prevData.value = prevRes.data
      const gruposAsignados = cicloRes.data?.grupos ?? ciclo.grupos ?? []
      gruposSeleccionados.value = gruposAsignados.map((g) => g.id).filter(Boolean)
    } catch {
      // Sin previsualización — el usuario puede editar solo los campos básicos
    }
  }
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    const payload = {
      nombre: String(form.nombre || '').trim(),
      sede_id: form.sede_id ? Number(form.sede_id) : null,
      curso_id: form.curso_id ? Number(form.curso_id) : null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin_automatica: Boolean(form.fecha_fin_automatica),
      status: Number(form.status)
    }
    if (form.descripcion?.trim()) payload.descripcion = form.descripcion.trim()
    if (!form.fecha_fin_automatica && form.fecha_fin) payload.fecha_fin = form.fecha_fin
    if (form.inscritos !== '' && form.inscritos !== null) payload.inscritos = Number(form.inscritos)
    if (gruposSeleccionados.value.length) payload.grupos = [...gruposSeleccionados.value]

    if (editingCiclo.value) {
      await cicloService.update(editingCiclo.value.id, payload, { _silent: true })
      notifySuccess(`El ciclo "${form.nombre}" fue actualizado correctamente.`)
    } else {
      await cicloService.create(payload, { _silent: true })
      notifySuccess(`El ciclo "${form.nombre}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await Promise.all([loadCiclos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      fieldErrors.value = e.response.data?.errors ?? {}
      formError.value = e.response.data?.message ?? 'Verifica los campos del formulario.'
    } else {
      formError.value = e?.response?.data?.message ?? 'Ocurrió un error inesperado.'
    }
  } finally {
    formLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)
const targetCiclo = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openEliminar(ciclo) {
  targetCiclo.value = ciclo
  actionError.value = ''
  showEliminarModal.value = true
}

async function confirmEliminar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await cicloService.delete(targetCiclo.value.id)
    notifySuccess(`El ciclo "${targetCiclo.value.nombre}" fue eliminado.`)
    showEliminarModal.value = false
    await Promise.all([loadCiclos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al eliminar el ciclo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ──────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(ciclo) {
  targetCiclo.value = ciclo
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await cicloService.restore(targetCiclo.value.id)
    notifySuccess(`El ciclo "${targetCiclo.value.nombre}" fue restaurado.`)
    showRestaurarModal.value = false
    await Promise.all([loadCiclos(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el ciclo.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ────────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailCiclo     = ref(null)
const detailGrupos    = ref([])
const gruposOrdenOriginal = ref([])

function syncDetailGrupos(grupos) {
  const sorted = [...(grupos ?? [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
  detailGrupos.value       = sorted
  gruposOrdenOriginal.value = sorted.map((g) => g.id)
}

async function openDetail(ciclo) {
  detailCiclo.value = ciclo
  syncDetailGrupos(ciclo.grupos)
  resetGruposOrden()
  cronogramaData.value    = null
  cronogramaLoading.value = false
  Object.keys(generandoClases).forEach((k) => { delete generandoClases[k] })
  Object.keys(clasesResultado).forEach((k) => { delete clasesResultado[k] })
  showDetailModal.value = true
  try {
    const res = await cicloService.getById(ciclo.id, {
      with: 'sede,curso,grupos.modulo,grupos.profesor,grupos.horarios.area'
    })
    detailCiclo.value = res.data
    syncDetailGrupos(res.data?.grupos)
  } catch {
    // Mantener datos del listado
  }
}

// ─── Reordenamiento de grupos (drag & drop) ───────────────────────────────────
const gruposDragIdx   = ref(null)
const reordenandoGrupos = ref(false)
const reordenError    = ref('')

const gruposOrdenCambiado = computed(() => {
  const current = detailGrupos.value.map((g) => g.id)
  const original = gruposOrdenOriginal.value
  return current.length > 0 &&
    current.some((id, i) => id !== original[i])
})

function onGrupoDragOver(idx) {
  const from = gruposDragIdx.value
  if (from === null || from === idx) return
  const arr = [...detailGrupos.value]
  const [moved] = arr.splice(from, 1)
  arr.splice(idx, 0, moved)
  detailGrupos.value = arr
  gruposDragIdx.value = idx
}

function resetGruposOrden() {
  detailGrupos.value  = [...(detailGrupos.value.length ? detailGrupos.value : [])]
  // Restaurar orden original
  const original = gruposOrdenOriginal.value
  if (original.length) {
    const byId = Object.fromEntries(detailGrupos.value.map((g) => [g.id, g]))
    detailGrupos.value = original.map((id) => byId[id]).filter(Boolean)
  }
  reordenError.value = ''
}

async function saveGruposOrden() {
  if (!detailCiclo.value?.id) return
  reordenandoGrupos.value = true
  reordenError.value      = ''
  try {
    const nuevoOrden = detailGrupos.value.map((g) => g.id)
    const res = await cicloService.reordenarGrupos(detailCiclo.value.id, nuevoOrden, { _silent: true })
    detailCiclo.value         = res.data
    syncDetailGrupos(res.data?.grupos)
    cronogramaData.value = null
  } catch (e) {
    reordenError.value = e?.response?.data?.message ?? 'Error al reordenar los grupos.'
  } finally {
    reordenandoGrupos.value = false
  }
}

// ─── Generar clases programadas ───────────────────────────────────────────────
const generandoClases = reactive({})
const clasesResultado = reactive({})

async function generarClases(grupo) {
  if (!detailCiclo.value?.id) return
  generandoClases[grupo.id] = true
  delete clasesResultado[grupo.id]
  try {
    const res = await cicloService.generarClasesProgramadas(grupo.id, detailCiclo.value.id, { _silent: true })
    clasesResultado[grupo.id] = { count: res.clases_generadas ?? 0, error: null }
  } catch (e) {
    clasesResultado[grupo.id] = { count: 0, error: e?.response?.data?.message ?? 'Error al generar clases.' }
  } finally {
    generandoClases[grupo.id] = false
  }
}

// ─── Cronograma del ciclo ─────────────────────────────────────────────────────
const cronogramaData    = ref(null)
const cronogramaLoading = ref(false)

async function loadCronograma(cicloId) {
  cronogramaLoading.value = true
  try {
    const res = await cicloService.cronograma(cicloId)
    cronogramaData.value = res.data
  } catch {
    // Silencioso
  } finally {
    cronogramaLoading.value = false
  }
}

// ─── Modal Aplazamientos ──────────────────────────────────────────────────────
const showAplazarModal = ref(false)
const targetAplazarCiclo = ref(null)

function openAplazar(ciclo) {
  targetAplazarCiclo.value = ciclo
  showAplazarModal.value = true
}

// ─── Modal Detalle del Grupo ──────────────────────────────────────────────────
const showGrupoDetalleModal = ref(false)
const grupoDetalle = ref(null)

function openGrupoDetalle(grupo) {
  grupoDetalle.value = grupo
  showGrupoDetalleModal.value = true
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  // Las fechas "YYYY-MM-DD" se parsean como UTC medianoche; usar los componentes
  // directamente evita que la conversión a hora local retroceda un día.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const d = dateOnly ? new Date(`${value}T00:00:00`) : new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  await loadCiclos(1)
  if (!apiError.value) {
    await Promise.all([loadStatistics(), loadMasterData()])
  }
})
</script>
