<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="emit('update:modelValue', false)"
      >
        <div
          :class="[
            'relative w-full rounded-[10px] border border-black/10 bg-white shadow-xl',
            sizeClass
          ]"
          @click.stop
        >
          <button
            type="button"
            class="absolute right-4 top-4 flex size-8 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerrar"
            @click="emit('update:modelValue', false)"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <header class="flex flex-col gap-2 px-6 pt-6 pr-12">
            <div class="flex items-start gap-3">
              <slot name="icon">
                <span class="flex size-5 shrink-0 items-center justify-center text-[#213360]" aria-hidden="true">
                  <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </slot>
              <div class="min-w-0 flex-1">
                <h2 :id="titleId" class="text-lg font-semibold text-slate-900">
                  {{ title }}
                </h2>
                <p v-if="description" class="mt-0.5 text-sm text-slate-500">
                  {{ description }}
                </p>
              </div>
            </div>
          </header>
          <div class="px-6 pt-4">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="flex justify-end gap-2 px-6 pb-6 pt-4">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  size: { type: String, default: 'md' }
})

const emit = defineEmits(['update:modelValue'])

const titleId = computed(() => `modal-title-${Math.random().toString(36).slice(2, 9)}`)

const sizeClass = computed(() => {
  const sizes = { sm: 'max-w-[400px]', md: 'max-w-[500px]', lg: 'max-w-[640px]' }
  return sizes[props.size] ?? sizes.md
})
</script>
