<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-roles-heading">
      <h2 id="stats-roles-heading" class="sr-only">Resumen de roles</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total roles"
            :value="stats.total"
            description="Definidos en el sistema"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="Disponibles para asignar"
            icon="people"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivos"
            :value="stats.inactivos"
            description="Deshabilitados temporalmente"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Barra de filtros y acciones -->
    <section aria-labelledby="filtros-roles-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-roles-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre del rol..."
            help="Filtra roles por nombre."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.status"
            label="Estado:"
            help="Activo o inactivo."
            :options="statusOptions"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo rol
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de roles -->
    <section aria-labelledby="listado-roles-heading">
      <SectionHeader
        id="listado-roles-heading"
        title="Roles del sistema"
        description="Cada rol define el conjunto de acciones que un usuario puede realizar."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando roles...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
        <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="loadRoles"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="rolesFiltrados"
        row-key="id"
        aria-label="Listado de roles del sistema"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'name'">
            <span class="font-medium capitalize text-slate-900">{{ value }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusBadge
              :label="row.status ? 'Activo' : 'Inactivo'"
              :variant="row.status ? 'activo' : 'inactivo'"
            />
          </template>
          <template v-else-if="column.key === 'permissions_count'">
            <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {{ value ?? row.permissions?.length ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'users_count'">
            <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {{ value ?? 0 }}
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
            class="rounded p-1.5 transition-colors focus:outline-none focus:ring-2"
            :class="row.status
              ? 'text-slate-500 hover:bg-red-100 hover:text-red-700 focus:ring-red-500'
              : 'text-slate-500 hover:bg-green-100 hover:text-green-700 focus:ring-green-500'"
            :title="row.status ? 'Desactivar' : 'Activar'"
            @click="confirmToggle(row)"
          >
            <NavIcon :name="row.status ? 'close' : 'track_changes'" class="size-4" />
          </button>
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Eliminar"
            @click="openEliminar(row)"
          >
            <NavIcon name="trash" class="size-4" />
          </button>
        </template>
      </DataTable>
    </section>

    <!-- ── Modal: Crear / Editar rol ──────────────────────────────────────────── -->
    <ModalBase
      v-model="showFormModal"
      size="xl"
      :title="editingRol ? 'Editar rol' : 'Nuevo rol'"
      :description="editingRol ? 'Modifica el nombre, estado y permisos del rol.' : 'Define el nombre y los permisos del nuevo rol.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="security" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-5 pb-2" @submit.prevent="submitForm">
        <!-- Nombre + Estado -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.name"
            label="Nombre del rol"
            placeholder="Ej: supervisor"
            help="Identificador único del rol en el sistema (sin espacios, minúsculas)."
            :required="true"
          />

          <!-- Toggle de estado -->
          <div class="flex items-center gap-3 rounded-lg bg-[#f3f3f5] px-3 py-2.5">
            <button
              type="button"
              role="switch"
              :aria-checked="form.status"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              :class="form.status ? 'bg-[#213360]' : 'bg-slate-300'"
              @click="form.status = !form.status"
            >
              <span
                class="pointer-events-none inline-block size-4 rounded-full bg-white shadow transition-transform"
                :class="form.status ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
            <span class="text-sm font-medium text-slate-700">
              {{ form.status ? 'Rol activo' : 'Rol inactivo' }}
            </span>
            <FormFieldHelp text="Un rol inactivo no puede asignarse a nuevos usuarios." />
          </div>
        </div>

        <!-- Permisos por módulo con checkboxes -->
        <div class="flex flex-col gap-3">
          <!-- Cabecera: título + búsqueda + contador + limpiar todo -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1">
              <span class="text-sm font-medium text-slate-900">Permisos</span>
              <FormFieldHelp text="Marca los permisos que tendrá este rol. Se sincronizan completamente al guardar." />
            </div>
            <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {{ form.permissions.length }} seleccionado{{ form.permissions.length !== 1 ? 's' : '' }}
            </span>
            <div class="ml-auto flex items-center gap-3">
              <div class="relative">
                <input
                  v-model="permisosSearch"
                  type="text"
                  placeholder="Buscar permiso..."
                  class="w-44 rounded-lg border-0 bg-[#f3f3f5] px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                class="text-xs text-slate-500 hover:text-slate-700 hover:underline focus:outline-none"
                @click="form.permissions.splice(0)"
              >
                Limpiar todo
              </button>
            </div>
          </div>

          <!-- Estado de carga -->
          <div v-if="permisosLoading" class="py-6 text-center text-sm text-slate-400">
            Cargando permisos del sistema...
          </div>

          <!-- Grid de módulos -->
          <div
            v-else
            class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div
              v-for="grupo in permisosAgrupadosTodos"
              :key="grupo.nombre"
              class="rounded-lg border border-black/10 bg-white overflow-hidden"
            >
              <!-- Cabecera del módulo -->
              <div class="flex items-center justify-between border-b border-black/8 bg-slate-50 px-3 py-2">
                <div class="flex items-center gap-1.5">
                  <NavIcon :name="grupo.icon" class="size-3.5 text-[#213360]" />
                  <span class="text-xs font-semibold text-slate-700">{{ grupo.nombre }}</span>
                  <span class="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-black/10">
                    {{ grupo.permisos.filter(p => form.permissions.includes(p.name)).length }}/{{ grupo.permisos.length }}
                  </span>
                </div>
                <div class="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    class="text-blue-600 hover:underline focus:outline-none"
                    @click="toggleModulo(grupo.permisos, true)"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    class="text-slate-400 hover:underline focus:outline-none"
                    @click="toggleModulo(grupo.permisos, false)"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <!-- Lista de checkboxes -->
              <div class="max-h-56 overflow-y-auto divide-y divide-slate-50">
                <label
                  v-for="p in grupo.permisos"
                  :key="p.name"
                  class="flex cursor-pointer items-start gap-2.5 px-3 py-2 transition-colors hover:bg-slate-50"
                  :class="{ 'bg-blue-50/60': form.permissions.includes(p.name) }"
                >
                  <input
                    type="checkbox"
                    :value="p.name"
                    :checked="form.permissions.includes(p.name)"
                    class="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 accent-[#213360] focus:ring-blue-500"
                    @change="togglePermiso(p.name)"
                  />
                  <div class="min-w-0">
                    <p class="text-xs leading-tight text-slate-700">{{ p.descripcion || p.name }}</p>
                    <code class="text-[9px] text-slate-400">{{ p.name }}</code>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <p v-if="fieldErrors['permissions']?.[0]" class="text-xs text-red-600">
            {{ fieldErrors['permissions'][0] }}
          </p>
        </div>

        <div v-if="formError" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </div>

        <div v-if="fieldErrors && Object.keys(fieldErrors).length > 0" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
          <span v-else>{{ editingRol ? 'Guardar cambios' : 'Crear rol' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Confirmar toggle status ─────────────────────────────────────── -->
    <ModalBase
      v-model="showToggleModal"
      :title="targetRol?.status ? 'Desactivar rol' : 'Activar rol'"
      :description="targetRol?.status
        ? 'El rol quedará inactivo y no podrá asignarse a nuevos usuarios.'
        : 'El rol volverá a estar disponible para asignarse a usuarios.'"
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Confirmas
          <strong>{{ targetRol?.status ? 'desactivar' : 'activar' }}</strong>
          el rol <strong class="capitalize">{{ targetRol?.name }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showToggleModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 focus:outline-none focus:ring-2"
          :class="targetRol?.status
            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'"
          @click="doToggle"
        >
          {{ actionLoading ? 'Procesando...' : (targetRol?.status ? 'Desactivar' : 'Activar') }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Confirmar eliminar ─────────────────────────────────────────── -->
    <ModalBase
      v-model="showEliminarModal"
      title="Eliminar rol"
      description="Esta acción es irreversible. El rol se eliminará permanentemente."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de eliminar el rol <strong class="capitalize">{{ targetRol?.name }}</strong>?
        </p>
        <p v-if="(targetRol?.users_count ?? 0) > 0" class="mt-2 text-sm text-amber-700">
          Este rol tiene <strong>{{ targetRol.users_count }}</strong> usuario(s) asignado(s). El backend rechazará la eliminación.
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
          @click="doEliminar"
        >
          {{ actionLoading ? 'Eliminando...' : 'Eliminar' }}
        </button>
      </template>
    </ModalBase>

    <!-- ── Modal: Detalle de rol ──────────────────────────────────────────────── -->
    <ModalBase
      v-model="showDetailModal"
      size="xl"
      title="Detalle del rol"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="security" class="size-5" />
        </span>
      </template>

      <div v-if="detailRol" class="space-y-5 pb-4">
        <!-- Resumen de propiedades -->
        <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 font-semibold capitalize text-slate-900">{{ detailRol.name }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailRol.status ? 'Activo' : 'Inactivo'"
                :variant="detailRol.status ? 'activo' : 'inactivo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Permisos</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailRol.permissions_count ?? detailRol.permissions?.length ?? 0 }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Usuarios</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailRol.users_count ?? 0 }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailRol.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailRol.updated_at) }}</dd>
          </div>
        </dl>

        <div class="border-t border-black/8" />

        <!-- Permisos por módulo en columnas -->
        <div>
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Permisos asignados
          </p>

          <div v-if="permisosDetalleAgrupados.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="grupo in permisosDetalleAgrupados"
              :key="grupo.nombre"
              class="rounded-lg border border-black/10 bg-white overflow-hidden"
            >
              <!-- Cabecera del módulo -->
              <div class="flex items-center gap-1.5 border-b border-black/8 bg-slate-50 px-3 py-2">
                <NavIcon :name="grupo.icon" class="size-3.5 text-[#213360]" />
                <span class="text-xs font-semibold text-slate-700">{{ grupo.nombre }}</span>
                <span class="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  {{ grupo.permisos.length }}
                </span>
              </div>

              <!-- Lista de permisos con check -->
              <ul class="max-h-56 overflow-y-auto divide-y divide-slate-50">
                <li
                  v-for="p in grupo.permisos"
                  :key="p.name"
                  class="flex items-start gap-2 px-3 py-2"
                >
                  <svg class="mt-0.5 size-3.5 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <div class="min-w-0">
                    <p class="text-xs leading-tight text-slate-700">{{ p.descripcion || p.name }}</p>
                    <code class="text-[9px] text-slate-400">{{ p.name }}</code>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <p v-else class="text-sm text-slate-400">Sin permisos asignados.</p>
        </div>
      </div>
    </ModalBase>

    <!-- ── Matriz de permisos (referencia) ────────────────────────────────────── -->
    <section aria-labelledby="matriz-heading">
      <SectionHeader
        id="matriz-heading"
        title="Matriz de permisos por módulo"
        description="Referencia de las acciones habilitadas para cada rol cargado desde el sistema."
        class="mb-4"
      />

      <div class="space-y-4">
        <div
          v-for="modulo in modulosConPermisos"
          :key="modulo.nombre"
          class="rounded-[14px] border border-black/10 bg-white"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between px-5 py-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            :aria-expanded="modulo.abierto"
            @click="modulo.abierto = !modulo.abierto"
          >
            <div class="flex items-center gap-2">
              <NavIcon :name="modulo.icon" class="size-4 text-[#213360]" />
              <span class="text-sm font-semibold text-slate-900">{{ modulo.nombre }}</span>
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {{ modulo.permisos.length }} permisos
              </span>
            </div>
            <NavIcon
              :name="modulo.abierto ? 'expand_less' : 'expand_more'"
              class="size-4 text-slate-400"
            />
          </button>

          <div v-if="modulo.abierto">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[640px] text-sm" :aria-label="`Permisos de ${modulo.nombre}`">
                <thead class="border-y border-slate-100 bg-slate-50/80">
                  <tr>
                    <th scope="col" class="px-5 py-2.5 text-left text-xs font-medium text-slate-500">
                      Permiso
                    </th>
                    <th
                      v-for="rol in rolesMatriz"
                      :key="rol.id ?? rol.name"
                      scope="col"
                      class="px-3 py-2.5 text-center text-xs font-medium text-slate-500"
                    >
                      <span class="capitalize">{{ rol.name }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  <tr
                    v-for="permiso in modulo.permisos"
                    :key="permiso.key"
                    class="bg-white transition-colors hover:bg-slate-50/50"
                  >
                    <td class="px-5 py-2.5">
                      <div>
                        <p class="text-xs font-medium text-slate-900">{{ permiso.descripcion }}</p>
                        <code class="text-[10px] text-slate-400">{{ permiso.key }}</code>
                      </div>
                    </td>
                    <td
                      v-for="rol in rolesMatriz"
                      :key="rol.id ?? rol.name"
                      class="px-3 py-2.5 text-center"
                    >
                      <span
                        v-if="rolTienePermiso(rol, permiso.key)"
                        class="inline-flex items-center justify-center"
                        :aria-label="`${rol.name} tiene ${permiso.key}`"
                      >
                        <svg class="size-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center justify-center"
                        :aria-label="`${rol.name} no tiene ${permiso.key}`"
                      >
                        <svg class="size-3.5 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { onMounted } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import DataTable from '@/components/activos/DataTable.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import FormInput from '@/components/forms/FormInput.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormFieldHelp from '@/components/forms/FormFieldHelp.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import roleService from '@/services/roleService.js'
import { useNotification } from '@/composables/useNotification'

const { success: notifySuccess, error: notifyError } = useNotification()

// ─── Estado principal ──────────────────────────────────────────────────────────
const roles = ref([])
const loading = ref(false)
const error = ref('')
const allPermisos = ref([])
const permisosLoading = ref(false)

// ─── Estadísticas computadas ──────────────────────────────────────────────────
const stats = computed(() => ({
  total: roles.value.length,
  activos: roles.value.filter((r) => r.status).length,
  inactivos: roles.value.filter((r) => !r.status).length
}))

// ─── Filtros ──────────────────────────────────────────────────────────────────
const filters = reactive({ search: '', status: '' })
let searchTimer = null

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' }
]

watch(() => filters.status, () => loadRoles())

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadRoles(), 400)
}

// Roles filtrados en cliente (los cargamos todos con per_page=0)
const rolesFiltrados = computed(() => {
  let lista = roles.value
  if (filters.search) {
    const q = filters.search.toLowerCase()
    lista = lista.filter((r) => r.name.toLowerCase().includes(q))
  }
  if (filters.status === '1') lista = lista.filter((r) => r.status)
  if (filters.status === '0') lista = lista.filter((r) => !r.status)
  return lista
})

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'name', label: 'Nombre' },
  { key: 'permissions_count', label: 'Permisos' },
  { key: 'users_count', label: 'Usuarios' },
  { key: 'status', label: 'Estado' },
  { key: 'created_at', label: 'Creado' }
]

// ─── Carga de datos ──────────────────────────────────────────────────────────
async function loadRoles() {
  loading.value = true
  error.value = ''
  try {
    const res = await roleService.getAll({ per_page: 0 })
    roles.value = res.data ?? []
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los roles.'
  } finally {
    loading.value = false
  }
}

async function loadPermisos() {
  permisosLoading.value = true
  try {
    const res = await roleService.getAllPermisos({ per_page: 0 })
    allPermisos.value = res.data ?? []
  } catch {
    // Fallar silenciosamente; el selector quedará sin opciones
  } finally {
    permisosLoading.value = false
  }
}

// ─── Helpers de permisos ─────────────────────────────────────────────────────
function grupoDePermiso(name) {
  if (name.startsWith('co_')) return 'Configuración'
  if (name.startsWith('crm_')) return 'CRM'
  if (name.startsWith('aca_')) return 'Académico'
  if (name.startsWith('fin_')) return 'Financiero'
  return 'General'
}

const MODULO_ICON = {
  'Configuración': 'settings',
  'CRM': 'contacts',
  'Académico': 'academico',
  'Financiero': 'payments',
  'General': 'list_alt'
}

function agruparPermisos(lista) {
  const orden = ['Configuración', 'CRM', 'Académico', 'Financiero', 'General']
  const grupos = {}
  for (const p of lista) {
    const g = grupoDePermiso(p.name ?? p)
    if (!grupos[g]) grupos[g] = []
    grupos[g].push(p)
  }
  return orden
    .filter((n) => grupos[n])
    .map((nombre) => ({ nombre, icon: MODULO_ICON[nombre], permisos: grupos[nombre] }))
}

// ── Grid para edición: todos los permisos con búsqueda ──
const permisosSearch = ref('')

const permisosAgrupadosTodos = computed(() => {
  const q = permisosSearch.value.trim().toLowerCase()
  const lista = q
    ? allPermisos.value.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.descripcion ?? '').toLowerCase().includes(q)
      )
    : allPermisos.value
  return agruparPermisos(lista)
})

function togglePermiso(name) {
  const idx = form.permissions.indexOf(name)
  if (idx === -1) form.permissions.push(name)
  else form.permissions.splice(idx, 1)
}

function toggleModulo(grupoPermisos, seleccionar) {
  grupoPermisos.forEach((p) => {
    const idx = form.permissions.indexOf(p.name)
    if (seleccionar && idx === -1) form.permissions.push(p.name)
    if (!seleccionar && idx !== -1) form.permissions.splice(idx, 1)
  })
}

function moduloTodosSeleccionados(grupoPermisos) {
  return grupoPermisos.length > 0 && grupoPermisos.every((p) => form.permissions.includes(p.name))
}

// ── Grid para detalle: solo los asignados, agrupados ──
const permisosDetalleAgrupados = computed(() => {
  if (!detailRol.value?.permissions?.length) return []
  return agruparPermisos(detailRol.value.permissions).filter((g) => g.permisos.length > 0)
})

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingRol = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  name: '',
  status: true,
  permissions: []
})

