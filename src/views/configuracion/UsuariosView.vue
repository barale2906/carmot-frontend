<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-usuarios-heading">
      <h2 id="stats-usuarios-heading" class="sr-only">Resumen de usuarios</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total usuarios"
            :value="stats.total"
            description="Registrados en el sistema"
            icon="people"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            :value="stats.activos"
            description="Con acceso habilitado"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivos"
            :value="stats.inactivos"
            description="Sin acceso al sistema"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Barra de filtros y acciones -->
    <section aria-labelledby="filtros-usuarios-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-usuarios-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="filters.search"
            label="Buscar:"
            placeholder="Nombre, email o documento..."
            @input="onSearchInput"
          />
        </div>
        <div class="w-full sm:w-[180px]">
          <FormSelect
            v-model="filters.rol"
            label="Rol:"
            placeholder="Todos los roles"
            :options="rolOptions"
          />
        </div>
        <div class="w-full sm:w-auto">
          <FormSelect
            v-model="filters.estado"
            label="Estado:"
            :options="estadoOptions"
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            @click="openCreate"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo usuario
          </button>
        </div>
      </div>
    </section>

    <!-- Tabla de usuarios -->
    <section aria-labelledby="listado-usuarios-heading">
      <SectionHeader
        id="listado-usuarios-heading"
        title="Listado de usuarios"
        description="Haz clic en el ícono de ojo para ver el detalle completo de cada usuario."
        class="mb-4"
      />

      <div v-if="loading" class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <span class="text-sm text-slate-500">Cargando usuarios...</span>
      </div>

      <div v-else-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-6">
        <p class="text-sm text-red-700">{{ error }}</p>
          <button
          type="button"
          class="mt-3 text-sm font-medium text-red-700 underline"
          @click="() => loadUsers(1)"
        >
          Reintentar
        </button>
      </div>

      <DataTable
        v-else
        :columns="tableColumns"
        :data="users"
        row-key="id"
        aria-label="Listado de usuarios del sistema"
      >
        <template #cell="{ column, value, row }">
          <template v-if="column.key === 'roles'">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="rol in (row.roles || [])"
                :key="rol"
                class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ rol }}
              </span>
              <span v-if="!row.roles || row.roles.length === 0" class="text-slate-400">—</span>
            </div>
          </template>
          <template v-else-if="column.key === 'estado'">
            <StatusBadge
              :label="row.deleted_at ? 'Inactivo' : 'Activo'"
              :variant="row.deleted_at ? 'inactivo' : 'activo'"
            />
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
            v-if="!row.deleted_at"
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Inactivar"
            @click="openInactivar(row)"
          >
            <NavIcon name="close" class="size-4" />
          </button>
          <button
            v-else
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-green-100 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Restaurar"
            @click="openRestaurar(row)"
          >
            <NavIcon name="track_changes" class="size-4" />
          </button>
        </template>
      </DataTable>

      <!-- Paginación -->
      <div
        v-if="pagination.lastPage > 1"
        class="mt-4 flex items-center justify-between rounded-[14px] border border-black/10 bg-white px-6 py-3"
      >
        <p class="text-sm text-slate-500">
          Mostrando {{ pagination.from }}–{{ pagination.to }} de {{ pagination.total }} usuarios
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

    <!-- Modal: Crear / Editar usuario -->
    <ModalBase
      v-model="showFormModal"
      :title="editingUser ? 'Editar usuario' : 'Nuevo usuario'"
      :description="editingUser ? 'Modifica los datos del usuario.' : 'Completa los campos para crear un nuevo usuario en el sistema.'"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>

      <form class="flex flex-col gap-4 pb-2" @submit.prevent="submitForm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            v-model="form.name"
            label="Nombre completo"
            placeholder="Ej: María López"
            :required="true"
            span="full"
          />
          <FormInput
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            placeholder="correo@ejemplo.com"
            :required="true"
          />
          <FormInput
            v-model="form.documento"
            label="Documento"
            placeholder="Número de documento"
            :required="true"
          />
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium text-slate-900">
              Rol <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              v-model="form.rol"
              class="w-full appearance-none rounded-lg border-0 bg-[#f3f3f5] px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un rol</option>
              <option
                v-for="opt in availableRoles"
                :key="opt.name"
                :value="opt.name"
              >
                {{ opt.name }}
              </option>
            </select>
          </div>

          <template v-if="!editingUser">
            <FormInput
              v-model="form.password"
              label="Contraseña"
              type="password"
              placeholder="Mín. 8 caracteres"
              :required="true"
              :hint="'Al menos 8 caracteres, mayúscula, número y símbolo.'"
            />
            <FormInput
              v-model="form.password_confirmation"
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite la contraseña"
              :required="true"
            />
          </template>

          <template v-if="editingUser">
            <div class="sm:col-span-2">
              <p class="mb-2 text-sm text-slate-500">
                Deja los campos de contraseña vacíos si no deseas cambiarla.
              </p>
            </div>
            <FormInput
              v-model="form.password"
              label="Nueva contraseña"
              type="password"
              placeholder="Dejar vacío para no cambiar"
            />
            <FormInput
              v-model="form.password_confirmation"
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite la contraseña"
            />
          </template>
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
          <span v-else>{{ editingUser ? 'Guardar cambios' : 'Crear usuario' }}</span>
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Confirmar inactivar -->
    <ModalBase
      v-model="showInactivarModal"
      title="Inactivar usuario"
      description="Esta acción bloqueará el acceso del usuario al sistema. Podrás restaurarlo en cualquier momento."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Estás seguro de que deseas inactivar a
          <strong>{{ targetUser?.name }}</strong>?
        </p>
        <div v-if="actionError" class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </div>
      </div>
      <template #footer>
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="showInactivarModal = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="actionLoading"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500"
          @click="confirmInactivar"
        >
          {{ actionLoading ? 'Inactivando...' : 'Inactivar' }}
        </button>
      </template>
    </ModalBase>

    <!-- Modal: Confirmar restaurar -->
    <ModalBase
      v-model="showRestaurarModal"
      title="Restaurar usuario"
      description="El usuario recuperará el acceso al sistema con su rol y permisos anteriores."
    >
      <div class="pb-2">
        <p class="text-sm text-slate-700">
          ¿Deseas restaurar el acceso de
          <strong>{{ targetUser?.name }}</strong>?
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

    <!-- Modal: Detalle de usuario -->
    <ModalBase
      v-model="showDetailModal"
      title="Detalle del usuario"
    >
      <template #icon>
        <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]">
          <NavIcon name="people" class="size-5" />
        </span>
      </template>
      <div v-if="detailUser" class="space-y-3 pb-4">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt class="font-medium text-slate-500">Nombre</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailUser.name }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Documento</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailUser.documento }}</dd>
          </div>
          <div class="col-span-2">
            <dt class="font-medium text-slate-500">Correo</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailUser.email }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Roles</dt>
            <dd class="mt-0.5 flex flex-wrap gap-1">
              <span
                v-for="rol in (detailUser.roles || [])"
                :key="rol"
                class="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {{ rol }}
              </span>
              <span v-if="!detailUser.roles || detailUser.roles.length === 0" class="text-slate-400">Sin rol asignado</span>
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Estado</dt>
            <dd class="mt-0.5">
              <StatusBadge
                :label="detailUser.deleted_at ? 'Inactivo' : 'Activo'"
                :variant="detailUser.deleted_at ? 'inactivo' : 'activo'"
              />
            </dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Cursos vinculados</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailUser.cursos_count ?? (detailUser.cursos?.length ?? 0) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Grupos</dt>
            <dd class="mt-0.5 text-slate-900">{{ detailUser.grupos_count ?? (detailUser.grupos?.length ?? 0) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Creado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailUser.created_at) }}</dd>
          </div>
          <div>
            <dt class="font-medium text-slate-500">Actualizado</dt>
            <dd class="mt-0.5 text-slate-900">{{ formatDate(detailUser.updated_at) }}</dd>
          </div>
        </dl>
      </div>
    </ModalBase>

  </div>
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
import NavIcon from '@/components/icons/NavIcon.vue'
import ModalBase from '@/components/ModalBase.vue'
import userService from '@/services/userService.js'

