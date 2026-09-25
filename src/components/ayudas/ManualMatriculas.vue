<template>
  <div class="space-y-6">

    <AyudaSeccion id="mat-que-es" numero="1" titulo="¿Para qué sirve este módulo?">
      <p>
        Aquí se <strong>inscribe a un estudiante en un curso</strong> (en un ciclo y una sede concretos), se acuerda
        cuánto va a pagar y se imprime su hoja de matrícula. También sirve para consultar, corregir o anular
        matrículas existentes.
      </p>
      <p>
        Lo encuentra en el menú lateral <AyudaBoton variante="icono" icono="menu" /> →
        <strong>Académico</strong> → <strong>Matrículas</strong>.
      </p>
    </AyudaSeccion>

    <AyudaSeccion id="mat-pantalla" numero="2" titulo="Conozca la pantalla">
      <p>La pantalla tiene tres partes, de arriba hacia abajo:</p>

      <!-- Maqueta simplificada de la pantalla de matrículas -->
      <figure class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="space-y-3">
          <div class="relative grid grid-cols-2 gap-2 sm:grid-cols-4">
            <span class="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow">A</span>
            <div v-for="tarjeta in TARJETAS" :key="tarjeta" class="rounded-lg border border-slate-200 bg-white p-2">
              <p class="text-[11px] text-slate-500">{{ tarjeta }}</p>
              <div class="mt-1 h-3 w-10 rounded bg-slate-300" />
            </div>
          </div>
          <div class="relative flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
            <span class="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow">B</span>
            <div class="h-6 w-32 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] leading-6 text-slate-400">Buscar…</div>
            <div class="h-6 w-20 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] leading-6 text-slate-400">Estado</div>
            <div class="h-6 w-20 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] leading-6 text-slate-400">Curso</div>
            <div class="h-6 w-20 rounded border border-slate-200 bg-slate-50 px-2 text-[11px] leading-6 text-slate-400">Ciclo</div>
            <span class="ml-auto"><AyudaBoton icono="plus">Nueva matrícula</AyudaBoton></span>
          </div>
          <div class="relative rounded-lg border border-slate-200 bg-white">
            <span class="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow">C</span>
            <div class="grid grid-cols-[110px_1fr_1fr_1fr] gap-2 border-b border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500">
              <span>Acciones</span><span>Estudiante</span><span>Curso</span><span>Ciclo</span>
            </div>
            <div v-for="n in 2" :key="n" class="grid grid-cols-[110px_1fr_1fr_1fr] items-center gap-2 px-3 py-1.5">
              <span class="flex gap-1 text-slate-500">
                <NavIcon name="eye" class="!size-3.5" /><NavIcon name="print" class="!size-3.5" /><NavIcon name="pencil" class="!size-3.5" /><NavIcon name="close" class="!size-3.5 text-red-500" />
              </span>
              <div class="h-2.5 rounded bg-slate-200" /><div class="h-2.5 rounded bg-slate-200" /><div class="h-2.5 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        </div>
        <figcaption class="mt-3 text-center text-xs text-slate-500">Vista simplificada de la pantalla de Matrículas.</figcaption>
      </figure>

      <dl class="grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 p-3">
          <dt class="font-semibold text-slate-900">A · Resumen</dt>
          <dd class="text-slate-600">Cuántas matrículas hay en total, activas y anuladas, y la suma de los montos acordados.</dd>
        </div>
        <div class="rounded-xl border border-slate-200 p-3">
          <dt class="font-semibold text-slate-900">B · Filtros y acciones</dt>
          <dd class="text-slate-600">Busque por estudiante, curso o ciclo, y cree matrículas nuevas.</dd>
        </div>
        <div class="rounded-xl border border-slate-200 p-3">
          <dt class="font-semibold text-slate-900">C · Listado</dt>
          <dd class="text-slate-600">Una fila por matrícula. Los botones de la izquierda actúan sobre esa fila.</dd>
        </div>
      </dl>

      <AyudaIconos
        :items="[
          { icono: 'eye', nombre: 'Ver detalle', texto: 'Muestra toda la información y sus recibos de pago.' },
          { icono: 'print', nombre: 'Imprimir hoja de matrícula', texto: 'Abre la hoja lista para imprimir o firmar.' },
          { icono: 'pencil', nombre: 'Editar', texto: 'Corrige fechas, monto, asesor u observaciones.' },
          { icono: 'close', nombre: 'Eliminar', texto: 'Anula la matrícula y la manda a la papelera.', clase: 'text-red-600' }
        ]"
      />
    </AyudaSeccion>

    <AyudaSeccion id="mat-nueva" numero="3" titulo="Registrar una matrícula nueva" descripcion="Un asistente le guía en 6 pasos.">
      <p>Pulse <AyudaBoton icono="plus">Nueva matrícula</AyudaBoton>. Arriba de la ventana verá en qué paso va:</p>

      <!-- Indicador de pasos, igual al del asistente -->
      <figure class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <ol class="flex items-start justify-between gap-1">
          <template v-for="(paso, idx) in PASOS_WIZARD" :key="paso.titulo">
            <li class="flex min-w-0 flex-1 flex-col items-center text-center">
              <span class="flex size-8 items-center justify-center rounded-full text-sm font-semibold" :class="idx < 2 ? 'bg-green-600 text-white' : idx === 2 ? 'bg-[#213360] text-white ring-4 ring-[#213360]/20' : 'bg-slate-200 text-slate-500'">
                <NavIcon v-if="idx < 2" name="check" class="!size-4" />
                <template v-else>{{ idx + 1 }}</template>
              </span>
              <span class="mt-1 max-w-full truncate text-[10px] font-medium text-slate-700 sm:text-xs">{{ paso.titulo }}</span>
            </li>
          </template>
        </ol>
        <figcaption class="mt-3 text-center text-xs text-slate-500">
          Verde = paso terminado · Azul = paso actual · Gris = pendiente. Puede volver a un paso anterior haciendo clic en él.
        </figcaption>
      </figure>

      <div class="grid gap-3 md:grid-cols-2">
        <div v-for="(paso, idx) in PASOS_WIZARD" :key="paso.titulo" class="rounded-xl border border-slate-200 p-4">
          <p class="flex items-center gap-2 font-semibold text-slate-900">
            <span class="flex size-6 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-800">{{ idx + 1 }}</span>
            {{ paso.titulo }}
          </p>
          <p class="mt-1 text-slate-600">{{ paso.texto }}</p>
        </div>
      </div>

      <AyudaNota tipo="info">
        Al pulsar <strong>Registrar matrícula</strong>, se abre automáticamente la <strong>hoja de matrícula</strong>
        para imprimirla y hacerla firmar.
      </AyudaNota>
      <AyudaNota tipo="atencion" titulo="Matrícula duplicada">
        Si el estudiante ya está matriculado en ese mismo curso y ciclo, el sistema le avisa y no permite repetirla.
      </AyudaNota>
      <AyudaNota tipo="consejo">
        Busque siempre primero al estudiante por su número de documento. Solo si no aparece, use
        «Registrar como nuevo estudiante»; así evita tener a la misma persona dos veces.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="mat-precio" numero="4" titulo="Contado o financiado">
      <p>En el paso <strong>Precio</strong> el sistema muestra las opciones de la lista de precios vigente para ese curso:</p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p class="font-semibold text-emerald-800">Contado</p>
          <p class="text-emerald-900/80">Un solo pago por el valor total.</p>
        </div>
        <div class="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <p class="font-semibold text-violet-800">Financiado</p>
          <p class="text-violet-900/80">Valor de matrícula + un número de cuotas. Se muestra el valor de cada cuota y el total financiado.</p>
        </div>
      </div>
      <p>El <strong>Monto acordado</strong> es lo que finalmente se pacta con el estudiante y es lo que suma en el resumen «Ingresos totales».</p>
    </AyudaSeccion>

    <AyudaSeccion id="mat-gestion" numero="5" titulo="Corregir, anular y recuperar">
      <AyudaFlujo
        :pasos="[
          { titulo: 'Activa', texto: 'Matrícula vigente. Se puede ver, imprimir y editar.', tono: 'verde', icono: 'check' },
          { titulo: 'Eliminada (papelera)', texto: 'Se anuló. Marque «Ver eliminadas» para encontrarla.', tono: 'ambar', icono: 'trash' },
          { titulo: 'Eliminada permanentemente', texto: 'Ya no se puede recuperar.', tono: 'rojo', icono: 'ban' }
        ]"
        leyenda="Desde la papelera, «Restaurar» devuelve la matrícula a Activa."
      />
      <AyudaPasos
        :pasos="[
          { titulo: 'Para corregir: pulse el lápiz de la fila.', texto: 'Puede cambiar fechas, monto, asesor comercial, estado y observaciones.' },
          { titulo: 'Para anular: pulse la X roja de la fila y confirme.', texto: 'La matrícula pasa a la papelera; puede restaurarla en cualquier momento.' },
          { titulo: 'Para recuperar: marque la casilla «Ver eliminadas» y pulse «Restaurar».' }
        ]"
      />
      <AyudaNota tipo="atencion">
        «Eliminar permanentemente» <strong>no se puede deshacer</strong>. Úselo solo si está seguro.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="mat-faq" numero="6" titulo="Preguntas frecuentes">
      <AyudaPreguntas
        :preguntas="[
          { pregunta: 'No veo el botón «Nueva matrícula».', respuesta: 'Su usuario no tiene permiso para crear matrículas. Solicítelo al administrador del sistema.' },
          { pregunta: 'El ciclo que necesito no aparece en el paso 1.', respuesta: 'Verifique que eligió la sede y el curso correctos. Solo aparecen ciclos programados para ese curso en esa sede.' },
          { pregunta: 'Dice que no hay lista de precios vigente.', respuesta: 'El curso no tiene precios activos para la fecha. Comuníquese con el área financiera.' },
          { pregunta: 'El nombre o el correo del estudiante están mal.', respuesta: 'En el paso «Estudiante», después de seleccionarlo, marque «Actualizar información del estudiante» y corríjalos antes de registrar.' },
          { pregunta: '¿Cuál es la contraseña del estudiante nuevo?', respuesta: 'Por defecto es su número de documento, salvo que usted escriba otra al crearlo.' },
          { pregunta: '¿Dónde imprimo el contrato o el pagaré?', respuesta: 'En Académico → Documentación → «Imprimir documento». Vea el manual de Documentación.' }
        ]"
      />
    </AyudaSeccion>
  </div>
