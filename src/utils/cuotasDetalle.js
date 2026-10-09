/**
 * Utilidades para el valor individual de cada cuota de una lista de precios
 * (campo `cuotas_detalle` de /precios-producto).
 */

/**
 * Reparte el saldo a financiar en `numeroCuotas` cuotas redondeadas al 100.
 * La última cuota absorbe la diferencia para que la suma sea exactamente el total.
 *
 * @param {number|string} total          Saldo a financiar
 * @param {number|string} numeroCuotas   Cantidad de cuotas
 * @returns {string[]} Valores como texto (listos para v-model de inputs numéricos)
 */
export function repartirCuotas(total, numeroCuotas) {
  const t = parseFloat(total)
  const n = parseInt(numeroCuotas, 10)
  if (!t || !n || n < 1) return []
  const base = Math.round(t / n / 100) * 100
  const cuotas = Array(n).fill(base)
  cuotas[n - 1] = Math.round((t - base * (n - 1)) * 100) / 100
  return cuotas.map(String)
}

/** Suma de los valores (ignora vacíos). */
export function sumaCuotas(cuotas) {
  const suma = (cuotas ?? []).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)
  return Math.round(suma * 100) / 100
}

/**
 * Valida cuotas individuales contra el plan (misma regla que el backend).
 *
 * @returns {string|null} Mensaje de error o null si cuadra
 */
export function mensajeCuotasDetalle(cuotas, total, numeroCuotas) {
  const n = parseInt(numeroCuotas, 10)
  if (!Array.isArray(cuotas) || cuotas.length !== n) {
    return 'La cantidad de valores de cuotas debe ser igual al número de cuotas.'
  }
  if (cuotas.some((v) => v === '' || isNaN(parseFloat(v)) || parseFloat(v) < 0)) {
    return 'Cada cuota debe tener un valor mayor o igual a 0.'
  }
  const diff = Math.abs(sumaCuotas(cuotas) - (parseFloat(total) || 0))
  if (diff > 0.01) return 'La suma de las cuotas debe ser igual al total financiado.'
  return null
}

/** Convierte los valores del formulario a números para enviarlos al API. */
export function cuotasDetalleParaApi(cuotas) {
  return cuotas.map((v) => parseFloat(v))
}
