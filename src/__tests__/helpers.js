import { createApp } from 'vue'

/**
 * Ejecuta un composable dentro de un contexto real de setup de Vue.
 * Necesario para composables que usan hooks de ciclo de vida (onMounted, onErrorCaptured, etc.).
 *
 * @param {Function} composable - El composable a ejecutar
 * @returns {[any, Function]} [resultado del composable, función unmount]
 */
export function withSetup(composable) {
  let result
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
    render() { return null },
  })
  const root = document.createElement('div')
  app.mount(root)
  return [result, () => app.unmount()]
}
