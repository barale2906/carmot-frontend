<template>
  <main
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgba(33,51,96,0.86)_0%,rgba(74,111,165,0.86)_100%)] px-5 py-8 sm:px-6"
    role="main"
  >
    <div class="relative z-10 flex w-full max-w-[448px] flex-col items-center gap-8">
      <section
        class="flex flex-col items-center gap-5 text-center text-white"
        aria-label="Marca CARMOT"
      >
        <Logo size="xlarge" variant="light" alt="CARMOT - Centro de Capacitaciones" class="shrink-0" />
        <!-- <p class="text-xl font-bold tracking-wide sm:text-2xl">
          CARMOT
        </p>
        <p class="tracking-widest opacity-90 text-lg sm:text-xl">
          Centro de Capacitaciones
        </p> -->
      </section>

      <article
        class="w-full rounded-[14px] border border-black/10 bg-white px-6 py-6 shadow-sm sm:px-8"
        aria-label="Formulario de inicio de sesión"
      >
        <LoginForm
          v-model:email="formData.email"
          v-model:password="formData.password"
          :loading="loading"
          :errors="errors"
          :submit-error="errorMessage"
          @submit="handleLogin"
        />
      </article>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '@/components/Logo.vue'
import LoginForm from '@/components/login/LoginForm.vue'
import { authService } from '@/services/authService'

const router = useRouter()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const errors = ref({})
const errorMessage = ref('')

async function handleLogin({ email, password }) {
  if (loading.value) return

  errors.value = {}
  errorMessage.value = ''
  loading.value = true

  try {
    await authService.login(email, password)
    router.push('/dashboard')
  } catch (err) {
    if (err?.errors) {
      errors.value = err.errors
    } else {
      errorMessage.value = err?.message ?? 'Error al iniciar sesión. Verifica tus credenciales.'
    }
  } finally {
    loading.value = false
  }
}
</script>
