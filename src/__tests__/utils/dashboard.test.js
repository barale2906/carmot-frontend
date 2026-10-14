import { describe, it, expect, vi } from 'vitest'
import {
  accesosVisibles, propsTarjeta, propsAlerta, propsActividad, propsEvento,
  tiempoTranscurrido, textoRetencion
} from '@/utils/dashboard.js'

vi.mock('@/services/api.js', () => ({ default: { get: vi.fn() } }))
import api from '@/services/api.js'
import dashboardService from '@/services/dashboardService.js'

describe('utils/dashboard', () => {
  it('muestra solo los accesos rápidos permitidos', () => {
    const accesos = accesosVisibles(p => p === 'aca_asistencias')
    expect(accesos.map(a => a.to)).toEqual(['/academico/asistencia'])
  })

  it('traduce tarjetas y alertas a props de los componentes', () => {
    expect(propsTarjeta({ clave: 'cartera_vencida', titulo: 'Mora', valor: 4, descripcion: 'x' }))
      .toEqual({ title: 'Mora', value: 4, description: 'x', icon: 'cartera', iconVariant: 'red' })
    expect(propsTarjeta({ clave: 'nueva', titulo: 'N', valor: 0 }).icon).toBe('dashboard')
    expect(propsAlerta({ titulo: 'T', descripcion: 'D', cantidad: 3, variante: 'danger' }))
      .toEqual({ title: 'T', description: 'D', count: 3, badgeLabel: 'Urgente', variant: 'red' })
    expect(propsAlerta({ titulo: 'T', descripcion: 'D', cantidad: 1, variante: 'warning' }).variant).toBe('yellow')
  })

  it('expresa el tiempo transcurrido en lenguaje natural', () => {
    const ahora = new Date('2026-10-13T15:00:00Z')
    expect(tiempoTranscurrido('2026-10-13T14:59:40Z', ahora)).toBe('Hace un momento')
    expect(tiempoTranscurrido('2026-10-13T14:45:00Z', ahora)).toBe('Hace 15 minutos')
    expect(tiempoTranscurrido('2026-10-13T14:00:00Z', ahora)).toBe('Hace 1 hora')
    expect(tiempoTranscurrido('2026-10-11T15:00:00Z', ahora)).toBe('Hace 2 días')
    expect(propsActividad({ tipo: 'pago', titulo: 'Pago', descripcion: 'd', fecha: '2026-10-13T14:45:00Z' }, ahora))
      .toMatchObject({ icon: 'cartera', timeAgo: 'Hace 15 minutos' })
  })

  it('convierte la fecha del evento sin desfase de zona horaria', () => {
    expect(propsEvento({ fecha: '2026-11-01', titulo: 'Inicio', subtitulo: 'Tunja' }))
      .toEqual({ month: 'NOV', day: '01', title: 'Inicio', subtitle: 'Tunja' })
    expect(propsEvento({ fecha: '2026-10-13', fecha_fin: '2026-10-18', titulo: 'Cierre', subtitulo: 'Sede Tunja' }).subtitle)
      .toBe('Sede Tunja · hasta el 18 OCT')
  })

  it('arma el texto de retención o null sin datos', () => {
    expect(textoRetencion({ tasa: 96.3, matriculas: 30, desertados: 1, retirados: 0 }).value).toBe('96,3 %')
    expect(textoRetencion({ tasa: null })).toBeNull()
    expect(textoRetencion(null)).toBeNull()
  })

  it('dashboardService consulta el resumen', async () => {
    api.get.mockResolvedValue({ data: { data: { tarjetas: [] } } })
    const res = await dashboardService.getResumen()
    expect(api.get).toHaveBeenCalledWith('/dashboard/resumen')
    expect(res.data.tarjetas).toEqual([])
  })
})
