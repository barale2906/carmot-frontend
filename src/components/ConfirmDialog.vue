<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      leave-active-class="transition-opacity duration-100 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state.visible"
        class="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div class="w-full max-w-sm rounded-[10px] border border-black/10 bg-white shadow-xl" @click.stop>
          <div class="flex items-start gap-3 p-6">
            <!-- Ícono según tipo -->
            <span
              class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
              :class="state.danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'"
              aria-hidden="true"
            >
              <svg class="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </span>
            <div>
              <h3 id="confirm-dialog-title" class="text-base font-semibold text-slate-900">
                {{ state.title }}
              </h3>
              <p id="confirm-dialog-message" class="mt-1 text-sm text-slate-600">
                {{ state.message }}
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-2 border-t border-black/10 px-6 py-4">
            <button
              type="button"
              class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="cancel"
            >
              {{ state.cancelLabel }}
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2"
              :class="state.danger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-[#213360] hover:bg-[#1a294d] focus:ring-blue-500'"
              @click="accept"
            >
              {{ state.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useConfirm } from '@/composables/useConfirm.js'

const { state, accept, cancel } = useConfirm()
</script>
