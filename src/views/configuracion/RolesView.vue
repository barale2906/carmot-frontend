<template>
  <div class="flex flex-col gap-6">

    <!-- Aviso informativo -->
    <div class="flex items-start gap-3 rounded-[14px] border border-amber-200 bg-amber-50 p-4">
      <NavIcon name="pendientes" class="mt-0.5 size-4 shrink-0 text-amber-600" />
      <p class="text-sm text-amber-800">
        Los roles y permisos del sistema son un catálogo definido a nivel del servidor.
        Para asignar un rol a un usuario, edítalo desde el módulo de
        <RouterLink to="/configuracion/usuarios" class="font-medium underline">Usuarios</RouterLink>.
      </p>
    </div>

    <!-- Tarjetas de roles -->
    <section aria-labelledby="roles-heading">
      <SectionHeader
        id="roles-heading"
        title="Roles del sistema"
        description="Cada rol define el conjunto de acciones que un usuario puede realizar en el sistema."
        class="mb-4"
      />
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
        <li
          v-for="rol in roles"
          :key="rol.name"
          role="listitem"
        >
          <article class="flex flex-col gap-3 rounded-[14px] border border-black/10 bg-white p-5">
            <div class="flex items-center gap-3">
              <span
                class="flex size-9 items-center justify-center rounded-full"
                :class="rol.badgeClass"
              >
                <NavIcon :name="rol.icon" class="size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-semibold capitalize text-slate-900">{{ rol.name }}</h3>
                <p class="mt-0.5 text-xs text-slate-500">{{ rol.descripcion }}</p>
              </div>
              <span
                class="ml-auto flex h-6 min-w-[40px] items-center justify-center rounded-full px-2 text-xs font-medium"
                :class="rol.badgeClass"
              >
                {{ rol.permisoCount }} permisos
              </span>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="modulo in rol.modulos"
                :key="modulo"
                class="inline-flex items-center rounded-full border border-current/20 px-2 py-0.5 text-xs font-medium"
                :class="rol.tagClass"
              >
                {{ modulo }}
              </span>
            </div>
          </article>
        </li>
      </ul>
    </section>

    <!-- Matriz de permisos por módulo -->
    <section aria-labelledby="matriz-heading">
      <SectionHeader
        id="matriz-heading"
        title="Matriz de permisos por módulo"
        description="Acciones habilitadas para cada rol en cada módulo del sistema."
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
                      v-for="rol in rolesHeader"
                      :key="rol.name"
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
                      v-for="rol in rolesHeader"
                      :key="rol.name"
                      class="px-3 py-2.5 text-center"
                    >
                      <span
                        v-if="tienePermiso(rol.name, permiso.key)"
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
import { reactive } from 'vue'
import { RouterLink } from 'vue-router'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import NavIcon from '@/components/icons/NavIcon.vue'

