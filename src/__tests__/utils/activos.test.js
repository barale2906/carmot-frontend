import { describe, it, expect } from 'vitest'
import {
  ESTADOS_INICIALES, varianteEstado, esDeBaja, areasDeSede, distribucionPorArea, payloadActivo, formatoCOP
} from '@/utils/activos.js'

describe('utils/activos', () => {
  it('no permite registrar un activo de baja', () => {
    expect(ESTADOS_INICIALES.map(e => e.value)).not.toContain('baja')
  })

  it('mapea estados a variantes del badge', () => {
    expect(varianteEstado('mantenimiento')).toBe('mantenimiento')
    expect(varianteEstado('raro')).toBe('operativo')
    expect(esDeBaja({ estado: 'baja' })).toBe(true)
    expect(esDeBaja(null)).toBe(false)
  })

  it('obtiene las áreas de una sede del catálogo', () => {
    const sedes = [{ id: 1, areas: [{ id: 5, nombre: 'Taller' }] }]
    expect(areasDeSede(sedes, '1')).toEqual([{ id: 5, nombre: 'Taller' }])
    expect(areasDeSede(sedes, 2)).toEqual([])
  })

  it('completa la distribución con áreas vacías y agrega "Sin área"', () => {
    const porArea = [{ area_id: 5, area: 'Taller', total: 3 }, { area_id: null, area: 'Sin área', total: 1 }]
    expect(distribucionPorArea(porArea, [{ id: 5, nombre: 'Taller' }, { id: 6, nombre: 'Bodega' }])).toEqual([
      { area: 'Taller', count: 3 },
      { area: 'Bodega', count: 0 },
      { area: 'Sin área', count: 1 }
    ])
    // Sin sede filtrada (todas las sedes): solo las áreas con activos.
    expect(distribucionPorArea(porArea, [])).toEqual([{ area: 'Taller', count: 3 }, { area: 'Sin área', count: 1 }])
  })

  it('arma el payload: ubicación y estado solo al crear', () => {
    const form = {
      codigo: ' A-1 ', nombre: 'Taladro', descripcion: '', categoria_id: '2', responsable_id: '',
      marca: 'Bosch', modelo: '', serial: '', fecha_ingreso: '2026-01-10', valor: '350000', observaciones: '',
      sede_id: '1', area_id: '', estado: ''
    }
    const nuevo = payloadActivo(form, { creando: true })
    expect(nuevo).toMatchObject({ codigo: 'A-1', categoria_id: 2, responsable_id: null, valor: 350000, sede_id: 1, area_id: null, estado: 'operativo', descripcion: null })
    const edicion = payloadActivo(form, { creando: false })
    expect(edicion).not.toHaveProperty('sede_id')
    expect(edicion).not.toHaveProperty('estado')
  })

  it('formatea pesos sin decimales', () => {
    expect(formatoCOP(2500000)).toMatch(/2\.500\.000/)
    expect(formatoCOP(null)).toMatch(/0/)
  })
})