function resetForm() {
  form.name = ''
  form.status = true
  form.permissions.splice(0)
  permisosSearch.value = ''
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingRol.value = null
  resetForm()
  showFormModal.value = true
}

function openEdit(rol) {
  editingRol.value = rol
  form.name = rol.name ?? ''
  form.status = rol.status ?? true
  form.permissions.splice(0, form.permissions.length, ...(rol.permissions ?? []).map((p) => p.name))
  formError.value = ''
  fieldErrors.value = {}
  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}

  const payload = {
    name: form.name,
    status: form.status,
    permissions: form.permissions
  }

  formLoading.value = true
  try {
    if (editingRol.value) {
      await roleService.update(editingRol.value.id, payload, { _silent: true })
      notifySuccess(`El rol "${form.name}" fue actualizado correctamente.`)
    } else {
      await roleService.create(payload, { _silent: true })
      notifySuccess(`El rol "${form.name}" fue creado correctamente.`)
    }
    showFormModal.value = false
    await loadRoles()
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

// ─── Modal Toggle status ─────────────────────────────────────────────────────
const showToggleModal = ref(false)
const targetRol = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function confirmToggle(rol) {
  targetRol.value = rol
  actionError.value = ''
  showToggleModal.value = true
}

async function doToggle() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await roleService.toggleStatus(targetRol.value.id)
    const label = targetRol.value.status ? 'desactivado' : 'activado'
    notifySuccess(`El rol "${targetRol.value.name}" fue ${label}.`)
    showToggleModal.value = false
    await loadRoles()
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al cambiar el estado del rol.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────
const showEliminarModal = ref(false)

function openEliminar(rol) {
  targetRol.value = rol
  actionError.value = ''
  showEliminarModal.value = true
}

async function doEliminar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await roleService.delete(targetRol.value.id)
    notifySuccess(`El rol "${targetRol.value.name}" fue eliminado.`)
    showEliminarModal.value = false
    await loadRoles()
  } catch (e) {
    if (e?.response?.status === 422) {
      actionError.value = e.response.data?.message ?? 'No se puede eliminar: el rol tiene usuarios asignados.'
    } else {
      actionError.value = e?.response?.data?.message ?? 'Error al eliminar el rol.'
    }
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ───────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailRol = ref(null)

async function openDetail(rol) {
  detailRol.value = rol
  showDetailModal.value = true
  try {
    const res = await roleService.getById(rol.id)
    detailRol.value = res.data
  } catch {
    // Mantener datos del listado si falla
  }
}

// ─── Matriz dinámica ──────────────────────────────────────────────────────────
const rolesMatriz = computed(() => roles.value.slice(0, 6))

function rolTienePermiso(rol, permisoKey) {
  return (rol.permissions ?? []).some((p) => p.name === permisoKey)
}

// ─── Módulos para la matriz ───────────────────────────────────────────────────
const modulosConPermisos = reactive([
  {
    nombre: 'Configuración',
    icon: 'settings',
    abierto: false,
    permisos: [
      { key: 'co_users', descripcion: 'Ver usuarios' },
      { key: 'co_userCrear', descripcion: 'Crear usuario' },
      { key: 'co_userEditar', descripcion: 'Editar usuario' },
      { key: 'co_userInactivar', descripcion: 'Inactivar usuario' },
      { key: 'co_usersPerfil', descripcion: 'Ver perfil de usuario' },
      { key: 'co_roles', descripcion: 'Ver roles' },
      { key: 'co_rolCrear', descripcion: 'Crear rol' },
      { key: 'co_rolEditar', descripcion: 'Editar rol' },
      { key: 'co_rolEliminar', descripcion: 'Eliminar rol' },
      { key: 'co_rolPermisos', descripcion: 'Gestionar permisos de un rol' },
      { key: 'co_permisos', descripcion: 'Ver todos los permisos' },
      { key: 'co_poblaciones', descripcion: 'Ver poblaciones' },
      { key: 'co_poblacionInactivar', descripcion: 'Activar / inactivar población' },
      { key: 'co_sedes', descripcion: 'Ver sedes' },
      { key: 'co_sedeCrear', descripcion: 'Crear sede' },
      { key: 'co_sedeEditar', descripcion: 'Editar sede' },
      { key: 'co_sedeInactivar', descripcion: 'Inactivar sede' },
      { key: 'co_areas', descripcion: 'Ver áreas' },
      { key: 'co_areaCrear', descripcion: 'Crear área' },
      { key: 'co_areaEditar', descripcion: 'Editar área' },
      { key: 'co_areaInactivar', descripcion: 'Inactivar área' },
      { key: 'co_horarios', descripcion: 'Ver horarios' },
      { key: 'co_horarioCrear', descripcion: 'Crear horario' },
      { key: 'co_horarioEditar', descripcion: 'Editar horario' },
      { key: 'co_horarioInactivar', descripcion: 'Inactivar horario' }
    ]
  },
  {
    nombre: 'CRM',
    icon: 'contacts',
    abierto: false,
    permisos: [
      { key: 'crm_referidos', descripcion: 'Ver referidos' },
      { key: 'crm_referidoCrear', descripcion: 'Crear referido' },
      { key: 'crm_referidoEditar', descripcion: 'Editar referido' },
      { key: 'crm_referidoInactivar', descripcion: 'Inactivar referido' },
      { key: 'crm_seguimientos', descripcion: 'Ver seguimientos' },
      { key: 'crm_seguimientoCrear', descripcion: 'Crear seguimiento' },
      { key: 'crm_seguimientoEditar', descripcion: 'Editar seguimiento' },
      { key: 'crm_seguimientoInactivar', descripcion: 'Inactivar seguimiento' },
      { key: 'crm_agendas', descripcion: 'Ver agendas' },
      { key: 'crm_agendaCrear', descripcion: 'Crear agenda' },
      { key: 'crm_agendaEditar', descripcion: 'Editar agenda' },
      { key: 'crm_agendaInactivar', descripcion: 'Inactivar agenda' }
    ]
  },
  {
    nombre: 'Académico',
    icon: 'academico',
    abierto: false,
    permisos: [
      { key: 'aca_cursos', descripcion: 'Ver cursos' },
      { key: 'aca_cursoCrear', descripcion: 'Crear curso' },
      { key: 'aca_cursoEditar', descripcion: 'Editar curso' },
      { key: 'aca_cursoInactivar', descripcion: 'Inactivar curso' },
      { key: 'aca_modulos', descripcion: 'Ver módulos' },
      { key: 'aca_moduloCrear', descripcion: 'Crear módulo' },
      { key: 'aca_moduloEditar', descripcion: 'Editar módulo' },
      { key: 'aca_moduloInactivar', descripcion: 'Inactivar módulo' },
      { key: 'aca_grupos', descripcion: 'Ver grupos' },
      { key: 'aca_grupoCrear', descripcion: 'Crear grupo' },
      { key: 'aca_grupoEditar', descripcion: 'Editar grupo' },
      { key: 'aca_grupoInactivar', descripcion: 'Inactivar grupo' },
      { key: 'aca_matriculas', descripcion: 'Ver matrículas' },
      { key: 'aca_matriculaCrear', descripcion: 'Crear matrícula' },
      { key: 'aca_matriculaEditar', descripcion: 'Editar matrícula' },
      { key: 'aca_matriculaInactivar', descripcion: 'Inactivar matrícula' },
      { key: 'aca_esquemas', descripcion: 'Ver esquemas de calificación' },
      { key: 'aca_esquemaCrear', descripcion: 'Crear esquema' },
      { key: 'aca_esquemaEditar', descripcion: 'Editar esquema' },
      { key: 'aca_esquemaInactivar', descripcion: 'Inactivar esquema' },
      { key: 'aca_notas', descripcion: 'Ver notas' },
      { key: 'aca_notaCrear', descripcion: 'Crear nota' },
      { key: 'aca_notaEditar', descripcion: 'Editar nota' },
      { key: 'aca_notaInactivar', descripcion: 'Inactivar nota' },
      { key: 'aca_asistencias', descripcion: 'Ver asistencias' },
      { key: 'aca_asistenciaCrear', descripcion: 'Crear asistencia' },
      { key: 'aca_asistenciaEditar', descripcion: 'Editar asistencia' },
      { key: 'aca_asistenciaInactivar', descripcion: 'Inactivar asistencia' },
      { key: 'aca_asistenciaReportes', descripcion: 'Ver reportes de asistencia' },
      { key: 'aca_claseProgramar', descripcion: 'Programar clases' },
      { key: 'aca_configuracionAsistencia', descripcion: 'Configurar topes de asistencia' }
    ]
  },
  {
    nombre: 'Financiero',
    icon: 'payments',
    abierto: false,
    permisos: [
      { key: 'fin_lp_tipos_producto', descripcion: 'Ver tipos de producto' },
      { key: 'fin_lp_tipoProductoCrear', descripcion: 'Crear tipo de producto' },
      { key: 'fin_lp_tipoProductoEditar', descripcion: 'Editar tipo de producto' },
      { key: 'fin_lp_tipoProductoInactivar', descripcion: 'Inactivar tipo de producto' },
      { key: 'fin_lp_productos', descripcion: 'Ver productos' },
      { key: 'fin_lp_productoCrear', descripcion: 'Crear producto' },
      { key: 'fin_lp_productoEditar', descripcion: 'Editar producto' },
      { key: 'fin_lp_productoInactivar', descripcion: 'Inactivar producto' },
      { key: 'fin_lp_listas_precios', descripcion: 'Ver listas de precios' },
      { key: 'fin_lp_listaPrecioCrear', descripcion: 'Crear lista de precios' },
      { key: 'fin_lp_listaPrecioEditar', descripcion: 'Editar lista de precios' },
      { key: 'fin_lp_listaPrecioInactivar', descripcion: 'Inactivar lista de precios' },
      { key: 'fin_lp_listaPrecioAprobar', descripcion: 'Aprobar lista de precios' },
      { key: 'fin_conceptos_pago', descripcion: 'Ver conceptos de pago' },
      { key: 'fin_conceptoPagoCrear', descripcion: 'Crear concepto de pago' },
      { key: 'fin_conceptoPagoEditar', descripcion: 'Editar concepto de pago' },
      { key: 'fin_conceptoPagoInactivar', descripcion: 'Inactivar concepto de pago' },
      { key: 'fin_descuentos', descripcion: 'Ver descuentos' },
      { key: 'fin_descuentoCrear', descripcion: 'Crear descuento' },
      { key: 'fin_descuentoEditar', descripcion: 'Editar descuento' },
      { key: 'fin_descuentoInactivar', descripcion: 'Inactivar descuento' },
      { key: 'fin_descuentoAprobar', descripcion: 'Aprobar descuento' },
      { key: 'fin_descuentoAplicar', descripcion: 'Aplicar descuento' },
      { key: 'fin_descuentoHistorial', descripcion: 'Ver historial de descuentos' },
      { key: 'fin_recibos_pago', descripcion: 'Ver recibos de pago' },
      { key: 'fin_reciboPagoCrear', descripcion: 'Crear recibo de pago' },
      { key: 'fin_reciboPagoEditar', descripcion: 'Editar recibo de pago' },
      { key: 'fin_reciboPagoAnular', descripcion: 'Anular recibo de pago' },
      { key: 'fin_reciboPagoCerrar', descripcion: 'Cerrar recibo de pago' },
      { key: 'fin_reciboPagoReportes', descripcion: 'Ver reportes de recibos' },
      { key: 'fin_reciboPagoPDF', descripcion: 'Generar PDF de recibo' }
    ]
  }
])

// ─── Utilidades ──────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Inicialización ───────────────────────────────────────────────────────────
onMounted(() => {
  loadRoles()
  loadPermisos()
})
</script>
