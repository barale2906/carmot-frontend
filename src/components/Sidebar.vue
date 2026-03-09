<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      leave-active-class="transition-opacity duration-300 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <button
        v-if="isOpen"
        type="button"
        class="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm transition-opacity"
        aria-label="Cerrar menú"
        tabindex="-1"
        @click="closeSidebar"
      />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-300 ease-in"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="isOpen"
        class="fixed left-0 top-0 z-[999] flex h-full w-[280px] flex-col overflow-y-auto overflow-x-hidden bg-[#1e3a8a] shadow-xl"
        aria-label="Menú principal"
        @click.stop
      >
        <header class="flex justify-center border-b border-white/10 px-5 py-6">
          <RouterLink
            to="/dashboard"
            class="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1e3a8a] rounded-lg"
            aria-label="CARMOT - Ir al inicio"
            @click="closeSidebar"
          >
            <Logo size="small" variant="light" alt="CARMOT - Inicio" />
          </RouterLink>
        </header>

        <!-- Skeleton Loading State -->
        <nav v-if="loading" class="flex-1 py-5" aria-label="Cargando menú">
          <ul class="flex flex-col gap-2 px-3" role="list">
            <li v-for="i in 8" :key="i" role="none" class="animate-pulse">
              <div class="flex items-center gap-3 rounded-lg px-4 py-3 bg-white/10 h-10" />
            </li>
          </ul>
        </nav>

        <!-- Menú (dinámico o fallback) -->
        <nav v-else-if="menuItems.length > 0" class="flex-1 py-5" aria-label="Navegación">
          <!-- Aviso sutil si se cargó el fallback por error -->
          <div
            v-if="error"
            class="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-amber-500/20 border border-amber-400/50 px-3 py-2 text-amber-200 text-xs"
          >
            <span class="flex-1">Menú parcial</span>
            <button
              type="button"
              class="underline hover:text-white transition"
              @click="reloadMenu"
            >
              Reintentar
            </button>
          </div>
          <ul class="flex flex-col gap-0.5 px-3" role="list">
            <li v-for="item in menuItems" :key="item.id" role="none">
              <MenuItem
                :item="item"
                :current-route="route.path"
                @navigate="closeSidebar"
              />
            </li>
          </ul>
        </nav>

        <!-- Sin items y con error -->
        <div v-else-if="error" class="flex-1 py-5 px-3">
          <div class="rounded-lg bg-red-500/20 border border-red-400 p-3 text-red-100 text-sm">
            <p class="font-semibold mb-2">Error al cargar el menú</p>
            <p class="mb-3 text-xs opacity-80">{{ error }}</p>
            <button
              type="button"
              class="w-full px-3 py-2 bg-red-500/40 hover:bg-red-500/60 rounded text-sm font-medium transition"
              @click="reloadMenu"
            >
              Reintentar
            </button>
          </div>
        </div>

        <!-- Footer: Logout -->
        <div class="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white transition hover:bg-white/10"
            @click="handleLogout"
          >
            <NavIcon name="logout" class="size-5 shrink-0" />
            <span class="text-[0.95rem]">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import NavIcon from '@/components/icons/NavIcon.vue'
import MenuItem from '@/components/MenuItem.vue'
import { authService } from '@/services/authService'
import { menuService } from '@/services/menuService'

const route = useRoute()
const router = useRouter()

const isOpen = inject('sidebarOpen', ref(false))
const closeSidebar = inject('closeSidebar', () => {})

// Estado del menú
const menuItems = ref([])
const loading = ref(true)
const error = ref(null)

/**
 * Cargar el menú dinámico del backend
 */
async function loadMenu() {
  try {
    loading.value = true
    error.value = null

    const menu = await menuService.getMenu()
    menuItems.value = menu || []

    // Si no hay items, mostrar menú de fallback
    if (menuItems.value.length === 0) {
      error.value = 'No tienes acceso a ningún módulo'
      loadFallbackMenu()
    }
  } catch (err) {
    console.error('Error al cargar menú:', err)

    // Manejar errores específicos
    if (err.type === 'auth_error') {
      error.value = err.message
      // Redirigir al login después de un tiempo
      setTimeout(() => {
        router.push('/')
      }, 2000)
      return
    }

    error.value =
      err.message || 'No se pudo cargar el menú de navegación. Intenta nuevamente.'

    // Cargar menú de fallback
    loadFallbackMenu()
  } finally {
    loading.value = false
  }
}

/**
 * Cargar menú de fallback (solo Dashboard)
 * Se muestra cuando falla la carga del menú dinámico
 */
function loadFallbackMenu() {
  menuItems.value = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      permission: null,
      disabled: false,
      children: []
    }
  ]
}

/**
 * Reintentar cargar el menú
 */
async function reloadMenu() {
  menuService.invalidateCache()
  await loadMenu()
}

/**
 * Manejar logout del usuario
 */
async function handleLogout() {
  try {
    await authService.logout()
    menuService.invalidateCache()
    closeSidebar()
    router.push('/')
  } catch {
    menuService.invalidateCache()
    closeSidebar()
    router.push('/')
  }
}

// Cargar menú cuando el componente monta
onMounted(() => {
  if (authService.isAuthenticated()) {
    loadMenu()
  }
})
</script>
