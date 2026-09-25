<template>
  <div class="space-y-6">
    <header class="border-b border-black/10 pb-6">
      <h1 class="text-xl font-medium text-slate-900">Manual de usuario</h1>
      <p class="mt-1 text-sm text-slate-500">
        Guías paso a paso para usar el sistema. Elija un módulo y siga las secciones en orden, o salte a la que necesite.
      </p>

      <!-- Selector de módulo -->
      <nav class="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Módulos del manual">
        <button
          v-for="modulo in MODULOS"
          :key="modulo.clave"
          type="button"
          class="flex items-start gap-3 rounded-[14px] border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          :class="modulo.clave === moduloActivo.clave
            ? 'border-[#213360] bg-[#213360] text-white shadow-sm'
            : 'border-black/10 bg-white text-slate-700 hover:bg-slate-50'"
          :aria-current="modulo.clave === moduloActivo.clave ? 'page' : undefined"
          @click="seleccionarModulo(modulo.clave)"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center rounded-xl"
            :class="modulo.clave === moduloActivo.clave ? 'bg-white/15' : 'bg-slate-100 text-[#213360]'"
          >
            <NavIcon :name="modulo.icono" />
          </span>
          <span>
            <span class="block font-semibold">{{ modulo.titulo }}</span>
            <span class="block text-xs" :class="modulo.clave === moduloActivo.clave ? 'text-white/80' : 'text-slate-500'">{{ modulo.resumen }}</span>
          </span>
        </button>
      </nav>
    </header>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <!-- Índice del módulo (fijo al hacer scroll en escritorio) -->
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <nav class="rounded-[14px] border border-black/10 bg-white p-4" aria-label="Contenido del manual">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Contenido</p>
          <ol class="space-y-1 text-sm">
            <li v-for="(seccion, idx) in moduloActivo.secciones" :key="seccion.id">
              <button
                type="button"
                class="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                @click="irASeccion(seccion.id)"
              >
                <span class="text-slate-400">{{ idx + 1 }}.</span>{{ seccion.titulo }}
              </button>
            </li>
          </ol>
        </nav>
      </aside>

      <component :is="moduloActivo.componente" :key="moduloActivo.clave" class="min-w-0" />
    </div>
  </div>
</template>

<script setup>
import { computed }            from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavIcon                 from '@/components/icons/NavIcon.vue'
import ManualDocumentacion     from '@/components/ayudas/ManualDocumentacion.vue'
import ManualMatriculas        from '@/components/ayudas/ManualMatriculas.vue'
import ManualInventarios       from '@/components/ayudas/ManualInventarios.vue'

const route  = useRoute()
const router = useRouter()

// Los `id` de cada sección deben coincidir con los de <AyudaSeccion> en el manual correspondiente
const MODULOS = [
  {
    clave: 'matriculas', titulo: 'Matrículas', icono: 'academico', componente: ManualMatriculas,
    resumen: 'Inscribir estudiantes en un curso y ciclo.',
    secciones: [
      { id: 'mat-que-es',   titulo: '¿Para qué sirve?' },
      { id: 'mat-pantalla', titulo: 'Conozca la pantalla' },
      { id: 'mat-nueva',    titulo: 'Registrar matrícula' },
      { id: 'mat-precio',   titulo: 'Contado o financiado' },
      { id: 'mat-gestion',  titulo: 'Corregir y anular' },
      { id: 'mat-faq',      titulo: 'Preguntas frecuentes' }
    ]
  },
  {
    clave: 'documentacion', titulo: 'Documentación', icono: 'description', componente: ManualDocumentacion,
    resumen: 'Imprimir contratos, constancias y más.',
    secciones: [
      { id: 'doc-que-es',     titulo: '¿Para qué sirve?' },
      { id: 'doc-imprimir',   titulo: 'Imprimir un documento' },
      { id: 'doc-bitacora',   titulo: 'Bitácora' },
      { id: 'doc-plantillas', titulo: 'Plantillas y versiones' },
      { id: 'doc-version',    titulo: '¿Qué versión se usa?' },
      { id: 'doc-tipos',      titulo: 'Tipos de documento' },
      { id: 'doc-faq',        titulo: 'Preguntas frecuentes' }
    ]
  },
  {
    clave: 'inventarios', titulo: 'Inventarios', icono: 'inventario', componente: ManualInventarios,
    resumen: 'Vender, entregar y controlar existencias.',
    secciones: [
      { id: 'inv-que-es',         titulo: '¿Para qué sirve?' },
      { id: 'inv-productos',      titulo: 'Tipos de producto' },
      { id: 'inv-configurar',     titulo: 'Configuración inicial' },
      { id: 'inv-vender',         titulo: 'Vender' },
      { id: 'inv-pedido',         titulo: 'La vida de un pedido' },
      { id: 'inv-transferencias', titulo: 'Pagos por transferencia' },
      { id: 'inv-entregas',       titulo: 'Entregas' },
      { id: 'inv-stock',          titulo: 'Existencias y movimientos' },
      { id: 'inv-compras',        titulo: 'Órdenes de compra' },
      { id: 'inv-faq',            titulo: 'Preguntas frecuentes' }
    ]
  }
]

// El módulo vive en la URL (?modulo=...) para poder compartir un enlace directo
const moduloActivo = computed(() => MODULOS.find((m) => m.clave === route.query.modulo) ?? MODULOS[0])

function seleccionarModulo(clave) {
  router.replace({ query: { ...route.query, modulo: clave } })
}

function irASeccion(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
