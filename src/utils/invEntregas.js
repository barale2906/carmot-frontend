/**
 * Reglas puras de la bandeja de entregas de inventario (simples y kits).
 * Se basan en la respuesta enriquecida de GET /inventarios/entregas/pendientes.
 */

export const ESTADO_ENTREGA_LABEL = {
  pendiente: 'Pendiente',
  parcial:   'Parcial',
  entregado: 'Entregado',
  completo:  'Completo',
}

/** Unidades que aún faltan por entregar de un ítem simple. */
export function pendienteSimple(item) {
  const entrega = item.entrega_simple ?? {}
  return entrega.cantidad_pendiente ?? Math.max(0, (item.cantidad ?? 0) - (entrega.cantidad_entregada ?? 0))
}

/** El ítem ya no tiene nada por entregar. */
export function itemEntregado(item) {
  if (item.entrega_kit)    return item.entrega_kit.status === 'completo'
  if (item.entrega_simple) return item.entrega_simple.status === 'entregado'
  return false
}

/**
 * Stock efectivo de un componente de kit en el almacén del pedido.
 * En componentes `grupo` sin variante asignada depende de la variante elegida en pantalla;
 * sin elección no hay producto del cual informar stock (0).
 */
export function stockComponente(comp, varianteElegidaId = null) {
  if (comp.producto_entregado || comp.componente_tipo !== 'grupo') return comp.stock_disponible ?? 0
  if (!varianteElegidaId) return 0
  return comp.variantes?.find(v => v.id === Number(varianteElegidaId))?.stock_disponible ?? 0
}

/** Cantidad propuesta para entregar: lo pendiente, limitado por el stock. */
export function cantidadSugerida(pendiente, stock) {
  return Math.max(0, Math.min(pendiente, stock ?? 0))
}

/**
 * Arma el arreglo `componentes` para entregar-componentes / completar.
 * @param {Array}  componentes - Componentes del kit (respuesta de pendientes)
 * @param {Object} seleccion   - { [componenteId]: { variante, cantidad } }
 * @param {{ incluirCantidad?: boolean }} [opciones]
 */
export function payloadComponentes(componentes, seleccion = {}, { incluirCantidad = true } = {}) {
  return componentes.map((comp) => {
    const sel   = seleccion[comp.id] ?? {}
    const linea = { kit_componente_id: comp.kit_componente_id }
    if (comp.componente_tipo === 'grupo' && !comp.producto_entregado && sel.variante) {
      linea.producto_entregado_id = Number(sel.variante)
    }
    if (incluirCantidad && sel.cantidad && sel.cantidad < comp.cantidad_pendiente) {
      linea.cantidad = Number(sel.cantidad)
    }
    return linea
  })
}

/**
 * Interpreta la respuesta de un endpoint de entrega.
 * Un 200 no implica que se entregó: con status `pendiente` no se descargó inventario,
 * ya sea por falta de stock o porque la marca `entrega_completa` lo bloqueó.
 * @param {{ message?: string, data?: { status: string } }} res
 * @param {{ entrega_completa?: boolean }} item
 * @returns {{ tipo: 'exito'|'parcial'|'bloqueado'|'sin_stock', mensaje: string }}
 */
export function interpretarResultadoEntrega(res, item) {
  const status  = res?.data?.status
  const mensaje = res?.message ?? ''
  if (status === 'entregado' || status === 'completo') return { tipo: 'exito',   mensaje: mensaje || 'Entrega completada.' }
  if (status === 'parcial')                            return { tipo: 'parcial', mensaje: mensaje || 'Entrega parcial registrada.' }
  if (item?.entrega_completa) {
    return { tipo: 'bloqueado', mensaje: mensaje || 'El ítem exige entrega completa y el stock no alcanza: no se descargó inventario.' }
  }
  return { tipo: 'sin_stock', mensaje: mensaje || 'Stock insuficiente: no se descargó inventario.' }
}
