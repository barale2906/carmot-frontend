<template>
  <nav class="navbar">
    <div class="navbar-content">
      <div class="navbar-left">
        <button 
          class="menu-toggle"
          @click="toggleSidebar"
          aria-label="Toggle menu"
        >
          <svg class="car-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 11L6.5 6.5H17.5L19 11M5 11H3M5 11V18M19 11H21M19 11V18M7 18H9M15 18H17M3 15H21M9 6V4M15 6V4" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"/>
          </svg>
        </button>
        
        <div class="navbar-title">
          <h1 class="page-title">{{ pageTitle }}</h1>
          <p class="page-subtitle">{{ pageSubtitle }}</p>
        </div>
      </div>

      <div class="navbar-right">
        <div class="user-info">
          <div class="user-details">
            <span class="user-name">{{ userName }}</span>
            <span class="user-email">{{ userEmail }}</span>
          </div>
          <div class="user-avatar">
            {{ userInitial }}
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
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

const toggleSidebar = inject('toggleSidebar', () => {})

const userInitial = computed(() => {
  return props.userName.charAt(0).toUpperCase()
})
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
  max-width: 100%;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  color: #1e293b;
  transition: background-color 0.2s, transform 0.2s;
}

.menu-toggle:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.menu-toggle:active {
  transform: scale(0.95);
}

.car-icon {
  width: 24px;
  height: 24px;
}

.navbar-title {
  display: flex;
  flex-direction: column;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a8a;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 2px 0 0;
  line-height: 1.2;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
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

@media (max-width: 768px) {
  .navbar-content {
    padding: 0 16px;
  }
  
  .menu-toggle {
    margin-right: 12px;
  }
}
</style>

