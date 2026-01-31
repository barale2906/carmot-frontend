<template>
  <div class="login-container">
    <div class="background-effects">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="login-content">
      <div class="brand-section">
        <div class="logo-container">
          <Logo :width="280" :height="280" variant="light" />
          <p class="brand-subtitle">Centro de Capacitaciones</p>
          <p class="brand-subtitle brand-name">CARMOT</p>
        </div>
      </div>

      <div class="login-form-container">
        <div class="form-header">
          <h2 class="form-title">Iniciar Sesión</h2>
          <p class="form-subtitle">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="form-input"
              :class="{ 'error': errors.email }"
              placeholder="Ingresa tu email"
              autocomplete="email"
              required
            />
            <span v-if="errors.email" class="error-message">{{ errors.email[0] }}</span>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Contraseña</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="form-input"
              :class="{ 'error': errors.password }"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              required
            />
            <span v-if="errors.password" class="error-message">{{ errors.password[0] }}</span>
          </div>
          
          <div v-if="errorMessage" class="error-alert">
            {{ errorMessage }}
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            <span v-if="!loading">Ingresar</span>
            <span v-else class="loading-spinner" aria-label="Cargando"></span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '../components/Logo.vue'
import { authService } from '../services/authService'

const router = useRouter()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const errors = ref({})
const errorMessage = ref('')

const handleLogin = async () => {
  if (loading.value) return
  
  // Limpiar errores previos
  errors.value = {}
  errorMessage.value = ''
  
  loading.value = true
  try {
    const response = await authService.login(formData.value.email, formData.value.password)
    
    // Login exitoso
    console.log('Login exitoso:', response.message)
    
    // Redirigir al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Error en login:', error)
    
    // Manejar errores de validación
    if (error.errors) {
      errors.value = error.errors
    } else {
      errorMessage.value = error.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1a2e 0%, #162447 50%, #1a1a3e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.background-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;
  will-change: transform;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(66, 153, 225, 0.6) 0%, transparent 70%);
  top: -100px;
  left: -100px;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%);
  bottom: -50px;
  right: -50px;
  animation-delay: 7s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
  top: 50%;
  right: 10%;
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.brand-section {
  text-align: center;
  color: white;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.brand-subtitle {
  font-size: 1.2rem;
  margin: 10px 0 0;
  opacity: 0.9;
  letter-spacing: 2px;
}

.brand-name {
  font-weight: 700;
  font-size: 1.4rem;
  margin-top: 5px;
}

.login-form-container {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  animation: slideUp 0.6s ease-out;
  will-change: transform, opacity;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.form-subtitle {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
}

.form-input {
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  background: #f8fafc;
  color: #1e293b;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s, transform 0.2s;
  outline: none;
  will-change: transform;
}

.form-input:focus {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 4px;
}

.error-alert {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 8px;
}

.login-button {
  padding: 16px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-top: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(30, 58, 138, 0.4);
  will-change: transform;
}

.login-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s;
}

.login-button:hover::before {
  transform: translateX(100%);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(30, 58, 138, 0.6);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive optimizado */
@media (max-width: 768px) {
  .login-content {
    gap: 30px;
  }

  .brand-subtitle {
    font-size: 1rem;
  }

  .login-form-container {
    padding: 30px 24px;
  }

  .form-title {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }

  .login-form-container {
    padding: 24px 20px;
    border-radius: 16px;
  }

  .form-title {
    font-size: 1.5rem;
  }

  .form-subtitle {
    font-size: 0.85rem;
  }
}
</style>

