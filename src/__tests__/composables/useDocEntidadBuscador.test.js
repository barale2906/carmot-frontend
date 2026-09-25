import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDocEntidadBuscador } from '@/composables/useDocEntidadBuscador.js'

vi.mock('@/services/matriculaService.js', () => ({ default: { getAll: vi.fn() } }))
vi.mock('@/services/carteraService.js',   () => ({ default: { getDetalleMatricula: vi.fn() } }))
vi.mock('@/services/userService.js',      () => ({ default: { getAll: vi.fn() } }))
vi.mock('@/services/cursoService.js',     () => ({ default: { getAll: vi.fn() } }))

import matriculaService from '@/services/matriculaService.js'
import carteraService   from '@/services/carteraService.js'
import userService      from '@/services/userService.js'
import cursoService     from '@/services/cursoService.js'

const MATRICULA = 'App\\Models\\Academico\\Matricula'
const CARTERA   = 'App\\Models\\Financiero\\Cartera\\Cartera'

/** Escribe un término y deja correr el debounce y las promesas. */
async function escribir(buscador, texto) {
  buscador.termino.value = texto
  await nextTick()
  await vi.runAllTimersAsync()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('useDocEntidadBuscador', () => {
  it('busca matrículas con debounce y mapea título y detalle', async () => {
    matriculaService.getAll.mockResolvedValue({
      data: [{ id: 345, estudiante: { name: 'Juan Pérez' }, curso: { nombre: 'Auxiliar de enfermería' }, fecha_matricula: '2024-06-15' }],
    })
    const buscador = useDocEntidadBuscador(ref(MATRICULA))

    await escribir(buscador, 'juan')

    expect(matriculaService.getAll).toHaveBeenCalledTimes(1)
    expect(matriculaService.getAll).toHaveBeenCalledWith({ search: 'juan', per_page: 10 })
    expect(buscador.resultados.value).toEqual([
      { id: 345, titulo: 'Juan Pérez', detalle: 'Auxiliar de enfermería · Matriculado el 2024-06-15' },
    ])
    expect(buscador.buscando.value).toBe(false)
  })

  it('no consulta con menos de 2 caracteres', async () => {
    const buscador = useDocEntidadBuscador(ref(MATRICULA))
    await escribir(buscador, 'j')
    expect(matriculaService.getAll).not.toHaveBeenCalled()
    expect(buscador.resultados.value).toEqual([])
  })

  it('agrupa pulsaciones rápidas en una sola consulta', async () => {
    matriculaService.getAll.mockResolvedValue({ data: [] })
    const buscador = useDocEntidadBuscador(ref(MATRICULA))
    buscador.termino.value = 'ju'
    await nextTick()
    buscador.termino.value = 'jua'
    await nextTick()
    await vi.runAllTimersAsync()
    expect(matriculaService.getAll).toHaveBeenCalledTimes(1)
    expect(matriculaService.getAll).toHaveBeenCalledWith({ search: 'jua', per_page: 10 })
  })

  it('elegir fija el registro seleccionado', async () => {
    matriculaService.getAll.mockResolvedValue({ data: [{ id: 1, estudiante: { name: 'Ana' } }] })
    const buscador = useDocEntidadBuscador(ref(MATRICULA))
    await escribir(buscador, 'ana')
    await buscador.elegir(buscador.resultados.value[0])
    expect(buscador.seleccionado.value.id).toBe(1)
    expect(buscador.resultados.value).toEqual([])
  })

  it('cuota de cartera: primero la matrícula, luego sus cuotas pendientes', async () => {
    matriculaService.getAll.mockResolvedValue({ data: [{ id: 345, estudiante: { name: 'Juan' } }] })
    carteraService.getDetalleMatricula.mockResolvedValue({
      data: {
        vencidas: [{ id: 90, numero_cuota: 0, fecha_vencimiento: '2026-08-01', saldo: 100000, status_text: 'Activa' }],
        proximas: [{ id: 91, numero_cuota: 1, fecha_vencimiento: '2026-10-01', saldo: 250000, status_text: 'Activa' }],
      },
    })
    const buscador = useDocEntidadBuscador(ref(CARTERA))
    expect(buscador.enDosPasos.value).toBe(true)

    await escribir(buscador, 'juan')
    await buscador.elegir(buscador.resultados.value[0])

    expect(carteraService.getDetalleMatricula).toHaveBeenCalledWith({ matricula_id: 345 })
    expect(buscador.padre.value.id).toBe(345)
    expect(buscador.seleccionado.value).toBeNull()
    expect(buscador.resultados.value.map((c) => c.titulo)).toEqual(['Cuota de matrícula', 'Cuota 1'])

    await buscador.elegir(buscador.resultados.value[1])
    expect(buscador.seleccionado.value.id).toBe(91)
  })

  it('estudiante y curso usan sus servicios', async () => {
    userService.getAll.mockResolvedValue({ data: [{ id: 5, primer_nombre: 'Ana', primer_apellido: 'Ruiz', documento: '123' }] })
    cursoService.getAll.mockResolvedValue({ data: [{ id: 8, nombre: 'Farmacia', status_text: 'Activo' }] })

    const estudiante = useDocEntidadBuscador(ref('App\\Models\\User'))
    await escribir(estudiante, 'ana')
    expect(estudiante.resultados.value).toEqual([{ id: 5, titulo: 'Ana Ruiz', detalle: '123' }])

    const curso = useDocEntidadBuscador(ref('App\\Models\\Academico\\Curso'))
    await escribir(curso, 'far')
    expect(curso.resultados.value).toEqual([{ id: 8, titulo: 'Farmacia', detalle: 'Activo' }])
  })

  it('entidad sin adaptador → no soportada (el selector pide el ID manual)', () => {
    const buscador = useDocEntidadBuscador(ref('App\\Models\\Otra\\Entidad'))
    expect(buscador.soportado.value).toBe(false)
  })

  it('expone el error del API', async () => {
    matriculaService.getAll.mockRejectedValue({ response: { data: { message: 'Sin permiso' } } })
    const buscador = useDocEntidadBuscador(ref(MATRICULA))
    await escribir(buscador, 'juan')
    expect(buscador.error.value).toBe('Sin permiso')
    expect(buscador.resultados.value).toEqual([])
  })

  it('cambiar la entidad reinicia la búsqueda', async () => {
    matriculaService.getAll.mockResolvedValue({ data: [{ id: 1, estudiante: { name: 'Ana' } }] })
    const entidad = ref(MATRICULA)
    const buscador = useDocEntidadBuscador(entidad)
    await escribir(buscador, 'ana')
    await buscador.elegir(buscador.resultados.value[0])

    entidad.value = CARTERA
    await nextTick()

    expect(buscador.seleccionado.value).toBeNull()
    expect(buscador.termino.value).toBe('')
  })
})
