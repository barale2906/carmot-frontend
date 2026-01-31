<template>
  <div class="signature-capture">
    <div class="header">
      <h2>Firma Manuscrita</h2>
      <p class="subtitle">Firme en el área indicada usando su dedo o stylus</p>
    </div>
    
    <!-- Canvas para captura de firma -->
    <div class="canvas-container">
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        class="signature-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      ></canvas>
      
      <div v-if="isEmpty" class="empty-indicator">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <p>Firme aquí</p>
      </div>
    </div>
    
    <!-- Información de captura -->
    <div v-if="!isEmpty" class="capture-info">
      <div class="info-item">
        <span class="info-label">Trazo:</span>
        <span class="info-value">{{ strokeCount }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Duración:</span>
        <span class="info-value">{{ formatDuration(duration) }}s</span>
      </div>
      <div class="info-item">
        <span class="info-label">Puntos:</span>
        <span class="info-value">{{ totalPoints }}</span>
      </div>
    </div>
    
    <!-- Botones de acción -->
    <div class="actions">
      <button 
        @click="clearSignature" 
        :disabled="isEmpty || saving"
        class="clear-button"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Limpiar
      </button>
      
      <button 
        @click="saveSignature" 
        :disabled="isEmpty || saving"
        class="save-button"
        :class="{ 'loading': saving }"
      >
        <span v-if="!saving">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Guardar Firma
        </span>
        <span v-else class="loading-content">
          <span class="spinner"></span>
          Guardando...
        </span>
      </button>
    </div>
    
    <!-- Mensajes de error -->
    <div v-if="errorMessage" class="error-message">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {{ errorMessage }}
    </div>
    
    <!-- Panel de verificación (después de guardar) -->
    <div v-if="verification && isSaved" class="verification-panel">
      <div class="verification-header">
        <h3>Firma Guardada Exitosamente</h3>
      </div>
      <div class="verification-grid">
        <div class="verification-item" :class="{ 'valid': verification.is_valid, 'invalid': !verification.is_valid }">
          <div class="verification-label">Estado</div>
          <div class="verification-value">
            <span class="status-icon">{{ verification.is_valid ? '✓' : '✗' }}</span>
            {{ verification.is_valid ? 'Válida' : 'Inválida' }}
          </div>
        </div>
        <div class="verification-item" :class="{ 'valid': verification.checks?.image_integrity, 'invalid': !verification.checks?.image_integrity }">
          <div class="verification-label">Integridad</div>
          <div class="verification-value">
            <span class="status-icon">{{ verification.checks?.image_integrity ? '✓' : '✗' }}</span>
            {{ verification.checks?.image_integrity ? 'OK' : 'Error' }}
          </div>
        </div>
        <div class="verification-item">
          <div class="verification-label">Tamaño</div>
          <div class="verification-value">{{ verification.image_size }} bytes</div>
        </div>
        <div class="verification-item" v-if="verification.quality_score">
          <div class="verification-label">Calidad</div>
          <div class="verification-value">{{ verification.quality_score }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { signatureService } from '../services/signatureService'

const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  documentId: {
    type: Number,
    default: null
  },
  canvasWidth: {
    type: Number,
    default: 800
  },
  canvasHeight: {
    type: Number,
    default: 300
  },
  penColor: {
    type: String,
    default: '#000000'
  },
  penWidth: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['saved', 'error'])

// Referencias
const canvasRef = ref(null)
let ctx = null

// Estados de dibujo
const isDrawing = ref(false)
const strokes = ref([])
const currentStroke = ref(null)
const startTime = ref(null)
const isEmpty = ref(true)

// Estadísticas
const strokeCount = computed(() => strokes.value.length)
const totalPoints = computed(() => {
  return strokes.value.reduce((total, stroke) => total + stroke.points.length, 0)
})
const duration = computed(() => {
  if (!startTime.value) return 0
  return Date.now() - startTime.value
})

// Estados de guardado
const saving = ref(false)
const isSaved = ref(false)
const errorMessage = ref('')
const verification = ref(null)
const signatureId = ref(null)

// Inicializar canvas
onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    setupCanvas()
  }
})

const setupCanvas = () => {
  if (!ctx) return
  
  // Configurar estilo de línea
  ctx.strokeStyle = props.penColor
  ctx.lineWidth = props.penWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  
  // Fondo blanco
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
}

// Obtener coordenadas del evento (mouse o touch)
const getEventPos = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = props.canvasWidth / rect.width
  const scaleY = props.canvasHeight / rect.height
  
  if (e.touches && e.touches.length > 0) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    }
  }
  
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

