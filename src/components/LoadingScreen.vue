<template>
  <main
    class="flex min-h-screen min-w-full items-center justify-center bg-[linear-gradient(180deg,rgb(33,51,96)_0%,rgb(74,111,165)_100%)] p-6"
    role="status"
    aria-live="polite"
    :aria-label="ariaLabel || undefined"
  >
    <div class="flex flex-col items-center gap-2">
      <div class="flex flex-col items-center justify-center gap-[13.54px] pb-0.5">
        <div class="flex size-[106px] items-center justify-center sm:size-[120px]">
          <span
            class="inline-block size-[101px] animate-spin sm:size-[115px]"
            aria-hidden="true"
          >
            <svg
              class="size-full text-white"
              viewBox="0 0 101 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M50.5 18.5v-6a3 3 0 0 0-6 0v6a3 3 0 0 0 6 0ZM50.5 88.5v6a3 3 0 0 1-6 0v-6a3 3 0 0 1 6 0ZM18.5 50.5h-6a3 3 0 0 0 0 6h6a3 3 0 0 0 0-6ZM88.5 50.5h6a3 3 0 0 1 0 6h-6a3 3 0 0 1 0-6ZM25.2 25.2l-4.24-4.24a3 3 0 0 1 4.24-4.24l4.24 4.24a3 3 0 0 1-4.24 4.24ZM79.8 79.8l-4.24-4.24a3 3 0 0 1 4.24-4.24l4.24 4.24a3 3 0 0 1-4.24 4.24ZM25.2 75.8l-4.24 4.24a3 3 0 0 1 4.24 4.24l4.24-4.24a3 3 0 0 1-4.24-4.24ZM79.8 25.2l4.24-4.24a3 3 0 0 1 4.24 4.24l-4.24 4.24a3 3 0 0 1-4.24-4.24Z"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
              <circle
                cx="50.5"
                cy="50.5"
                r="12"
                stroke="currentColor"
                stroke-width="3"
              />
            </svg>
          </span>
        </div>
        <p class="text-center text-base leading-6 text-white">
          <slot name="message">{{ message }}</slot>
        </p>
      </div>
      <p class="text-center text-base leading-6 text-blue-100">
        <slot name="hint">{{ hint }}</slot>
      </p>
    </div>
  </main>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Cargando información...'
  },
  hint: {
    type: String,
    default: 'Por favor espera un momento'
  },
  ariaLabel: {
    type: String,
    default: 'Cargando, por favor espera'
  }
})
</script>
