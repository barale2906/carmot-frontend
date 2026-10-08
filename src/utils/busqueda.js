/**
 * Utilidades puras de búsqueda de texto para listas de opciones (selects, checkboxes).
 */

/**
 * Pasa a minúsculas y quita tildes, para que "malaga" encuentre "Málaga".
 *
 * @param {*} texto
 * @returns {string}
 */
export function normalizarTexto(texto) {
  if (texto == null) return ''
  return String(texto).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Filtra opciones `{ label, description? }` cuyo texto contenga todas las palabras
 * buscadas, en cualquier orden ("bogota norte" encuentra "Sede Norte - Bogotá").
 *
 * @param {Array<{ label: *, description?: * }>} opciones
 * @param {string} consulta
 * @returns {Array}
 */
export function filtrarOpciones(opciones, consulta) {
  const palabras = normalizarTexto(consulta).split(/\s+/).filter(Boolean)
  if (!palabras.length) return opciones
  return opciones.filter((opcion) => {
    const texto = `${normalizarTexto(opcion.label)} ${normalizarTexto(opcion.description)}`
    return palabras.every((palabra) => texto.includes(palabra))
  })
}

/**
 * Compara el valor de una opción con el v-model como lo haría un <select> nativo:
 * los primitivos se igualan por su texto (5 === '5'); null y objetos, por identidad.
 */
export function mismoValor(a, b) {
  if (a === b) return true
  if (a == null || b == null || typeof a === 'object' || typeof b === 'object') return false
  return String(a) === String(b)
}
