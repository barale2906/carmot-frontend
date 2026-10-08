/**
 * Utilidades puras de calendario (fechas como texto 'YYYY-MM-DD', sin zona horaria).
 */

export const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/** Iniciales de los días de la semana, empezando en lunes. */
export const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/** Clases Tailwind por tipo de día no laborable (celda del calendario y badge). */
export const ESTILOS_TIPO_DIA = {
  festivo:       { celda: 'bg-red-500 text-white',     badge: 'bg-red-100 text-red-800',       punto: 'bg-red-500' },
  vacaciones:    { celda: 'bg-sky-500 text-white',     badge: 'bg-sky-100 text-sky-800',       punto: 'bg-sky-500' },
  institucional: { celda: 'bg-violet-500 text-white',  badge: 'bg-violet-100 text-violet-800', punto: 'bg-violet-500' },
  otro:          { celda: 'bg-slate-500 text-white',   badge: 'bg-slate-100 text-slate-700',   punto: 'bg-slate-500' }
}

/**
 * Convierte año, mes (0-11) y día a 'YYYY-MM-DD'.
 * @param {number} anio
 * @param {number} mes  0 = enero
 * @param {number} dia
 */
export function toIsoDate(anio, mes, dia) {
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * Celdas de un mes en una grilla semanal que inicia en lunes.
 * Los huecos antes del día 1 son `null` para alinear la primera semana.
 * @param {number} anio
 * @param {number} mes  0 = enero
 * @returns {Array<{ dia: number, fecha: string, domingo: boolean } | null>}
 */
export function buildMonthGrid(anio, mes) {
  const primerDia = new Date(anio, mes, 1).getDay()     // 0 = domingo
  const huecos    = (primerDia + 6) % 7                 // lunes = 0
  const diasMes   = new Date(anio, mes + 1, 0).getDate()

  const celdas = Array.from({ length: huecos }, () => null)
  for (let dia = 1; dia <= diasMes; dia++) {
    celdas.push({
      dia,
      fecha: toIsoDate(anio, mes, dia),
      domingo: (huecos + dia - 1) % 7 === 6
    })
  }
  return celdas
}

/**
 * Formatea 'YYYY-MM-DD' como "Lunes, 16 de noviembre de 2026" sin desfase de zona horaria.
 * @param {string} fecha
 */
export function formatFechaLarga(fecha) {
  if (!fecha) return '—'
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`)
  if (isNaN(d.getTime())) return fecha
  const texto = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * Formatea 'YYYY-MM-DD' como "16/11/2026" sin desfase de zona horaria.
 * @param {string} fecha
 */
export function formatFechaCorta(fecha) {
  if (!fecha) return '—'
  const d = new Date(`${String(fecha).slice(0, 10)}T00:00:00`)
  if (isNaN(d.getTime())) return fecha
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
