/**
 * Utilidades puras del dashboard de inicio: presentación de las secciones del
 * resumen (GET /dashboard/resumen) con los componentes de components/dashboard.
 */

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** Ícono y color de StatCard para cada tarjeta del backend. */
const ESTILO_TARJETA = {
  estudiantes_activos: { icon: 'estudiantes', iconVariant: 'blue' },
  citas_hoy:           { icon: 'calendario',  iconVariant: 'amber' },
  cartera_vencida:     { icon: 'cartera',     iconVariant: 'red' },
  bajo_stock:          { icon: 'inventario',  iconVariant: 'orange' }
}

/** Variante de AlertItem según la severidad que manda el backend. */
const VARIANTE_ALERTA = { danger: 'red', warning: 'yellow', info: 'blue' }

/** Ícono y color de ActivityItem por tipo de actividad. */
const ESTILO_ACTIVIDAD = {
  matricula: { icon: 'estudiantes', iconVariant: 'green' },
  pago:      { icon: 'cartera',     iconVariant: 'blue' }
}

/** Accesos rápidos: cada uno se muestra solo con su permiso. */
export const ACCESOS_RAPIDOS = [
  { permiso: 'aca_matriculaCrear',  title: 'Nueva matrícula',  description: 'Registrar un nuevo estudiante',    to: '/academico/matriculas?action=create', icon: 'estudiantes', iconVariant: 'blue' },
  { permiso: 'fin_reciboPagoCrear', title: 'Recibo de pago',   description: 'Registrar el pago de un estudiante', to: '/financiero/recibos-pago/nuevo',     icon: 'formularios', iconVariant: 'green' },
  { permiso: 'aca_asistencias',     title: 'Tomar asistencia', description: 'Lista de asistencia de una clase',  to: '/academico/asistencia',              icon: 'calendario',  iconVariant: 'purple' },
  { permiso: 'crm_referidos',       title: 'Leads del CRM',    description: 'Aspirantes, seguimientos y citas',  to: '/crm/referidos',                     icon: 'control-estudiantes', iconVariant: 'orange' }
]

/**
 * Accesos rápidos visibles con los permisos del usuario.
 * @param {(permiso: string) => boolean} can
 */
export function accesosVisibles(can) {
  return ACCESOS_RAPIDOS.filter(a => can(a.permiso))
}

/** Tarjeta del backend → props de StatCard. */
export function propsTarjeta(tarjeta) {
  const estilo = ESTILO_TARJETA[tarjeta.clave] ?? { icon: 'dashboard', iconVariant: 'slate' }
  return { title: tarjeta.titulo, value: tarjeta.valor, description: tarjeta.descripcion, ...estilo }
}

/** Alerta del backend → props de AlertItem. */
export function propsAlerta(alerta) {
  return {
    title:       alerta.titulo,
    description: alerta.descripcion,
    count:       alerta.cantidad,
    badgeLabel:  alerta.variante === 'danger' ? 'Urgente' : '',
    variant:     VARIANTE_ALERTA[alerta.variante] ?? 'blue'
  }
}

/**
 * "Hace 5 minutos", "Hace 3 horas", "Hace 2 días" o la fecha si pasó más de una semana.
 * @param {string} iso
 * @param {Date} [ahora]
 */
export function tiempoTranscurrido(iso, ahora = new Date()) {
  if (!iso) return ''
  const fecha    = new Date(iso)
  const minutos  = Math.max(0, Math.floor((ahora - fecha) / 60000))
  if (minutos < 1) return 'Hace un momento'
  if (minutos < 60) return `Hace ${minutos} minuto${minutos === 1 ? '' : 's'}`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} hora${horas === 1 ? '' : 's'}`
  const dias = Math.floor(horas / 24)
  if (dias <= 7) return `Hace ${dias} día${dias === 1 ? '' : 's'}`
  return fecha.toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })
}

/** Actividad del backend → props de ActivityItem. */
export function propsActividad(item, ahora = new Date()) {
  return {
    title:       item.titulo,
    description: item.descripcion,
    timeAgo:     tiempoTranscurrido(item.fecha, ahora),
    datetime:    item.fecha ?? '',
    ...(ESTILO_ACTIVIDAD[item.tipo] ?? ESTILO_ACTIVIDAD.matricula)
  }
}

/** "YYYY-MM-DD" → { mes: 'OCT', dia: '13' } sin desfase UTC. */
function mesDia(fecha) {
  const [, m, d] = String(fecha).split('-')
  return { mes: MESES[Number(m) - 1] ?? '', dia: d ?? '' }
}

/**
 * Evento del backend → props de EventItem. Un tramo de varios días (fecha_fin)
 * indica hasta cuándo va en el subtítulo.
 */
export function propsEvento(evento) {
  const inicio   = mesDia(evento.fecha)
  const fin      = evento.fecha_fin ? mesDia(evento.fecha_fin) : null
  const subtitle = [evento.subtitulo, fin && `hasta el ${fin.dia} ${fin.mes}`].filter(Boolean).join(' · ')
  return { month: inicio.mes, day: inicio.dia, title: evento.titulo, subtitle }
}

/** Texto de la tarjeta de retención; null si aún no hay matrículas en el periodo. */
export function textoRetencion(retencion) {
  if (!retencion || retencion.tasa === null || retencion.tasa === undefined) return null
  return {
    value:       `${String(retencion.tasa).replace('.', ',')} %`,
    description: `Últimos 12 meses: ${retencion.matriculas} matrículas, ${retencion.desertados} deserciones y ${retencion.retirados} retiros`
  }
}
