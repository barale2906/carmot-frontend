import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authGuard, permissionGuard, menuItemGuard, protectedGuard, routeAccessGuard, entrarAlModulo } from '@/guards/menuGuards.js'

vi.mock('@/services/authService.js', () => ({
  authService: {
    isAuthenticated:  vi.fn(),
    hasPermission:    vi.fn(),
    esSoloEstudiante: vi.fn(),
    getUser:          vi.fn(),
  },
}))

vi.mock('@/composables/useNotification', () => ({
  notify: { error: vi.fn() },
}))

vi.mock('@/services/menuService.js', () => ({
  menuService: {
    isCached:       vi.fn(),
    getMenu:        vi.fn(),
    isRouteEnabled: vi.fn(),
    primeraRutaBajo: vi.fn(),
  },
}))

import { authService } from '@/services/authService.js'
import { menuService } from '@/services/menuService.js'
import { notify } from '@/composables/useNotification'

// Helper: crea un mock de `next` limpio en cada test
const mkNext = () => vi.fn()

describe('authGuard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama next() cuando el usuario está autenticado', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    const next = mkNext()

    await authGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('redirige a "/" cuando el usuario no está autenticado', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    const next = mkNext()

    await authGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith('/')
  })
})

// ── permissionGuard ────────────────────────────────────────────────────────

describe('permissionGuard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirige a "/" cuando no está autenticado', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    const next = mkNext()

    await permissionGuard({ meta: {}, path: '/admin' }, {}, next)

    expect(next).toHaveBeenCalledWith('/')
  })

  it('llama next() cuando no hay permiso requerido en meta', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    const next = mkNext()

    await permissionGuard({ meta: {} }, {}, next)

    expect(next).toHaveBeenCalledWith()
    expect(authService.hasPermission).not.toHaveBeenCalled()
  })

  it('llama next() cuando el usuario tiene el permiso requerido', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(true)
    const next = mkNext()

    await permissionGuard({ meta: { permission: 'ver-matriculas' }, path: '/matriculas' }, {}, next)

    expect(authService.hasPermission).toHaveBeenCalledWith('ver-matriculas')
    expect(next).toHaveBeenCalledWith()
  })

  it('redirige a /dashboard cuando el usuario no tiene el permiso', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(false)
    const next = mkNext()

    await permissionGuard({ meta: { permission: 'solo-admin' }, path: '/admin' }, {}, next)

    expect(next).toHaveBeenCalledWith('/dashboard')
  })
})

// ── menuItemGuard ──────────────────────────────────────────────────────────

describe('menuItemGuard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirige a "/" cuando no está autenticado', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    const next = mkNext()

    await menuItemGuard({ path: '/dashboard' }, {}, next)

    expect(next).toHaveBeenCalledWith('/')
  })

  it('llama next() cuando la ruta está habilitada en el menú', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    menuService.isCached.mockReturnValue(true)
    menuService.isRouteEnabled.mockReturnValue(true)
    const next = mkNext()

    await menuItemGuard({ path: '/dashboard' }, {}, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('redirige a /dashboard cuando la ruta está deshabilitada', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    menuService.isCached.mockReturnValue(true)
    menuService.isRouteEnabled.mockReturnValue(false)
    const next = mkNext()

    await menuItemGuard({ path: '/ruta-deshabilitada' }, {}, next)

    expect(next).toHaveBeenCalledWith('/dashboard')
  })

  it('carga el menú desde la API cuando no está en caché', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    menuService.isCached.mockReturnValue(false)
    menuService.getMenu.mockResolvedValue([])
    menuService.isRouteEnabled.mockReturnValue(true)
    const next = mkNext()

    await menuItemGuard({ path: '/dashboard' }, {}, next)

    expect(menuService.getMenu).toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })

  it('llama next() (permisivo) cuando ocurre un error inesperado', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    menuService.isCached.mockReturnValue(false)
    menuService.getMenu.mockRejectedValue(new Error('Error de API'))
    const next = mkNext()

    await menuItemGuard({ path: '/dashboard' }, {}, next)

    expect(next).toHaveBeenCalledWith()
  })
})

// ── protectedGuard ─────────────────────────────────────────────────────────

