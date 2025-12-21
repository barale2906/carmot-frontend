<template>
  <div class="logo-wrapper" :class="[size, variant]">
    <img 
      v-if="logoPath && !imageError"
      :src="logoPath" 
      :alt="alt"
      class="logo-image"
      :style="imageStyle"
      loading="lazy"
      @error="handleImageError"
    />
    <div v-else class="logo-placeholder" :style="imageStyle">
      <span class="placeholder-text">LOGO</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'xlarge'].includes(value)
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'light', 'dark', 'monochrome'].includes(value)
  },
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  },
  alt: {
    type: String,
    default: 'CARMOT Logo'
  }
})

const logoPath = ref(null)
const imageError = ref(false)

// Importación estática optimizada para Vite
try {
  logoPath.value = new URL('../assets/images/logo.svg', import.meta.url).href
} catch {
  imageError.value = true
}

const handleImageError = () => {
  imageError.value = true
  logoPath.value = null
}

const imageStyle = computed(() => {
  if (!props.width && !props.height) return {}
  
  const style = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  return style
})
</script>

<style scoped>
.logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.logo-image {
  display: block;
  object-fit: contain;
  max-width: 100%;
  height: auto;
  will-change: filter;
}

.logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  min-width: 60px;
  min-height: 60px;
}

.placeholder-text {
  font-size: 0.8em;
  font-weight: 600;
  letter-spacing: 2px;
}

/* Tamaños usando CSS custom properties para mejor rendimiento */
.logo-wrapper.small .logo-image,
.logo-wrapper.small .logo-placeholder {
  width: 60px;
  height: 60px;
}

.logo-wrapper.medium .logo-image,
.logo-wrapper.medium .logo-placeholder {
  width: 120px;
  height: 120px;
}

.logo-wrapper.large .logo-image,
.logo-wrapper.large .logo-placeholder {
  width: 180px;
  height: 180px;
}

.logo-wrapper.xlarge .logo-image,
.logo-wrapper.xlarge .logo-placeholder {
  width: 240px;
  height: 240px;
}

/* Variantes optimizadas con will-change */
.logo-wrapper.light .logo-image {
  filter: brightness(1.2);
}

.logo-wrapper.dark .logo-image {
  filter: brightness(0.8);
}

.logo-wrapper.monochrome .logo-image {
  filter: grayscale(100%);
}

/* Responsive optimizado */
@media (max-width: 768px) {
  .logo-wrapper.medium .logo-image,
  .logo-wrapper.medium .logo-placeholder {
    width: 100px;
    height: 100px;
  }
  
  .logo-wrapper.large .logo-image,
  .logo-wrapper.large .logo-placeholder {
    width: 150px;
    height: 150px;
  }
  
  .logo-wrapper.xlarge .logo-image,
  .logo-wrapper.xlarge .logo-placeholder {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 480px) {
  .logo-wrapper.medium .logo-image,
  .logo-wrapper.medium .logo-placeholder {
    width: 80px;
    height: 80px;
  }
  
  .logo-wrapper.large .logo-image,
  .logo-wrapper.large .logo-placeholder {
    width: 120px;
    height: 120px;
  }
  
  .logo-wrapper.xlarge .logo-image,
  .logo-wrapper.xlarge .logo-placeholder {
    width: 160px;
    height: 160px;
  }
}
</style>