// ─── Catálogo de roles (fijo por seeder del backend) ─────────────────────────
const roles = [
  {
    name: 'superusuario',
    descripcion: 'Acceso total al sistema, incluyendo gestión de usuarios.',
    icon: 'security',
    badgeClass: 'bg-purple-100 text-purple-700',
    tagClass: 'text-purple-700 bg-purple-50',
    modulos: ['Configuración', 'CRM', 'Académico', 'Financiero'],
    permisoCount: '∞'
  },
  {
    name: 'financiero',
    descripcion: 'Módulo financiero, CRM y configuración básica.',
    icon: 'payments',
    badgeClass: 'bg-blue-100 text-blue-700',
    tagClass: 'text-blue-700 bg-blue-50',
    modulos: ['Financiero', 'CRM', 'Académico'],
    permisoCount: 40
  },
  {
    name: 'coordinador',
    descripcion: 'Módulo académico, CRM y configuración básica.',
    icon: 'school',
    badgeClass: 'bg-teal-100 text-teal-700',
    tagClass: 'text-teal-700 bg-teal-50',
    modulos: ['Académico', 'CRM', 'Financiero'],
    permisoCount: 40
  },
  {
    name: 'profesor',
    descripcion: 'Gestión de grupos, notas y asistencias.',
    icon: 'book',
    badgeClass: 'bg-green-100 text-green-700',
    tagClass: 'text-green-700 bg-green-50',
    modulos: ['Académico'],
    permisoCount: 10
  },
  {
    name: 'auxiliar',
    descripcion: 'CRM operativo y módulo financiero (recibos).',
    icon: 'contacts',
    badgeClass: 'bg-amber-100 text-amber-700',
    tagClass: 'text-amber-700 bg-amber-50',
    modulos: ['CRM', 'Financiero'],
    permisoCount: 12
  },
  {
    name: 'alumno',
    descripcion: 'Solo lectura de sus propias notas, asistencias y recibos.',
    icon: 'estudiantes',
    badgeClass: 'bg-slate-100 text-slate-600',
    tagClass: 'text-slate-600 bg-slate-50',
    modulos: ['Académico (lectura)'],
    permisoCount: 4
  }
]

const rolesHeader = [
  { name: 'superusuario' },
  { name: 'financiero' },
  { name: 'coordinador' },
  { name: 'profesor' },
  { name: 'auxiliar' },
  { name: 'alumno' }
]

