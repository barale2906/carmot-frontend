import { describe, it, expect } from 'vitest'
import {
  ESTADOS_INICIALES, varianteEstado, esDeBaja, areasDeSede, distribucionPorArea, payloadActivo, formatoCOP,
  estaEnTransito, etiquetaActivo, varianteTraslado, accionesTraslado
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
      nombre: ' Taladro ', descripcion: '', categoria_id: '2', responsable_id: '',
      marca: 'Bosch', modelo: '', serial: '', fecha_ingreso: '2026-01-10', valor: '350000', observaciones: '',
      sede_id: '1', area_id: '', estado: ''
    }
    const nuevo = payloadActivo(form, { creando: true })
    expect(nuevo).not.toHaveProperty('codigo')
    expect(nuevo).toMatchObject({ nombre: 'Taladro', categoria_id: 2, responsable_id: null, valor: 350000, sede_id: 1, area_id: null, estado: 'operativo', descripcion: null })
    const edicion = payloadActivo(form, { creando: false })
    expect(edicion).not.toHaveProperty('sede_id')
    expect(edicion).not.toHaveProperty('estado')
  })

  it('identifica el activo por ID y detecta si está en tránsito', () => {
    expect(etiquetaActivo({ id: 12, nombre: 'Taladro' })).toBe('#12 · Taladro')
    expect(etiquetaActivo(null)).toBe('')
    expect(estaEnTransito({ traslado_pendiente: { id: 3 } })).toBe(true)
    expect(estaEnTransito({ traslado_pendiente: null })).toBe(false)
  })

  it('mapea el estado del traslado a variantes del badge', () => {
    expect(varianteTraslado('pendiente')).toBe('mantenimiento')
    expect(varianteTraslado('recibido')).toBe('operativo')
    expect(varianteTraslado('cancelado')).toBe('baja')
  })

  it('recibe quien tiene la sede de destino y cancela quien tiene la de origen', () => {
    const traslado = { estado_traslado: 'pendiente', sede_origen_id: 1, sede_destino_id: 2 }
    const todo = () => true
    expect(accionesTraslado(traslado, [2], todo)).toEqual({ recibir: true, cancelar: false })
    expect(accionesTraslado(traslado, [1], todo)).toEqual({ recibir: false, cancelar: true })
    expect(accionesTraslado(traslado, [1, 2], (p) => p === 'act_activoRecibir')).toEqual({ recibir: true, cancelar: false })
    expect(accionesTraslado({ ...traslado, estado_traslado: 'recibido' }, [1, 2], todo)).toEqual({ recibir: false, cancelar: false })
  })

  it('no ofrece recibir a quien envió el traslado, salvo al superusuario', () => {
    const traslado = { estado_traslado: 'pendiente', sede_origen_id: 1, sede_destino_id: 2, usuario: { id: 7 } }
    const todo = () => true
    expect(accionesTraslado(traslado, [1, 2], todo, { id: 7 })).toEqual({ recibir: false, cancelar: true })
    expect(accionesTraslado(traslado, [1, 2], todo, { id: 7, superusuario: true })).toEqual({ recibir: true, cancelar: true })
    expect(accionesTraslado(traslado, [1, 2], todo, { id: 8 })).toEqual({ recibir: true, cancelar: true })
  })

  it('formatea pesos sin decimales', () => {
    expect(formatoCOP(2500000)).toMatch(/2\.500\.000/)
    expect(formatoCOP(null)).toMatch(/0/)
  })
})
