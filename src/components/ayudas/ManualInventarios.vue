<template>
  <div class="space-y-6">

    <AyudaSeccion id="inv-que-es" numero="1" titulo="¿Para qué sirve este módulo?">
      <p>
        Controla los <strong>productos físicos</strong> que el instituto vende o entrega a los estudiantes (uniformes,
        botas, material didáctico…): cuántos hay en cada almacén, a qué precio se venden, quién los compró y si ya se
        entregaron. Lo encuentra en el menú lateral <AyudaBoton variante="icono" icono="menu" /> → <strong>Inventario</strong>.
      </p>
      <p>El módulo se organiza en cinco grupos de pantallas (pestañas en la parte superior):</p>

      <!-- Mapa del módulo -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="grupo in MAPA_MODULO" :key="grupo.titulo" class="rounded-xl border p-3" :class="[tono(grupo.tono).caja, tono(grupo.tono).texto]">
          <div class="flex items-center gap-2">
            <span class="flex size-7 items-center justify-center rounded-full" :class="tono(grupo.tono).marca">
              <NavIcon :name="grupo.icono" class="!size-4" />
            </span>
            <p class="text-sm font-semibold leading-tight">{{ grupo.titulo }}</p>
          </div>
          <ul class="mt-2 space-y-0.5 text-xs opacity-80">
            <li v-for="pantalla in grupo.pantallas" :key="pantalla">• {{ pantalla }}</li>
          </ul>
        </div>
      </div>
    </AyudaSeccion>

    <AyudaSeccion id="inv-productos" numero="2" titulo="Los tres tipos de producto" descripcion="Entender esto evita la mayoría de confusiones.">
      <!-- Diagrama Simple → Grupo → Kit con el ejemplo del uniforme -->
      <figure class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div class="flex flex-col items-center gap-3">
          <div class="rounded-xl border-2 border-violet-300 bg-violet-50 px-4 py-2 text-center">
            <p class="text-[11px] font-medium uppercase tracking-wide text-violet-600">Kit</p>
            <p class="font-semibold text-violet-900">Uniforme</p>
            <p class="text-xs text-violet-700">1 × Camisas + 1 × Botas</p>
          </div>
          <!-- Conector del kit hacia sus dos grupos (en móvil se apilan y basta la flecha) -->
          <div class="flex w-full flex-col items-center" aria-hidden="true">
            <div class="h-3 w-0.5 bg-slate-300" />
            <div class="hidden h-3 w-1/2 rounded-t border-x-2 border-t-2 border-slate-300 sm:block" />
            <span class="text-slate-400 sm:hidden">↓</span>
          </div>
          <div class="grid w-full gap-4 sm:grid-cols-2">
            <div v-for="grupo in EJEMPLO_GRUPOS" :key="grupo.nombre" class="flex flex-col items-center gap-2">
              <div class="rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-2 text-center">
                <p class="text-[11px] font-medium uppercase tracking-wide text-blue-600">Grupo</p>
                <p class="font-semibold text-blue-900">{{ grupo.nombre }}</p>
              </div>
              <span class="text-slate-400" aria-hidden="true">↓</span>
              <div class="flex flex-wrap justify-center gap-1.5">
                <span v-for="variante in grupo.variantes" :key="variante" class="rounded-lg border border-green-300 bg-green-50 px-2 py-1 text-xs text-green-900">
                  <span class="block text-[10px] uppercase text-green-600">Simple</span>{{ variante }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <figcaption class="mt-3 text-center text-xs text-slate-500">Ejemplo: el kit «Uniforme» se arma con grupos, y cada grupo reúne productos simples (tallas o números).</figcaption>
      </figure>
      <div class="grid gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-green-200 p-4">
          <p class="font-semibold text-green-800">Simple</p>
          <p class="text-slate-600">Un producto concreto que <strong>sí tiene existencias</strong> en el almacén. Ej: «Camisa talla M».</p>
        </div>
        <div class="rounded-xl border border-blue-200 p-4">
          <p class="font-semibold text-blue-800">Grupo</p>
          <p class="text-slate-600">Reúne simples parecidos como <strong>variantes</strong> (tallas, colores, números). Ej: «Camisas».</p>
        </div>
        <div class="rounded-xl border border-violet-200 p-4">
          <p class="font-semibold text-violet-800">Kit</p>
          <p class="text-slate-600">Un paquete formado por grupos. <strong>No tiene existencias propias</strong>: al entregarlo, el estudiante elige su talla.</p>
        </div>
      </div>
      <AyudaNota tipo="consejo" titulo="Orden recomendado para crear productos">
        Primero los <strong>simples</strong>, luego los <strong>grupos</strong> (agregando los simples como variantes)
        y al final los <strong>kits</strong>. El botón «Nuevo producto» abre un asistente que explica cada tipo con dibujos.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="inv-configurar" numero="3" titulo="Configuración inicial" descripcion="Se hace una sola vez; normalmente la hace un administrador.">
      <AyudaFlujo
        :pasos="[
          { titulo: 'Catálogos', texto: 'Categorías, unidades de medida, almacenes (y sus cajeros) y proveedores.', tono: 'gris', icono: 'settings' },
          { titulo: 'Productos', texto: 'Simples, grupos y kits.', tono: 'azul', icono: 'inventario' },
          { titulo: 'Stock inicial', texto: 'Cargue las existencias desde Excel en «Stock».', tono: 'ambar', icono: 'warehouse' },
          { titulo: 'Precios', texto: 'Cree la lista de precios, apruébela y actívela.', tono: 'verde', icono: 'payments' }
        ]"
        leyenda="Con estos cuatro pasos el inventario ya está listo para vender."
      />
      <h3 class="pt-2 font-semibold text-slate-900">Listas de precios</h3>
      <p>En <strong>Facturación de inventario → Precios de venta</strong>. Cada lista pasa por estos estados:</p>
      <AyudaFlujo
        :pasos="[
          { titulo: 'En proceso', texto: 'Se agregan y ajustan los precios.', tono: 'ambar' },
          { titulo: 'Aprobada', texto: 'Revisada por quien tiene permiso.', tono: 'azul' },
          { titulo: 'Activa', texto: 'Se usa en las ventas dentro de sus fechas.', tono: 'verde' },
          { titulo: 'Inactiva', texto: 'Ya no se usa.', tono: 'gris' }
        ]"
      />
      <AyudaNota tipo="consejo">
        Para una lista nueva parecida a la actual (por ejemplo, la del próximo año), use <strong>Clonar</strong> y
        solo cambie los precios que suben.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="inv-vender" numero="4" titulo="Vender (Caja / Ventas)" descripcion="La tarea más frecuente.">
      <p>Vaya a <strong>Ventas y entregas → Caja / Ventas</strong> y pulse <AyudaBoton icono="plus">Nueva venta</AyudaBoton>. Un asistente de 3 pasos le guía:</p>
      <AyudaFlujo
        :pasos="[
          { titulo: 'Estudiante', texto: 'Busque al estudiante (o regístrelo) y elija el almacén de donde sale el producto.', tono: 'marca', icono: 'people' },
          { titulo: 'Productos', texto: 'Agregue productos al carrito, cantidades y descuentos. Verá si hay existencias.', tono: 'marca', icono: 'inventario' },
          { titulo: 'Pago', texto: 'Registre uno o varios medios de pago y confirme.', tono: 'marca', icono: 'payments' }
        ]"
      />

      <h3 class="pt-2 font-semibold text-slate-900">El «semáforo» de existencias</h3>
      <p>Junto a cada producto del carrito aparece una etiqueta de color que le dice qué pasará con la entrega:</p>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="estado in SEMAFORO" :key="estado.texto" class="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
          <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" :class="estado.clase">
            <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />{{ estado.texto }}
          </span>
          <span class="text-xs text-slate-600">{{ estado.significa }}</span>
        </li>
      </ul>
      <AyudaNota tipo="info" titulo="Se puede vender sin existencias">
        El sistema <strong>nunca bloquea una venta</strong> por falta de stock. Lo que no se pueda entregar hoy queda
        pendiente en la pantalla <strong>Entregas</strong> para despacharlo cuando llegue.
      </AyudaNota>

      <h3 class="pt-2 font-semibold text-slate-900">Casillas de cada producto</h3>
      <ul class="list-inside list-disc space-y-1 text-slate-600">
        <li><strong>No entregar ahora:</strong> el estudiante paga hoy pero recoge el producto otro día.</li>
        <li><strong>Solo entrega completa:</strong> el estudiante no quiere recibir por partes; se entrega todo junto o nada.</li>
        <li><strong>Elige variante:</strong> en los kits, seleccione la talla o número de cada componente.</li>
      </ul>

      <h3 class="pt-2 font-semibold text-slate-900">Medios de pago</h3>
      <p>
        Efectivo, transferencia, tarjeta débito o crédito y cheque. Puede combinar varios (por ejemplo, parte en efectivo
        y parte con tarjeta). Algunos medios tienen <strong>sobrecargo</strong>; el total con sobrecargos se muestra antes de confirmar.
        Si el estudiante no paga todo, la diferencia queda como <strong>saldo pendiente</strong>.
      </p>
    </AyudaSeccion>

    <AyudaSeccion id="inv-pedido" numero="5" titulo="La vida de un pedido">
      <p>Cada venta crea un <strong>pedido</strong>. Su estado cambia así:</p>
      <AyudaFlujo
        :pasos="[
          { titulo: 'Activo', texto: 'Tiene saldo pendiente. Se completa con abonos.', tono: 'ambar' },
          { titulo: 'Pagado', texto: 'Pagado del todo; falta entregar.', tono: 'azul' },
          { titulo: 'Entregando', texto: 'Se entregó una parte.', tono: 'marca' },
          { titulo: 'Entregado', texto: 'El estudiante recibió todo.', tono: 'verde' }
        ]"
        leyenda="Un pedido también puede terminar en «Cancelado»."
      />
      <p>Acciones de cada pedido en la tabla:</p>
      <AyudaIconos
        :items="[
          { icono: 'eye', nombre: 'Ver detalle / imprimir recibo', texto: 'Muestra el recibo para imprimirlo o enviarlo por correo.' },
          { icono: 'receipt', nombre: 'Abonar al pedido', texto: 'Registra un pago adicional sobre el saldo pendiente.' },
          { icono: 'trash', nombre: 'Cancelar pedido', texto: 'Lo cancela SIN devolver productos al almacén.', clase: 'text-amber-600' },
          { icono: 'track_changes', nombre: 'Anular pedido', texto: 'Lo anula y DEVUELVE los productos al almacén.', clase: 'text-red-600' }
        ]"
      />
      <AyudaNota tipo="atencion" titulo="¿Cancelar o anular?">
        Use <strong>Anular</strong> si los productos vuelven físicamente al almacén (se reintegra el stock).
        Use <strong>Cancelar</strong> si no vuelven (por ejemplo, ya se entregaron y no se devolvieron).
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="inv-transferencias" numero="6" titulo="Pagos por transferencia" descripcion="Requieren la aprobación de un validador.">
      <AyudaFlujo
        :pasos="[
          { titulo: 'Cajero registra la venta', texto: 'Con medio «Transferencia» y el comprobante (foto o PDF).', tono: 'marca', icono: 'receipt' },
          { titulo: 'Pendiente de aprobación', texto: 'El recibo queda en espera. El cajero pulsa notificar.', tono: 'ambar', icono: 'mail' },
          { titulo: 'Validador revisa', texto: 'En «Transferencias» compara el comprobante con el banco.', tono: 'azul', icono: 'eye' },
          { titulo: 'Aprobada o rechazada', texto: 'Si se aprueba, el pago queda en firme.', tono: 'verde', icono: 'check' }
        ]"
      />
      <AyudaNota tipo="consejo">
        Adjunte siempre una foto clara del comprobante con el <strong>número de transacción</strong> visible; así el
        validador aprueba más rápido.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="inv-entregas" numero="7" titulo="Entregar productos pendientes">
      <p>En <strong>Ventas y entregas → Entregas</strong> están los pedidos pagados que aún tienen productos por entregar.</p>
      <AyudaPasos
        :pasos="[
          { titulo: 'Busque el pedido del estudiante en la lista de entregas pendientes.' },
          { titulo: 'Productos simples: indique la cantidad que entrega hoy.', texto: 'Puede entregar una parte; el resto sigue pendiente.' },
          { titulo: 'Kits: elija la variante (talla/número) de cada componente.', texto: 'O use «Entregar todo lo disponible» para despachar lo que haya en existencia.' },
          { titulo: 'Confirme la entrega.', texto: 'El stock se descuenta del almacén automáticamente.' }
        ]"
      />
      <AyudaNota tipo="info">
        Si el estudiante pidió «Solo entrega completa» y falta algo, el sistema le avisa. Puede esperar o, si el
        estudiante acepta, usar <strong>Entregar de todos modos</strong>.
      </AyudaNota>
      <p>
        Debajo verá <strong>Necesidades de compra pendientes</strong>: los productos vendidos que no hay en existencia.
        Úsela para saber qué pedir al proveedor.
      </p>
    </AyudaSeccion>

    <AyudaSeccion id="inv-stock" numero="8" titulo="Existencias y movimientos">
      <p>
        En <strong>Stock</strong> consulta cuántas unidades hay de cada producto en cada almacén. Marque
        <strong>Ver solo bajo stock</strong> para ver lo que se está agotando.
      </p>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200 p-3">
          <p class="font-semibold text-slate-900">Unidades físicas</p>
          <p class="text-xs text-slate-600">Lo que hay en la estantería.</p>
        </div>
        <div class="rounded-xl border border-slate-200 p-3">
          <p class="font-semibold text-slate-900">Reservadas</p>
          <p class="text-xs text-slate-600">Ya vendidas, esperando entrega.</p>
        </div>
        <div class="rounded-xl border border-green-200 bg-green-50/60 p-3">
          <p class="font-semibold text-green-900">Disponibles</p>
          <p class="text-xs text-green-800">Físicas − reservadas: lo que se puede vender.</p>
        </div>
      </div>
      <p>En <strong>Movimientos</strong> se registra todo lo que entra o sale del almacén por fuera de las ventas:</p>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs text-slate-500">
            <tr><th class="px-3 py-2 font-medium">Tipo</th><th class="px-3 py-2 font-medium">¿Cuándo usarlo?</th><th class="px-3 py-2 font-medium">Ejemplo</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mov in MOVIMIENTOS" :key="mov.tipo">
              <td class="px-3 py-2 font-medium" :class="mov.clase">{{ mov.tipo }}</td>
              <td class="px-3 py-2 text-slate-600">{{ mov.cuando }}</td>
              <td class="px-3 py-2 text-slate-500">{{ mov.ejemplo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AyudaNota tipo="atencion">
        Un movimiento no se borra: si se equivocó, use <strong>Anular movimiento</strong> e indique el motivo. Así queda la trazabilidad.
      </AyudaNota>
    </AyudaSeccion>

    <AyudaSeccion id="inv-compras" numero="9" titulo="Órdenes de compra" descripcion="Para pedir mercancía a los proveedores.">
      <AyudaFlujo
        :pasos="[
          { titulo: 'Borrador', texto: 'Se crea con proveedor, almacén destino y productos.', tono: 'gris', icono: 'pencil' },
          { titulo: 'Enviada', texto: 'Se envió al proveedor.', tono: 'azul', icono: 'mail' },
          { titulo: 'Recibida parcial', texto: 'Llegó una parte de lo pedido.', tono: 'ambar', icono: 'warehouse' },
          { titulo: 'Recibida', texto: 'Llegó todo. Las existencias ya suman.', tono: 'verde', icono: 'check' }
        ]"
        leyenda="Mientras está en Borrador o Enviada, la orden se puede cancelar."
      />
      <AyudaPasos
        :pasos="[
          { titulo: 'Cree la orden con el botón «Nueva orden de compra».' },
          { titulo: 'Cuando la envíe al proveedor, pulse «Enviar OC al proveedor».' },
          { titulo: 'Al llegar la mercancía, pulse «Recepcionar mercancía».', texto: 'Escriba las cantidades y precios reales recibidos. Las existencias aumentan solas.' }
        ]"
      />
    </AyudaSeccion>

    <AyudaSeccion id="inv-faq" numero="10" titulo="Preguntas frecuentes">
      <AyudaPreguntas
        :preguntas="[
          { pregunta: 'Un producto no aparece al buscarlo en la venta.', respuesta: 'Verifique que esté activo y que tenga precio en una lista de precios activa y vigente.' },
          { pregunta: 'El estudiante pagó pero no se llevó el producto.', respuesta: 'Quedó pendiente en «Entregas». Despáchelo desde allí cuando lo recoja.' },
          { pregunta: 'No aparece el banco al pagar con transferencia.', respuesta: 'El banco debe estar activo en Configuración → Bancos.' },
          { pregunta: 'Las existencias del sistema no coinciden con las reales.', respuesta: 'Haga un conteo físico y registre un movimiento de «Ajuste» (positivo o negativo) con el motivo.' },
          { pregunta: '¿Cómo paso productos de una sede a otra?', respuesta: 'Registre un movimiento de «Traslado» indicando el almacén de origen y el de destino.' },
          { pregunta: '¿Dónde reimprimo un recibo?', respuesta: 'En «Facturación de inventario → Recibos de pago», o desde el detalle del pedido en «Caja / Ventas».' }
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
import { tono }       from './ayudaTonos.js'

