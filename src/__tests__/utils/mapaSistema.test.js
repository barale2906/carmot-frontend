import { describe, it, expect } from 'vitest'
import { ETAPAS_SISTEMA } from '@/components/ayudas/mapaSistema.js'

// Claves de los manuales registrados en AyudasView
const MANUALES = ['mapa', 'matriculas', 'documentacion', 'inventarios', 'ingreso']

describe('mapa del sistema', () => {
  it('cada etapa tiene id único (ancla del índice) y al menos un flujo con pasos', () => {
    const ids = ETAPAS_SISTEMA.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const etapa of ETAPAS_SISTEMA) {
      expect(etapa.flujos.length).toBeGreaterThan(0)
      for (const flujo of etapa.flujos) expect(flujo.pasos.length).toBeGreaterThan(0)
    }
  })

  it('solo enlaza manuales que existen', () => {
    for (const etapa of ETAPAS_SISTEMA.filter((e) => e.manual)) {
      expect(MANUALES).toContain(etapa.manual)
    }
  })

  it('la matrícula viene después de las etapas que requiere', () => {
    const orden = ETAPAS_SISTEMA.map((e) => e.titulo)
    const matricula = orden.indexOf('Matrícula')
    for (const previa of ['Oferta académica', 'Precios y descuentos', 'Documentos']) {
      expect(orden.indexOf(previa)).toBeLessThan(matricula)
    }
  })
})
