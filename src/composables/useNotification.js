import { reactive } from 'vue'

// ── Estado singleton a nivel de módulo ─────────────────────────────────────
// Al vivir fuera de la función, todas las instancias comparten el mismo array.
// No se necesita Pinia ni Vuex para este patrón.
const notifications = reactive([])
let _counter = 0

function _add(type, title, message, duration = 5000) {
  const id = ++_counter
  notifications.push({ id, type, title, message, duration })
  if (duration > 0) {
    setTimeout(() => _remove(id), duration)
  }
  return id
}

function _remove(id) {
  const i = notifications.findIndex((n) => n.id === id)
  if (i > -1) notifications.splice(i, 1)
}

// ── Composable público ─────────────────────────────────────────────────────
export function useNotification() {
  return {
    /** Lista reactiva de notificaciones activas (solo lectura en consumidores) */
    notifications,

    /** Operación exitosa */
    success(message, title = 'Éxito') {
      return _add('success', title, message)
    },

    /** Error de operación o del servidor */
    error(message, title = 'Error') {
      return _add('error', title, message)
    },

    /** Advertencia / acción con consecuencias */
    warning(message, title = 'Advertencia') {
      return _add('warning', title, message)
    },

    /** Información general */
    info(message, title = 'Información') {
      return _add('info', title, message)
    },

    /** Cerrar una notificación específica por id */
    dismiss: _remove,

    /**
     * API genérica para casos especiales.
     * @param {{ type, title, message, duration }} opts
     */
    notify({ type = 'info', title, message, duration } = {}) {
      return _add(type, title, message, duration)
    },
  }
}

// ── Re-exportación directa para uso fuera de componentes (ej. api.js) ──────
export const notify = {
  success: (message, title) => _add('success', title ?? 'Éxito', message),
  error:   (message, title) => _add('error',   title ?? 'Error', message),
  warning: (message, title) => _add('warning', title ?? 'Advertencia', message),
  info:    (message, title) => _add('info',    title ?? 'Información', message),
  dismiss: _remove,
}
