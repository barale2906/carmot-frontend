<template>
  <div class="menu-item" :class="{ disabled: item.disabled }">
    <!-- Item con o sin children -->
    <component
      :is="item.children?.length > 0 ? 'button' : 'RouterLink'"
      v-bind="getItemBinding()"
      :class="[
        'flex items-center gap-3 w-full rounded-lg px-4 py-3 text-white transition',
        isActive ? 'bg-[#3B4961] font-semibold' : 'hover:bg-white/10',
        item.disabled && 'opacity-50 cursor-not-allowed'
      ]"
      :type="item.children?.length > 0 ? 'button' : undefined"
      @click="handleClick"
    >
      <NavIcon :name="item.icon" class="size-5 shrink-0" />
      <span class="text-[0.95rem] flex-1 text-left">{{ item.title }}</span>

      <!-- Ícono de expansión para items con children -->
      <NavIcon
        v-if="item.children?.length > 0"
        :name="isExpanded ? 'expand_less' : 'expand_more'"
        class="size-5 shrink-0 transition-transform"
        :class="{ 'rotate-180': isExpanded }"
      />
    </component>

    <!-- Submenu (recursivo) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-screen opacity-100"
      leave-from-class="max-h-screen opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-if="isExpanded && item.children?.length > 0"
        class="overflow-hidden"
      >
        <div class="pl-8 border-l-2 border-white/20 ml-3 my-1 py-1">
          <MenuItem
            v-for="child in item.children"
            :key="child.id"
            :item="child"
            :current-route="currentRoute"
            @navigate="$emit('navigate')"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavIcon from '@/components/icons/NavIcon.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
    validator: (item) => {
      return (
        item.id &&
        item.title &&
        item.icon !== undefined &&
        item.route !== undefined &&
        typeof item.disabled === 'boolean'
      )
    }
  },
  currentRoute: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['navigate'])

const route = useRoute()
const router = useRouter()
const isExpanded = ref(false)

/**
 * Determinar si el item está activo basado en la ruta actual
 */
const isActive = computed(() => {
  const routePath = props.currentRoute || route.path
  return routePath === props.item.route || routePath.startsWith(props.item.route + '/')
})

/**
 * Expandir automáticamente si algún hijo está activo
 */
const shouldAutoExpand = computed(() => {
  if (!props.item.children?.length) return false

  const routePath = props.currentRoute || route.path

  return props.item.children.some((child) => {
    return routePath === child.route || routePath.startsWith(child.route + '/')
  })
})

/**
 * Obtener propiedades dinámicas del binding
 */
function getItemBinding() {
  if (props.item.children?.length > 0) {
    return {}
  }

  return {
    to: props.item.route,
    class: props.item.disabled && 'pointer-events-none'
  }
}

/**
 * Manejar clic en el item
 */
function handleClick() {
  // Si está deshabilitado, no hacer nada
  if (props.item.disabled) return

  // Si tiene children, expandir/contraer
  if (props.item.children?.length > 0) {
    isExpanded.value = !isExpanded.value
    return
  }

  // Si es un link, navegar
  if (props.item.route) {
    router.push(props.item.route)
    emit('navigate')
  }
}

/**
 * Inicializar expanded si está activo
 */
if (shouldAutoExpand.value) {
  isExpanded.value = true
}
</script>

<style scoped>
.menu-item.disabled :deep(*) {
  color: rgba(255, 255, 255, 0.38);
  cursor: not-allowed;
}
</style>
