<template>
  <div class="space-y-6">

    <AyudaSeccion id="doc-que-es" numero="1" titulo="¿Para qué sirve este módulo?">
      <p>
        Aquí se preparan e imprimen los <strong>documentos oficiales del instituto</strong>: contratos, pagarés,
        hojas de matrícula, constancias, cartas, sábanas de notas, etc. Usted escribe el texto <em>una sola vez</em>
        (la "plantilla") y el sistema rellena automáticamente los datos de cada estudiante al imprimir.
      </p>
      <p>
        Lo encuentra en el menú lateral <AyudaBoton variante="icono" icono="menu" /> →
        <strong>Académico</strong> → <strong>Documentación</strong>. Tiene tres pestañas:
      </p>
      <AyudaFlujo
        :pasos="[
          { titulo: 'Tipos de documento', texto: 'Qué documentos existen (ej: Contrato) y de dónde toman los datos.', tono: 'gris', icono: 'settings' },
          { titulo: 'Plantillas', texto: 'El texto del documento, con versiones por fecha.', tono: 'azul', icono: 'pencil' },
          { titulo: 'Documentos', texto: 'Imprimir y consultar la bitácora de lo impreso.', tono: 'verde', icono: 'print' }
        ]"
        leyenda="Se configura de izquierda a derecha, pero en el día a día solo se usa la pestaña Documentos."
      />
    </AyudaSeccion>

    <AyudaSeccion id="doc-imprimir" numero="2" titulo="Imprimir un documento (uso diario)" descripcion="Lo que la mayoría de usuarios necesita.">
      <AyudaPasos
        :pasos="[
          { titulo: 'Entre a la pestaña «Documentos».', texto: 'Verá la bitácora: la lista de todo lo que se ha impreso.' },
          { titulo: 'Pulse el botón «Imprimir documento».', texto: 'Se abre una ventana para elegir qué imprimir.' },
          { titulo: 'Elija el «Tipo de documento».', texto: 'Por ejemplo: Contrato de matrícula.' },
          { titulo: 'Busque el registro (estudiante o matrícula).', texto: 'Escriba el nombre o el número y selecciónelo de la lista. También puede escribir el número de registro directamente.' },
          { titulo: 'Revise la vista previa.', texto: 'El documento aparece ya armado con los datos reales.' },
          { titulo: 'Imprima o descargue el PDF.', texto: 'El archivo PDF se nombra con el código del documento y el número del registro (ej: CONTRATO-345.pdf).' }
        ]"
      />
      <p class="text-slate-600">
        Busque este botón en la parte superior: <AyudaBoton icono="plus">Imprimir documento</AyudaBoton>
      </p>
      <AyudaNota tipo="info">
        Los documentos <strong>no se guardan</strong>: se arman de nuevo cada vez que se imprimen, con los datos
        actuales del sistema. La bitácora solo deja constancia de <em>quién</em> imprimió <em>qué</em> y <em>cuándo</em>.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="doc-bitacora" numero="3" titulo="La bitácora de impresiones">
      <p>Cada fila de la tabla es una impresión o un archivo subido. Use los filtros para encontrar algo rápido:</p>
      <ul class="list-inside list-disc space-y-1 text-slate-600">
        <li><strong>Buscar:</strong> por nombre del archivo subido.</li>
        <li><strong>Tipo de documento:</strong> solo contratos, solo constancias, etc.</li>
        <li><strong>Origen:</strong> impresiones hechas por el sistema o archivos subidos manualmente.</li>
        <li><strong>Limpiar:</strong> quita todos los filtros.</li>
      </ul>
      <p>Los botones de cada fila (columna <strong>Acciones</strong>, a la izquierda):</p>
      <AyudaIconos
        :items="[
          { icono: 'eye', nombre: 'Reimprimir en pantalla', texto: 'Vuelve a armar el documento y lo muestra para imprimirlo.' },
          { icono: 'download', nombre: 'Descargar PDF / Abrir archivo', texto: 'Baja el documento como PDF (o abre el archivo, si fue subido).' },
          { icono: 'trash', nombre: 'Eliminar de la bitácora', texto: 'Lo manda a la papelera (se puede restaurar).', clase: 'text-red-600' }
        ]"
      />
      <AyudaNota tipo="consejo">
        Si llega a esta pantalla desde una matrícula, verá una etiqueta azul «Solo impresiones del registro #…».
        Pulse <strong>Quitar</strong> para ver de nuevo toda la bitácora.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="doc-plantillas" numero="4" titulo="Plantillas y versiones" descripcion="Para quien redacta los documentos.">
      <p>
        Un mismo documento puede cambiar con el tiempo (por ejemplo, el contrato de 2025 y el de 2026). Por eso cada
        plantilla tiene <strong>versiones</strong>, y cada versión pasa por estos estados:
      </p>
      <AyudaFlujo
        :pasos="[
          { titulo: 'En proceso', texto: 'Borrador. Solo en este estado se puede editar el texto.', tono: 'ambar', icono: 'pencil' },
          { titulo: 'Aprobada', texto: 'Revisada y lista, pero todavía no se usa.', tono: 'azul', icono: 'check' },
          { titulo: 'Activa', texto: 'Es la que se usa al imprimir desde su fecha de inicio de vigencia.', tono: 'verde', icono: 'print' },
          { titulo: 'Inactiva', texto: 'Ya no se usa. Se conserva como historial.', tono: 'gris', icono: 'ban' }
        ]"
        leyenda="Ciclo de vida de una versión de plantilla."
      />
      <h3 class="pt-2 font-semibold text-slate-900">Crear una versión nueva</h3>
      <AyudaPasos
        :pasos="[
          { titulo: 'En la pestaña «Plantillas», pulse «Nueva versión».', texto: 'Elija el tipo de documento y póngale un nombre (ej: Contrato 2026). Se abre el editor.' },
          { titulo: 'Escriba el texto como en un procesador de palabras.', texto: 'Para volver a editarlo después, use el ícono del lápiz en la lista de versiones.' },
          { titulo: 'Inserte los datos variables desde el panel «Datos insertables».', texto: 'Busque el dato (nombre del estudiante, documento, valor, fecha…) y haga clic: aparece como una etiqueta de color en el texto. Al imprimir se reemplaza por el dato real.' },
          { titulo: 'Use «Previsualizar con datos reales» para comprobar cómo queda.' },
          { titulo: 'Guarde, y cuando esté lista pulse «Aprobar versión» y luego «Activar versión».', texto: 'Al activar se indica desde qué fecha empieza a regir.' }
        ]"
      />
      <AyudaNota tipo="consejo" titulo="Atajo: clonar">
        Para hacer un cambio pequeño, use <strong>Clonar como nuevo borrador</strong> sobre la versión actual. Así no
        empieza desde cero.
      </AyudaNota>
      <AyudaNota tipo="atencion">
        Si el editor marca algún dato <span class="font-semibold text-red-700">en rojo</span>, es un dato que ese tipo
        de documento no tiene habilitado. Quítelo o pida que se habilite en «Tipos de documento».
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="doc-version" numero="5" titulo="¿Qué versión se usa al reimprimir?">
      <p>Depende de cómo esté configurado el tipo de documento:</p>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 p-4">
          <p class="font-semibold text-slate-900">Documentos normales</p>
          <p class="text-slate-600">Constancias, cartas, sábanas de notas… Siempre usan la versión <strong>vigente hoy</strong>.</p>
        </div>
        <div class="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <p class="font-semibold text-blue-900">«Conforma la matrícula»</p>
          <p class="text-blue-900/80">
            Contratos, pagarés, hojas de matrícula… Usan la versión que estaba vigente <strong>en la fecha de la matrícula</strong>,
            aunque se reimpriman años después.
          </p>
        </div>
      </div>

      <!-- Línea de tiempo: ilustra la regla de «Conforma la matrícula» -->
      <figure class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <svg viewBox="0 0 640 170" class="w-full" role="img" aria-label="Línea de tiempo: una matrícula de marzo 2025 usa la versión 2025 del contrato aunque se reimprima en 2026">
          <line x1="20" y1="80" x2="620" y2="80" stroke="#94a3b8" stroke-width="2" />
          <rect x="20"  y="56" width="300" height="48" rx="10" fill="#dbeafe" stroke="#60a5fa" />
          <text x="170" y="85" text-anchor="middle" font-size="14" fill="#1e3a8a" font-weight="600">Contrato versión 2025</text>
          <rect x="320" y="56" width="300" height="48" rx="10" fill="#dcfce7" stroke="#4ade80" />
          <text x="470" y="85" text-anchor="middle" font-size="14" fill="#14532d" font-weight="600">Contrato versión 2026</text>
          <text x="20"  y="124" font-size="11" fill="#64748b">ene 2025</text>
          <text x="320" y="124" text-anchor="middle" font-size="11" fill="#64748b">ene 2026</text>
          <text x="620" y="124" text-anchor="end" font-size="11" fill="#64748b">hoy</text>
          <!-- Matrícula -->
          <circle cx="110" cy="30" r="7" fill="#213360" />
          <line x1="110" y1="37" x2="110" y2="56" stroke="#213360" stroke-width="2" />
          <text x="124" y="34" font-size="12" fill="#213360" font-weight="600">Matrícula: marzo 2025</text>
          <!-- Reimpresión -->
          <circle cx="560" cy="30" r="7" fill="#b45309" />
          <line x1="560" y1="37" x2="560" y2="56" stroke="#b45309" stroke-width="2" />
          <text x="546" y="34" text-anchor="end" font-size="12" fill="#b45309" font-weight="600">Se reimprime hoy</text>
          <path d="M548 150 C 420 168, 220 168, 118 112" stroke="#213360" stroke-width="2" fill="none" stroke-dasharray="5 4" marker-end="url(#doc-flecha)" />
          <defs>
            <marker id="doc-flecha" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="#213360" />
            </marker>
          </defs>
        </svg>
        <figcaption class="mt-2 text-center text-xs text-slate-500">
          Con «Conforma la matrícula», el contrato reimpreso hoy sale con la versión 2025, porque la matrícula es de marzo 2025.
        </figcaption>
      </figure>
    </AyudaSeccion>

    <AyudaSeccion id="doc-tipos" numero="6" titulo="Tipos de documento" descripcion="Configuración inicial; normalmente la hace un administrador.">
      <AyudaPasos
        :pasos="[
          { titulo: 'En la pestaña «Tipos de documento», pulse «Nuevo tipo».' },
          { titulo: 'Escriba un «Código» corto (ej: CONTRATO) y un «Nombre» (ej: Contrato de matrícula).' },
          { titulo: 'En «Toma los datos de», elija de dónde salen los datos (por ejemplo, de la matrícula).' },
          { titulo: 'Marque «Conforma la matrícula» solo en contratos, pagarés y hojas de matrícula.', texto: 'Luego elija la «Fecha de referencia» (normalmente, la fecha de matrícula).' },
          { titulo: 'En «Variables habilitadas», marque los datos que las plantillas podrán usar.' },
          { titulo: 'Guarde.' }
        ]"
      />
    </AyudaSeccion>

    <AyudaSeccion id="doc-faq" numero="7" titulo="Preguntas frecuentes">
      <AyudaPreguntas
        :preguntas="[
          { pregunta: 'No veo el botón «Imprimir documento».', respuesta: 'Su usuario no tiene el permiso para imprimir documentos. Solicítelo al administrador del sistema.' },
          { pregunta: 'Al imprimir me dice que no hay versión vigente.', respuesta: 'Ese tipo de documento no tiene ninguna versión Activa para la fecha. Pida a quien redacta las plantillas que active una.' },
          { pregunta: 'No puedo editar el texto de una plantilla.', respuesta: 'Solo se editan versiones «En proceso». Use «Clonar como nuevo borrador» para crear una versión editable a partir de la actual.' },
          { pregunta: 'Borré una entrada de la bitácora por error.', respuesta: 'Abra la «Papelera» y pulse «Restaurar». Solo «Eliminar definitivo» la borra para siempre.' },
          { pregunta: 'El documento salió con un dato equivocado.', respuesta: 'Corrija el dato en su módulo de origen (por ejemplo, en la matrícula o en el estudiante) y vuelva a imprimir: el documento siempre toma los datos actuales.' }
        ]"
      />
    </AyudaSeccion>
  </div>
</template>

<script setup>
import AyudaSeccion   from './AyudaSeccion.vue'
import AyudaPasos     from './AyudaPasos.vue'
import AyudaNota      from './AyudaNota.vue'
import AyudaFlujo     from './AyudaFlujo.vue'
import AyudaBoton     from './AyudaBoton.vue'
import AyudaIconos    from './AyudaIconos.vue'
import AyudaPreguntas from './AyudaPreguntas.vue'
</script>
