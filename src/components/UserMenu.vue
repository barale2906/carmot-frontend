<template>
  <div class="user-menu-wrapper">
    <div class="user-info" @click.stop="toggleMenu">
      <div class="user-details">
        <span class="user-name">{{ userName }}</span>
        <span class="user-email">{{ userEmail }}</span>
      </div>
      <div class="user-avatar">
        {{ userInitial }}
      </div>
      <svg 
        class="chevron-icon" 
        :class="{ 'open': isOpen }"
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <Transition name="dropdown">
      <div v-if="isOpen" class="user-menu-dropdown" @click.stop>
        <div class="dropdown-header">
          <div class="dropdown-user-info">
            <div class="dropdown-avatar">
              {{ userInitial }}
            </div>
            <div class="dropdown-details">
              <span class="dropdown-name">{{ userName }}</span>
              <span class="dropdown-email">{{ userEmail }}</span>
            </div>
          </div>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <div class="dropdown-menu">
          <a href="#" class="dropdown-item" @click.prevent="goToProfile">
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Ver Perfil</span>
          </a>
          
          <button class="dropdown-item logout-item" @click="handleLogout">
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Overlay para cerrar al hacer clic fuera -->
    <Transition name="overlay">
      <div 
        v-if="isOpen" 
        class="user-menu-overlay" 
        @click="closeMenu"
      ></div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

const props = defineProps({
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  }
})

const router = useRouter()
const isOpen = ref(false)
const closeSidebar = inject('closeSidebar', () => {})

const userInitial = computed(() => {
  return props.userName.charAt(0).toUpperCase()
})

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  // Cerrar el sidebar izquierdo si está abierto
  if (isOpen.value) {
    closeSidebar()
  }
}

const closeMenu = () => {
  isOpen.value = false
}

const goToProfile = () => {
  closeMenu()
  router.push('/perfil')
}

const handleLogout = async () => {
  try {
    await authService.logout()
    closeMenu()
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    // Aunque falle, redirigir al login
    closeMenu()
    router.push('/')
  }
}

// Cerrar menú al presionar Escape
const handleEscape = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

// Cerrar menú al hacer clic fuera
const handleClickOutside = (e) => {
  if (isOpen.value && !e.target.closest('.user-menu-wrapper')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.user-menu-wrapper {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.2;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
  transition: transform 0.2s;
}

.chevron-icon.open {
  transform: rotate(180deg);
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
}

.dropdown-header {
  padding: 16px;
  background: #f8fafc;
}

.dropdown-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.dropdown-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.dropdown-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-email {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0;
}

.dropdown-menu {
  padding: 8px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #1e293b;
  text-decoration: none;
  font-size: 0.95rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.logout-item {
  color: #dc2626;
}

.logout-item:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.dropdown-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.user-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: transparent;
}

/* Transiciones */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .user-menu-dropdown {
    width: 260px;
    right: 8px;
  }
  
  .user-details {
    display: none;
  }
}
</style>

