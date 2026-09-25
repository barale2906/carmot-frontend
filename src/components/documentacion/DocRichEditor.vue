<template>
  <div class="flex flex-col overflow-hidden rounded-[14px] border border-black/10 bg-white">
    <!-- Barra de herramientas: solo expone lo que dompdf sabe renderizar -->
    <div
      v-if="editor && editable"
      class="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-2 py-1.5"
      role="toolbar"
      aria-label="Formato del documento"
    >
      <select
        class="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Estilo del párrafo"
        :value="estiloActual"
        @change="aplicarEstilo($event.target.value)"
      >
        <option v-for="estilo in ESTILOS" :key="estilo.value" :value="estilo.value">{{ estilo.label }}</option>
      </select>

      <template v-for="(grupo, i) in gruposBotones" :key="i">
        <span class="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
        <button
          v-for="boton in grupo"
          :key="boton.id"
          type="button"
          :title="boton.titulo"
          :aria-pressed="boton.activo?.() ?? false"
          :disabled="boton.deshabilitado?.() ?? false"
          class="flex size-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-30"
          :class="boton.activo?.() ? 'bg-white text-slate-900 shadow-sm' : ''"
          @click="boton.accion()"
        >
          <span v-if="boton.texto" class="text-sm" :class="boton.claseTexto">{{ boton.texto }}</span>
          <svg v-else class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="boton.icono" />
          </svg>
        </button>
      </template>

      <span class="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
      <button
        v-for="color in COLORES"
        :key="color.valor ?? 'sin-color'"
        type="button"
        :title="color.titulo"
        class="flex size-6 items-center justify-center rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :style="color.valor ? { backgroundColor: color.valor } : {}"
        @click="aplicarColor(color.valor)"
      >
        <span v-if="!color.valor" class="text-[10px] text-slate-500">✕</span>
      </button>

      <!-- Acciones de tabla: solo cuando el cursor está dentro de una -->
      <template v-if="enTabla">
        <span class="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
        <button
          v-for="accion in ACCIONES_TABLA"
          :key="accion.comando"
          type="button"
          :title="accion.titulo"
          class="rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @click="editor.chain().focus()[accion.comando]().run()"
        >
          {{ accion.texto }}
        </button>
      </template>
    </div>

    <EditorContent :editor="editor" class="min-h-[420px] flex-1 overflow-y-auto" />
  </div>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit                    from '@tiptap/starter-kit'
import TextAlign                     from '@tiptap/extension-text-align'
import { TableKit }                  from '@tiptap/extension-table'
import { TextStyle, Color }          from '@tiptap/extension-text-style'
import { DocVariable, DocBloque }    from './extensions/docMarcadores.js'
import { prepararContenidoEditor, limpiarContenidoEditor } from '@/utils/documentacion.js'
import '@/assets/styles/documentacion.css'

