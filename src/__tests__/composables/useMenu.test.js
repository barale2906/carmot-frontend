import { describe, it, expect, beforeEach } from 'vitest'
import { useMenuError, useMenuNavigation, useMenuSync } from '@/composables/useMenu.js'
import { withSetup } from '../helpers.js'

// ── useMenuNavigation ──────────────────────────────────────────────────────

describe('useMenuNavigation', () => {
  describe('canNavigate', () => {
    it('retorna true cuando la ruta es válida y no hay falla de permisos', async () => {
      const { canNavigate } = useMenuNavigation()
      expect(await canNavigate('/dashboard', true)).toBe(true)
    })

    it('retorna false cuando route es null', async () => {
      const { canNavigate } = useMenuNavigation()
      expect(await canNavigate(null)).toBe(false)
    })

    it('retorna false cuando hasPermission es explícitamente false', async () => {
      const { canNavigate } = useMenuNavigation()
      expect(await canNavigate('/dashboard', false)).toBe(false)
    })

    it('retorna true cuando hasPermission no se pasa (undefined)', async () => {
      const { canNavigate } = useMenuNavigation()
      // hasPermission === undefined → no es false → permite
      expect(await canNavigate('/dashboard')).toBe(true)
    })
  })
})

// ── useMenuSync ────────────────────────────────────────────────────────────

describe('useMenuSync', () => {
  // localStorage se limpia en setup.js antes de cada test

  it('guarda y recupera el menú de localStorage', () => {
    const { saveMenuToStorage, getMenuFromStorage } = useMenuSync()
    const menu = [{ id: '1', route: '/dashboard' }]

    saveMenuToStorage(menu)
    expect(getMenuFromStorage()).toEqual(menu)
  })

  it('isMenuCacheValid retorna true justo después de guardar', () => {
    const { saveMenuToStorage, isMenuCacheValid } = useMenuSync()
    saveMenuToStorage([{ id: '1' }])
    expect(isMenuCacheValid()).toBe(true)
  })

  it('isMenuCacheValid retorna false cuando no hay timestamp', () => {
    const { isMenuCacheValid } = useMenuSync()
    expect(isMenuCacheValid()).toBe(false)
  })

  it('getMenuFromStorage retorna null cuando no hay datos', () => {
    const { getMenuFromStorage } = useMenuSync()
    expect(getMenuFromStorage()).toBeNull()
  })

  it('clearMenuCache elimina el menú almacenado', () => {
    const { saveMenuToStorage, clearMenuCache, getMenuFromStorage } = useMenuSync()
    saveMenuToStorage([{ id: '1' }])
    clearMenuCache()
    expect(getMenuFromStorage()).toBeNull()
  })

  it('getMenuFromStorage retorna null cuando la caché está expirada (>5 min)', () => {
    const { saveMenuToStorage, getMenuFromStorage } = useMenuSync()
    saveMenuToStorage([{ id: '1' }])

    // Simular que el timestamp tiene más de 5 minutos de antigüedad
    const hace6Min = Date.now() - 6 * 60 * 1000
    localStorage.setItem('carmot_menu_timestamp', hace6Min.toString())

    expect(getMenuFromStorage()).toBeNull()
  })

  it('getMenuFromStorage retorna los datos cuando la caché aún es válida (<5 min)', () => {
    const { saveMenuToStorage, getMenuFromStorage } = useMenuSync()
    const menu = [{ id: '2', route: '/academico' }]
    saveMenuToStorage(menu)

    // Simular que el timestamp tiene 1 minuto de antigüedad
    const hace1Min = Date.now() - 60 * 1000
    localStorage.setItem('carmot_menu_timestamp', hace1Min.toString())

    expect(getMenuFromStorage()).toEqual(menu)
  })
})

// ── useMenuError ───────────────────────────────────────────────────────────
// Se ejecuta con withSetup porque onErrorCaptured requiere contexto de componente

describe('useMenuError', () => {
  it('setError con string asigna el mensaje y activa isMenuError', () => {
    const [{ menuError, isMenuError, setError }, unmount] = withSetup(() => useMenuError())

    setError('No se pudo cargar el menú')

    expect(isMenuError.value).toBe(true)
    expect(menuError.value).toBe('No se pudo cargar el menú')

    unmount()
  })

  it('setError con objeto Error usa la propiedad .message', () => {
    const [{ menuError, setError }, unmount] = withSetup(() => useMenuError())

    setError(new Error('Falla de conexión'))

    expect(menuError.value).toBe('Falla de conexión')
    unmount()
  })

  it('setError con valor desconocido usa mensaje por defecto', () => {
    const [{ menuError, setError }, unmount] = withSetup(() => useMenuError())

    setError(42)

    expect(menuError.value).toBe('Error desconocido al cargar el menú')
    unmount()
  })

  it('clearError reinicia el estado de error', () => {
    const [{ menuError, isMenuError, setError, clearError }, unmount] = withSetup(() => useMenuError())

    setError('Algo falló')
    clearError()

    expect(isMenuError.value).toBe(false)
    expect(menuError.value).toBeNull()
    unmount()
  })
})