// Refleja los grupos de InventarioLayout.vue
const MAPA_MODULO = [
  { titulo: 'Catálogos',                 tono: 'gris',  icono: 'settings',   pantallas: ['Categorías', 'Unidades de medida', 'Productos', 'Almacenes', 'Proveedores'] },
  { titulo: 'Stock y movimientos',       tono: 'ambar', icono: 'warehouse',  pantallas: ['Stock', 'Movimientos'] },
  { titulo: 'Ventas y entregas',         tono: 'marca', icono: 'payments',   pantallas: ['Caja / Ventas', 'Entregas'] },
  { titulo: 'Facturación de inventario', tono: 'verde', icono: 'receipt',    pantallas: ['Precios de venta', 'Recibos de pago', 'Transferencias'] },
  { titulo: 'Órdenes de compra',         tono: 'azul',  icono: 'inventario', pantallas: ['Órdenes de compra'] }
]

const EJEMPLO_GRUPOS = [
  { nombre: 'Camisas', variantes: ['Talla S', 'Talla M', 'Talla L'] },
  { nombre: 'Botas',   variantes: ['N.º 38', 'N.º 39', 'N.º 40'] }
]

// Mismos textos y colores que muestra InvVentaItemEntrega.vue
const SEMAFORO = [
  { texto: 'Se entrega ahora',             clase: 'bg-green-100 text-green-800', significa: 'Hay existencias: sale del almacén con esta venta.' },
  { texto: 'Entrega parcial — faltan 2',   clase: 'bg-amber-100 text-amber-800', significa: 'Se entrega una parte; el resto queda pendiente.' },
  { texto: 'Queda pendiente de entrega',   clase: 'bg-slate-200 text-slate-700', significa: 'No hay existencias: se entregará cuando lleguen.' },
  { texto: 'Elige la variante',            clase: 'bg-blue-100 text-blue-800',   significa: 'Falta escoger talla o número en un kit.' },
  { texto: 'Se entregará después',         clase: 'bg-slate-100 text-slate-600', significa: 'Marcó «No entregar ahora».' }
]

const MOVIMIENTOS = [
  { tipo: 'Entrada',    clase: 'text-green-700', cuando: 'Llega mercancía sin orden de compra.',       ejemplo: 'Donación de 20 cuadernos.' },
  { tipo: 'Ajuste',     clase: 'text-amber-700', cuando: 'Corregir diferencias tras un conteo físico.', ejemplo: 'Se encontraron 2 camisas dañadas (−2).' },
  { tipo: 'Traslado',   clase: 'text-blue-700',  cuando: 'Mover productos entre almacenes.',            ejemplo: '10 overoles de la sede Norte a la Sur.' },
  { tipo: 'Devolución', clase: 'text-violet-700', cuando: 'Un producto vuelve al almacén.',              ejemplo: 'El estudiante cambia unas botas.' },
  { tipo: 'Salida',     clase: 'text-red-700',   cuando: 'La genera el sistema al vender/entregar.',    ejemplo: 'Entrega de un uniforme.' }
]
</script>
