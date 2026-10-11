/**
 * Reglas puras del libro diario: cálculo de impuestos y retenciones de un movimiento.
 *
 *   valor_total = subtotal + Σ impuestos que suman − Σ retenciones
 *
 * Los valores se redondean a pesos enteros. El backend recalcula los totales y
 * acepta una diferencia de hasta $1 con el total enviado.
 */

/** Efecto del impuesto sobre el total (coincide con LdImpuesto del backend). */
export const EFECTO_SUMA = 1
export const EFECTO_RESTA = 2

/** Clase del tipo de movimiento (coincide con LdTipoMovimiento del backend). */
export const CLASE_EGRESO = 1
export const CLASE_INGRESO = 2

const aNumero = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Formatea un valor en pesos colombianos sin decimales: 1500000 → "$ 1.500.000". */
export function formatCOP(valor) {
  return `$ ${aNumero(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

/**
 * Totales a partir del subtotal y los valores de impuestos ya calculados (o ajustados a mano).
 *
 * @param {number|string} subtotal
 * @param {Array<{ efecto: number, valor: number|string }>} impuestos
 * @returns {{ total_impuestos: number, total_retenciones: number, valor_total: number }}
 */
export function totalesMovimiento(subtotal, impuestos = []) {
  let suma = 0
  let resta = 0
  for (const imp of impuestos) {
    if (Number(imp.efecto) === EFECTO_RESTA) resta += aNumero(imp.valor)
    else suma += aNumero(imp.valor)
  }
  return {
    total_impuestos: suma,
    total_retenciones: resta,
    valor_total: aNumero(subtotal) + suma - resta,
  }
}

/**
 * Calcula el valor de cada impuesto sobre el subtotal y los totales.
 *
 * @param {number|string} subtotal
 * @param {Array<{ efecto: number, porcentaje: number|string }>} impuestos
 * @returns {{ subtotal: number, impuestos: Array, total_impuestos: number, total_retenciones: number, valor_total: number }}
 */
export function calcularDesdeSubtotal(subtotal, impuestos = []) {
  const base = Math.round(aNumero(subtotal))
  const conValor = impuestos.map((imp) => ({ ...imp, valor: Math.round(base * aNumero(imp.porcentaje) / 100) }))
  return { subtotal: base, impuestos: conValor, ...totalesMovimiento(base, conValor) }
}

/**
 * Despeja el subtotal a partir del valor total y los porcentajes:
 * subtotal = total / (1 + Σ% que suman − Σ% de retenciones). La diferencia por
 * redondeo se absorbe en el subtotal para que el total quede exactamente igual al ingresado.
 *
 * @param {number|string} total
 * @param {Array<{ efecto: number, porcentaje: number|string }>} impuestos
 */
export function calcularDesdeTotal(total, impuestos = []) {
  const objetivo = Math.round(aNumero(total))
  const factor = impuestos.reduce((f, imp) => {
    const pct = aNumero(imp.porcentaje) / 100
    return Number(imp.efecto) === EFECTO_RESTA ? f - pct : f + pct
  }, 1)

  if (factor <= 0) return calcularDesdeSubtotal(0, impuestos)

  const calculo = calcularDesdeSubtotal(objetivo / factor, impuestos)
  const ajuste = objetivo - calculo.valor_total
  return { ...calculo, subtotal: calculo.subtotal + ajuste, valor_total: objetivo }
}

/**
 * Agrupa el resumen de un turno en las filas que muestra la UI.
 *
 * @param {object|null} resumen - `resumen` de un turno de caja
 * @returns {Array<{ clave: string, label: string, valor: number }>}
 */
export function filasResumenTurno(resumen) {
  if (!resumen) return []
  return [
    { clave: 'base', label: 'Base inicial', valor: resumen.base_inicial ?? 0 },
    { clave: 'academico', label: 'Recibos académicos', valor: resumen.ingresos?.academico ?? 0 },
    { clave: 'inventario', label: 'Recibos de inventario', valor: resumen.ingresos?.inventario ?? 0 },
    { clave: 'otros', label: 'Otros ingresos', valor: resumen.ingresos?.otros ?? 0 },
    { clave: 'egresos', label: 'Egresos', valor: resumen.egresos ?? 0 },
    { clave: 'consignaciones', label: 'Consignaciones', valor: resumen.consignaciones ?? 0 },
  ]
}

/** Tamaño máximo de un soporte (coincide con ArchivoService::MAX_KB del backend). */
export const MAX_SOPORTE_BYTES = 10 * 1024 * 1024
const EXTENSIONES_SOPORTE = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

/**
 * Valida un archivo de soporte antes de subirlo.
 *
 * @param {File} archivo
 * @returns {string|null} Mensaje de error, o null si es válido
 */
export function validarArchivoSoporte(archivo) {
  const extension = (archivo?.name ?? '').split('.').pop().toLowerCase()
  if (!EXTENSIONES_SOPORTE.includes(extension)) {
    return `"${archivo?.name}" no es PDF ni imagen (JPG, PNG, WEBP).`
  }
  if (archivo.size > MAX_SOPORTE_BYTES) {
    return `"${archivo.name}" pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB; el máximo es 10 MB.`
  }
  return null
}

/**
 * Tipo de vista previa de un soporte según su MIME type.
 *
 * @param {string|null} mime
 * @returns {'imagen'|'pdf'|null}
 */
export function tipoVistaPrevia(mime) {
  if (mime?.startsWith('image/')) return 'imagen'
  if (mime === 'application/pdf') return 'pdf'
  return null
}

/**
 * Desglose de todos los medios de pago de un turno (incluidos los que están en cero),
 * en el orden del catálogo de medios, con sus totales. `porOrigen` es false en los
 * resúmenes congelados antes de existir el desglose por académico/inventario/otros.
 *
 * @param {object|null} resumen - `resumen` de un turno de caja
 * @param {Record<string, string>} etiquetas - { efectivo: 'Efectivo', ... }
 */
export function filasMediosPago(resumen, etiquetas = {}) {
  const porMedio = resumen?.por_medio_pago ?? {}
  const claves = [...new Set([...Object.keys(etiquetas), ...Object.keys(porMedio)])]
  const campos = ['academico', 'inventario', 'otros', 'ingresos', 'egresos']

  const filas = claves.map((medio) => ({
    medio,
    label: etiquetas[medio] ?? medio,
    ...Object.fromEntries(campos.map((c) => [c, aNumero(porMedio[medio]?.[c])])),
  }))
  const totales = Object.fromEntries(campos.map((c) => [c, filas.reduce((t, f) => t + f[c], 0)]))

  const porOrigen = Object.values(porMedio).some((m) => m && 'academico' in m)

  return { filas: resumen ? filas : [], totales, porOrigen }
}

/** Largo mínimo de un motivo (rechazo, reversión, anulación, autorización); coincide con el backend. */
export const MIN_MOTIVO = 5

/**
 * Valida el motivo de una acción de control antes de enviarla.
 *
 * @param {string} texto
 * @returns {string|null} Mensaje de error, o null si es válido
 */
export function validarMotivo(texto) {
  const largo = (texto ?? '').trim().length
  if (!largo) return 'Escriba el motivo.'
  if (largo < MIN_MOTIVO) return `El motivo debe tener al menos ${MIN_MOTIVO} caracteres.`
  return null
}
