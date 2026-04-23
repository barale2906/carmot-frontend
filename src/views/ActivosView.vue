<template>
  <div class="flex flex-col gap-6">
    <!-- Gestión de activos -->
    <section aria-labelledby="gestion-activos-heading" class="flex flex-col gap-6">
      <SectionHeader
        id="gestion-activos-heading"
        title="Gestión de activos"
        description="Control completo de elementos, herramientas y equipos por sede y área"
      />

      <div class="rounded-[14px] border border-black/10 bg-white p-6">
        <form
          class="flex flex-wrap items-end gap-4 sm:gap-4"
          @submit.prevent="applyFilters"
        >
          <div class="w-full sm:w-[150px]">
            <FormSelect
              v-model="filters.sede"
              label="Sede:"
              placeholder="Sede"
              help="Filtra activos por sede."
              :options="sedeOptions"
            />
          </div>
          <div class="w-full sm:w-[200px]">
            <FormSelect
              v-model="filters.area"
              label="Área:"
              placeholder="Área"
              help="Filtra por área o taller dentro de la sede."
              :options="areaOptions"
            />
          </div>
          <div class="min-w-0 flex-1 sm:max-w-xs">
            <FormInputSearch
              v-model="filters.buscar"
              label="Buscar:"
              placeholder="Buscar por nombre o código..."
              help="Busca activos por nombre o código interno."
            />
          </div>
          <div class="w-full sm:w-auto">
            <button
              type="button"
              class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              @click="openNuevoActivo"
            >
              <NavIcon name="plus" class="size-4" />
              Nuevo activo
            </button>
          </div>
        </form>
      </div>

      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
        <li role="listitem">
          <StatCard
            title="Total activos"
            :value="stats.totalActivos"
            :description="filters.sede || 'Sede'"
            icon="inventario"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Áreas con activos"
            :value="stats.areasConActivos"
            description="de 6 áreas"
            icon="location"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Distribución por área -->
    <section aria-labelledby="distribucion-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <SectionHeader
        id="distribucion-heading"
        :title="`Distribución de activos por área - ${filters.sede || 'Tunja'}`"
        description="Cantidad de activos en cada área"
        class="mb-6"
      />
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
        <li
          v-for="item in distribucionPorArea"
          :key="item.area"
          role="listitem"
        >
          <AreaDistributionCard
            :area-name="item.area"
            :count="item.count"
          />
        </li>
      </ul>
    </section>

    <!-- Listado de Activos -->
    <section aria-labelledby="listado-activos-heading">
      <h2 id="listado-activos-heading" class="mb-4 text-base font-medium text-slate-900">
        Listado de Activos
      </h2>
      <DataTable
        :columns="tableColumns"
        :data="activosList"
        row-key="codigo"
        aria-label="Listado de activos"
      >
        <template #cell="{ column, value, formatted }">
          <StatusBadge
            v-if="column.key === 'estado'"
            :label="value"
            :variant="getEstadoVariant(value)"
          />
          <span v-else-if="column.key === 'area'" class="inline-flex items-center gap-1">
            <NavIcon name="location" class="size-4 text-slate-500" />
            {{ value }}
          </span>
          <span v-else>{{ formatted }}</span>
        </template>
        <template #actions="{ row }">
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Ficha"
            @click="verFicha(row)"
          >
            <NavIcon name="eye" class="size-4" />
          </button>
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Mover"
            @click="moverActivo(row)"
          >
            <NavIcon name="location" class="size-4" />
          </button>
          <button
            type="button"
            class="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Editar"
            @click="editarActivo(row)"
          >
            <NavIcon name="pencil" class="size-4" />
          </button>
        </template>
      </DataTable>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import AreaDistributionCard from '@/components/activos/AreaDistributionCard.vue'
import StatusBadge from '@/components/activos/StatusBadge.vue'
import DataTable from '@/components/activos/DataTable.vue'
import FormSelect from '@/components/forms/FormSelect.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const filters = ref({
  sede: 'Tunja',
  area: 'todas',
  buscar: ''
})

const sedeOptions = [
  { value: 'Tunja', label: 'Tunja' }
]

const areaOptions = [
  { value: 'todas', label: 'Todas las Áreas' },
  { value: 'recepcion', label: 'Recepción' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'taller-motos', label: 'Taller de Motos' },
  { value: 'taller-automotriz', label: 'Taller Automotriz' },
  { value: 'taller-soldadura', label: 'Taller Soldadura' },
  { value: 'taller-car-audio', label: 'Taller Car Audio' }
]

const stats = computed(() => ({
  totalActivos: 11,
  areasConActivos: 5
}))

const distribucionPorArea = ref([
  { area: 'Recepción', count: 2 },
  { area: 'Cafetería', count: 2 },
  { area: 'Taller de Motos', count: 3 },
  { area: 'Taller Automotriz', count: 2 },
  { area: 'Taller Soldadura', count: 2 },
  { area: 'Taller Car Audio', count: 0 }
])

const tableColumns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'area', label: 'Área', icon: 'location' },
  { key: 'fechaIngreso', label: 'Fecha Ingreso', icon: 'calendario', format: 'date' },
  { key: 'estado', label: 'Estado' },
  { key: 'valor', label: 'Valor', format: 'currency' }
]

const activosList = ref([
  { codigo: 'TUN-REC-001', nombre: 'Computador HP All-in-One', categoria: 'Equipo de Cómputo', area: 'Recepción', fechaIngreso: '2024-01-14', estado: 'Operativo', valor: 2500000 },
  { codigo: 'TUN-REC-002', nombre: 'Impresora Multifuncional Epson', categoria: 'Equipo de Oficina', area: 'Recepción', fechaIngreso: '2024-01-19', estado: 'Operativo', valor: 800000 },
  { codigo: 'TUN-MOT-001', nombre: 'Compresor de Aire 50L', categoria: 'Herramienta Eléctrica', area: 'Taller de Motos', fechaIngreso: '2024-03-04', estado: 'Operativo', valor: 1800000 },
  { codigo: 'TUN-AUT-001', nombre: 'Gato Hidráulico 3 Toneladas', categoria: 'Herramienta Mecánica', area: 'Taller Automotriz', fechaIngreso: '2024-03-14', estado: 'Operativo', valor: 1200000 },
  { codigo: 'TUN-AUT-002', nombre: 'Escáner Automotriz OBD2', categoria: 'Equipo Electrónico', area: 'Taller Automotriz', fechaIngreso: '2024-03-19', estado: 'Operativo', valor: 3500000 },
  { codigo: 'TUN-SOL-001', nombre: 'Soldadora Inverter MIG 200A', categoria: 'Equipo de Soldadura', area: 'Taller Soldadura', fechaIngreso: '2024-03-24', estado: 'Operativo', valor: 2800000 }
])

function applyFilters() {
  // Conectar con API cuando exista
}

function openNuevoActivo() {
  // Navegar o abrir modal
}

function getEstadoVariant(estado) {
  const map = { Operativo: 'operativo', Mantenimiento: 'mantenimiento', Baja: 'baja', Disponible: 'disponible' }
  return map[estado] || 'operativo'
}

function verFicha(row) {
  console.log('Ver ficha', row)
}

function moverActivo(row) {
  console.log('Mover activo', row)
}

function editarActivo(row) {
  console.log('Editar activo', row)
}
</script>
