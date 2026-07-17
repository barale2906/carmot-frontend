import { beforeEach } from 'vitest'

// Limpiar localStorage entre tests para evitar contaminación de estado
beforeEach(() => {
  localStorage.clear()
})
