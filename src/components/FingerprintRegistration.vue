<template>
  <div class="fingerprint-registration">
    <div class="header">
      <h2>Registro de Huella Dactilar</h2>
      <p class="subtitle">Capture su huella dactilar para autenticación biométrica</p>
    </div>
    
    <!-- Sección de captura -->
    <div v-if="!isRegistered" class="capture-section">
      <div class="instructions">
        <div class="instruction-card">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Coloque su dedo</h3>
            <p>Posicione su {{ fingerPositionName }} en el lector de huellas</p>
          </div>
        </div>
        
        <div v-if="qualityScore !== null" class="quality-indicator">
          <div class="quality-label">Calidad de captura:</div>
          <div class="quality-bar">
            <div 
              class="quality-fill" 
              :style="{ width: qualityScore + '%' }"
              :class="getQualityClass(qualityScore)"
            ></div>
          </div>
          <div class="quality-value">{{ qualityScore }}%</div>
        </div>
      </div>
      
      <div class="actions">
        <button 
          @click="captureFingerprint" 
          :disabled="loading"
          class="capture-button"
          :class="{ 'loading': loading }"
        >
          <span v-if="!loading">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Capturar Huella
          </span>
          <span v-else class="loading-content">
            <span class="spinner"></span>
            Capturando...
          </span>
        </button>
        
        <button 
          v-if="capturedTemplate"
          @click="registerFingerprint" 
          :disabled="registering"
          class="register-button"
        >
          {{ registering ? 'Registrando...' : 'Registrar Huella' }}
        </button>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ errorMessage }}
      </div>
    </div>
    
    <!-- Sección de éxito -->
    <div v-else class="success-section">
      <div class="success-animation">
        <div class="success-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      
      <h3>¡Huella Registrada Exitosamente!</h3>
      
      <div class="verification-info">
        <h4>Información de Verificación</h4>
        <div class="verification-grid">
          <div class="verification-item" :class="{ 'valid': verification.is_valid, 'invalid': !verification.is_valid }">
            <div class="verification-label">Estado General</div>
            <div class="verification-value">
              <span class="status-icon">{{ verification.is_valid ? '✓' : '✗' }}</span>
              {{ verification.is_valid ? 'Válida' : 'Inválida' }}
            </div>
          </div>
          
          <div class="verification-item" :class="{ 'valid': verification.integrity_ok, 'invalid': !verification.integrity_ok }">
            <div class="verification-label">Integridad</div>
            <div class="verification-value">
              <span class="status-icon">{{ verification.integrity_ok ? '✓' : '✗' }}</span>
              {{ verification.integrity_ok ? 'OK' : 'Error' }}
            </div>
          </div>
          
          <div class="verification-item" :class="{ 'valid': verification.size_ok, 'invalid': !verification.size_ok }">
            <div class="verification-label">Tamaño</div>
            <div class="verification-value">
              {{ verification.template_size }} bytes
              <span class="status-icon">{{ verification.size_ok ? '✓' : '✗' }}</span>
            </div>
          </div>
          
          <div class="verification-item">
            <div class="verification-label">Hash de Integridad</div>
            <div class="verification-value hash-value">
              <code>{{ verification.calculated_hash?.substring(0, 16) }}...</code>
            </div>
          </div>
          
          <div class="verification-item" v-if="verification.quality_score">
            <div class="verification-label">Calidad</div>
            <div class="verification-value">{{ verification.quality_score }}%</div>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button @click="resetRegistration" class="secondary-button">
          Registrar Otra Huella
        </button>
        <button @click="$emit('completed', fingerprintId)" class="primary-button">
          Continuar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { fingerprintService } from '../services/fingerprintService'

const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  fingerPosition: {
    type: Number,
    default: 1,
    validator: (value) => value >= 1 && value <= 10
  }
})

const emit = defineEmits(['completed', 'error'])

// Estados
const loading = ref(false)
const registering = ref(false)
const isRegistered = ref(false)
const errorMessage = ref('')
const qualityScore = ref(null)
const verification = ref({})
const fingerprintId = ref(null)
const capturedTemplate = ref(null)

// Nombres de dedos
const fingerNames = {
  1: 'Pulgar Derecho',
  2: 'Índice Derecho',
  3: 'Medio Derecho',
  4: 'Anular Derecho',
  5: 'Meñique Derecho',
  6: 'Pulgar Izquierdo',
  7: 'Índice Izquierdo',
  8: 'Medio Izquierdo',
  9: 'Anular Izquierdo',
  10: 'Meñique Izquierdo'
}

const fingerPositionName = computed(() => fingerNames[props.fingerPosition] || 'Dedo')

