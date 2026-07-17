import { describe, it, expect } from 'vitest'
import { nombreCompleto } from '@/utils/formatters.js'

describe('nombreCompleto', () => {
  it('retorna cadena vacía para valor nulo', () => {
    expect(nombreCompleto(null)).toBe('')
    expect(nombreCompleto(undefined)).toBe('')
  })

  it('une los cuatro campos de nombre cuando todos están presentes', () => {
    const usuario = {
      primer_nombre: 'Juan',
      segundo_nombre: 'Carlos',
      primer_apellido: 'García',
      segundo_apellido: 'López',
    }
    expect(nombreCompleto(usuario)).toBe('Juan Carlos García López')
  })

  it('omite campos vacíos o nulos sin dejar espacios dobles', () => {
    expect(nombreCompleto({ primer_nombre: 'Ana', primer_apellido: 'Torres' }))
      .toBe('Ana Torres')

    expect(nombreCompleto({ primer_nombre: 'Luis', segundo_nombre: null, primer_apellido: 'Pérez', segundo_apellido: '' }))
      .toBe('Luis Pérez')
  })

  it('cae en user.name cuando no hay campos de nombre desglosados', () => {
    expect(nombreCompleto({ name: 'María Rodríguez' })).toBe('María Rodríguez')
  })

  it('cae en user.email cuando tampoco hay name', () => {
    expect(nombreCompleto({ email: 'usuario@correo.com' })).toBe('usuario@correo.com')
  })

  it('user.name tiene prioridad sobre user.email', () => {
    expect(nombreCompleto({ name: 'Admin', email: 'admin@correo.com' })).toBe('Admin')
  })

  it('campos desglosados tienen prioridad sobre name y email', () => {
    const usuario = {
      primer_nombre: 'Carlos',
      primer_apellido: 'Ruiz',
      name: 'Nombre Legado',
      email: 'carlos@correo.com',
    }
    expect(nombreCompleto(usuario)).toBe('Carlos Ruiz')
  })
})
