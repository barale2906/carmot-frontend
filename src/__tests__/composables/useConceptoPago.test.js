import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useConceptoPagoTipos, useConceptoPagoSelector } from '@/composables/useConceptoPago.js'

vi.mock('@/services/conceptoPagoService.js', () => ({
  default: {
    getTipos: vi.fn(),
    getAll:   vi.fn(),
  },
}))

import conceptoPagoService from '@/services/conceptoPagoService.js'

describe('useConceptoPagoTipos', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── tiposOptions ───────────────────────────────────────────────────────────

  it('tiposOptions es vacío antes de loadTipos', () => {
    const { tiposOptions } = useConceptoPagoTipos()
    expect(tiposOptions.value).toEqual([])
  })

  it('tiposOptions mapea el objeto raw a pares { value, label }', async () => {
    conceptoPagoService.getTipos.mockResolvedValue({
      data: { 1: 'Pensión', 2: 'Matrícula', 3: 'Material' },
    })

    const { tiposOptions, loadTipos } = useConceptoPagoTipos()
    await loadTipos()

    expect(tiposOptions.value).toEqual([
      { value: 1, label: 'Pensión' },
      { value: 2, label: 'Matrícula' },
      { value: 3, label: 'Material' },
    ])
  })

  // ── tiposFilterOptions ─────────────────────────────────────────────────────

  it('tiposFilterOptions antepone la opción "Todos los tipos"', async () => {
    conceptoPagoService.getTipos.mockResolvedValue({
      data: { 1: 'Pensión' },
    })

    const { tiposFilterOptions, loadTipos } = useConceptoPagoTipos()
    await loadTipos()

    expect(tiposFilterOptions.value[0]).toEqual({ value: '', label: 'Todos los tipos' })
    expect(tiposFilterOptions.value).toHaveLength(2)
  })

  // ── loadTipos: estados de carga y error ────────────────────────────────────

  it('tiposLoading es true durante la carga y false al terminar', async () => {
    let resolvePromise
    conceptoPagoService.getTipos.mockReturnValue(
      new Promise(res => { resolvePromise = res })
    )

    const { tiposLoading, loadTipos } = useConceptoPagoTipos()
    const loadPromise = loadTipos()

    expect(tiposLoading.value).toBe(true)

    resolvePromise({ data: {} })
    await loadPromise

    expect(tiposLoading.value).toBe(false)
  })

  it('asigna tiposError cuando la API falla', async () => {
    conceptoPagoService.getTipos.mockRejectedValue(new Error('API caída'))

    const { tiposError, loadTipos } = useConceptoPagoTipos()
    await loadTipos()

    expect(tiposError.value).toBe('No se pudieron cargar los tipos de concepto.')
  })

  it('limpia tiposError en una segunda carga exitosa', async () => {
    conceptoPagoService.getTipos
      .mockRejectedValueOnce(new Error('primer error'))
      .mockResolvedValueOnce({ data: { 1: 'Pensión' } })

    const { tiposError, loadTipos } = useConceptoPagoTipos()
    await loadTipos()
    expect(tiposError.value).toBeTruthy()

    await loadTipos()
    expect(tiposError.value).toBe('')
  })

  // ── getTipoNombre ──────────────────────────────────────────────────────────

  it('getTipoNombre retorna el nombre para un índice existente', async () => {
    conceptoPagoService.getTipos.mockResolvedValue({
      data: { 1: 'Pensión', 2: 'Matrícula' },
    })

    const { getTipoNombre, loadTipos } = useConceptoPagoTipos()
    await loadTipos()

    expect(getTipoNombre(1)).toBe('Pensión')
    expect(getTipoNombre(2)).toBe('Matrícula')
  })

  it('getTipoNombre retorna "—" para un índice inexistente', async () => {
    conceptoPagoService.getTipos.mockResolvedValue({ data: {} })

    const { getTipoNombre, loadTipos } = useConceptoPagoTipos()
    await loadTipos()

    expect(getTipoNombre(99)).toBe('—')
  })
})

// ── useConceptoPagoSelector ────────────────────────────────────────────────

describe('useConceptoPagoSelector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('conceptosOptions es vacío antes de loadConceptos', () => {
    const { conceptosOptions } = useConceptoPagoSelector()
    expect(conceptosOptions.value).toEqual([])
  })

  it('conceptosOptions mapea conceptos a { value, label, _concepto }', async () => {
    const conceptos = [
      { id: 1, nombre: 'Pensión mensual' },
      { id: 2, nombre: 'Matrícula anual' },
    ]
    conceptoPagoService.getAll.mockResolvedValue({ data: conceptos })

    const { conceptosOptions, loadConceptos } = useConceptoPagoSelector()
    await loadConceptos()

    expect(conceptosOptions.value).toEqual([
      { value: 1, label: 'Pensión mensual',  _concepto: conceptos[0] },
      { value: 2, label: 'Matrícula anual', _concepto: conceptos[1] },
    ])
  })

  it('llama a getAll con los parámetros correctos de orden y paginación', async () => {
    conceptoPagoService.getAll.mockResolvedValue({ data: [] })

    const { loadConceptos } = useConceptoPagoSelector()
    await loadConceptos()

    expect(conceptoPagoService.getAll).toHaveBeenCalledWith({
      sort_by:        'nombre',
      sort_direction: 'asc',
      per_page:       100,
    })
  })

  it('resetea conceptos a array vacío cuando la API falla', async () => {
    conceptoPagoService.getAll.mockRejectedValue(new Error('Error'))

    const { conceptos, loadConceptos } = useConceptoPagoSelector()
    await loadConceptos()

    expect(conceptos.value).toEqual([])
  })

  it('conceptosLoading es true durante la carga y false al terminar', async () => {
    let resolvePromise
    conceptoPagoService.getAll.mockReturnValue(
      new Promise(res => { resolvePromise = res })
    )

    const { conceptosLoading, loadConceptos } = useConceptoPagoSelector()
    const loadPromise = loadConceptos()

    expect(conceptosLoading.value).toBe(true)

    resolvePromise({ data: [] })
    await loadPromise

    expect(conceptosLoading.value).toBe(false)
  })
})