// Capturar huella del lector
const captureFingerprint = async () => {
  loading.value = true
  errorMessage.value = ''
  qualityScore.value = null
  capturedTemplate.value = null
  
  try {
    const captureResult = await fingerprintService.captureFingerprint()
    
    qualityScore.value = captureResult.quality_score
    capturedTemplate.value = captureResult
    
    // Validar calidad mínima
    if (captureResult.quality_score < 60) {
      errorMessage.value = `Calidad de captura baja (${captureResult.quality_score}%). Por favor, intente nuevamente.`
      capturedTemplate.value = null
      return
    }
    
  } catch (error) {
    console.error('Error capturando huella:', error)
    errorMessage.value = error.message || 'Error al capturar la huella. Por favor, intente nuevamente.'
    emit('error', error)
  } finally {
    loading.value = false
  }
}

// Registrar huella en el backend
const registerFingerprint = async () => {
  if (!capturedTemplate.value) {
    errorMessage.value = 'Debe capturar una huella primero'
    return
  }
  
  registering.value = true
  errorMessage.value = ''
  
  try {
    // Registrar en el backend
    const registerResult = await fingerprintService.registerFingerprint({
      userId: props.userId,
      template: capturedTemplate.value.template,
      fingerPosition: props.fingerPosition,
      quality: capturedTemplate.value.quality_score,
      deviceId: capturedTemplate.value.device_id
    })
    
    fingerprintId.value = registerResult.data.fingerprint_id
    
    // Verificar que se guardó correctamente
    const verifyResult = await fingerprintService.verifyFingerprint(fingerprintId.value)
    verification.value = verifyResult.data
    
    if (verifyResult.data.is_valid) {
      isRegistered.value = true
    } else {
      errorMessage.value = 'La huella se registró pero hay problemas de verificación. Por favor, contacte al administrador.'
      emit('error', { message: 'Problemas de verificación', data: verifyResult.data })
    }
    
  } catch (error) {
    console.error('Error registrando huella:', error)
    errorMessage.value = error.message || 'Error al registrar la huella. Por favor, intente nuevamente.'
    emit('error', error)
  } finally {
    registering.value = false
  }
}

// Resetear formulario
const resetRegistration = () => {
  isRegistered.value = false
  qualityScore.value = null
  verification.value = {}
  fingerprintId.value = null
  capturedTemplate.value = null
  errorMessage.value = ''
}

// Obtener clase CSS según calidad
const getQualityClass = (quality) => {
  if (quality >= 80) return 'quality-excellent'
  if (quality >= 60) return 'quality-good'
  return 'quality-poor'
}
</script>

<style scoped>
.fingerprint-registration {
  max-width: 700px;
  margin: 0 auto;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #1a202c;
  font-size: 24px;
}

.subtitle {
  color: #718096;
  margin: 0;
}

.instruction-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
  margin-bottom: 20px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4299e1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 4px 0;
  color: #2d3748;
  font-size: 16px;
}

.step-content p {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

.quality-indicator {
  margin-top: 20px;
  padding: 16px;
  background: #edf2f7;
  border-radius: 8px;
}

.quality-label {
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 8px;
}

.quality-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.quality-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.quality-excellent {
  background: #48bb78;
}

.quality-good {
  background: #ed8936;
}

.quality-poor {
  background: #f56565;
}

.quality-value {
  font-size: 18px;
  font-weight: bold;
  color: #2d3748;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.capture-button,
.register-button,
.primary-button,
.secondary-button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.capture-button {
  background: #4299e1;
  color: white;
}

.capture-button:hover:not(:disabled) {
  background: #3182ce;
}

.capture-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-button {
  background: #48bb78;
  color: white;
}

.register-button:hover:not(:disabled) {
  background: #38a169;
}

.primary-button {
  background: #4299e1;
  color: white;
}

.secondary-button {
  background: #e2e8f0;
  color: #4a5568;
}

.icon {
  width: 20px;
  height: 20px;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.success-section {
  text-align: center;
}

.success-animation {
  margin-bottom: 24px;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: #c6f6d5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.5s ease;
}

.success-icon svg {
  width: 48px;
  height: 48px;
  color: #48bb78;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-section h3 {
  margin: 0 0 24px 0;
  color: #1a202c;
  font-size: 20px;
}

.verification-info {
  text-align: left;
  margin: 24px 0;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
}

.verification-info h4 {
  margin: 0 0 16px 0;
  color: #2d3748;
  font-size: 16px;
}

.verification-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.verification-item {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.verification-item.valid {
  border-color: #48bb78;
  background: #f0fff4;
}

.verification-item.invalid {
  border-color: #f56565;
  background: #fff5f5;
}

.verification-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.verification-value {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 18px;
}

.hash-value code {
  font-size: 12px;
  background: #edf2f7;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}
</style>

