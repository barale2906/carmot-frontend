import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from '@/services/authService.js'

vi.mock('@/services/api.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

import api from '@/services/api.js'

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    authService.clearUserCache()
  })

  // ── getUser (caché) ────────────────────────────────────────────────────────

  describe('getUser', () => {
    it('pide /user una sola vez aunque se llame varias veces a la par', async () => {
      api.get.mockResolvedValue({ data: { id: 1, roles: [] } })

      await Promise.all([authService.getUser(), authService.getUser(), authService.getUserPermissions()])

      expect(api.get).toHaveBeenCalledTimes(1)
    })

    it('no deja en caché un fallo: el siguiente llamado reintenta', async () => {
      api.get.mockRejectedValueOnce({ response: { status: 429 } })
      api.get.mockResolvedValueOnce({ data: { id: 1 } })

      await expect(authService.getUser()).rejects.toMatchObject({ status: 429 })
      expect(await authService.getUser()).toEqual({ id: 1 })
    })

    it('vuelve a pedir el perfil después de iniciar sesión', async () => {
      api.get.mockResolvedValue({ data: { id: 1 } })
      api.post.mockResolvedValue({ data: { access_token: 't' } })

      await authService.getUser()
      await authService.login('a@b.co', 'x')
      await authService.getUser()

      expect(api.get).toHaveBeenCalledTimes(2)
    })
  })

  // ── esSoloProfesor ─────────────────────────────────────────────────────────

  describe('esSoloProfesor', () => {
    it('es verdadero con solo el rol profesor', async () => {
      api.get.mockResolvedValue({ data: { roles: ['profesor'] } })
      expect(await authService.esSoloProfesor()).toBe(true)
    })

    it('es falso si además tiene un rol del personal', async () => {
      api.get.mockResolvedValue({ data: { roles: ['profesor', 'coordinador'] } })
      expect(await authService.esSoloProfesor()).toBe(false)
    })
  })

  // ── esSoloEstudiante ───────────────────────────────────────────────────────

  describe('esSoloEstudiante', () => {
    it('es verdadero cuando el único rol es alumno', async () => {
      api.get.mockResolvedValue({ data: { roles: ['alumno'] } })
      expect(await authService.esSoloEstudiante()).toBe(true)
    })

    it('es falso si además tiene un rol del personal', async () => {
      api.get.mockResolvedValue({ data: { roles: ['alumno', 'profesor'] } })
      expect(await authService.esSoloEstudiante()).toBe(false)
    })

    it('es falso si no tiene roles', async () => {
      api.get.mockResolvedValue({ data: { roles: [] } })
      expect(await authService.esSoloEstudiante()).toBe(false)
    })
  })

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('guarda el token en localStorage al iniciar sesión con éxito', async () => {
      api.post.mockResolvedValue({
        data: { access_token: 'token-abc', token_type: 'Bearer' },
      })

      const result = await authService.login('user@test.com', 'pass123')

      expect(api.post).toHaveBeenCalledWith('/login', {
        email: 'user@test.com',
        password: 'pass123',
      })
      expect(localStorage.getItem('access_token')).toBe('token-abc')
      expect(localStorage.getItem('token_type')).toBe('Bearer')
      expect(result.access_token).toBe('token-abc')
    })

    it('usa "Bearer" por defecto si el backend no devuelve token_type', async () => {
      api.post.mockResolvedValue({
        data: { access_token: 'mi-token' },
      })

      await authService.login('a@b.com', '1234')
      expect(localStorage.getItem('token_type')).toBe('Bearer')
    })

    it('lanza error de validación en respuesta 422', async () => {
      api.post.mockRejectedValue({
        response: {
          status: 422,
          data: { errors: { email: ['El email no es válido'] } },
        },
      })

      await expect(authService.login('bad', 'pass')).rejects.toMatchObject({
        message: 'Error de validación',
        errors: { email: ['El email no es válido'] },
      })
    })

    it('lanza error genérico en otras fallas', async () => {
      api.post.mockRejectedValue({
        response: { status: 500, data: { message: 'Error interno' } },
      })

      await expect(authService.login('a@b.com', 'pass')).rejects.toMatchObject({
        message: 'Error interno',
        status: 500,
      })
    })

    it('usa mensaje por defecto cuando el backend no envía message', async () => {
      api.post.mockRejectedValue({
        response: { status: 503, data: {} },
      })

      await expect(authService.login('a@b.com', 'pass')).rejects.toMatchObject({
        message: 'Error al iniciar sesión',
      })
    })
  })

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('elimina los tokens de localStorage al cerrar sesión', async () => {
      localStorage.setItem('access_token', 'token-abc')
      localStorage.setItem('token_type', 'Bearer')
      api.post.mockResolvedValue({})

      await authService.logout()

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('token_type')).toBeNull()
    })

    it('elimina los tokens incluso cuando la API falla', async () => {
      localStorage.setItem('access_token', 'token-abc')
      api.post.mockRejectedValue(new Error('Sin conexión'))

      await expect(authService.logout()).rejects.toThrow()
      expect(localStorage.getItem('access_token')).toBeNull()
    })
  })

  // ── isAuthenticated / getToken ─────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('retorna true cuando hay token almacenado', () => {
      localStorage.setItem('access_token', 'token-abc')
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('retorna false cuando no hay token', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('getToken', () => {
    it('retorna el token almacenado', () => {
      localStorage.setItem('access_token', 'mi-token')
      expect(authService.getToken()).toBe('mi-token')
    })

    it('retorna null cuando no hay token', () => {
      expect(authService.getToken()).toBeNull()
    })
  })

  // ── getUserPermissions ─────────────────────────────────────────────────────

  describe('getUserPermissions', () => {
    it('extrae permisos de user.permissions (array de strings)', async () => {
      api.get.mockResolvedValue({
        data: { permissions: ['ver-matriculas', 'crear-matriculas'] },
      })

      expect(await authService.getUserPermissions()).toEqual([
        'ver-matriculas',
        'crear-matriculas',
      ])
    })

    it('extrae permisos de user.permissions (array de objetos {name})', async () => {
      api.get.mockResolvedValue({
        data: {
          permissions: [{ name: 'ver-matriculas' }, { name: 'editar-matriculas' }],
        },
      })

      expect(await authService.getUserPermissions()).toEqual([
        'ver-matriculas',
        'editar-matriculas',
      ])
    })

    it('extrae permisos desde user.roles cuando no hay permissions directos', async () => {
      api.get.mockResolvedValue({
        data: {
          roles: [{ name: 'admin', permissions: ['ver-todo', 'editar-todo'] }],
        },
      })

      expect(await authService.getUserPermissions()).toEqual(['ver-todo', 'editar-todo'])
    })

    it('retorna array vacío si la API falla', async () => {
      api.get.mockRejectedValue(new Error('Error de red'))
      expect(await authService.getUserPermissions()).toEqual([])
    })

    it('filtra permisos vacíos o nulos', async () => {
      api.get.mockResolvedValue({
        data: { permissions: ['ver-matriculas', null, '', { name: '' }] },
      })

      const result = await authService.getUserPermissions()
      expect(result).toEqual(['ver-matriculas'])
    })
  })

  // ── hasPermission ──────────────────────────────────────────────────────────

  describe('hasPermission', () => {
    it('retorna true cuando el usuario tiene el permiso', async () => {
      api.get.mockResolvedValue({ data: { permissions: ['ver-matriculas'] } })
      expect(await authService.hasPermission('ver-matriculas')).toBe(true)
    })

    it('retorna false cuando el usuario no tiene el permiso', async () => {
      api.get.mockResolvedValue({ data: { permissions: ['ver-matriculas'] } })
      expect(await authService.hasPermission('eliminar-todo')).toBe(false)
    })

    it('acepta array: retorna true si tiene AL MENOS uno', async () => {
      api.get.mockResolvedValue({ data: { permissions: ['ver-matriculas'] } })
      expect(await authService.hasPermission(['ver-matriculas', 'admin-total'])).toBe(true)
    })

    it('acepta array: retorna false si no tiene ninguno', async () => {
      api.get.mockResolvedValue({ data: { permissions: ['ver-matriculas'] } })
      expect(await authService.hasPermission(['crear-usuarios', 'admin-total'])).toBe(false)
    })
  })

  // ── hasAllPermissions ──────────────────────────────────────────────────────

  describe('hasAllPermissions', () => {
    it('retorna true cuando tiene todos los permisos requeridos', async () => {
      api.get.mockResolvedValue({
        data: { permissions: ['ver-matriculas', 'editar-matriculas'] },
      })
      expect(await authService.hasAllPermissions(['ver-matriculas', 'editar-matriculas'])).toBe(true)
    })

    it('retorna false cuando falta algún permiso', async () => {
      api.get.mockResolvedValue({ data: { permissions: ['ver-matriculas'] } })
      expect(await authService.hasAllPermissions(['ver-matriculas', 'editar-matriculas'])).toBe(false)
    })
  })

  // ── getUserRole ────────────────────────────────────────────────────────────

  describe('getUserRole', () => {
    it('retorna user.role cuando está presente', async () => {
      api.get.mockResolvedValue({ data: { role: 'comercial' } })
      expect(await authService.getUserRole()).toBe('comercial')
    })

    it('retorna el nombre del primer rol de user.roles', async () => {
      api.get.mockResolvedValue({
        data: { roles: [{ name: 'coordinador' }, { name: 'docente' }] },
      })
      expect(await authService.getUserRole()).toBe('coordinador')
    })

    it('retorna null si la API falla', async () => {
      api.get.mockRejectedValue(new Error('error'))
      expect(await authService.getUserRole()).toBeNull()
    })
  })

  // ── isAdmin ────────────────────────────────────────────────────────────────

  describe('isAdmin', () => {
    it('retorna true para rol "admin"', async () => {
      api.get.mockResolvedValue({ data: { role: 'admin' } })
      expect(await authService.isAdmin()).toBe(true)
    })

    it('retorna true para rol "Administrador" (case-insensitive)', async () => {
      api.get.mockResolvedValue({ data: { role: 'Administrador' } })
      expect(await authService.isAdmin()).toBe(true)
    })

    it('retorna false para otros roles', async () => {
      api.get.mockResolvedValue({ data: { role: 'comercial' } })
      expect(await authService.isAdmin()).toBe(false)
    })

    it('retorna false si no hay rol', async () => {
      api.get.mockRejectedValue(new Error('error'))
      expect(await authService.isAdmin()).toBe(false)
    })
  })
})
