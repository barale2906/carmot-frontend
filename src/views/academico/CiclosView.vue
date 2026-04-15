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
            <FormInputSearch v-model="filters.search" label="Buscar:" placeholder="Nombre del ciclo..." @input="onSearchInput" />
          </div>
          <div class="w-full sm:w-[180px]">
            <FormSelect v-model="filters.status" label="Estado:" :options="statusOptions" />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect v-model="filters.sede_id" label="Sede:" :options="filterSedeOptions" />
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
        <DataTable v-else :columns="tableColumns" :data="ciclos" row-key="id" aria-label="Listado de ciclos">
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
            :required="true"
            maxlength="255"
          />
          <FormTextarea
            v-model="form.descripcion"
            label="Descripción"
            placeholder="Descripción opcional del ciclo..."
            hint="Máximo 1000 caracteres."
            :rows="2"
          />
        </div>

        <!-- ── Sede y Curso ───────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect v-model="form.sede_id" label="Sede *" :options="formSedeOptions" :required="true" />
          <FormSelect v-model="form.curso_id" label="Curso *" :options="formCursoOptions" :required="true" />
        </div>

        <!-- ── Módulos del curso con selección de grupos ──────────────────── -->
        <div class="flex flex-col gap-3">
          <div>
            <p class="text-sm font-medium text-slate-900">Grupos por módulo</p>
            <p class="mt-0.5 text-xs text-slate-500">
              El sistema organiza los grupos según los módulos del curso. Para cada módulo, elige el grupo que lo dictará en la sede seleccionada. El orden de los módulos define la secuencia del ciclo.
            </p>
          </div>

          <!-- Estado: sin sede o curso -->
          <div v-if="!form.sede_id || !form.curso_id" class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
            <p class="text-sm text-slate-500">Selecciona la sede y el curso para ver los módulos disponibles.</p>
          </div>

          <!-- Estado: cargando módulos -->
          <div v-else-if="modulosLoading" class="flex items-center justify-center rounded-lg border border-black/10 bg-white py-6">
            <span class="text-sm text-slate-500">Cargando módulos del curso...</span>
          </div>

          <!-- Estado: sin módulos -->
          <div v-else-if="cursoModulos.length === 0" class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
            <p class="text-sm text-slate-500">El curso seleccionado no tiene módulos configurados.</p>
          </div>

          <!-- Lista de módulos -->
          <div v-else class="space-y-2">
            <div
              v-for="(modulo, idx) in cursoModulos"
              :key="modulo.id"
              class="rounded-lg border border-black/10 bg-white p-3"
            >
              <!-- Cabecera del módulo -->
              <div class="mb-2 flex items-center gap-2">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#213360] text-xs font-bold text-white">
                  {{ idx + 1 }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900">{{ modulo.nombre }}</p>
                  <p v-if="modulo.duracion" class="text-xs text-slate-500">{{ modulo.duracion }}h</p>
                </div>
                <!-- Indicador de grupo asignado -->
                <span
                  v-if="moduloSeleccion[modulo.id]"
                  class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                >
                  Asignado
                </span>
                <span v-else class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Sin asignar
                </span>
              </div>

              <!-- Selector de grupo -->
              <div class="pl-8">
                <div v-if="moduloGruposMap[modulo.id]?.loading" class="text-xs text-slate-400 italic">Cargando grupos...</div>
                <div v-else-if="!moduloGruposMap[modulo.id]?.grupos?.length" class="text-xs text-slate-400 italic">
                  Sin grupos disponibles para este módulo en la sede seleccionada.
                </div>
                <div v-else class="flex flex-col gap-1">
                  <!-- Opción: sin grupo -->
                  <label class="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-50">
                    <input
                      type="radio"
                      :name="`modulo-${modulo.id}`"
                      :value="null"
                      :checked="!moduloSeleccion[modulo.id]"
                      class="size-3.5 text-blue-600 focus:ring-blue-500"
                      @change="setModuloSeleccion(modulo.id, null)"
                    />
                    <span class="text-slate-400 italic">Sin grupo asignado</span>
                  </label>
                  <!-- Opciones de grupos del módulo -->
                  <label
                    v-for="grupo in moduloGruposMap[modulo.id].grupos"
                    :key="grupo.id"
                    class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-blue-50"
                    :class="moduloSeleccion[modulo.id] === grupo.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''"
                  >
                    <input
                      type="radio"
                      :name="`modulo-${modulo.id}`"
                      :value="grupo.id"
                      :checked="moduloSeleccion[modulo.id] === grupo.id"
                      class="mt-0.5 size-3.5 text-blue-600 focus:ring-blue-500"
                      @change="setModuloSeleccion(modulo.id, grupo.id)"
                    />
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-slate-900">{{ grupo.nombre }}</p>
                      <p class="text-xs text-slate-500">
                        {{ grupo.jornada_nombre ?? getJornadaLabel(grupo.jornada) ?? '' }}
                        <template v-if="grupo.profesor?.name"> · {{ grupo.profesor.name }}</template>
                        <template v-if="grupo.total_horas_semana"> · {{ grupo.total_horas_semana }}h/sem</template>
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- Resumen de grupos seleccionados -->
            <div v-if="gruposSeleccionadosCount > 0" class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {{ gruposSeleccionadosCount }} de {{ cursoModulos.length }} módulos con grupo asignado.
              El ciclo se dictará en el orden que aparecen los módulos.
            </div>
          </div>
        </div>

        <!-- ── Fechas ─────────────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput v-model="form.fecha_inicio" label="Fecha inicio *" type="date" :required="true" />
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-slate-900">Fecha fin</label>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                v-model="form.fecha_fin_automatica"
                type="checkbox"
                class="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Calcular automáticamente según grupos
            </label>
            <FormInput v-if="!form.fecha_fin_automatica" v-model="form.fecha_fin" label="" type="date" />
            <p v-else class="text-xs text-slate-500">El sistema sumará la duración de cada módulo según el orden de los grupos asignados.</p>
          </div>
        </div>

        <!-- ── Inscritos y Estado ─────────────────────────────────────────── -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput v-model="form.inscritos" label="Inscritos" type="number" placeholder="0" min="0" hint="Número de estudiantes inscritos (opcional)." />
          <FormSelect v-model="form.status" label="Estado" :options="[{ value: 1, label: 'Activo' }, { value: 2, label: 'Inactivo' }]" />
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

        <!-- Grupos del ciclo agrupados por módulo -->
        <div v-if="detailCiclo.grupos?.length" class="col-span-2">
          <dt class="font-medium text-slate-500 mb-2">Plan de dictado ({{ detailCiclo.grupos.length }} grupos)</dt>
          <dd class="space-y-2">
            <button
              v-for="grupo in detailCiclo.grupos"
              :key="grupo.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-slate-50 px-3 py-2.5 text-sm transition-colors hover:bg-slate-100 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="openGrupoDetalle(grupo)"
            >
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#213360] text-xs font-bold text-white">
                {{ grupo.orden ?? '·' }}
              </span>
              <div class="min-w-0 flex-1 text-left">
                <p class="font-medium text-slate-900">{{ grupo.nombre }}</p>
                <p class="text-xs text-slate-500">
                  <span v-if="grupo.modulo">{{ grupo.modulo.nombre }}</span>
                  <span v-if="grupo.jornada_nombre"> · {{ grupo.jornada_nombre }}</span>
                  <span v-if="grupo.profesor"> · {{ grupo.profesor.name }}</span>
                </p>
              </div>
              <NavIcon name="eye" class="size-4 shrink-0 text-slate-400" />
            </button>
          </dd>
        </div>
      </dl>
    </div>
  </ModalBase>

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
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import cicloService from '@/services/cicloService.js'
import sedeService from '@/services/sedeService.js'
import cursoService from '@/services/cursoService.js'
import grupoService from '@/services/grupoService.js'
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

// ─── Módulos del curso con sus grupos por sede ────────────────────────────────
const cursoModulos = ref([])
const modulosLoading = ref(false)
// moduloGruposMap[moduloId] = { grupos: [], loading: false }
const moduloGruposMap = reactive({})
// moduloSeleccion[moduloId] = grupoId | null
const moduloSeleccion = reactive({})

const gruposSeleccionadosCount = computed(() =>
  cursoModulos.value.filter((m) => moduloSeleccion[m.id]).length
)

function setModuloSeleccion(moduloId, grupoId) {
  moduloSeleccion[moduloId] = grupoId
}

async function loadModulosCurso(cursoId) {
  if (!cursoId) {
    cursoModulos.value = []
    return
  }
  modulosLoading.value = true
  try {
    const res = await cursoService.getById(cursoId, { with: 'modulos' })
    cursoModulos.value = res.data?.modulos ?? []
    // Limpiar selecciones previas de módulos que ya no aplican
    Object.keys(moduloSeleccion).forEach((k) => { delete moduloSeleccion[k] })
    Object.keys(moduloGruposMap).forEach((k) => { delete moduloGruposMap[k] })
    // Inicializar entradas del mapa
    for (const mod of cursoModulos.value) {
      moduloGruposMap[mod.id] = { grupos: [], loading: false }
      moduloSeleccion[mod.id] = null
    }
    // Cargar grupos para cada módulo si ya hay sede seleccionada
    if (form.sede_id) {
      await loadGruposTodosModulos()
    }
  } catch {
    cursoModulos.value = []
  } finally {
    modulosLoading.value = false
  }
}

async function loadGruposTodosModulos() {
  const sedeId = form.sede_id
  if (!sedeId || !cursoModulos.value.length) return
  await Promise.all(
    cursoModulos.value.map((mod) => loadGruposModulo(mod.id, sedeId))
  )
}

async function loadGruposModulo(moduloId, sedeId) {
  if (!moduloGruposMap[moduloId]) moduloGruposMap[moduloId] = { grupos: [], loading: false }
  moduloGruposMap[moduloId].loading = true
  try {
    const res = await grupoService.getAll({
      modulo_id: moduloId,
      sede_id: sedeId,
      status: 1,
      per_page: 100,
      sort_by: 'nombre',
      sort_direction: 'asc',
      with: 'modulo,profesor'
    })
    moduloGruposMap[moduloId].grupos = res.data ?? []
  } catch {
    moduloGruposMap[moduloId].grupos = []
  } finally {
    moduloGruposMap[moduloId].loading = false
  }
}

// ─── Watchers de sede y curso ─────────────────────────────────────────────────
watch(() => form.sede_id, (newSedeId) => {
  // Al cambiar sede: limpiar selecciones y recargar grupos de cada módulo
  Object.keys(moduloSeleccion).forEach((k) => { moduloSeleccion[k] = null })
  if (newSedeId && cursoModulos.value.length) {
    loadGruposTodosModulos()
  }
})

watch(() => form.curso_id, (newCursoId) => {
  loadModulosCurso(newCursoId)
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
  cursoModulos.value = []
  Object.keys(moduloSeleccion).forEach((k) => { delete moduloSeleccion[k] })
  Object.keys(moduloGruposMap).forEach((k) => { delete moduloGruposMap[k] })
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

  // Cargar módulos y grupos del curso/sede
  if (form.curso_id) {
    await loadModulosCurso(form.curso_id)
  }

  // Pre-seleccionar grupos ya asignados al ciclo (en orden)
  try {
    const res = await cicloService.getById(ciclo.id, { with: 'grupos.modulo' })
    const gruposAsignados = res.data?.grupos ?? ciclo.grupos ?? []
    // Ordenar por campo "orden" y asignar al módulo correspondiente
    const sorted = [...gruposAsignados].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    for (const g of sorted) {
      const moduloId = g.modulo_id ?? g.modulo?.id
      if (moduloId && moduloSeleccion[moduloId] !== undefined) {
        moduloSeleccion[moduloId] = g.id
      }
    }
  } catch {
    // Mantener sin selección previa
  }

  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}
  formLoading.value = true
  try {
    // Construir array de grupos en el orden de los módulos del curso
    const gruposOrdenados = cursoModulos.value
      .map((m) => moduloSeleccion[m.id])
      .filter(Boolean)

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
    if (gruposOrdenados.length) payload.grupos = gruposOrdenados

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
const detailCiclo = ref(null)

async function openDetail(ciclo) {
  detailCiclo.value = ciclo
  showDetailModal.value = true
  try {
    const res = await cicloService.getById(ciclo.id, {
      with: 'sede,curso,grupos.modulo,grupos.profesor,grupos.horarios.area'
    })
    detailCiclo.value = res.data
  } catch {
    // Mantener datos del listado
  }
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
  const d = new Date(value)
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