// Iniciar dibujo
const startDrawing = (e) => {
  e.preventDefault()
  isDrawing.value = true
  
  if (!startTime.value) {
    startTime.value = Date.now()
  }
  
  const pos = getEventPos(e)
  currentStroke.value = {
    points: [{
      x: pos.x,
      y: pos.y,
      time: Date.now(),
      pressure: 1.0 // Los dispositivos táctiles pueden proporcionar presión
    }],
    color: props.penColor,
    width: props.penWidth
  }
  
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
  isEmpty.value = false
}

// Dibujar
const draw = (e) => {
  if (!isDrawing.value || !currentStroke.value) return
  e.preventDefault()
  
  const pos = getEventPos(e)
  currentStroke.value.points.push({
    x: pos.x,
    y: pos.y,
    time: Date.now(),
    pressure: 1.0
  })
  
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
}

// Detener dibujo
const stopDrawing = (e) => {
  if (!isDrawing.value) return
  e.preventDefault()
  
  if (currentStroke.value && currentStroke.value.points.length > 0) {
    strokes.value.push(currentStroke.value)
  }
  
  isDrawing.value = false
  currentStroke.value = null
}

// Manejar eventos táctiles
const handleTouchStart = (e) => {
  startDrawing(e)
}

const handleTouchMove = (e) => {
  draw(e)
}

const handleTouchEnd = (e) => {
  stopDrawing(e)
}

// Limpiar firma
const clearSignature = () => {
  if (!ctx) return
  
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, props.canvasWidth, props.canvasHeight)
  
  strokes.value = []
  currentStroke.value = null
  isEmpty.value = true
  startTime.value = null
  isSaved.value = false
  verification.value = null
  errorMessage.value = ''
}

// Guardar firma
const saveSignature = async () => {
  if (isEmpty.value || saving.value) return
  
  saving.value = true
  errorMessage.value = ''
  
  try {
    // Convertir canvas a imagen base64
    const imageBase64 = canvasRef.value.toDataURL('image/png')
    // Remover el prefijo data:image/png;base64,
    const base64Data = imageBase64.split(',')[1]
    
    // Preparar datos vectoriales
    const vectorData = {
      version: '1.0',
      width: props.canvasWidth,
      height: props.canvasHeight,
      strokes: strokes.value,
      metadata: {
        device: 'touchscreen',
        capture_date: new Date().toISOString(),
        duration_ms: duration.value,
        stroke_count: strokeCount.value,
        total_points: totalPoints.value
      }
    }
    
    // Registrar en el backend
    const result = await signatureService.registerSignature({
      userId: props.userId,
      imageBase64: base64Data,
      vectorData: vectorData,
      width: props.canvasWidth,
      height: props.canvasHeight,
      documentId: props.documentId,
      deviceType: 'touchscreen'
    })
    
    signatureId.value = result.data.signature_id
    verification.value = result.data.verification
    
    isSaved.value = true
    emit('saved', {
      signatureId: signatureId.value,
      verification: verification.value
    })
    
  } catch (error) {
    console.error('Error guardando firma:', error)
    errorMessage.value = error.message || 'Error al guardar la firma'
    emit('error', error)
  } finally {
    saving.value = false
  }
}

// Formatear duración
const formatDuration = (ms) => {
  return (ms / 1000).toFixed(1)
}

// Observar cambios en props para actualizar canvas
watch([() => props.penColor, () => props.penWidth], () => {
  if (ctx) {
    ctx.strokeStyle = props.penColor
    ctx.lineWidth = props.penWidth
  }
})
</script>

<style scoped>
.signature-capture {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #1a202c;
  font-size: 24px;
}

.subtitle {
  color: #718096;
  margin: 0;
  font-size: 14px;
}

.canvas-container {
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #f7fafc;
  margin-bottom: 16px;
  overflow: hidden;
}

.signature-canvas {
  display: block;
  width: 100%;
  height: auto;
  cursor: crosshair;
  touch-action: none;
  background: white;
}

.empty-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #cbd5e0;
  pointer-events: none;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 8px;
  opacity: 0.5;
}

.capture-info {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f7fafc;
  border-radius: 6px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.actions {
  display: flex;
  gap: 12px;
}

.clear-button,
.save-button {
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

.clear-button {
  background: #e2e8f0;
  color: #4a5568;
}

.clear-button:hover:not(:disabled) {
  background: #cbd5e0;
}

.save-button {
  background: #4299e1;
  color: white;
}

.save-button:hover:not(:disabled) {
  background: #3182ce;
}

.clear-button:disabled,
.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.verification-panel {
  margin-top: 24px;
  padding: 20px;
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 8px;
}

.verification-header h3 {
  margin: 0 0 16px 0;
  color: #22543d;
  font-size: 18px;
}

.verification-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
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
</style>

