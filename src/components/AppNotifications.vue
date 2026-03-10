<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      aria-atomic="false"
      class="pointer-events-none fixed right-4 top-4 z-[9999] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3"
    >
      <TransitionGroup name="toast">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
          role="alert"
        >
          <!-- Franja lateral de color -->
          <span
            class="absolute left-0 top-0 h-full w-1 rounded-l-xl"
            :class="accentBg(n.type)"
          />

          <!-- Ícono -->
          <span
            class="ml-2 flex size-8 shrink-0 items-center justify-center rounded-full"
            :class="iconBg(n.type)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-4 text-white"
            >
              <path :d="iconPath(n.type)" />
            </svg>
          </span>

          <!-- Contenido -->
          <div class="min-w-0 flex-1 py-0.5">
            <p class="text-sm font-semibold text-slate-900">{{ n.title }}</p>
            <p v-if="n.message" class="mt-0.5 text-xs leading-relaxed text-slate-500">
              {{ n.message }}
            </p>
          </div>

          <!-- Botón de cierre -->
          <button
            type="button"
            class="shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar notificación"
            @click="dismiss(n.id)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="size-3.5"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <!-- Barra de progreso (se reduce hasta desaparecer) -->
          <div
            v-if="n.duration > 0"
            class="progress-bar absolute bottom-0 left-0 right-0 h-0.5 origin-left"
            :class="accentBg(n.type)"
            :style="{ animationDuration: `${n.duration}ms` }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useNotification } from '@/composables/useNotification'

const { notifications, dismiss } = useNotification()

function iconBg(type) {
  return {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    warning: 'bg-amber-500',
    info:    'bg-[#213360]',
  }[type] ?? 'bg-slate-500'
}

function accentBg(type) {
  return {
    success: 'bg-emerald-400',
    error:   'bg-red-400',
    warning: 'bg-amber-400',
    info:    'bg-[#213360]',
  }[type] ?? 'bg-slate-400'
}

function iconPath(type) {
  return {
    success: 'M20 6 9 17l-5-5',
    error:   'M18 6 6 18M6 6l12 12',
    warning: 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
    info:    'M12 16v-4m0-4h.01M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  }[type] ?? 'M13 16h-1v-4h-1m1-4h.01'
}
</script>

<style scoped>
/* ── Animación de la barra de progreso ──────────────────────────────────── */
@keyframes progress-shrink {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

.progress-bar {
  animation: progress-shrink linear forwards;
}

/* ── Transición de entrada / salida de cada toast ───────────────────────── */
.toast-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  /* Quitar del flujo durante la salida para que los demás se reubiquen */
  position: absolute;
  width: 100%;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 1rem));
}

/* Movimiento suave al reordenarse */
.toast-move {
  transition: transform 0.3s ease;
}
</style>
