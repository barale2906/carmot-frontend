<template>
  <form
    class="flex flex-col gap-4"
    aria-labelledby="login-title"
    @submit.prevent="onSubmit"
  >
    <header class="mb-1 text-left">
      <h2
        id="login-title"
        class="text-base font-medium leading-4 text-[#0a0a0a]"
      >
        Iniciar Sesión
      </h2>
      <p class="mt-1.5 text-sm leading-6 text-[#717182]">
        Ingresa tus credenciales para acceder al sistema
      </p>
    </header>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="login-email" class="text-sm font-medium leading-[14px] text-[#0a0a0a]">
          Usuario
        </label>
        <input
          id="login-email"
          v-model="localEmail"
          type="email"
          autocomplete="username"
          required
          placeholder="Ingresa tu usuario"
          class="h-9 w-full rounded-lg border border-transparent bg-[#f3f3f5] px-3 py-1 text-sm leading-normal text-[#0a0a0a] outline-none transition placeholder:text-[#717182] focus:ring-2 focus:ring-[#213360]/20 disabled:opacity-70"
          :class="{ 'ring-2 ring-red-500/50 bg-red-50/50': hasEmailError }"
          :aria-invalid="hasEmailError"
          :aria-describedby="emailError ? 'email-error' : undefined"
        />
        <p
          v-if="emailError"
          id="email-error"
          class="text-sm text-red-600"
          role="alert"
        >
          {{ emailError }}
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label for="login-password" class="text-sm font-medium leading-[14px] text-[#0a0a0a]">
          Contraseña
        </label>
        <input
          id="login-password"
          v-model="localPassword"
          type="password"
          autocomplete="current-password"
          required
          placeholder="Ingresa tu contraseña"
          class="h-9 w-full rounded-lg border border-transparent bg-[#f3f3f5] px-3 py-1 text-sm leading-normal text-[#0a0a0a] outline-none transition placeholder:text-[#717182] focus:ring-2 focus:ring-[#213360]/20 disabled:opacity-70"
          :class="{ 'ring-2 ring-red-500/50 bg-red-50/50': hasPasswordError }"
          :aria-invalid="hasPasswordError"
          :aria-describedby="hasPasswordError ? 'password-error' : undefined"
        />
        <p
          v-if="passwordError"
          id="password-error"
          class="text-sm text-red-600"
          role="alert"
        >
          {{ passwordError }}
        </p>
      </div>

      <div
        v-if="submitError"
        class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        role="alert"
      >
        {{ submitError }}
      </div>

      <button
        type="submit"
        class="mt-0 h-9 w-full rounded-lg bg-[#213360] text-sm font-medium leading-5 text-white transition hover:bg-[#1a2949] focus:outline-none focus:ring-2 focus:ring-[#213360] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
        :disabled="loading"
        :aria-busy="loading"
      >
        <span v-if="!loading">Ingresar</span>
        <span
          v-else
          class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
          aria-hidden="true"
        />
      </button>
    </div>
  </form>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
  submitError: { type: String, default: '' }
})

const emit = defineEmits(['submit', 'update:email', 'update:password'])

const localEmail = ref(props.email)
const localPassword = ref(props.password)

watch(
  () => props.email,
  (v) => { localEmail.value = v }
)
watch(
  () => props.password,
  (v) => { localPassword.value = v }
)

watch(localEmail, (v) => emit('update:email', v))
watch(localPassword, (v) => emit('update:password', v))

const emailError = computed(() =>
  Array.isArray(props.errors?.email) ? props.errors.email[0] : props.errors?.email
)
const passwordError = computed(() =>
  Array.isArray(props.errors?.password) ? props.errors.password[0] : props.errors?.password
)
const hasEmailError = computed(() => !!emailError.value)
const hasPasswordError = computed(() => !!passwordError.value)

function onSubmit() {
  emit('submit', {
    email: localEmail.value,
    password: localPassword.value
  })
}
</script>
