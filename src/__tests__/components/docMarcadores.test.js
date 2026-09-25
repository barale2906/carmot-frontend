import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { DocVariable, DocBloque } from '@/components/documentacion/extensions/docMarcadores.js'
import { prepararContenidoEditor, limpiarContenidoEditor } from '@/utils/documentacion.js'

/**
 * Ida y vuelta real por TipTap: lo que entra del backend debe salir igual
 * (marcadores planos) después de pasar por el editor.
 */
let editor

function crearEditor(html, labels = {}) {
  editor = new Editor({
    extensions: [
      StarterKit,
      DocVariable.configure({ getLabel: (clave) => labels[clave] ?? null }),
      DocBloque.configure({ getLabel: (clave) => labels[clave] ?? null }),
    ],
    content: prepararContenidoEditor(html),
  })
  return editor
}

const salida = () => limpiarContenidoEditor(editor.getHTML())

afterEach(() => editor?.destroy())

describe('extensiones de marcadores (TipTap)', () => {
  it('conserva variables en línea y bloques entre párrafos', () => {
    const html = '<p>Yo, {{ estudiante.name }}, me obligo a pagar {{ monto_letras }}.</p>{{ bloque.estado_cartera }}<p>Expedido el {{ documento.fecha_larga }}.</p>'
    crearEditor(html)
    expect(salida()).toBe(html)
  })

  it('un bloque dentro de un párrafo propio sale como marcador de bloque', () => {
    crearEditor('<p>{{ bloque.sabana_notas }}</p>')
    expect(salida()).toBe('{{ bloque.sabana_notas }}')
  })

  it('las variables se crean como nodos atómicos (no se editan letra a letra)', () => {
    crearEditor('<p>{{ estudiante.name }}</p>')
    const nodos = []
    editor.state.doc.descendants((n) => { if (n.type.name === 'docVariable') nodos.push(n) })
    expect(nodos).toHaveLength(1)
    expect(nodos[0].attrs.clave).toBe('estudiante.name')
  })

  it('los comandos insertan marcadores en el cursor', () => {
    crearEditor('<p>Hola</p>')
    editor.commands.focus('end')
    editor.commands.insertContent(' ')
    editor.commands.insertarVariable('estudiante.name')
    editor.commands.insertarBloque('recibos_pago')
    expect(salida()).toBe('<p>Hola {{ estudiante.name }}</p>{{ bloque.recibos_pago }}<p></p>')
  })

  it('getText serializa los marcadores', () => {
    crearEditor('<p>Nombre: {{ estudiante.name }}</p>')
    expect(editor.getText()).toBe('Nombre: {{ estudiante.name }}')
  })
})
