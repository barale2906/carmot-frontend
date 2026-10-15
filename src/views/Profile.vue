<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">Mi perfil</h1>
      <p class="mt-1 text-sm text-slate-500">Tus datos de acceso y el cambio de contraseña.</p>
    </header>

    <!-- Datos del usuario -->
    <section class="rounded-lg border border-black/10 bg-white p-5">
      <h2 class="text-sm font-medium text-slate-900">Datos de la cuenta</h2>
      <p v-if="cargando" class="mt-3 text-sm text-slate-500">Cargando...</p>
      <dl v-else-if="usuario" class="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-xs text-slate-500">Nombre</dt>
          <dd class="mt-0.5 text-slate-900">{{ nombreCompleto(usuario) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Documento</dt>
          <dd class="mt-0.5 text-slate-900">{{ usuario.documento || '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Correo</dt>
          <dd class="mt-0.5 break-all text-slate-900">{{ usuario.email }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">Roles</dt>
          <dd class="mt-0.5 text-slate-900">{{ roles || '—' }}</dd>
        </div>
      </dl>
    </section>

    <!-- Cambio de contraseña -->
    <section class="rounded-lg border border-black/10 bg-white p-5">
      <h2 class="text-sm font-medium text-slate-900">Cambiar contraseña</h2>
      <p class="mt-1 text-xs text-slate-500">
        Al cambiarla se cierran tus sesiones abiertas en otros equipos.
      </p>
      <form class="mt-4 grid grid-cols-1 gap-4" @submit.prevent="cambiarContrasena">
        <FormInput
          v-model="form.contrasena_actual"
          label="Contraseña actual"
          type="password"
          required
          :error="errores.contrasena_actual?.[0]"
        />
        <FormInput
          v-model="form.password"
          label="Nueva contraseña"
          type="password"
          required
          :hint="esAlumno ? 'Mínimo 6 caracteres, sin espacios.' : 'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.'"
          :error="errores.password?.[0]"
        />
        <FormInput
          v-model="form.password_confirmation"
          label="Confirmar nueva contraseña"
          type="password"
          required
        />
        <div class="flex justify-end">
          <button
            type="submit"
            class="rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            :disabled="guardando"
          >
            {{ guardando ? 'Guardando...' : 'Cambiar contraseña' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import FormInput from '@/components/forms/FormInput.vue'
import { authService } from '@/services/authService.js'
import userService from '@/services/userService.js'
import { nombreCompleto } from '@/utils/formatters.js'
import { useNotification } from '@/composables/useNotification'

/**
 * Perfil del usuario autenticado (F03): datos de la cuenta y cambio de la contraseña propia.
 */
const { success: notifySuccess } = useNotification()

const usuario  = ref(null)
const cargando = ref(true)
const guardando = ref(false)
const errores  = ref({})
const form = reactive({ contrasena_actual: '', password: '', password_confirmation: '' })

const nombresRoles = computed(() => (usuario.value?.roles ?? []).map((r) => (typeof r === 'string' ? r : r?.name)))
const roles   = computed(() => nombresRoles.value.join(', '))
const esAlumno = computed(() => nombresRoles.value.length > 0 && nombresRoles.value.every((r) => r === 'alumno'))

async function cambiarContrasena() {
  guardando.value = true
  errores.value = {}
  try {
    await userService.cambiarMiContrasena({ ...form }, { _silent: true })
    notifySuccess('Tu contraseña fue actualizada.')
    Object.assign(form, { contrasena_actual: '', password: '', password_confirmation: '' })
  } catch (e) {
    errores.value = e?.response?.data?.errors ?? { password: [e?.response?.data?.message ?? 'No se pudo cambiar la contraseña.'] }
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  try {
    usuario.value = await authService.getUser()
  } finally {
    cargando.value = false
  }
})
</script>
