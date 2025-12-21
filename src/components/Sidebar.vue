<template>
  <Transition name="sidebar">
    <aside v-if="isOpen" class="sidebar" @click.stop>
      <div class="sidebar-header">
        <Logo size="medium" variant="light" />
        <div class="brand-info">
          <h2 class="brand-title">CARMOT</h2>
          <p class="brand-subtitle">Centro de Capacitaciones</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li 
            v-for="item in menuItems" 
            :key="item.id"
            class="nav-item"
            :class="{ active: item.active }"
          >
            <a :href="item.path" class="nav-link" @click.prevent="handleNavClick(item)">
              <component :is="item.icon" class="nav-icon" />
              <span class="nav-text">{{ item.label }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  </Transition>
  
  <!-- Overlay para cerrar al hacer clic fuera -->
  <Transition name="overlay">
    <div 
      v-if="isOpen" 
      class="sidebar-overlay" 
      @click="closeSidebar"
    ></div>
  </Transition>
</template>

<script setup>
import { inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import Logo from './Logo.vue'

const router = useRouter()

// Iconos SVG inline (temporales, luego vendrán del backend)
const DashboardIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
}

const StudentsIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1674 16.5523C21.6304 15.8519 20.8833 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
}

const CoursesIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6.253V13.5L15.5 15.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 2V6M12 18V22M22 12H18M6 12H2" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `
}

const FormsIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
}

const ReportsIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3V21H21M7 16L12 11L16 15L21 10M21 10H16M21 10V15" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
}

const isOpen = inject('sidebarOpen', false)
const closeSidebar = inject('closeSidebar', () => {})

// Menú temporal - luego vendrá del backend según permisos
const menuItems = computed(() => [
  { id: 1, label: 'Dashboard', path: '/dashboard', icon: DashboardIcon, active: false },
  { id: 2, label: 'Estudiantes', path: '/estudiantes', icon: StudentsIcon, active: false },
  { id: 3, label: 'Cursos y Técnicos', path: '/cursos', icon: CoursesIcon, active: false },
  { id: 4, label: 'Formularios', path: '/formularios', icon: FormsIcon, active: true },
  { id: 5, label: 'Reportes', path: '/reportes', icon: ReportsIcon, active: false }
])

const handleNavClick = (item) => {
  router.push(item.path)
  closeSidebar()
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: #1e3a8a;
  z-index: 999;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-info {
  text-align: center;
  color: white;
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 2px;
}

.brand-subtitle {
  font-size: 0.85rem;
  margin: 4px 0 0;
  opacity: 0.9;
  letter-spacing: 1px;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin: 4px 12px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active .nav-link {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-text {
  font-size: 0.95rem;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  backdrop-filter: blur(2px);
}

/* Transiciones */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from {
  transform: translateX(-100%);
}

.sidebar-leave-to {
  transform: translateX(-100%);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Scrollbar personalizado */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .sidebar {
    width: 260px;
  }
}
</style>

