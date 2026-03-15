<template>
  <div class="flex flex-col gap-6">

    <!-- Estadísticas -->
    <section aria-labelledby="stats-cursos-heading">
      <h2 id="stats-cursos-heading" class="sr-only">Resumen de cursos</h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
        <li role="listitem">
          <StatCard
            title="Total cursos"
            value="0"
            description="Registrados en el sistema"
            icon="people"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Activos"
            value="0"
            description="Disponibles para matricular"
            icon="security"
            icon-variant="blue"
          />
        </li>
        <li role="listitem">
          <StatCard
            title="Inactivos"
            value="0"
            description="No disponibles actualmente"
            icon="pendientes"
            icon-variant="blue"
          />
        </li>
      </ul>
    </section>

    <!-- Barra de acciones -->
    <section aria-labelledby="filtros-cursos-heading" class="rounded-[14px] border border-black/10 bg-white p-6">
      <h2 id="filtros-cursos-heading" class="sr-only">Filtros y acciones</h2>
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 sm:max-w-xs">
          <FormInputSearch
            v-model="search"
            label="Buscar:"
            placeholder="Nombre del curso..."
          />
        </div>
        <div class="flex w-full items-end sm:w-auto">
          <button
            type="button"
            class="flex h-9 items-center gap-2 rounded-lg bg-[#213360] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a294d] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <NavIcon name="plus" class="size-4" />
            Nuevo curso
          </button>
        </div>
      </div>
    </section>

    <!-- Listado -->
    <section aria-labelledby="listado-cursos-heading">
      <SectionHeader
        id="listado-cursos-heading"
        title="Listado de cursos"
        description="Aquí aparecerán los cursos registrados en el sistema."
        class="mb-4"
      />
      <div class="flex items-center justify-center rounded-[14px] border border-black/10 bg-white py-16">
        <p class="text-sm text-slate-400">No hay cursos registrados aún.</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import SectionHeader from '@/components/activos/SectionHeader.vue'
import FormInputSearch from '@/components/forms/FormInputSearch.vue'
import NavIcon from '@/components/icons/NavIcon.vue'

const search = ref('')
</script>
