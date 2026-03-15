<template>
  <div class="flex min-h-screen flex-col">
    <Navbar
      :page-title="pageTitle"
      :page-subtitle="pageSubtitle"
      :user-name="userName"
      :user-email="userEmail"
    />
    <Sidebar />
    <main
      class="min-h-[calc(100vh-4rem)] flex-1 bg-slate-50 p-6 pt-16"
      @click="handleMainClick"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Sidebar from '../components/Sidebar.vue'
import { authService } from '../services/authService'
import { menuService } from '../services/menuService'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

// Títulos dinámicos según la ruta — orden de más específico a más general
const pageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title

  const path = route.path

  // Rutas con prefijo (orden: más específico primero)
  const prefixTitles = [
    { prefix: '/academico/cursos',        title: 'Cursos' },
    { prefix: '/academico',               title: 'Académico' },
    { prefix: '/configuracion/sedes',     title: 'Sedes' },
    { prefix: '/configuracion/usuarios',  title: 'Configuración' },
    { prefix: '/configuracion/roles',     title: 'Configuración' },
    { prefix: '/configuracion/poblaciones', title: 'Configuración' },
    { prefix: '/configuracion/areas',     title: 'Configuración' },
    { prefix: '/configuracion/horarios',  title: 'Configuración' },
    { prefix: '/configuracion',           title: 'Configuración' },
    { prefix: '/dashboard',               title: 'Dashboard' },
    { prefix: '/estudiantes',             title: 'Estudiantes' },
    { prefix: '/perfil',                  title: 'Perfil' },
    { prefix: '/activos',                 title: 'Activos' },
    { prefix: '/pendientes',              title: 'Pendientes' },
    { prefix: '/calendario',              title: 'Calendario' },
    { prefix: '/inventario',              title: 'Inventario' },
    { prefix: '/control-estudiantes',     title: 'Control Estudiantes' },
    { prefix: '/cartera',                 title: 'Cartera' },
    { prefix: '/reportes',                title: 'Reportes' },
    { prefix: '/formularios',             title: 'Formularios' }
  ]

  const match = prefixTitles.find(({ prefix }) => path === prefix || path.startsWith(prefix + '/'))
  return match ? match.title : 'Dashboard'
})

const pageSubtitle = computed(() => {
  return 'Sistema de gestión - Centro de Capacitación CARMOT'
})

// Datos del usuario
const userName = ref('Usuario')
const userEmail = ref('')
const loadingUser = ref(true)
const userRole = ref(null)

/**
 * Obtener datos del usuario autenticado
 */
const fetchUserData = async () => {
  if (!authService.isAuthenticated()) {
    router.push('/')
    return
  }

  try {
    loadingUser.value = true
    const userData = await authService.getUser()

    // Ajustar según la estructura de respuesta de la API
    if (typeof userData === 'string') {
      // Si es un string, podría ser JSON parseado
      try {
        const parsed = JSON.parse(userData)
        userName.value = parsed.name || parsed.nombre || 'Usuario'
        userEmail.value = parsed.email || parsed.correo || ''
        userRole.value = parsed.role || parsed.rol || null
      } catch {
        // Si no se puede parsear, usar valores por defecto
        userName.value = 'Usuario'
        userEmail.value = ''
      }
    } else if (typeof userData === 'object') {
      userName.value = userData.name || userData.nombre || userData.username || 'Usuario'
      userEmail.value = userData.email || userData.correo || ''
      userRole.value = userData.role || userData.rol || null
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error)
    // Si hay error 401, redirigir al login
    if (error.status === 401) {
      router.push('/')
    }
  } finally {
    loadingUser.value = false
  }
}

/**
 * Verificar acceso a la ruta actual basado en permisos
 */
const checkRouteAccess = async () => {
  // Si el menú está en caché y la ruta no está habilitada, redirigir
  if (menuService.isCached()) {
    const isEnabled = menuService.isRouteEnabled(route.path)
    if (!isEnabled) {
      console.warn(`Acceso denegado a la ruta: ${route.path}`)
      router.push('/dashboard')
    }
  }
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

/**
 * Cerrar sidebar al hacer clic en el contenido principal
 */
const handleMainClick = () => {
  if (sidebarOpen.value) {
    closeSidebar()
  }
}

// Proveer el estado del sidebar a los componentes hijos
provide('sidebarOpen', sidebarOpen)
provide('toggleSidebar', toggleSidebar)
provide('closeSidebar', closeSidebar)

/**
 * Cerrar sidebar al presionar Escape
 */
const handleEscape = (e) => {
  if (e.key === 'Escape' && sidebarOpen.value) {
    closeSidebar()
  }
}

/**
 * Resetear caché cuando el usuario cambia
 */
const handleAuthChange = () => {
  if (!authService.isAuthenticated()) {
    menuService.invalidateCache()
    router.push('/')
  }
}

// Ejecutar al montar el componente
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  fetchUserData()
  checkRouteAccess()
})

// Ejecutar al cambiar de ruta
watch(
  () => route.path,
  () => {
    checkRouteAccess()
  }
)

// Desuscribirse del evento al desmontar
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>


