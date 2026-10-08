/**
 * Concatena los campos de nombre de un usuario en un string legible.
 * Soporta tanto el campo calculado `name` (legado) como los campos
 * primer_nombre / segundo_nombre / primer_apellido / segundo_apellido.
 *
 * @param {object} usuario
 * @returns {string}
 */
export function nombreCompleto(usuario) {
  if (!usuario) return ''

  const partes = [
    usuario.primer_nombre,
    usuario.segundo_nombre,
    usuario.primer_apellido,
    usuario.segundo_apellido
  ].filter(Boolean)

  if (partes.length > 0) return partes.join(' ')

  return usuario.name ?? usuario.email ?? ''
}

/**
 * Convierte bancos `{ id, nombre, codigo? }` en opciones de select: "Bancolombia (007)".
 *
 * @param {Array<{ id: number, nombre: string, codigo?: string }>} bancos
 * @returns {Array<{ value: number, label: string }>}
 */
export function opcionesBanco(bancos) {
  return (bancos ?? []).map((b) => ({
    value: b.id,
    label: b.codigo ? `${b.nombre} (${b.codigo})` : b.nombre
  }))
}
