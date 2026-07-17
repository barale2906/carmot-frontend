import { describe, it, expect, beforeEach, vi } from 'vitest'
import { menuService } from '@/services/menuService.js'

vi.mock('@/services/api.js', () => ({
  default: { get: vi.fn() },
}))

import api from '@/services/api.js'

const MENU_FIXTURE = [
  {
    id: '1',
    route: '/dashboard',
    permission: null,
    disabled: false,
    children: [],
  },
  {
    id: '2',
    route: '/academico',
    permission: 'ver-academico',
    disabled: false,
    children: [
      { id: '2-1', route: '/academico/matriculas', permission: 'ver-matriculas', disabled: false, children: [] },
      { id: '2-2', route: '/academico/ciclos',     permission: 'ver-ciclos',     disabled: true,  children: [] },
    ],
  },
]

describe('menuService', () => {
  beforeEach(() => {
    menuService._cachedMenu = null
    vi.clearAllMocks()
  })

  // ── getMenu ────────────────────────────────────────────────────────────────

  describe('getMenu', () => {
    it('obtiene el menú de la API y lo almacena en caché', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: MENU_FIXTURE } })

      const menu = await menuService.getMenu()

      expect(api.get).toHaveBeenCalledWith('/menu')
      expect(menu).toEqual(MENU_FIXTURE)
    })

    it('devuelve la caché sin llamar a la API en la segunda petición', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: MENU_FIXTURE } })

      await menuService.getMenu()
      await menuService.getMenu()

      expect(api.get).toHaveBeenCalledTimes(1)
    })

    it('acepta respuesta como array directo (sin wrapper success)', async () => {
      api.get.mockResolvedValue({ data: MENU_FIXTURE })

      const menu = await menuService.getMenu()
      expect(menu).toEqual(MENU_FIXTURE)
    })

    it('lanza error de autenticación en 401', async () => {
      api.get.mockRejectedValue({ response: { status: 401, data: {} } })

      await expect(menuService.getMenu()).rejects.toMatchObject({
        status: 401,
        type: 'auth_error',
      })
    })

    it('lanza error de permisos en 403', async () => {
      api.get.mockRejectedValue({ response: { status: 403, data: {} } })

      await expect(menuService.getMenu()).rejects.toMatchObject({
        status: 403,
        type: 'permission_error',
      })
    })

    it('lanza error genérico en otras fallas', async () => {
      api.get.mockRejectedValue({ response: { status: 500, data: { message: 'Error interno' } } })

      await expect(menuService.getMenu()).rejects.toMatchObject({
        type: 'api_error',
        message: 'Error interno',
      })
    })
  })

  // ── isCached / invalidateCache ─────────────────────────────────────────────

  describe('isCached / invalidateCache', () => {
    it('isCached es false al inicio', () => {
      expect(menuService.isCached()).toBe(false)
    })

    it('isCached es true después de cargar el menú', async () => {
      api.get.mockResolvedValue({ data: MENU_FIXTURE })
      await menuService.getMenu()
      expect(menuService.isCached()).toBe(true)
    })

    it('isCached vuelve a false tras invalidateCache', async () => {
      api.get.mockResolvedValue({ data: MENU_FIXTURE })
      await menuService.getMenu()
      menuService.invalidateCache()
      expect(menuService.isCached()).toBe(false)
    })

    it('invalidateCache fuerza una nueva petición a la API', async () => {
      api.get.mockResolvedValue({ data: MENU_FIXTURE })
      await menuService.getMenu()
      menuService.invalidateCache()
      await menuService.getMenu()
      expect(api.get).toHaveBeenCalledTimes(2)
    })
  })

  // ── filterByPermissions ────────────────────────────────────────────────────

  describe('filterByPermissions', () => {
    it('incluye items sin permiso requerido', () => {
      const items = [{ id: '1', permission: null, children: [] }]
      expect(menuService.filterByPermissions(items, [])).toHaveLength(1)
    })

    it('excluye items cuyo permiso no posee el usuario', () => {
      const items = [
        { id: '1', permission: 'ver-matriculas', children: [] },
        { id: '2', permission: 'ver-ciclos',     children: [] },
      ]
      const result = menuService.filterByPermissions(items, ['ver-matriculas'])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('filtra hijos de forma recursiva', () => {
      const items = [
        {
          id: '1',
          permission: null,
          children: [
            { id: '1-1', permission: 'ver-matriculas', children: [] },
            { id: '1-2', permission: 'ver-ciclos',     children: [] },
          ],
        },
      ]
      const result = menuService.filterByPermissions(items, ['ver-matriculas'])
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].id).toBe('1-1')
    })

    it('retorna array vacío para entrada no-array', () => {
      expect(menuService.filterByPermissions(null, [])).toEqual([])
      expect(menuService.filterByPermissions(undefined, [])).toEqual([])
    })
  })

  // ── getMenuItemById ────────────────────────────────────────────────────────

  describe('getMenuItemById', () => {
    it('encuentra un item de nivel raíz', () => {
      expect(menuService.getMenuItemById('1', MENU_FIXTURE)).toMatchObject({ id: '1', route: '/dashboard' })
    })

    it('encuentra un item anidado en children', () => {
      expect(menuService.getMenuItemById('2-1', MENU_FIXTURE)).toMatchObject({ id: '2-1' })
    })

    it('retorna null cuando el item no existe', () => {
      expect(menuService.getMenuItemById('999', MENU_FIXTURE)).toBeNull()
    })

    it('usa la caché interna cuando no se pasa array', () => {
      menuService._cachedMenu = MENU_FIXTURE
      expect(menuService.getMenuItemById('2-2')).toMatchObject({ id: '2-2' })
    })

    it('retorna null cuando no hay caché ni array', () => {
      expect(menuService.getMenuItemById('1')).toBeNull()
    })
  })

  // ── isRouteEnabled ─────────────────────────────────────────────────────────

  describe('isRouteEnabled', () => {
    beforeEach(() => {
      menuService._cachedMenu = MENU_FIXTURE
    })

    it('retorna true para una ruta habilitada', () => {
      expect(menuService.isRouteEnabled('/dashboard')).toBe(true)
    })

    it('retorna false para una ruta deshabilitada (disabled: true)', () => {
      expect(menuService.isRouteEnabled('/academico/ciclos')).toBe(false)
    })

    it('retorna true para una ruta no presente en el menú (comportamiento permisivo)', () => {
      expect(menuService.isRouteEnabled('/ruta-desconocida')).toBe(true)
    })

    it('retorna true cuando la caché está vacía', () => {
      menuService._cachedMenu = null
      expect(menuService.isRouteEnabled('/cualquier-ruta')).toBe(true)
    })
  })
})
