import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePermisos }          from '@/composables/usePermisos.js'
import { useDocTiposDocumento } from '@/composables/useDocTiposDocumento.js'

vi.mock('@/services/authService.js', () => ({
  authService: { getUserPermissions: vi.fn() },
}))
vi.mock('@/services/docTipoDocumentoService.js', () => ({
  default: { getAll: vi.fn() },
}))

import { authService }         from '@/services/authService.js'
import docTipoDocumentoService from '@/services/docTipoDocumentoService.js'

beforeEach(() => vi.clearAllMocks())

describe('usePermisos', () => {
  it('can() responde según los permisos cargados', async () => {
    authService.getUserPermissions.mockResolvedValue(['aca_documentos', 'aca_documentoGenerar'])
    const { can, loadPermisos } = usePermisos()

    expect(can('aca_documentos')).toBe(false)
    await loadPermisos()
    expect(can('aca_documentos')).toBe(true)
    expect(can('aca_documentoAnular')).toBe(false)
  })
})

describe('useDocTiposDocumento', () => {
  const TIPOS = [
    { id: 1, nombre: 'Contrato', prefijo_numero: 'CONT' },
    { id: 2, nombre: 'Certificado', prefijo_numero: 'CERT' },
  ]

  it('carga los tipos y arma opciones con value string', async () => {
    docTipoDocumentoService.getAll.mockResolvedValue({ data: TIPOS })
    const { tiposOptions, tipoPorId, loadTipos } = useDocTiposDocumento()
    await loadTipos()

    expect(docTipoDocumentoService.getAll).toHaveBeenCalledWith({ per_page: 100, sort_by: 'nombre', sort_direction: 'asc' })
    expect(tiposOptions.value).toEqual([
      { value: '1', label: 'Contrato (CONT)' },
      { value: '2', label: 'Certificado (CERT)' },
    ])
    expect(tipoPorId('2').nombre).toBe('Certificado')
    expect(tipoPorId(9)).toBeNull()
  })

  it('soloActivos filtra por status 1', async () => {
    docTipoDocumentoService.getAll.mockResolvedValue({ data: [] })
    await useDocTiposDocumento({ soloActivos: true }).loadTipos()
    expect(docTipoDocumentoService.getAll).toHaveBeenCalledWith(expect.objectContaining({ status: 1 }))
  })

  it('un error deja la lista vacía', async () => {
    docTipoDocumentoService.getAll.mockRejectedValue(new Error('500'))
    const { tipos, cargandoTipos, loadTipos } = useDocTiposDocumento()
    await loadTipos()
    expect(tipos.value).toEqual([])
    expect(cargandoTipos.value).toBe(false)
  })
})
