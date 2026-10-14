<template>
  <div class="space-y-8">
    <div v-if="error" class="rounded-[14px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ error }}
      <button type="button" class="ml-2 font-medium underline hover:no-underline" @click="cargar">Reintentar</button>
    </div>

    <!-- Tarjetas de estadísticas -->
    <section v-if="tarjetas.length" aria-labelledby="stats-heading">
      <h2 id="stats-heading" class="sr-only">
        Resumen de estadísticas
      </h2>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
        <li v-for="tarjeta in tarjetas" :key="tarjeta.clave" role="listitem">
          <RouterLink :to="tarjeta.ruta" class="block rounded-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500">
            <StatCard v-bind="propsTarjeta(tarjeta)" />
          </RouterLink>
        </li>
      </ul>
    </section>

    <div class="grid gap-8 lg:grid-cols-2">
      <!-- Accesos rápidos -->
      <section v-if="accesos.length" aria-labelledby="quick-access-heading">
        <header class="mb-4">
          <h2 id="quick-access-heading" class="text-lg font-semibold text-slate-900">
            Accesos rápidos
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Acciones frecuentes del sistema
          </p>
        </header>
        <ul class="grid gap-3 sm:grid-cols-2" role="list">
          <li v-for="item in accesos" :key="item.title" role="listitem">
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
      <section v-if="actividad.length" aria-labelledby="activity-heading">
        <header class="mb-4">
          <h2 id="activity-heading" class="text-lg font-semibold text-slate-900">
            Actividad reciente
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Últimas matrículas y pagos de tus sedes
          </p>
        </header>
        <ul class="space-y-3" role="list">
          <ActivityItem
            v-for="(item, index) in actividad"
            :key="index"
            v-bind="propsActividad(item)"
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
        <p v-if="cargando" class="text-sm text-slate-500">Cargando...</p>
        <p v-else-if="!alertas.length" class="rounded-[14px] border border-black/10 bg-white p-4 text-sm text-slate-500">
          No hay pendientes que requieran tu atención.
        </p>
        <ul v-else class="space-y-3" role="list">
          <li v-for="alerta in alertas" :key="alerta.clave" role="listitem">
            <RouterLink :to="alerta.ruta" class="block rounded-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <AlertItem v-bind="propsAlerta(alerta)" />
            </RouterLink>
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
              Inicios de ciclo y días no laborables de los próximos 30 días
            </p>
          </header>
          <p v-if="!cargando && !eventos.length" class="rounded-[14px] border border-black/10 bg-white p-4 text-sm text-slate-500">
            Sin eventos en los próximos 30 días.
          </p>
          <ul v-else class="space-y-3" role="list">
            <li v-for="(evento, index) in eventos" :key="index" role="listitem">
              <EventItem v-bind="propsEvento(evento)" />
            </li>
          </ul>
        </section>

        <section v-if="retencion" aria-labelledby="retention-heading">
          <h2 id="retention-heading" class="sr-only">
            Tasa de retención
          </h2>
          <RetentionCard
            title="Tasa de retención"
            :value="retencion.value"
            :description="retencion.description"
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatCard         from '@/components/dashboard/StatCard.vue'
import QuickAccessCard  from '@/components/dashboard/QuickAccessCard.vue'
import ActivityItem     from '@/components/dashboard/ActivityItem.vue'
import AlertItem        from '@/components/dashboard/AlertItem.vue'
import EventItem        from '@/components/dashboard/EventItem.vue'
import RetentionCard    from '@/components/dashboard/RetentionCard.vue'
import dashboardService from '@/services/dashboardService.js'
import { usePermisos }  from '@/composables/usePermisos.js'
import {
  accesosVisibles, propsTarjeta, propsAlerta, propsActividad, propsEvento, textoRetencion
} from '@/utils/dashboard.js'

const { can, loadPermisos } = usePermisos()

const resumen  = ref(null)
const cargando = ref(true)
const error    = ref('')

const tarjetas  = computed(() => resumen.value?.tarjetas ?? [])
const alertas   = computed(() => resumen.value?.alertas ?? [])
const actividad = computed(() => resumen.value?.actividad ?? [])
const eventos   = computed(() => resumen.value?.eventos ?? [])
const retencion = computed(() => textoRetencion(resumen.value?.retencion))
const accesos   = computed(() => accesosVisibles(can))

async function cargar() {
  cargando.value = true
  error.value    = ''
  try {
    const res = await dashboardService.getResumen()
    resumen.value = res.data ?? null
  } catch (e) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar el resumen del dashboard.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  loadPermisos().catch(() => {})
  cargar()
})
</script>
