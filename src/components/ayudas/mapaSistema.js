/**
 * Mapa del sistema: etapas de puesta en marcha en el orden en que se configuran,
 * con los flujos de cada módulo (cada flujo es una cadena de pasos) y las etapas
 * de las que depende. Lo usan el inicio de Ayudas (ManualMapaSistema) y su índice.
 *
 * `manual` es la `clave` del manual de AyudasView que amplía la etapa, si existe.
 */
export const ETAPAS_SISTEMA = [
  {
    id: 'mapa-configuracion', titulo: 'Configuración base', icono: 'settings', tono: 'marca',
    menu: 'Configuración',
    descripcion: 'Lo primero: quién entra al sistema, en qué sedes trabaja y qué días no hay clase.',
    flujos: [
      { nombre: 'Accesos', pasos: ['Roles y permisos', 'Usuarios (rol y sedes asignadas)'] },
      { nombre: 'Sedes', pasos: ['Área', 'Sede (ciudad, áreas y horario de atención)', 'Horarios de la sede (se generan solos)'] },
      { nombre: 'Calendario', pasos: ['Festivos del año', 'Vacaciones colectivas', 'Días institucionales por sede'] },
      { nombre: 'Catálogos', pasos: ['Poblaciones (precargadas)', 'EPS (una a una o por CSV)', 'Bancos'] }
    ]
  },
  {
    id: 'mapa-plan', titulo: 'Plan de estudios', icono: 'book', tono: 'azul',
    menu: 'Académico → Gestión de cursos',
    descripcion: 'Qué se enseña. Cada nivel suma la duración del anterior.',
    requiere: ['Configuración base'],
    flujos: [
      { nombre: 'Contenido', pasos: ['Tema (horas)', 'Tópico (agrupa temas)', 'Módulo (agrupa tópicos)', 'Curso (ordena sus módulos)'] }
    ]
  },
  {
    id: 'mapa-oferta', titulo: 'Oferta académica', icono: 'calendario', tono: 'azul',
    menu: 'Académico → Gestión de cursos / Programaciones',
    descripcion: 'Cuándo, dónde y con quién se dicta cada curso.',
    requiere: ['Sedes y áreas', 'Plan de estudios', 'Profesores', 'Calendario'],
    flujos: [
      { nombre: 'Cohorte', pasos: ['Grupo (sede, módulo, profesor y horario en áreas de la sede)', 'Ciclo (sede, curso y sus grupos; fecha de fin automática)', 'Programación académica (opcional)'] },
      { nombre: 'Siguiente cohorte', pasos: ['Ciclo', 'Clonar ciclo'] },
      { nombre: 'Suspensiones', pasos: ['Aplazar ciclo', 'Ampliar o interrumpir', 'Confirmar (revertir: solo superusuario)'] }
    ]
  },
  {
    id: 'mapa-precios', titulo: 'Precios y descuentos', icono: 'payments', tono: 'verde',
    menu: 'Financiero → Listas de precios / Descuentos / Conceptos de pago',
    descripcion: 'Cuánto cuesta cada curso y qué descuentos o recargos aplican. Todo pasa por aprobación.',
    requiere: ['Plan de estudios'],
    flujos: [
      { nombre: 'Lista de precios', pasos: ['Tipo de producto', 'Producto (vinculado al curso)', 'Lista de precios (poblaciones y vigencia)', 'Precios (contado = matrícula + financiado)', 'Aprobar', 'Activar'] },
      { nombre: 'Descuentos y recargos', pasos: ['Crear (pronto pago, promoción, código, medio de pago, mora)', 'Aprobar', 'Activar'] },
      { nombre: 'Otros cobros', pasos: ['Conceptos de pago'] }
    ]
  },
  {
    id: 'mapa-documentos', titulo: 'Documentos', icono: 'description', tono: 'verde',
    menu: 'Académico → Documentación', manual: 'documentacion',
    descripcion: 'Contratos, pagarés, certificados y diplomas que se generan con los datos de la matrícula.',
    requiere: ['Configuración base'],
    flujos: [
      { nombre: 'Plantillas', pasos: ['Tipo de documento (entidad y variables habilitadas)', 'Plantilla (texto y bloques)', 'Aprobar', 'Activar desde una fecha'] }
    ]
  },
  {
    id: 'mapa-crm', titulo: 'Captación (CRM)', icono: 'track_changes', tono: 'ambar',
    menu: 'CRM → Leads / Seguimientos / Agendas',
    descripcion: 'Los interesados antes de matricularse. Cada lead tiene un asesor que lo lleva hasta el final.',
    requiere: ['Plan de estudios', 'Usuarios'],
    flujos: [
      { nombre: 'Lead', pasos: ['Lead (curso y asesor)', 'Seguimientos', 'Citas en la agenda', 'Convertir en matrícula'] },
      { nombre: 'Reasignación', pasos: ['Cambiar el asesor', 'Queda en la bitácora del lead'] }
    ]
  },
  {
    id: 'mapa-matricula', titulo: 'Matrícula', icono: 'academico', tono: 'marca',
    menu: 'Académico → Matrículas', manual: 'matriculas',
    descripcion: 'Aquí se unen las ramas anteriores: el estudiante entra a un ciclo con un precio de lista.',
    requiere: ['Oferta académica', 'Precios y descuentos', 'Documentos', 'Captación (opcional)'],
    flujos: [
      { nombre: 'Inscripción', pasos: ['Estudiante', 'Matrícula (curso, ciclo y precio)', 'Cartera (cuotas automáticas)', 'Contrato y pagaré'] }
    ]
  },
  {
    id: 'mapa-caja', titulo: 'Caja, recibos y cartera', icono: 'cartera', tono: 'verde',
    menu: 'Financiero → Mi caja / Recibos de pago / Cartera / Libro diario',
    descripcion: 'Todo pago se registra dentro de un turno de caja abierto.',
    requiere: ['Matrícula'],
    flujos: [
      { nombre: 'Turno de caja', pasos: ['Abrir turno (base inicial)', 'Recibos, movimientos y consignaciones', 'Cerrar turno (conteo ciego)', 'Aprobar o rechazar (otro usuario)'] },
      { nombre: 'Transferencia', pasos: ['Registrar con comprobante', 'Notificar', 'Aprobar (no quien la registró)'] },
      { nombre: 'Cartera', pasos: ['Cuotas vencidas', 'Mora diaria', 'Acuerdo de pago'] }
    ]
  },
  {
    id: 'mapa-clases', titulo: 'Clases, asistencia y notas', icono: 'event_note', tono: 'azul',
    menu: 'Académico → Asistencia / Calificaciones',
    descripcion: 'El día a día del profesor con los estudiantes de su grupo.',
    requiere: ['Oferta académica', 'Matrícula'],
    flujos: [
      { nombre: 'Asistencia', pasos: ['Configuración de asistencia (mínimo y pérdida por fallas)', 'Clases programadas (se generan del horario)', 'Tomar asistencia'] },
      { nombre: 'Notas', pasos: ['Esquema de calificación del grupo (pesos al 100 %)', 'Registrar notas', 'Sábana de notas'] }
    ]
  },
  {
    id: 'mapa-cierre', titulo: 'Cierre y certificación', icono: 'school', tono: 'marca',
    menu: 'Académico → Matrículas → Estado académico',
    descripcion: 'El final de la matrícula. Graduar exige notas aprobadas y asistencia cumplida.',
    requiere: ['Clases, asistencia y notas', 'Documentos'],
    flujos: [
      { nombre: 'Graduación', pasos: ['Evaluación de cierre', 'Graduado', 'Certificado de notas y diploma'] },
      { nombre: 'Sin aprobar', pasos: ['Evaluación de cierre', 'Reprobado (también por fallas)', 'Puede matricularse de nuevo'] },
      { nombre: 'Otros estados', pasos: ['Aplazado', 'Retirado o desertado'] }
    ]
  },
  {
    id: 'mapa-inventario', titulo: 'Inventario y ventas', icono: 'inventario', tono: 'ambar',
    menu: 'Inventario', manual: 'inventarios',
    descripcion: 'Dotación y material que se compra, se guarda en los almacenes de cada sede y se vende a los estudiantes.',
    requiere: ['Sedes', 'Usuarios'],
    flujos: [
      { nombre: 'Catálogo', pasos: ['Unidades, categorías y proveedores', 'Almacenes (sede y usuarios)', 'Productos (simple, grupo con variantes, kit)'] },
      { nombre: 'Existencias', pasos: ['Orden de compra (borrador → enviada)', 'Recibir', 'Traslado al punto de venta'] },
      { nombre: 'Venta', pasos: ['Lista de precios de inventario (aprobar y activar)', 'Venta (pedido y abonos en la caja)', 'Entrega'] }
    ]
  },
  {
    id: 'mapa-activos', titulo: 'Activos fijos', icono: 'construction', tono: 'gris',
    menu: 'Inventario de activos → Categorías / Activos',
    descripcion: 'Equipos y mobiliario de cada sede, con su historial.',
    requiere: ['Sedes y áreas'],
    flujos: [
      { nombre: 'Ciclo de vida', pasos: ['Categoría', 'Activo (sede, área y responsable)', 'Traslado o mantenimiento', 'Baja definitiva'] }
    ]
  },
  {
    id: 'mapa-biblioteca', titulo: 'Biblioteca', icono: 'biblioteca', tono: 'gris',
    menu: 'Académico → Biblioteca',
    descripcion: 'Material de estudio disponible para los cursos.',
    requiere: ['Plan de estudios'],
    flujos: [
      { nombre: 'Material', pasos: ['Curso', 'Archivo de biblioteca'] }
    ]
  },
  {
    id: 'mapa-tableros', titulo: 'Indicadores y tableros', icono: 'dashboard', tono: 'gris',
    menu: 'Dashboard',
    descripcion: 'Se arma al final, cuando ya hay datos de las demás etapas.',
    requiere: ['Matrícula', 'Caja, recibos y cartera'],
    flujos: [
      { nombre: 'Tablero', pasos: ['KPI (modelo, operación y campo)', 'Tablero', 'Tarjetas (agrupadas por sede)'] }
    ]
  }
]
