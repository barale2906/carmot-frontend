<template>
  <div class="space-y-8">
    <!-- Tarjetas de estadísticas -->
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading" class="sr-only">
        Resumen de estadísticas
      </h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
        <li v-for="stat in stats" :key="stat.title" role="listitem">
          <StatCard
            :title="stat.title"
            :value="stat.value"
            :description="stat.description"
            :icon="stat.icon"
            :icon-variant="stat.iconVariant"
          />
        </li>
      </ul>
    </section>

    <div class="grid gap-8 lg:grid-cols-2">
      <!-- Accesos rápidos -->
      <section aria-labelledby="quick-access-heading">
        <header class="mb-4">
          <h2 id="quick-access-heading" class="text-lg font-semibold text-slate-900">
            Accesos rápidos
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Acciones frecuentes del sistema
          </p>
        </header>
        <ul class="grid gap-3 sm:grid-cols-2" role="list">
          <li v-for="item in quickAccess" :key="item.title" role="listitem">
            <QuickAccessCard
              :title="item.title"
              :description="item.description"
              :to="item.to"
              :icon="item.icon"
              :icon-variant="item.iconVariant"
            />
          </li>
        </ul>
      </section>

      <!-- Actividad reciente -->
      <section aria-labelledby="activity-heading">
        <header class="mb-4">
          <h2 id="activity-heading" class="text-lg font-semibold text-slate-900">
            Actividad reciente
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Últimas acciones en el sistema
          </p>
        </header>
        <ul class="space-y-3" role="list">
          <ActivityItem
            v-for="(item, index) in recentActivity"
            :key="index"
            :title="item.title"
            :description="item.description"
            :time-ago="item.timeAgo"
            :icon="item.icon"
            :icon-variant="item.iconVariant"
          />
        </ul>
      </section>
    </div>

    <div class="grid gap-8 lg:grid-cols-2">
      <!-- Alertas importantes -->
      <section aria-labelledby="alerts-heading">
        <header class="mb-4">
          <h2 id="alerts-heading" class="text-lg font-semibold text-slate-900">
            Alertas importantes
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Requieren tu atención
          </p>
        </header>
        <ul class="space-y-3" role="list">
          <li v-for="(alert, index) in alerts" :key="index" role="listitem">
            <AlertItem
              :title="alert.title"
              :description="alert.description"
              :badge-label="alert.badgeLabel"
              :count="alert.count"
              :variant="alert.variant"
            />
          </li>
        </ul>
      </section>

      <!-- Próximos eventos + Tasa de retención -->
      <div class="space-y-8">
        <section aria-labelledby="events-heading">
          <header class="mb-4">
            <h2 id="events-heading" class="text-lg font-semibold text-slate-900">
              Próximos eventos
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Calendario académico
            </p>
          </header>
          <ul class="space-y-3" role="list">
            <li v-for="(event, index) in upcomingEvents" :key="index" role="listitem">
              <EventItem
                :month="event.month"
                :day="event.day"
                :title="event.title"
                :subtitle="event.subtitle"
              />
            </li>
          </ul>
        </section>

        <section aria-labelledby="retention-heading">
          <h2 id="retention-heading" class="sr-only">
            Tasa de retención
          </h2>
          <RetentionCard
            title="Tasa de retención"
            value="96.3%"
            description="+2.1% vs mes anterior"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatCard from '@/components/dashboard/StatCard.vue'
import QuickAccessCard from '@/components/dashboard/QuickAccessCard.vue'
import ActivityItem from '@/components/dashboard/ActivityItem.vue'
import AlertItem from '@/components/dashboard/AlertItem.vue'
import EventItem from '@/components/dashboard/EventItem.vue'
import RetentionCard from '@/components/dashboard/RetentionCard.vue'

// Datos ficticios según diseño Figma — luego conectar con API/BD
const stats = [
  {
    title: 'Total estudiantes',
    value: '328',
    description: '+12% desde el mes pasado',
    icon: 'estudiantes',
    iconVariant: 'slate'
  },
  {
    title: 'Citas pendientes hoy',
    value: '7',
    description: 'Asesorías programadas para hoy',
    icon: 'calendario',
    iconVariant: 'blue'
  },
  {
    title: 'Pendientes vencidos',
    value: '8',
    description: 'Requieren atención urgente',
    icon: 'pendientes',
    iconVariant: 'red'
  },
  {
    title: 'Inventario bajo stock',
    value: '5',
    description: 'Elementos por reponer',
    icon: 'inventario',
    iconVariant: 'orange'
  }
]

const quickAccess = [
  {
    title: 'Nueva matrícula',
    description: 'Registrar nuevo estudiante',
    to: '/academico/matriculas?action=create',
    icon: 'estudiantes',
    iconVariant: 'blue'
  },
  {
    title: 'Recibo de pago',
    description: 'Registrar pago de estudiante',
    to: '/cartera',
    icon: 'formularios',
    iconVariant: 'green'
  },
  {
    title: 'Ver programas académicos',
    description: 'Cursos y técnicos disponibles',
    to: '/academico',
    icon: 'academico',
    iconVariant: 'purple'
  },
  {
    title: 'Ver estudiantes',
    description: 'Listado completo de estudiantes',
    to: '/estudiantes',
    icon: 'control-estudiantes',
    iconVariant: 'orange'
  }
]

const recentActivity = [
  {
    title: 'Nueva matrícula registrada',
    description: 'Ana Martínez - Mecánica de Motos',
    timeAgo: 'Hace 15 minutos',
    icon: 'estudiantes',
    iconVariant: 'green'
  },
  {
    title: 'Pago procesado',
    description: 'Carlos Rodríguez - Mensualidad Febrero',
    timeAgo: 'Hace 1 hora',
    icon: 'formularios',
    iconVariant: 'blue'
  },
  {
    title: 'Inventario actualizado',
    description: 'Entrada de 20 overoles - Tunja',
    timeAgo: 'Hace 2 horas',
    icon: 'inventario',
    iconVariant: 'orange'
  },
  {
    title: 'Deserción reportada',
    description: 'Pedro López - Soldadura Duitama',
    timeAgo: 'Hace 3 horas',
    icon: 'estudiantes',
    iconVariant: 'purple'
  }
]

const alerts = [
  {
    title: 'Cartera por cobrar vencida',
    description: '8 estudiantes con pagos vencidos hace más de 7 días',
    badgeLabel: 'Urgente',
    count: null,
    variant: 'red'
  },
  {
    title: 'Matrículas virtuales incompletas',
    description: '12 estudiantes con documentos pendientes de cargar',
    badgeLabel: '',
    count: 12,
    variant: 'yellow'
  },
  {
    title: 'Inventario bajo stock',
    description: '5 elementos requieren reposición urgente',
    badgeLabel: '',
    count: 5,
    variant: 'orange'
  },
  {
    title: 'Acuerdos de pago pendientes',
    description: '3 solicitudes de plan de pagos por gestionar',
    badgeLabel: '',
    count: 3,
    variant: 'blue'
  }
]

const upcomingEvents = [
  { month: 'FEB', day: '25', title: 'Entrega de certificados', subtitle: 'Promoción Soldadura Industrial - Tunja' },
  { month: 'FEB', day: '28', title: 'Cierre de matrículas', subtitle: 'Curso Mecánica Automotriz - Todas las sedes' },
  { month: 'MAR', day: '03', title: 'Inicio de curso', subtitle: 'Técnico Mecánica Automotriz - Duitama' },
  { month: 'MAR', day: '10', title: 'Evaluación final', subtitle: 'Todos los cursos - Periodo 1' }
]
</script>