describe('protectedGuard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirige a "/" cuando no está autenticado', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    const next = mkNext()

    await protectedGuard({ meta: {}, path: '/cualquiera' }, {}, next)

    expect(next).toHaveBeenCalledWith('/')
  })

  it('llama next() cuando está autenticado, tiene permiso y la ruta está habilitada', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(true)
    menuService.isCached.mockReturnValue(true)
    menuService.isRouteEnabled.mockReturnValue(true)
    const next = mkNext()

    await protectedGuard({ meta: { permission: 'ver-algo' }, path: '/algo' }, {}, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('llama next() cuando no hay permiso requerido en meta y la ruta está habilitada', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    menuService.isCached.mockReturnValue(true)
    menuService.isRouteEnabled.mockReturnValue(true)
    const next = mkNext()

    await protectedGuard({ meta: {}, path: '/dashboard' }, {}, next)

    expect(authService.hasPermission).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })

  it('redirige a /dashboard cuando el usuario no tiene el permiso', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(false)
    const next = mkNext()

    await protectedGuard({ meta: { permission: 'solo-admin' }, path: '/admin' }, {}, next)

    expect(next).toHaveBeenCalledWith('/dashboard')
  })

  it('redirige a /dashboard cuando la ruta está deshabilitada en el menú', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(true)
    menuService.isCached.mockReturnValue(true)
    menuService.isRouteEnabled.mockReturnValue(false)
    const next = mkNext()

    await protectedGuard({ meta: { permission: 'ver-algo' }, path: '/deshabilitado' }, {}, next)

    expect(next).toHaveBeenCalledWith('/dashboard')
  })

  it('redirige a /dashboard cuando ocurre un error inesperado', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockRejectedValue(new Error('Inesperado'))
    const next = mkNext()

    await protectedGuard({ meta: { permission: 'ver-algo' }, path: '/algo' }, {}, next)

    expect(next).toHaveBeenCalledWith('/dashboard')
  })
})

// ── routeAccessGuard (guard global del router) ─────────────────────────────

describe('routeAccessGuard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deja pasar rutas sin permiso exigido sin consultar el perfil', async () => {
    expect(await routeAccessGuard({ meta: {}, path: '/dashboard' })).toBe(true)
    expect(authService.hasPermission).not.toHaveBeenCalled()
  })

  it('manda al login si la ruta exige permiso y no hay sesión', async () => {
    authService.isAuthenticated.mockReturnValue(false)
    expect(await routeAccessGuard({ meta: { permission: 'aca_matriculas' } })).toBe('/')
  })

  it('redirige a /dashboard cuando falta el permiso de la ruta', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(false)

    expect(await routeAccessGuard({ meta: { permission: 'fin_carteras' } })).toBe('/dashboard')
  })

  it('permite la ruta cuando tiene el permiso', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(true)

    expect(await routeAccessGuard({ meta: { permission: 'fin_carteras' } })).toBe(true)
  })

  it('niega una pantalla del personal al alumno aunque tenga el permiso de consulta', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(true)
    authService.esSoloEstudiante.mockResolvedValue(true)

    expect(await routeAccessGuard({ meta: { permission: 'aca_notas', soloPersonal: true } })).toBe('/dashboard')
  })

  it('permite la pantalla del personal a quien no es solo alumno', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.hasPermission.mockResolvedValue(true)
    authService.esSoloEstudiante.mockResolvedValue(false)

    expect(await routeAccessGuard({ meta: { permission: 'aca_notas', soloPersonal: true } })).toBe(true)
  })

  it('redirige a /dashboard con aviso de conexión si falla la consulta del perfil', async () => {
    authService.isAuthenticated.mockReturnValue(true)
    authService.getUser.mockRejectedValue({ status: 429 })

    expect(await routeAccessGuard({ meta: { permission: 'aca_notas' } })).toBe('/dashboard')
    expect(notify.error).toHaveBeenCalledWith(expect.stringContaining('No se pudo verificar'), 'Error de conexión')
  })
})

// ── entrarAlModulo (F01) ───────────────────────────────────────────────────

describe('entrarAlModulo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lleva a la primera opción del módulo en el menú', async () => {
    menuService.getMenu.mockResolvedValue([])
    menuService.primeraRutaBajo.mockReturnValue('/financiero/recibos-pago')

    expect(await entrarAlModulo({ path: '/financiero/' })).toBe('/financiero/recibos-pago')
    expect(menuService.primeraRutaBajo).toHaveBeenCalledWith('/financiero')
  })

  it('vuelve al dashboard si el usuario no tiene opciones en el módulo', async () => {
    menuService.getMenu.mockResolvedValue([])
    menuService.primeraRutaBajo.mockReturnValue(null)

    expect(await entrarAlModulo({ path: '/inventario' })).toBe('/dashboard')
  })
})