</template>

<script setup>
import NavIcon        from '@/components/icons/NavIcon.vue'
import AyudaSeccion   from './AyudaSeccion.vue'
import AyudaPasos     from './AyudaPasos.vue'
import AyudaNota      from './AyudaNota.vue'
import AyudaFlujo     from './AyudaFlujo.vue'
import AyudaBoton     from './AyudaBoton.vue'
import AyudaIconos    from './AyudaIconos.vue'
import AyudaPreguntas from './AyudaPreguntas.vue'

const TARJETAS = ['Total', 'Activas', 'Anuladas', 'Ingresos totales']

// Mismos nombres de paso que WIZARD_STEPS en useMatriculaWizard.js
const PASOS_WIZARD = [
  { titulo: 'Programación', texto: 'Elija la sede, luego el curso y por último el ciclo (grupo con fechas de inicio). Verá cuántos inscritos lleva el ciclo.' },
  { titulo: 'Precio',       texto: 'Elija la forma de pago: de contado o financiado en cuotas, según la lista de precios vigente.' },
  { titulo: 'Estudiante',   texto: 'Busque al estudiante por nombre o número de documento. Si no existe, regístrelo como nuevo estudiante.' },
  { titulo: 'Personales',   texto: 'Revise o complete sus datos: contacto, EPS, contacto de emergencia, nivel educativo, tallas, foto, etc.' },
  { titulo: 'Matrícula',    texto: 'Fecha de matrícula, inicio de clases, asesor comercial, monto acordado, autorizaciones (uso de imagen) y observaciones.' },
  { titulo: 'Confirmación', texto: 'Resumen de todo. Revise con calma y pulse «Registrar matrícula».' }
]
</script>