const props = defineProps({
  /** HTML en formato backend (marcadores `{{ clave }}` en texto plano). */
  modelValue: { type: String, default: '' },
  editable:   { type: Boolean, default: true },
  /** Catálogo de variables del tipo: `[{ clave, label, habilitada }]`. */
  variables:  { type: Array, default: () => [] },
  /** Catálogo de bloques de la plantilla: `[{ clave, label }]`. */
  bloques:    { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const ESTILOS = [
  { value: 'p',  label: 'Párrafo' },
  { value: 'h1', label: 'Título 1' },
  { value: 'h2', label: 'Título 2' },
  { value: 'h3', label: 'Título 3' },
]

// Colores sobrios compatibles con impresión; null quita el color.
const COLORES = [
  { valor: '#222222', titulo: 'Texto negro' },
  { valor: '#213360', titulo: 'Azul institucional' },
  { valor: '#b02a37', titulo: 'Rojo' },
  { valor: '#6b7280', titulo: 'Gris' },
  { valor: null,      titulo: 'Quitar color' },
]

const ACCIONES_TABLA = [
  { comando: 'addRowAfter',       texto: '+ Fila',      titulo: 'Agregar fila debajo' },
  { comando: 'addColumnAfter',    texto: '+ Columna',   titulo: 'Agregar columna a la derecha' },
  { comando: 'deleteRow',         texto: '− Fila',      titulo: 'Eliminar fila' },
  { comando: 'deleteColumn',      texto: '− Columna',   titulo: 'Eliminar columna' },
  { comando: 'toggleHeaderRow',   texto: 'Encabezado',  titulo: 'Alternar fila de encabezado' },
  { comando: 'deleteTable',       texto: 'Quitar tabla', titulo: 'Eliminar la tabla' },
]

const labelsVariables = computed(() => new Map(
  props.variables.filter((v) => v.habilitada).map((v) => [v.clave, v.label]),
))
const labelsBloques = computed(() => new Map(props.bloques.map((b) => [b.clave, b.label])))

const editor = useEditor({
  content: prepararContenidoEditor(props.modelValue),
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      code: false,
      codeBlock: false,
      blockquote: false,
      strike: false,
      link: false,
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TableKit.configure({ table: { resizable: false } }),
    TextStyle,
    Color,
    DocVariable.configure({ getLabel: (clave) => labelsVariables.value.get(clave) ?? null }),
    DocBloque.configure({ getLabel: (clave) => labelsBloques.value.get(clave) ?? null }),
  ],
  editorProps: {
    attributes: { class: 'doc-contenido doc-contenido--editor', 'aria-label': 'Contenido del documento' },
  },
  onUpdate: ({ editor: instancia }) => {
    emit('update:modelValue', limpiarContenidoEditor(instancia.getHTML()))
  },
})

// Sincroniza cambios externos (p. ej. recarga desde el backend) sin re-emitir.
watch(() => props.modelValue, (valor) => {
  if (!editor.value) return
  if (valor === limpiarContenidoEditor(editor.value.getHTML())) return
  editor.value.commands.setContent(prepararContenidoEditor(valor), { emitUpdate: false })
})

watch(() => props.editable, (valor) => editor.value?.setEditable(valor))

onBeforeUnmount(() => editor.value?.destroy())

const enTabla = computed(() => editor.value?.isActive('table') ?? false)

const estiloActual = computed(() => {
  const nivel = [1, 2, 3].find((n) => editor.value?.isActive('heading', { level: n }))
  return nivel ? `h${nivel}` : 'p'
})

function cadena() {
  return editor.value.chain().focus()
}

function aplicarEstilo(valor) {
  if (valor === 'p') cadena().setParagraph().run()
  else cadena().setHeading({ level: Number(valor.slice(1)) }).run()
}

function aplicarColor(valor) {
  if (valor) cadena().setColor(valor).run()
  else cadena().unsetColor().run()
}

const gruposBotones = computed(() => {
  const e = editor.value
  if (!e) return []
  return [
    [
      { id: 'undo', titulo: 'Deshacer', icono: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3', accion: () => cadena().undo().run(), deshabilitado: () => !e.can().undo() },
      { id: 'redo', titulo: 'Rehacer',  icono: 'M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3', accion: () => cadena().redo().run(), deshabilitado: () => !e.can().redo() },
    ],
    [
      { id: 'bold',      titulo: 'Negrita',   texto: 'B', claseTexto: 'font-bold',  accion: () => cadena().toggleBold().run(),      activo: () => e.isActive('bold') },
      { id: 'italic',    titulo: 'Cursiva',   texto: 'I', claseTexto: 'italic',     accion: () => cadena().toggleItalic().run(),    activo: () => e.isActive('italic') },
      { id: 'underline', titulo: 'Subrayado', texto: 'U', claseTexto: 'underline',  accion: () => cadena().toggleUnderline().run(), activo: () => e.isActive('underline') },
    ],
    [
      { id: 'bullet',  titulo: 'Lista con viñetas', icono: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01', accion: () => cadena().toggleBulletList().run(),  activo: () => e.isActive('bulletList') },
      { id: 'ordered', titulo: 'Lista numerada',    icono: 'M10 6h10M10 12h10M10 18h10M4 4v4M3 18h3l-3 3h3',     accion: () => cadena().toggleOrderedList().run(), activo: () => e.isActive('orderedList') },
    ],
    [
      { id: 'left',    titulo: 'Alinear a la izquierda', icono: 'M4 6h16M4 12h10M4 18h14', accion: () => cadena().setTextAlign('left').run(),    activo: () => e.isActive({ textAlign: 'left' }) },
      { id: 'center',  titulo: 'Centrar',                icono: 'M4 6h16M7 12h10M5 18h14', accion: () => cadena().setTextAlign('center').run(),  activo: () => e.isActive({ textAlign: 'center' }) },
      { id: 'right',   titulo: 'Alinear a la derecha',   icono: 'M4 6h16M10 12h10M6 18h14', accion: () => cadena().setTextAlign('right').run(),  activo: () => e.isActive({ textAlign: 'right' }) },
      { id: 'justify', titulo: 'Justificar',             icono: 'M4 6h16M4 12h16M4 18h16', accion: () => cadena().setTextAlign('justify').run(), activo: () => e.isActive({ textAlign: 'justify' }) },
    ],
    [
      { id: 'table', titulo: 'Insertar tabla (3×3)', icono: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14M15 5v14', accion: () => cadena().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { id: 'hr',    titulo: 'Línea horizontal',     icono: 'M4 12h16', accion: () => cadena().setHorizontalRule().run() },
    ],
  ]
})

defineExpose({
  /** Inserta `{{ clave }}` en la posición del cursor. */
  insertarVariable: (clave) => editor.value && cadena().insertarVariable(clave).run(),
  /** Inserta `{{ bloque.clave }}` como bloque propio en la posición del cursor. */
  insertarBloque: (clave) => editor.value && cadena().insertarBloque(clave).run(),
})
</script>
