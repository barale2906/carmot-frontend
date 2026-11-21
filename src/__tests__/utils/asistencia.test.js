import { describe, it, expect } from 'vitest'
import {
  ESTADOS_ASISTENCIA, admiteJustificacion, justificacionesSinMotivo, paramsListado,
  claseSugerida, esClaseFutura, rangoHoras, buscarEstudiantesEnClases, construirPlanilla, resumenPlanilla, payloadPlanilla, etiquetaClase,
  invitadosDeReposiciones, estudiantesConInvitados, etiquetaClaseReposicion, claseEstadoEstudiante, esDesertado
} from '@/utils/asistencia.js'

const clases = [
  { id: 1, fecha_clase: '2026-10-06', estado: 'dictada' },
  { id: 2, fecha_clase: '2026-10-10', estado: 'cancelada' },
  { id: 3, fecha_clase: '2026-10-13', estado: 'programada' },
  { id: 4, fecha_clase: '2026-10-20', estado: 'programada' }
]

describe('claseSugerida', () => {
  it('prefiere la clase de hoy', () => {
    expect(claseSugerida(clases, '2026-10-13').id).toBe(3)
  })

  it('sin clase hoy toma la última pasada que no esté cancelada', () => {
    expect(claseSugerida(clases, '2026-10-11').id).toBe(1)
  })

  it('si todas son futuras toma la primera y sin clases devuelve null', () => {
    expect(claseSugerida(clases, '2026-01-01').id).toBe(1)
    expect(claseSugerida([], '2026-10-13')).toBeNull()
  })
})

describe('planilla', () => {
  const estudiantes = [{ id: 10 }, { id: 11 }]

  it('usa lo registrado y deja "presente" por defecto a quien no tiene registro', () => {
    const planilla = construirPlanilla(estudiantes, [
      { estudiante_id: 11, estado: 'ausente', justificada: true, justificacion: 'Cita médica', observaciones: null }
    ])
    expect(planilla).toEqual([
      { estudiante_id: 10, estado: 'presente', justificada: false, justificacion: '', observaciones: '', guardada: false },
      { estudiante_id: 11, estado: 'ausente', justificada: true, justificacion: 'Cita médica', observaciones: '', guardada: true }
    ])
  })

  it('resume por estado y arma el payload con textos vacíos en null', () => {
    const planilla = construirPlanilla(estudiantes, [])
    planilla[1].estado = 'tardanza'
    planilla[1].observaciones = '  '
    expect(resumenPlanilla(planilla)).toEqual({ presente: 1, tardanza: 1, ausente: 0, justificadas: 0 })
    expect(payloadPlanilla(planilla)).toEqual([
      { estudiante_id: 10, estado: 'presente', justificada: false, justificacion: null, observaciones: null },
      { estudiante_id: 11, estado: 'tardanza', justificada: false, justificacion: null, observaciones: null }
    ])
  })

  it('la ausencia justificada sigue siendo ausente y la justificación de un presente se descarta', () => {
    const planilla = construirPlanilla(estudiantes, [])
    Object.assign(planilla[0], { estado: 'presente', justificada: true, justificacion: 'x' })
    Object.assign(planilla[1], { estado: 'ausente', justificada: true, justificacion: ' Cita médica ' })
    expect(resumenPlanilla(planilla)).toEqual({ presente: 1, tardanza: 0, ausente: 1, justificadas: 1 })
    expect(payloadPlanilla(planilla)).toEqual([
      { estudiante_id: 10, estado: 'presente', justificada: false, justificacion: null, observaciones: null },
      { estudiante_id: 11, estado: 'ausente', justificada: true, justificacion: 'Cita médica', observaciones: null }
    ])
  })

  it('detecta justificaciones sin motivo', () => {
    const planilla = construirPlanilla(estudiantes, [])
    Object.assign(planilla[1], { estado: 'ausente', justificada: true, justificacion: '  ' })
    expect(justificacionesSinMotivo(planilla).map(f => f.estudiante_id)).toEqual([11])
  })
})

describe('estados y justificación', () => {
  it('no existe el estado "justificado": la justificación va aparte', () => {
    expect(ESTADOS_ASISTENCIA.map(e => e.value)).toEqual(['presente', 'tardanza', 'ausente'])
  })

  it('solo se justifica una ausencia o una tardanza', () => {
    expect(admiteJustificacion('ausente')).toBe(true)
    expect(admiteJustificacion('tardanza')).toBe(true)
    expect(admiteJustificacion('presente')).toBe(false)
  })
})

