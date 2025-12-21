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
import { useRoute } from 'vue-router'
import Navbar from '../components/Navbar.vue'
import Sidebar from '../components/Sidebar.vue'

const route = useRoute()
const sidebarOpen = ref(false)

// Títulos dinámicos según la ruta (se puede mejorar con meta en las rutas)
const pageTitle = computed(() => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/estudiantes': 'Estudiantes',
    '/cursos': 'Cursos y Técnicos',
    '/formularios': 'Formularios',
    '/reportes': 'Reportes'
  }
  return titles[route.path] || 'Dashboard'
})

const pageSubtitle = computed(() => {
  return 'Sistema de gestión - Centro de Capacitación CARMOT'
})

// Datos del usuario (luego vendrán del store/auth)
const userName = ref('Administrador')
const userEmail = ref('admin@carmot.com')

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

