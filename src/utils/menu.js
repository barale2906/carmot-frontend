/**
 * Reglas puras del menú lateral: qué ítem corresponde a la ruta visitada
 * y qué dropdown debe quedar abierto por ella.
 */

/**
 * La ruta visitada es la del ítem o una subruta suya. Las rutas `#...` son
 * agrupadores de sub-dropdowns (no navegan) y nunca coinciden.
 *
 * @param {string} itemRoute
 * @param {string} path
 */
export function rutaCoincide(itemRoute, path) {
  if (!itemRoute || itemRoute.startsWith('#') || !path) return false
  return path === itemRoute || path.startsWith(`${itemRoute}/`)
}

/** Algún descendiente del ítem (a cualquier nivel) corresponde a la ruta visitada. */
export function contieneRutaActiva(item, path) {
  return (item?.children ?? []).some((child) => rutaCoincide(child.route, path) || contieneRutaActiva(child, path))
}

/**
 * Id del dropdown de un nivel que contiene la ruta visitada, o null si ninguno.
 *
 * @param {Array<{ id: string, children?: Array }>} items - Ítems hermanos de un mismo nivel
 * @param {string} path
 */
export function dropdownActivoId(items, path) {
  return (items ?? []).find((item) => item.children?.length && contieneRutaActiva(item, path))?.id ?? null
}
