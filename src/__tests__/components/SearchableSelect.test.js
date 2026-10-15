import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchableSelect from '@/components/forms/SearchableSelect.vue'

const OPCIONES = [
  { value: 1, label: 'Bogotá Norte' },
  { value: 2, label: 'Medellín Centro' },
  { value: 3, label: 'Tunja Norte' },
  { value: 4, label: 'Cali Sur' }
]

// jsdom no implementa scrollIntoView
Element.prototype.scrollIntoView = () => {}

let wrapper
function montar(props = {}) {
  wrapper = mount(SearchableSelect, {
    attachTo: document.body,
    props: {
      modelValue: '',
      options: OPCIONES,
      'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }),
      ...props
    }
  })
  return wrapper
}
const panel = () => document.body.querySelector('[role="listbox"]')
const buscador = () => document.body.querySelector('input[type="text"]')
const opciones = () => [...document.body.querySelectorAll('[role="option"]')]
const activa = () => opciones().findIndex((o) => o.className.includes('bg-blue-600'))
async function tecla(el, key, extra = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }))
  await nextTick(); await nextTick()
}

afterEach(() => { wrapper?.unmount(); document.body.innerHTML = '' })

describe('SearchableSelect', () => {
  it('filtra por cualquier parte del nombre', async () => {
    montar()
    await wrapper.find('button').trigger('click')
    buscador().value = 'nor'
    buscador().dispatchEvent(new Event('input'))
    await nextTick()
    expect(opciones().map((o) => o.textContent.trim())).toEqual(['Bogotá Norte', 'Tunja Norte'])
  })

  it('se mueve entre opciones sin búsqueda con flechas y Tab, y selecciona con Enter', async () => {
    montar()
    await wrapper.find('button').trigger('click')
    expect(activa()).toBe(0)
    await tecla(buscador(), 'ArrowDown')
    expect(activa()).toBe(1)
    await tecla(buscador(), 'Tab')
    expect(activa()).toBe(2)
    await tecla(buscador(), 'Tab', { shiftKey: true })
    expect(activa()).toBe(1)
    await tecla(buscador(), 'Enter')
    expect(wrapper.props('modelValue')).toBe(2)
    expect(panel()).toBeNull()
  })

  it('abre con el teclado desde el campo cerrado y navega', async () => {
    montar()
    const boton = wrapper.find('button').element
    await tecla(boton, 'ArrowDown')
    expect(panel()).not.toBeNull()
    await tecla(buscador(), 'ArrowDown')
    await tecla(buscador(), 'Enter')
    expect(wrapper.props('modelValue')).toBe(2)
  })

  it('selecciona con clic', async () => {
    montar()
    await wrapper.find('button').trigger('click')
    opciones()[3].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    await nextTick()
    expect(wrapper.props('modelValue')).toBe(4)
  })

  it('el teclado no pierde el resaltado por un hover sin movimiento del ratón', async () => {
    montar()
    await wrapper.find('button').trigger('click')
    const mover = async (i, x, y) => {
      opciones()[i].dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }))
      await nextTick()
    }
    await mover(0, 10, 10)
    await tecla(buscador(), 'ArrowDown')
    await tecla(buscador(), 'ArrowDown')
    expect(activa()).toBe(2)
    await mover(0, 10, 10) // misma posición: evento sintético tras el scroll
    expect(activa()).toBe(2)
    await mover(3, 10, 40) // el ratón sí se movió
    expect(activa()).toBe(3)
  })

  it('keepOpen: elegir emite select, no cambia el valor y deja el panel abierto y limpio', async () => {
    const seleccionadas = []
    montar({ keepOpen: true, onSelect: (o) => seleccionadas.push(o.value) })
    await wrapper.find('button').trigger('click')
    buscador().value = 'cali'
    buscador().dispatchEvent(new Event('input'))
    await nextTick()
    await tecla(buscador(), 'Enter')
    expect(seleccionadas).toEqual([4])
    expect(wrapper.props('modelValue')).toBe('')
    expect(panel()).not.toBeNull()
    expect(buscador().value).toBe('')
  })

  it('remote: no filtra local, pide desde minChars y muestra lo que entrega el padre', async () => {
    const buscadas = []
    montar({ remote: true, minChars: 3, debounce: 0, onSearch: (t) => buscadas.push(t) })
    await wrapper.find('button').trigger('click')
    expect(opciones()).toHaveLength(0)
    expect(panel().textContent).toContain('al menos 3 letras')
    buscador().value = 'ca'
    buscador().dispatchEvent(new Event('input'))
    await new Promise((r) => setTimeout(r, 5))
    expect(buscadas).toEqual([])
    buscador().value = 'cal'
    buscador().dispatchEvent(new Event('input'))
    await new Promise((r) => setTimeout(r, 5))
    expect(buscadas).toEqual(['cal'])
    expect(opciones()).toHaveLength(4)
  })

  it('selectedOption y clearable: muestra la opción externa y la quita con ✕', async () => {
    let limpiada = false
    montar({ modelValue: 99, options: [], selectedOption: { value: 99, label: 'Producto externo' }, clearable: true, onClear: () => { limpiada = true } })
    expect(wrapper.text()).toContain('Producto externo')
    await wrapper.find('button[aria-label="Quitar selección"]').trigger('click')
    expect(limpiada).toBe(true)
    expect(wrapper.props('modelValue')).toBeNull()
  })
})