describe('paramsListado', () => {
  it('descarta filtros vacíos', () => {
    expect(paramsListado({ sede_id: 2, curso_id: '', estudiante: null, estado: 'ausente' }))
      .toEqual({ sede_id: 2, estado: 'ausente' })
  })

  it('con un día de clase ignora el rango', () => {
    expect(paramsListado({ fecha: '2026-10-13', fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31' }))
      .toEqual({ fecha: '2026-10-13' })
    expect(paramsListado({ fecha: '', fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31' }))
      .toEqual({ fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31' })
  })
})

describe('etiquetaClase', () => {
  it('muestra fecha, horas y estado', () => {
    expect(etiquetaClase({ fecha_clase: '2026-10-13', hora_inicio: '08:00:00', hora_fin: '10:00:00', estado_text: 'Programada' }))
      .toBe('13/10/2026 · 08:00–10:00 (Programada)')
  })
})

describe('esClaseFutura', () => {
  it('solo es futura si la fecha de la clase es posterior a hoy', () => {
    expect(esClaseFutura({ fecha_clase: '2026-10-14' }, '2026-10-13')).toBe(true)
    expect(esClaseFutura({ fecha_clase: '2026-10-13' }, '2026-10-13')).toBe(false)
    expect(esClaseFutura(null, '2026-10-13')).toBe(false)
  })
})

describe('rangoHoras', () => {
  it('recorta los segundos', () => {
    expect(rangoHoras({ hora_inicio: '08:00:00', hora_fin: '10:30:00' })).toBe('08:00–10:30')
  })
  it('sin clase devuelve vacío', () => {
    expect(rangoHoras(null)).toBe('')
  })
})

describe('buscarEstudiantesEnClases', () => {
  const maria = { id: 1, name: 'María Pérez', documento: '1001' }
  const juan  = { id: 2, name: 'Juan Gómez', documento: '2002' }
  const clasesDia = [
    { id: 10, estudiantes: [maria, juan] },
    { id: 11, estudiantes: [maria] }
  ]

  it('ignora tildes y mayúsculas y agrupa las clases del estudiante', () => {
    const r = buscarEstudiantesEnClases(clasesDia, 'maria PEREZ')
    expect(r).toHaveLength(1)
    expect(r[0].estudiante.id).toBe(1)
    expect(r[0].clases.map(c => c.id)).toEqual([10, 11])
  })

  it('busca por documento', () => {
    expect(buscarEstudiantesEnClases(clasesDia, '2002')[0].estudiante.id).toBe(2)
  })

  it('sin consulta o sin coincidencias devuelve vacío', () => {
    expect(buscarEstudiantesEnClases(clasesDia, '  ')).toEqual([])
    expect(buscarEstudiantesEnClases(clasesDia, 'zzz')).toEqual([])
  })
})

describe('reposiciones en la planilla', () => {
  it('extrae los invitados de las reposiciones de la clase', () => {
    const reposiciones = [{ estudiante: { id: 7, name: 'Ana', documento: '1', extra: 'x' } }, { estudiante: null }]
    expect(invitadosDeReposiciones(reposiciones)).toEqual([{ id: 7, name: 'Ana', documento: '1' }])
    expect(invitadosDeReposiciones(undefined)).toEqual([])
  })

  it('une estudiantes e invitados sin repetir y marca a los invitados', () => {
    const r = estudiantesConInvitados([{ id: 1, name: 'A' }], [{ id: 1, name: 'A' }, { id: 7, name: 'Ana' }])
    expect(r).toEqual([{ id: 1, name: 'A' }, { id: 7, name: 'Ana', invitado: true }])
  })

  it('etiqueta la clase con día, horas, grupo y sede', () => {
    const etiqueta = etiquetaClaseReposicion({ fecha_clase: '2026-11-19', hora_inicio: '08:00:00', hora_fin: '10:00:00', grupo: { nombre: 'Grupo B', sede: 'Tunja' } })
    expect(etiqueta).toContain('19/11')
    expect(etiqueta).toContain('08:00–10:00')
    expect(etiqueta).toContain('Grupo B (Tunja)')
  })
})

describe('estado del estudiante', () => {
  it('destaca al desertado', () => {
    expect(esDesertado({ estado_estudiante: 'Desertado' })).toBe(true)
    expect(esDesertado({ estado_estudiante: 'Activo' })).toBe(false)
    expect(esDesertado(null)).toBe(false)
    expect(claseEstadoEstudiante('Desertado')).toContain('red')
    expect(claseEstadoEstudiante('En mora')).toContain('amber')
    expect(claseEstadoEstudiante('Activo')).toContain('slate')
  })
})
