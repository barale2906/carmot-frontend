<template>
  <header
    class="fixed left-0 right-0 top-0 z-[1000] flex h-16 items-center justify-between border-b border-black/10 bg-white/95 px-4 shadow-sm backdrop-blur-sm sm:px-6"
    role="banner"
  >
    <div class="flex flex-1 items-center gap-4">
      <button
        type="button"
        class="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-black/5 hover:scale-105 active:scale-95"
        :aria-label="sidebarOpen ? 'Cerrar menú' : 'Abrir menú'"
        @click="toggleSidebar"
      >
        <NavIcon :name="sidebarOpen ? 'close' : 'menu'" class="size-6" />
      </button>
      <div class="flex min-w-0 flex-col">
        <h1 class="truncate text-xl font-bold text-blue-900 sm:text-2xl">
          {{ pageTitle }}
        </h1>
        <p class="truncate text-sm text-slate-500">
          {{ pageSubtitle }}
        </p>
      </div>
    </div>
    <div class="flex shrink-0 items-center">
      <UserMenu
        :user-name="userName"
        :user-email="userEmail"
      />
    </div>
  </header>
</template>

<script setup>
import { inject, ref } from 'vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import UserMenu from '@/components/UserMenu.vue'

defineProps({
  pageTitle: {
    type: String,
    default: 'Dashboard'
  },
  pageSubtitle: {
    type: String,
    default: 'Sistema de gestión - Centro de Capacitación CARMOT'
  },
  userName: {
    type: String,
    default: 'Administrador'
  },
  userEmail: {
    type: String,
    default: 'admin@carmot.com'
  }
})

const sidebarOpen = inject('sidebarOpen', ref(false))
const toggleSidebar = inject('toggleSidebar', () => {})
</script>
