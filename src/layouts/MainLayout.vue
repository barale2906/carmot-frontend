<template>
  <div class="main-layout">
    <Navbar 
      :page-title="pageTitle"
      :page-subtitle="pageSubtitle"
      :user-name="userName"
      :user-email="userEmail"
    />
    <Sidebar />
    <main class="main-content" :class="{ 'sidebar-open': sidebarOpen }" @click="handleMainClick">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, provide, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Sidebar from '../components/Sidebar.vue'
import { authService } from '../services/authService'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

// Títulos dinámicos según la ruta (se puede mejorar con meta en las rutas)
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/estudiantes': 'Estudiantes',
    '/cursos': 'Cursos y Técnicos',
    '/formularios': 'Formularios',
    '/reportes': 'Reportes',
    '/perfil': 'Perfil'
  }
  return titles[route.path] || 'Dashboard'
})

const pageSubtitle = computed(() => {
  return 'Sistema de gestión - Centro de Capacitación CARMOT'
})

// Datos del usuario
const userName = ref('Usuario')
const userEmail = ref('')
const loadingUser = ref(true)

// Obtener datos del usuario autenticado
const fetchUserData = async () => {
  if (!authService.isAuthenticated()) {
    router.push('/')
    return
  }

  try {
    loadingUser.value = true
    const userData = await authService.getUser()
    
    // Ajustar según la estructura de respuesta de la API
    // Si la API devuelve un objeto con name y email, usar esos campos
    if (typeof userData === 'string') {
      // Si es un string, podría ser JSON parseado
      try {
        const parsed = JSON.parse(userData)
        userName.value = parsed.name || parsed.nombre || 'Usuario'
        userEmail.value = parsed.email || parsed.correo || ''
      } catch {
        // Si no se puede parsear, usar valores por defecto
        userName.value = 'Usuario'
        userEmail.value = ''
      }
    } else if (typeof userData === 'object') {
      userName.value = userData.name || userData.nombre || userData.username || 'Usuario'
      userEmail.value = userData.email || userData.correo || ''
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

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

// Cerrar sidebar al hacer clic en el contenido principal
const handleMainClick = () => {
  if (sidebarOpen.value) {
    closeSidebar()
  }
}

// Proveer el estado del sidebar a los componentes hijos
provide('sidebarOpen', sidebarOpen)
provide('toggleSidebar', toggleSidebar)
provide('closeSidebar', closeSidebar)

// Cerrar sidebar al presionar Escape
const handleEscape = (e) => {
  if (e.key === 'Escape' && sidebarOpen.value) {
    closeSidebar()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  fetchUserData()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  margin-top: 64px;
  margin-left: 0;
  padding: 24px;
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 64px);
  background: #f8fafc;
}

.main-content.sidebar-open {
  margin-left: 0;
}

@media (min-width: 1024px) {
  .main-content.sidebar-open {
    margin-left: 280px;
  }
}
</style>

