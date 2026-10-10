<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        id="matricula-print-overlay"
        class="print-reset fixed inset-0 z-[1100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8"
      >
        <div
          class="print-reset relative my-auto w-full max-w-3xl rounded-xl border border-black/10 bg-white shadow-xl"
          @click.stop
        >
          <!-- Cabecera del modal (no se imprime) -->
          <div class="no-print flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
            <div>
              <h2 class="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <NavIcon name="formularios" class="size-5 text-[#213360]" />
                Hoja de matrícula
              </h2>
              <p class="mt-0.5 text-sm text-slate-500">
                Revisa la información y presiona el botón de imprimir para generar el PDF
              </p>
            </div>
            <button
              type="button"
              class="flex size-8 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Cerrar"
              @click="handleClose"
            >
              <NavIcon name="close" class="size-4" />
            </button>
          </div>

          <!-- Contenido imprimible -->
          <div id="matricula-print-sheet" class="max-h-[65vh] overflow-y-auto px-8 py-6">
            <template v-if="data">
              <!-- Encabezado institucional -->
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-4">
                  <!--
                    El logo tiene el wordmark "CARMOT" en blanco (pensado para fondos
                    oscuros); sobre la hoja blanca solo se veía el anillo de colores.
                    Se usa el SVG directo (no el componente Logo, que lo recorta a un
                    cuadrado) sobre un chip con el azul institucional para que el
                    texto blanco sea legible.
                  -->
                  <div class="flex shrink-0 items-center rounded-lg bg-[#213360] px-3 py-2">
                    <img :src="logoSrc" alt="CARMOT" class="h-12 w-auto print:h-10" />
                  </div>
                  <div>
                    <h1 class="text-xl font-bold text-slate-900 print:text-[15pt]">Centro de Capacitaciones CARMOT</h1>
                    <p class="text-xs text-slate-500 print:text-[8.5pt]">NIT: 1.048.849.874-0</p>
                    <p v-if="data.curso" class="mt-1 text-sm text-slate-600 print:mt-0.5 print:text-[10pt]">
                      Formación Técnica en {{ data.curso }}
                    </p>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <span class="inline-block rounded-lg bg-[#213360] px-3 py-1.5 text-sm font-semibold text-white print:text-[10pt]">
                    {{ data.codigo || '—' }}
                  </span>
                  <p class="mt-1.5 text-xs text-slate-500 print:text-[8.5pt]">Fecha: {{ formatDate(data.fecha) }}</p>
                </div>
              </div>

              <div class="mt-4 h-1 rounded-full bg-[#213360] print:mt-2" />

              <div class="my-5 rounded-lg bg-[#213360] py-3 text-center text-white print:my-2.5 print:py-1.5">
                <p class="text-sm font-semibold uppercase tracking-wide print:text-[11pt]">Hoja de matrícula</p>
                <p class="text-xs text-blue-100 print:text-[8.5pt]">Sede: {{ data.sede || '—' }}</p>
              </div>

              <!-- Información personal -->
              <PrintSection title="Información personal" :print-cols="5">
                <PrintField label="Nombres"               :value="data.personal.nombres" />
                <PrintField label="Apellidos"              :value="data.personal.apellidos" />
                <PrintField label="Tipo de identificación" :value="data.personal.tipoIdentificacion" />
                <PrintField label="Número de documento"    :value="data.personal.documento" />
                <PrintField label="Expedición"              :value="data.personal.expedicion" />
                <PrintField label="Fecha de nacimiento"     :value="formatDate(data.personal.fechaNacimiento)" />
                <PrintField label="Lugar de origen"         :value="data.personal.lugarOrigen" />
                <PrintField label="Género"                  :value="data.personal.genero" />
                <PrintField label="Estado civil"            :value="data.personal.estadoCivil" />
                <PrintField label="Tipo de sangre"          :value="data.personal.tipoSangre" />
              </PrintSection>

              <!-- Información de contacto -->
              <PrintSection title="Información de contacto" :print-cols="6">
                <PrintField label="Dirección"            :value="data.contacto.direccion" span="full" />
                <PrintField label="Teléfono fijo"        :value="data.contacto.telefono" />
                <PrintField label="Celular"              :value="data.contacto.celular" />
                <PrintField label="Correo electrónico"   :value="data.contacto.email" span="full" class="break-words" />
              </PrintSection>

              <!-- Información académica y laboral -->
              <PrintSection title="Información académica y laboral" :print-cols="6">
                <PrintField label="Nivel de estudios" :value="data.academico.nivelEducacion" />
                <PrintField label="Ocupación"         :value="data.academico.ocupacion" />
                <PrintField label="Régimen de salud"  :value="data.academico.regimenSalud" />
                <PrintField label="EPS"               :value="data.academico.eps" />
                <PrintField label="Empresa"           :value="data.academico.empresa" />
                <PrintField label="Estrato"           :value="data.academico.estrato" />
              </PrintSection>

              <!--
                Al imprimir, las secciones cortas comparten fila (grillas de 4 columnas)
                para que la hoja quepa en una sola página.
              -->
              <div class="print:grid print:grid-cols-4 print:gap-x-3">
                <!-- Información médica -->
                <PrintSection title="Información médica" :print-cols="2" class="print:col-span-2">
                  <PrintField
                    label="Enfermedades de atención prioritaria"
                    :value="data.medica.enfermedadPrioritaria ? (data.medica.enfermedadDetalle || 'Sí, requiere atención') : 'Ninguna'"
                  />
                  <PrintField
                    label="Discapacidad"
                    :value="data.medica.discapacidad ? (data.medica.tipoDiscapacidad || 'Sí') : 'Ninguna'"
                  />
                </PrintSection>

                <!-- Aprueba uso de imagen -->
                <PrintSection title="Aprueba uso de imagen" :print-cols="1">
                  <p class="text-sm text-slate-700 print:text-[10pt]">{{ data.apruebaUsoImagen ? 'Sí' : 'No' }}</p>
                </PrintSection>

                <!-- Multiculturalidad -->
                <PrintSection title="Multiculturalidad" :print-cols="1">
                  <p class="text-sm text-slate-700 print:text-[10pt]">{{ data.multiculturalidad || 'Ninguna' }}</p>
                </PrintSection>
              </div>

              <!-- Información del curso -->
              <PrintSection title="Información del curso" highlight>
                <PrintField label="Técnico" :value="data.curso" span="full" class="print:col-span-1" />
                <PrintField label="Ciclo"        :value="data.ciclo" />
                <PrintField label="Fecha de inicio" :value="formatDate(data.detalleCurso.fechaInicio)" />
                <div class="col-span-2 mt-1 print:col-span-1 print:mt-0">
                  <dt class="text-xs text-slate-400 print:text-[7.5pt] print:leading-tight print:text-slate-500">Valor matrícula</dt>
                  <dd class="text-xl font-bold text-[#213360] print:text-[13pt] print:leading-tight">{{ formatCOP(data.detalleCurso.monto) }}</dd>
                </div>
              </PrintSection>

              <div class="print:grid print:grid-cols-4 print:gap-x-3">
                <!-- Overol / botas -->
                <PrintSection title="Overol / botas" :print-cols="2">
                  <PrintField label="Talla overol" :value="data.detalleCurso.tallaOverol" />
                  <PrintField label="Talla botas"  :value="data.detalleCurso.tallaBotas" />
                </PrintSection>

                <!-- Contacto de emergencia -->
                <PrintSection title="Contacto de emergencia" :print-cols="3" class="print:col-span-3">
                  <PrintField label="Nombre"   :value="data.emergencia.nombre" />
                  <PrintField label="Teléfono" :value="data.emergencia.telefono" />
                  <PrintField label="Correo"   :value="data.emergencia.correo" class="break-words" />
                </PrintSection>
              </div>

              <!-- Observaciones -->
              <PrintSection v-if="data.observaciones" title="Observaciones">
                <p class="text-sm text-slate-700 print:col-span-4 print:text-[9.5pt] print:leading-snug">{{ data.observaciones }}</p>
              </PrintSection>

              <!--
                Foto / huella / firmas. Al imprimir, los dos bloques se "disuelven"
                (print:contents) en una sola fila de 4 columnas con las firmas
                alineadas abajo, para ahorrar alto de página.
              -->
              <div class="print:mt-3 print:grid print:grid-cols-[auto_auto_1fr_1fr] print:items-end print:gap-x-6 print:break-inside-avoid">
                <!-- Foto / huella -->
                <div class="mt-5 grid grid-cols-2 gap-6 break-inside-avoid print:contents">
                  <div>
                    <p class="mb-2 text-sm font-medium text-slate-800 print:mb-1 print:text-[9pt]">Foto del estudiante</p>
                    <div class="flex aspect-[3/4] w-full max-w-[180px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 print:w-[22mm]">
                      <img v-if="data.fotoUrl" :src="data.fotoUrl" alt="Foto del estudiante" class="size-full object-cover" />
                    </div>
                  </div>
                  <div>
                    <p class="mb-2 text-sm font-medium text-slate-800 print:mb-1 print:text-[9pt]">Huella del estudiante</p>
                    <div class="aspect-[3/4] w-full max-w-[180px] rounded-lg border border-slate-200 bg-slate-50 print:w-[22mm]" />
                  </div>
                </div>

                <!-- Firmas -->
                <div class="mt-10 grid grid-cols-2 gap-6 break-inside-avoid print:contents">
                  <div class="border-t border-slate-300 pt-2">
                    <p class="text-sm font-medium text-slate-800 print:text-[9pt]">Firma del estudiante</p>
                    <p class="text-xs text-slate-400 print:text-[8pt]">C.C. {{ data.personal.documento || '—' }}</p>
                  </div>
                  <div class="border-t border-slate-300 pt-2">
                    <p class="text-sm font-medium text-slate-800 print:text-[9pt]">Firma asistente Carmot</p>
                    <p class="text-xs text-slate-400 print:text-[8pt]">{{ data.registradoPor || 'Autorizado' }}</p>
                  </div>
                </div>
              </div>

              <p class="mt-8 border-t border-black/5 pt-3 text-center text-xs text-slate-400 print:mt-2 print:pt-1 print:text-[7.5pt]">
                Centro de Capacitaciones CARMOT
                <template v-if="sedesTexto"> - Sedes: {{ sedesTexto }}</template>
                <br class="print:hidden">
                <span class="hidden print:inline"> · </span>Generado el: {{ generadoEl }}
              </p>
            </template>
          </div>

          <!-- Footer del modal (no se imprime) -->
          <div class="no-print flex items-center justify-end gap-3 border-t border-black/5 px-6 py-4">
            <button
              type="button"
              class="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="handleClose"
            >
              Cerrar
            </button>
            <button
              v-if="data?.matriculaId && data?.estudianteId"
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-[#213360] px-4 py-2 text-sm font-medium text-[#213360] transition hover:bg-blue-50"
              @click="irARecibo"
            >
              <NavIcon name="receipt" class="size-4" />
              Ir al recibo de caja
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-[#213360] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a294d]"
              @click="handlePrint"
            >
              <NavIcon name="print" class="size-4" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, h, watch } from 'vue'
import { useRouter } from 'vue-router'

import NavIcon from '@/components/icons/NavIcon.vue'
import { formatDate, formatCOP } from '@/composables/useMatriculaWizard.js'
import logoSrc from '@/assets/images/logo.svg'

const props = defineProps({
  open:  { type: Boolean, default: false },
  data:  { type: Object,  default: null },
  sedes: { type: Array,   default: () => [] }
})
const emit = defineEmits(['close'])

const router = useRouter()

function irARecibo() {
  emit('close')
  router.push({
    path: '/academico/recibo-pago',
    query: {
      matricula_id:  props.data?.matriculaId,
      estudiante_id: props.data?.estudianteId,
    }
  })
}

const sedesTexto = computed(() => props.sedes.map(s => s.nombre).filter(Boolean).join(', '))

const generadoEl = computed(() =>
  new Date().toLocaleString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
)

function handleClose() {
  emit('close')
}

function handlePrint() {
  window.print()
}

// Libera el object URL creado para la vista previa de la foto (si la matrícula
// incluyó un archivo nuevo) cuando el modal se cierra.
watch(() => props.open, (val, prevVal) => {
  if (!val && prevVal && props.data?.fotoUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(props.data.fotoUrl)
  }
})

/** Columnas de la grilla de campos al imprimir (clases literales para que Tailwind las genere). */
const PRINT_GRID_COLS = { 1: 'print:grid-cols-1', 2: 'print:grid-cols-2', 3: 'print:grid-cols-3', 4: 'print:grid-cols-4', 5: 'print:grid-cols-5', 6: 'print:grid-cols-6' }

/**
 * Sección con título y grilla de campos, estilo consistente con la hoja impresa.
 * En pantalla la grilla es de 2 columnas; al imprimir usa `printCols` (4 por defecto,
 * menos para secciones que comparten fila) para que la hoja quepa en una página.
 */
const PrintSection = {
  props: {
    title:     String,
    highlight: { type: Boolean, default: false },
    printCols: { type: Number,  default: 4 }
  },
  setup(props, { slots }) {
    return () => h(
      'div',
      { class: `mt-4 break-inside-avoid rounded-xl border p-4 print:mt-2 print:rounded-lg print:px-3 print:py-2 ${props.highlight ? 'border-blue-100 bg-blue-50' : 'border-slate-200'}` },
      [
        h('h3', { class: 'mb-2 text-xs font-semibold uppercase tracking-wide text-[#213360] border-b border-black/5 pb-1.5 print:mb-1 print:pb-0.5 print:text-[8.5pt]' }, props.title),
        h('dl', { class: `grid grid-cols-2 gap-x-6 gap-y-2 print:gap-x-4 print:gap-y-1 ${PRINT_GRID_COLS[props.printCols]}` }, slots.default?.())
      ]
    )
  }
}

/** Par etiqueta/valor semántico para la hoja impresa. */
const PrintField = {
  props: { label: String, value: [String, Number], span: { type: String, default: '' } },
  setup(props) {
    return () => h('div', { class: props.span === 'full' ? 'col-span-2' : '' }, [
      h('dt', { class: 'text-xs text-slate-400 print:text-[7.5pt] print:leading-tight print:text-slate-500' }, props.label),
      h('dd', { class: 'text-sm text-slate-800 print:text-[10pt] print:leading-snug' },                  props.value || '—')
    ])
  }
}
</script>

<style>
@media print {
  /*
   * `visibility: hidden` no saca el resto de la SPA del flujo del documento:
   * el dashboard oculto seguía ocupando su alto completo y empujaba la hoja
   * a la página 2 (página 1 en blanco). Por eso se oculta con `display: none`
   * todo lo que esté al nivel de <body> salvo el overlay del modal.
   *
   * Además, el overlay usa `position: fixed` y la hoja `position: absolute`;
   * los navegadores solo imprimen la primera página de elementos con esas
   * posiciones y recortan lo que no entra ahí. Por eso, al imprimir, hay que
   * "aplanar" toda la cadena de ancestros a flujo normal (`static`) para que
   * el contenido fluya sin restricción de altura.
   */
  body > *:not(#matricula-print-overlay) { display: none !important; }

  .print-reset {
    position: static !important;
    inset: auto !important;
    top: auto !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    width: auto !important;
    height: auto !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    background: none !important;
    box-shadow: none !important;
    border: none !important;
    overflow: visible !important;
    display: block !important;
  }

  /*
   * La hoja se imprime a tamaño real (sin `zoom`): reducirla con zoom hacía que
   * desbordara a la derecha y el navegador la encogía de nuevo para ajustarla
   * al ancho, dejando letra de ~4 pt ilegible. Para que quepa en una sola carta
   * el template usa variantes `print:` (tipografía en pt, grillas de 4 columnas
   * y secciones cortas en pares). El margen va como padding de la hoja con
   * `@page { margin: 0 }`, lo que además omite el encabezado/pie del navegador
   * (fecha y URL).
   */
  #matricula-print-sheet {
    position: static !important;
    max-height: none !important;
    overflow: visible !important;
    width: 100% !important;
    padding: 7mm 11mm !important;
  }

  /*
   * El diálogo de impresión del navegador trae por defecto desactivada la
   * opción "Imágenes/gráficos de fondo", así que los `background-color`
   * (el chip azul del logo, la franja "HOJA DE MATRÍCULA", el badge del
   * código, las secciones resaltadas) no se imprimían y el texto blanco
   * quedaba invisible sobre la hoja. Esto fuerza su impresión sin depender
   * de esa opción.
   */
  #matricula-print-sheet, #matricula-print-sheet * {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .no-print { display: none !important; }

  @page {
    size: letter portrait;
    margin: 0;
  }
}
</style>
