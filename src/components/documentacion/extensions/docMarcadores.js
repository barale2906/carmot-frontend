import { Node } from '@tiptap/vue-3'
import { PREFIJO_BLOQUE } from '@/utils/documentacion.js'

/**
 * Nodos TipTap para los marcadores del motor de documentos.
 *
 * En el editor se muestran como etiquetas no editables con el label legible;
 * al serializar producen el marcador `{{ clave }}` que resuelve el backend
 * (la envoltura se quita con `limpiarContenidoEditor` antes de guardar).
 * Si una clave no tiene label (no habilitada o inexistente), se pinta en rojo
 * con la clave cruda para que el error se note antes de guardar.
 */

function crearEtiqueta({ texto, titulo, clase }) {
  const dom = document.createElement('span')
  dom.className = clase
  dom.textContent = texto
  dom.title = titulo
  dom.contentEditable = 'false'
  return dom
}

export const DocVariable = Node.create({
  name: 'docVariable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return {
      /** @type {(clave: string) => string|null} */
      getLabel: () => null,
    }
  },

  addAttributes() {
    return {
      clave: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-variable'),
        renderHTML: (attrs) => ({ 'data-variable': attrs.clave }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', HTMLAttributes, `{{ ${node.attrs.clave} }}`]
  },

  renderText({ node }) {
    return `{{ ${node.attrs.clave} }}`
  },

  addNodeView() {
    return ({ node }) => {
      const label = this.options.getLabel(node.attrs.clave)
      return {
        dom: crearEtiqueta({
          texto: label ?? node.attrs.clave,
          titulo: label ? `Variable: ${label}` : 'Variable no habilitada para este tipo de documento',
          clase: label ? 'doc-marcador' : 'doc-marcador doc-marcador--invalido',
        }),
      }
    }
  },

  addCommands() {
    return {
      insertarVariable: (clave) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: { clave } }),
    }
  },
})

export const DocBloque = Node.create({
  name: 'docBloque',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      /** @type {(clave: string) => string|null} */
      getLabel: () => null,
    }
  },

  addAttributes() {
    return {
      clave: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-bloque'),
        renderHTML: (attrs) => ({ 'data-bloque': attrs.clave }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-bloque]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', HTMLAttributes, `{{ ${PREFIJO_BLOQUE}${node.attrs.clave} }}`]
  },

  renderText({ node }) {
    return `{{ ${PREFIJO_BLOQUE}${node.attrs.clave} }}`
  },

  addNodeView() {
    return ({ node }) => {
      const label = this.options.getLabel(node.attrs.clave)
      const dom = document.createElement('div')
      dom.className = label ? 'doc-bloque' : 'doc-bloque doc-bloque--invalido'
      dom.contentEditable = 'false'
      dom.appendChild(crearEtiqueta({
        texto: label ? `Tabla: ${label}` : `Bloque desconocido: ${node.attrs.clave}`,
        titulo: label
          ? 'Al imprimir el documento se reemplaza por la tabla consultada del sistema'
          : 'Este bloque no está disponible para la entidad del tipo de documento',
        clase: 'doc-bloque__titulo',
      }))
      return { dom }
    }
  },

  addCommands() {
    return {
      insertarBloque: (clave) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs: { clave } }),
    }
  },
})
