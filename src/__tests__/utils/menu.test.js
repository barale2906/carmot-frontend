import { describe, it, expect } from 'vitest'
import { rutaCoincide, contieneRutaActiva, dropdownActivoId } from '@/utils/menu.js'

const MENU = [
  { id: 'dashboard', route: '/dashboard', children: [] },
  {
    id: 'academico', route: '/academico', children: [
      { id: 'academico-cursos', route: '/academico/cursos' },
      { id: 'academico-documentacion', route: '/academico/documentacion' },
    ],
  },
  {
    id: 'financiero', route: '/financiero', children: [
      { id: 'fin-listas', route: '#financiero-listas', children: [{ id: 'fin-productos', route: '/financiero/productos' }] },
      { id: 'fin-cartera', route: '#financiero-cartera', children: [{ id: 'fin-cartera-v', route: '/financiero/cartera' }] },
    ],
  },
]

describe('rutaCoincide', () => {
  it('coincide con la ruta exacta y sus subrutas', () => {
    expect(rutaCoincide('/academico/documentacion', '/academico/documentacion')).toBe(true)
    expect(rutaCoincide('/academico/documentacion', '/academico/documentacion/plantillas/7')).toBe(true)
  })

  it('no confunde prefijos parciales ni agrupadores #', () => {
    expect(rutaCoincide('/academico/cursos', '/academico/cursosx')).toBe(false)
    expect(rutaCoincide('#financiero-listas', '#financiero-listas')).toBe(false)
    expect(rutaCoincide('', '/x')).toBe(false)
  })
})

describe('contieneRutaActiva', () => {
  it('busca en cualquier nivel de profundidad', () => {
    expect(contieneRutaActiva(MENU[2], '/financiero/cartera')).toBe(true)
    expect(contieneRutaActiva(MENU[2].children[0], '/financiero/cartera')).toBe(false)
  })
})

describe('dropdownActivoId', () => {
  it('devuelve el dropdown del nivel que contiene la pantalla visitada', () => {
    expect(dropdownActivoId(MENU, '/academico/documentacion/plantillas')).toBe('academico')
    expect(dropdownActivoId(MENU[2].children, '/financiero/cartera')).toBe('fin-cartera')
  })

  it('null si la pantalla no está dentro de ningún dropdown', () => {
    expect(dropdownActivoId(MENU, '/dashboard')).toBeNull()
    expect(dropdownActivoId(MENU, '/academico')).toBeNull()
    expect(dropdownActivoId(undefined, '/x')).toBeNull()
  })
})
