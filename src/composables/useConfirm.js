import { reactive } from 'vue'

/**
 * Composable singleton para diálogos de confirmación programáticos.
 * Reemplaza el `window.confirm()` nativo con un modal del sistema.
 *
 * Uso: `if (!await confirm('¿Eliminar este registro?')) return`
 * Opciones: `{ title, confirmLabel, cancelLabel, danger }`
 */
const state = reactive({
  visible:      false,
  message:      '',
  title:        'Confirmar acción',
  confirmLabel: 'Aceptar',
  cancelLabel:  'Cancelar',
  danger:       false,
  resolve:      null,
})

export function useConfirm() {
  function confirm(message, options = {}) {
    state.message      = message
    state.title        = options.title        ?? 'Confirmar acción'
    state.confirmLabel = options.confirmLabel ?? 'Aceptar'
    state.cancelLabel  = options.cancelLabel  ?? 'Cancelar'
    state.danger       = options.danger       ?? true
    state.visible      = true
    return new Promise((resolve) => { state.resolve = resolve })
  }

  function accept() {
    state.visible = false
    state.resolve?.(true)
  }

  function cancel() {
    state.visible = false
    state.resolve?.(false)
  }

  return { state, confirm, accept, cancel }
}
