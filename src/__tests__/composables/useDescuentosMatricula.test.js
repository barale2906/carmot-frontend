import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDescuentosMatricula } from '@/composables/useDescuentosMatricula.js'

vi.mock('@/services/matriculaService.js', () => ({
  default: { precalcularDescuentos: vi.fn() },
}))
vi.mock('@/services/programacionService.js', () => ({
  default: { getAll: vi.fn() },
}))

import matriculaService    from '@/services/matriculaService.js'
import programacionService from '@/services/programacionService.js'

beforeEach(() => vi.clearAllMocks())

describe('useDescuentosMatricula — programaciones', () => {
  it('carga las programaciones activas del curso en la sede y arma las opciones con la jornada', async () => {
    programacionService.getAll.mockResolvedValue({
      data: [{ id: 5, nombre: 'Grupo A', jornada: 2 }, { id: 6, nombre: 'Grupo B', jornada: 0 }],
    })
    const { cargarProgramaciones, programacionesOpciones } = useDescuentosMatricula()

    await cargarProgramaciones(1, 2)

    expect(programacionService.getAll).toHaveBeenCalledWith({ sede_id: 1, curso_id: 2, status: 1, per_page: 100 })
    expect(programacionesOpciones.value).toEqual([
      { value: '5', label: 'Grupo A — Noche' },
      { value: '6', label: 'Grupo B — Mañana' },
    ])
  })

  it('sin sede o curso no consulta y deja la lista vacía', async () => {
    const { cargarProgramaciones, programaciones } = useDescuentosMatricula()

    await cargarProgramaciones(1, '')

    expect(programacionService.getAll).not.toHaveBeenCalled()
    expect(programaciones.value).toEqual([])
  })

  it('si la consulta falla (p. ej. sin permiso) deja la lista vacía sin lanzar error', async () => {
    programacionService.getAll.mockRejectedValue(new Error('403'))
    const { cargarProgramaciones, programaciones, programacionesLoading } = useDescuentosMatricula()

    await cargarProgramaciones(1, 2)

    expect(programaciones.value).toEqual([])
    expect(programacionesLoading.value).toBe(false)
  })
})

describe('useDescuentosMatricula — vista previa', () => {
  const CONTEXTO = { sedeId: '1', cursoId: '2', cicloId: '3', programacionId: '4', precioId: 9, fecha: '2026-11-20' }

  it('consulta con el contexto convertido a números y guarda la vista previa', async () => {
    matriculaService.precalcularDescuentos.mockResolvedValue({ data: { total_curso: 1000000, descuentos: [] } })
    const { consultarDescuentos, preview } = useDescuentosMatricula()

    await consultarDescuentos(CONTEXTO)

    expect(matriculaService.precalcularDescuentos).toHaveBeenCalledWith({
      sede_id: 1, curso_id: 2, ciclo_id: 3, programacion_id: 4,
      lp_precio_producto_id: 9, fecha_matricula: '2026-11-20',
    }, { _silent: true })
    expect(preview.value.total_curso).toBe(1000000)
  })

  it('envía programacion_id y precio en null cuando no hay', async () => {
    matriculaService.precalcularDescuentos.mockResolvedValue({ data: {} })
    const { consultarDescuentos } = useDescuentosMatricula()

    await consultarDescuentos({ sedeId: 1, cursoId: 2, cicloId: 3 })

    const payload = matriculaService.precalcularDescuentos.mock.calls[0][0]
    expect(payload.programacion_id).toBeNull()
    expect(payload.lp_precio_producto_id).toBeNull()
    expect(payload).not.toHaveProperty('fecha_matricula')
  })

  it('sin sede, curso y ciclo no consulta y limpia la vista previa', async () => {
    matriculaService.precalcularDescuentos.mockResolvedValue({ data: { total_curso: 1 } })
    const { consultarDescuentos, preview } = useDescuentosMatricula()
    await consultarDescuentos(CONTEXTO)

    await consultarDescuentos({ sedeId: 1, cursoId: 2, cicloId: '' })

    expect(matriculaService.precalcularDescuentos).toHaveBeenCalledTimes(1)
    expect(preview.value).toBeNull()
  })

  it('si la consulta falla deja la vista previa en null y apaga el cargando', async () => {
    matriculaService.precalcularDescuentos.mockRejectedValue(new Error('500'))
    const { consultarDescuentos, preview, previewLoading } = useDescuentosMatricula()

    await consultarDescuentos(CONTEXTO)

    expect(preview.value).toBeNull()
    expect(previewLoading.value).toBe(false)
  })

  it('limpiarDescuentos borra la vista previa', async () => {
    matriculaService.precalcularDescuentos.mockResolvedValue({ data: { total_curso: 5 } })
    const { consultarDescuentos, limpiarDescuentos, preview } = useDescuentosMatricula()
    await consultarDescuentos(CONTEXTO)

    limpiarDescuentos()

    expect(preview.value).toBeNull()
  })
})