// ─── Estado principal ──────────────────────────────────────────────────────────
const users = ref([])
const loading = ref(false)
const error = ref('')
const availableRoles = ref([])

const pagination = reactive({
  currentPage: 1,
  lastPage: 1,
  total: 0,
  from: 0,
  to: 0,
  perPage: 15
})

const stats = reactive({ total: 0, activos: 0, inactivos: 0 })

const filters = reactive({
  search: '',
  rol: '',
  estado: 'activos'
})

let searchTimer = null

// ─── Opciones de filtros ──────────────────────────────────────────────────────
const rolOptions = computed(() =>
  availableRoles.value.map((r) => ({ value: r.name, label: r.name }))
)

const estadoOptions = [
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
  { value: 'todos', label: 'Todos' }
]

// Observa los filtros de select: se ejecutan DESPUÉS de que Vue actualiza el valor reactivo,
// garantizando que filters.rol / filters.estado ya tienen el nuevo valor al llamar a la API.
watch(() => filters.rol, () => loadUsers(1))
watch(() => filters.estado, () => loadUsers(1))

// ─── Columnas de la tabla ─────────────────────────────────────────────────────
const tableColumns = [
  { key: 'name', label: 'Nombre' },
  { key: 'email', label: 'Correo' },
  { key: 'documento', label: 'Documento' },
  { key: 'roles', label: 'Rol' },
  { key: 'estado', label: 'Estado' },
  { key: 'created_at', label: 'Creado' }
]