// ─── Catálogo de permisos por módulo (desde documentación del backend) ────────
const PERMISOS_POR_ROL = {
  superusuario: new Set([
    'co_users', 'co_userCrear', 'co_userEditar', 'co_userInactivar', 'co_usersPerfil',
    'co_poblaciones', 'co_sedes', 'co_sedeCrear', 'co_sedeEditar', 'co_sedeInactivar',
    'co_areas', 'co_areaCrear', 'co_areaEditar', 'co_areaInactivar',
    'co_horarios', 'co_horarioCrear', 'co_horarioEditar', 'co_horarioInactivar',
    'crm_referidos', 'crm_referidoCrear', 'crm_referidoEditar', 'crm_referidoInactivar',
    'crm_seguimientos', 'crm_seguimientoCrear', 'crm_seguimientoEditar', 'crm_seguimientoInactivar',
    'crm_agendas', 'crm_agendaCrear', 'crm_agendaEditar', 'crm_agendaInactivar',
    'aca_cursos', 'aca_cursoCrear', 'aca_cursoEditar', 'aca_cursoInactivar',
    'aca_modulos', 'aca_moduloCrear', 'aca_moduloEditar', 'aca_moduloInactivar',
    'aca_grupos', 'aca_grupoCrear', 'aca_grupoEditar', 'aca_grupoInactivar',
    'aca_matriculas', 'aca_matriculaCrear', 'aca_matriculaEditar', 'aca_matriculaInactivar',
    'aca_esquemas', 'aca_esquemaCrear', 'aca_esquemaEditar', 'aca_esquemaInactivar',
    'aca_notas', 'aca_notaCrear', 'aca_notaEditar', 'aca_notaInactivar',
    'aca_asistencias', 'aca_asistenciaCrear', 'aca_asistenciaEditar', 'aca_asistenciaInactivar',
    'aca_asistenciaReportes', 'aca_claseProgramar', 'aca_configuracionAsistencia',
    'fin_lp_tipos_producto', 'fin_lp_tipoProductoCrear', 'fin_lp_tipoProductoEditar', 'fin_lp_tipoProductoInactivar',
    'fin_lp_productos', 'fin_lp_productoCrear', 'fin_lp_productoEditar', 'fin_lp_productoInactivar',
    'fin_lp_listas_precios', 'fin_lp_listaPrecioCrear', 'fin_lp_listaPrecioEditar', 'fin_lp_listaPrecioInactivar', 'fin_lp_listaPrecioAprobar',
    'fin_conceptos_pago', 'fin_conceptoPagoCrear', 'fin_conceptoPagoEditar', 'fin_conceptoPagoInactivar',
    'fin_descuentos', 'fin_descuentoCrear', 'fin_descuentoEditar', 'fin_descuentoInactivar', 'fin_descuentoAprobar', 'fin_descuentoAplicar', 'fin_descuentoHistorial',
    'fin_recibos_pago', 'fin_reciboPagoCrear', 'fin_reciboPagoEditar', 'fin_reciboPagoAnular', 'fin_reciboPagoCerrar', 'fin_reciboPagoReportes', 'fin_reciboPagoPDF'
  ]),
  financiero: new Set([
    'co_usersPerfil', 'co_poblaciones', 'co_sedes', 'co_sedeCrear', 'co_sedeEditar', 'co_sedeInactivar',
    'co_areas', 'co_areaCrear', 'co_areaEditar', 'co_areaInactivar',
    'co_horarios', 'co_horarioCrear', 'co_horarioEditar', 'co_horarioInactivar',
    'crm_referidos', 'crm_referidoCrear', 'crm_referidoEditar', 'crm_referidoInactivar',
    'crm_seguimientos', 'crm_seguimientoCrear', 'crm_seguimientoEditar', 'crm_seguimientoInactivar',
    'crm_agendas', 'crm_agendaCrear', 'crm_agendaEditar', 'crm_agendaInactivar',
    'aca_cursos', 'aca_cursoCrear', 'aca_cursoEditar', 'aca_cursoInactivar',
    'aca_modulos', 'aca_moduloCrear', 'aca_moduloEditar', 'aca_moduloInactivar',
    'aca_grupos', 'aca_grupoCrear', 'aca_grupoEditar', 'aca_grupoInactivar',
    'aca_matriculas', 'aca_matriculaCrear', 'aca_matriculaEditar', 'aca_matriculaInactivar',
    'aca_esquemas', 'aca_esquemaCrear', 'aca_esquemaEditar', 'aca_esquemaInactivar',
    'aca_notas', 'aca_notaCrear', 'aca_notaEditar', 'aca_notaInactivar',
    'aca_asistencias', 'aca_asistenciaCrear', 'aca_asistenciaEditar', 'aca_asistenciaInactivar',
    'aca_asistenciaReportes', 'aca_claseProgramar', 'aca_configuracionAsistencia',
    'fin_lp_tipos_producto', 'fin_lp_tipoProductoCrear', 'fin_lp_tipoProductoEditar', 'fin_lp_tipoProductoInactivar',
    'fin_lp_productos', 'fin_lp_productoCrear', 'fin_lp_productoEditar', 'fin_lp_productoInactivar',
    'fin_lp_listas_precios', 'fin_lp_listaPrecioCrear', 'fin_lp_listaPrecioEditar', 'fin_lp_listaPrecioInactivar', 'fin_lp_listaPrecioAprobar',
    'fin_conceptos_pago', 'fin_conceptoPagoCrear', 'fin_conceptoPagoEditar', 'fin_conceptoPagoInactivar',
    'fin_descuentos', 'fin_descuentoCrear', 'fin_descuentoEditar', 'fin_descuentoInactivar', 'fin_descuentoAprobar', 'fin_descuentoAplicar', 'fin_descuentoHistorial',
    'fin_recibos_pago', 'fin_reciboPagoCrear', 'fin_reciboPagoEditar', 'fin_reciboPagoAnular', 'fin_reciboPagoCerrar', 'fin_reciboPagoReportes', 'fin_reciboPagoPDF'
  ]),
  coordinador: new Set([
    'co_usersPerfil', 'co_poblaciones', 'co_sedes', 'co_sedeCrear', 'co_sedeEditar', 'co_sedeInactivar',
    'co_areas', 'co_areaCrear', 'co_areaEditar', 'co_areaInactivar',
    'co_horarios', 'co_horarioCrear', 'co_horarioEditar', 'co_horarioInactivar',
    'crm_referidos', 'crm_referidoCrear', 'crm_referidoEditar', 'crm_referidoInactivar',
    'crm_seguimientos', 'crm_seguimientoCrear', 'crm_seguimientoEditar', 'crm_seguimientoInactivar',
    'crm_agendas', 'crm_agendaCrear', 'crm_agendaEditar', 'crm_agendaInactivar',
    'aca_cursos', 'aca_cursoCrear', 'aca_cursoEditar', 'aca_cursoInactivar',
    'aca_modulos', 'aca_moduloCrear', 'aca_moduloEditar', 'aca_moduloInactivar',
    'aca_grupos', 'aca_grupoCrear', 'aca_grupoEditar', 'aca_grupoInactivar',
    'aca_matriculas', 'aca_matriculaCrear', 'aca_matriculaEditar', 'aca_matriculaInactivar',
    'aca_esquemas', 'aca_esquemaCrear', 'aca_esquemaEditar', 'aca_esquemaInactivar',
    'aca_notas', 'aca_notaCrear', 'aca_notaEditar', 'aca_notaInactivar',
    'aca_asistencias', 'aca_asistenciaCrear', 'aca_asistenciaEditar', 'aca_asistenciaInactivar',
    'aca_asistenciaReportes', 'aca_claseProgramar', 'aca_configuracionAsistencia',
    'fin_lp_tipos_producto', 'fin_lp_tipoProductoCrear', 'fin_lp_tipoProductoEditar', 'fin_lp_tipoProductoInactivar',
    'fin_lp_productos', 'fin_lp_productoCrear', 'fin_lp_productoEditar', 'fin_lp_productoInactivar',
    'fin_lp_listas_precios', 'fin_lp_listaPrecioCrear', 'fin_lp_listaPrecioEditar', 'fin_lp_listaPrecioInactivar', 'fin_lp_listaPrecioAprobar',
    'fin_conceptos_pago', 'fin_conceptoPagoCrear', 'fin_conceptoPagoEditar', 'fin_conceptoPagoInactivar',
    'fin_descuentos', 'fin_descuentoCrear', 'fin_descuentoEditar', 'fin_descuentoInactivar', 'fin_descuentoAplicar', 'fin_descuentoHistorial',
    'fin_recibos_pago', 'fin_reciboPagoCrear', 'fin_reciboPagoEditar', 'fin_reciboPagoAnular', 'fin_reciboPagoCerrar', 'fin_reciboPagoReportes', 'fin_reciboPagoPDF'
  ]),
  profesor: new Set([
    'co_usersPerfil',
    'aca_esquemas', 'aca_esquemaCrear', 'aca_esquemaEditar',
    'aca_notas', 'aca_notaCrear', 'aca_notaEditar',
    'aca_asistencias', 'aca_asistenciaCrear', 'aca_asistenciaEditar',
    'aca_asistenciaReportes', 'aca_claseProgramar'
  ]),
  auxiliar: new Set([
    'co_usersPerfil', 'co_poblaciones', 'co_sedes',
    'crm_referidos', 'crm_referidoCrear', 'crm_referidoEditar',
    'crm_seguimientos', 'crm_seguimientoCrear', 'crm_seguimientoEditar',
    'crm_agendas', 'crm_agendaCrear', 'crm_agendaEditar',
    'fin_descuentoAplicar',
    'fin_recibos_pago', 'fin_reciboPagoCrear', 'fin_reciboPagoPDF'
  ]),
  alumno: new Set([
    'co_usersPerfil',
    'aca_notas', 'aca_asistencias',
    'fin_reciboPagoPDF'
  ])
}

function tienePermiso(rolName, permisoKey) {
  return PERMISOS_POR_ROL[rolName]?.has(permisoKey) ?? false
}

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
      { key: 'co_poblaciones', descripcion: 'Ver poblaciones' },
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
</script>