// ─── Carga de datos ──────────────────────────────────────────────────────────
async function loadUsers(page = 1) {
  loading.value = true
  error.value = ''
  try {
    const params = {
      page,
      per_page: pagination.perPage,
      with: 'roles'
    }
    if (filters.search) params.search = filters.search
    if (filters.rol) params.role = filters.rol
    const res = await userService.getAll(params)
    users.value = res.data ?? []
    if (res.meta) {
      pagination.currentPage = res.meta.current_page
      pagination.lastPage = res.meta.last_page
      pagination.total = res.meta.total
      pagination.from = res.meta.from
      pagination.to = res.meta.to
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'Error al cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

async function loadFilters() {
  try {
    const res = await userService.getFilters()
    availableRoles.value = res.data?.roles ?? []
  } catch {
    // Fallar silenciosamente; los selects quedarán vacíos
  }
}

async function loadStatistics() {
  try {
    const res = await userService.getStatistics()
    const totales = res.data?.totales ?? {}
    stats.total = totales.total ?? 0
    stats.activos = totales.activos ?? 0
    stats.inactivos = totales.eliminados ?? 0
  } catch {
    // Las estadísticas son informativas; no bloquear la vista
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadUsers(1), 400)
}

function goToPage(page) {
  if (page >= 1 && page <= pagination.lastPage) loadUsers(page)
}

// ─── Modal Crear / Editar ─────────────────────────────────────────────────────
const showFormModal = ref(false)
const editingUser = ref(null)
const formLoading = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const form = reactive({
  name: '',
  email: '',
  documento: '',
  rol: '',
  password: '',
  password_confirmation: ''
})

function resetForm() {
  form.name = ''
  form.email = ''
  form.documento = ''
  form.rol = ''
  form.password = ''
  form.password_confirmation = ''
  formError.value = ''
  fieldErrors.value = {}
}

function openCreate() {
  editingUser.value = null
  resetForm()
  showFormModal.value = true
}

function openEdit(user) {
  editingUser.value = user
  form.name = user.name ?? ''
  form.email = user.email ?? ''
  form.documento = user.documento ?? ''
  form.rol = user.roles?.[0] ?? ''
  form.password = ''
  form.password_confirmation = ''
  formError.value = ''
  fieldErrors.value = {}
  showFormModal.value = true
}

async function submitForm() {
  formError.value = ''
  fieldErrors.value = {}

  const payload = {
    name: form.name,
    email: form.email,
    documento: form.documento,
    roles: form.rol ? [form.rol] : []
  }
  if (form.password) {
    payload.password = form.password
    payload.password_confirmation = form.password_confirmation
  }

  formLoading.value = true
  try {
    if (editingUser.value) {
      await userService.update(editingUser.value.id, payload)
    } else {
      if (!form.password) {
        formError.value = 'La contraseña es obligatoria para crear un usuario.'
        return
      }
      await userService.create(payload)
    }
    showFormModal.value = false
    await Promise.all([loadUsers(pagination.currentPage), loadStatistics()])
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

// ─── Modal Inactivar ─────────────────────────────────────────────────────────
const showInactivarModal = ref(false)
const targetUser = ref(null)
const actionLoading = ref(false)
const actionError = ref('')

function openInactivar(user) {
  targetUser.value = user
  actionError.value = ''
  showInactivarModal.value = true
}

async function confirmInactivar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await userService.inactivate(targetUser.value.id)
    showInactivarModal.value = false
    await Promise.all([loadUsers(pagination.currentPage), loadStatistics()])
  } catch (e) {
    if (e?.response?.status === 422) {
      actionError.value = e.response.data?.message ?? 'El usuario tiene relaciones asociadas.'
    } else if (e?.response?.status === 409) {
      actionError.value = 'El usuario ya está inactivo.'
    } else {
      actionError.value = e?.response?.data?.message ?? 'Error al inactivar el usuario.'
    }
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Restaurar ─────────────────────────────────────────────────────────
const showRestaurarModal = ref(false)

function openRestaurar(user) {
  targetUser.value = user
  actionError.value = ''
  showRestaurarModal.value = true
}

async function confirmRestaurar() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await userService.restore(targetUser.value.id)
    showRestaurarModal.value = false
    await Promise.all([loadUsers(pagination.currentPage), loadStatistics()])
  } catch (e) {
    actionError.value = e?.response?.data?.message ?? 'Error al restaurar el usuario.'
  } finally {
    actionLoading.value = false
  }
}

// ─── Modal Detalle ───────────────────────────────────────────────────────────
const showDetailModal = ref(false)
const detailUser = ref(null)

async function openDetail(user) {
  detailUser.value = user
  showDetailModal.value = true
  try {
    const res = await userService.getById(user.id)
    detailUser.value = res.data
  } catch {
    // Mantener los datos del listado si falla el detalle
  }
}

// ─── Utilidades ──────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

// ─── Inicialización ──────────────────────────────────────────────────────────
onMounted(() => {
  loadFilters()
  loadUsers()
  loadStatistics()
})
</script>
