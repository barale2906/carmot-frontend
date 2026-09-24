/**
 * useDisponibilidadVenta
 *
 * Consulta con debounce qué parte del carrito de una venta de inventario se puede
 * entregar en el acto con el stock del almacén. Es solo informativo: el stock nunca
 * impide facturar, únicamente define qué se descarga ahora y qué queda pendiente.
 *
 * Se vuelve a consultar cuando cambia el almacén, un producto, su cantidad, la marca
 * `entrega_completa` o la variante elegida para un componente de kit.
 *
 * @param {{ items: Ref<Array>, almacenId: Ref<string|number> }} refs
 *   items: [{ producto_id, cantidad, entrega_completa, variantes: { [kit_componente_id]: producto_id } }]
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'

import invVentaService from '@/services/invVentaService.js'

const DEBOUNCE_MS = 400

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades puras
// ─────────────────────────────────────────────────────────────────────────────

/** Convierte el mapa { kit_componente_id: producto_id } en el arreglo que espera el backend. */
export function variantesSeleccionadas(variantes = {}) {
  return Object.entries(variantes)
    .filter(([, productoId]) => productoId)
    .map(([kitComponenteId, productoId]) => ({
      kit_componente_id:     Number(kitComponenteId),
      producto_entregado_id: Number(productoId),
    }))
}

function componentesSinVariante(disp) {
  return (disp?.componentes ?? []).filter(c => c.requiere_variante && !c.producto_entregado_id)
}

/**
 * Estado de entrega de una línea del carrito para el semáforo.
 * @param {{ entregar: boolean, entrega_completa: boolean }} item
 * @param {Object|null} disp - Ítem de la respuesta de verificar-disponibilidad
 * @returns {{ tono: 'ok'|'parcial'|'pendiente'|'variante'|'diferido'|'cargando', texto: string }}
 */
export function estadoEntregaItem(item, disp) {
  if (!item.entregar) return { tono: 'diferido', texto: 'Se entregará después' }
  if (!disp)          return { tono: 'cargando', texto: 'Verificando stock...' }
  if (disp.entregable_ahora) return { tono: 'ok', texto: 'Se entrega ahora' }

  const sinVariante = disp.tipo === 'kit' ? componentesSinVariante(disp).length > 0 : disp.requiere_variante
  if (sinVariante) return { tono: 'variante', texto: 'Elige la variante para entregarlo' }

  if (item.entrega_completa) return { tono: 'pendiente', texto: 'Queda pendiente de entrega (entrega completa)' }
  if (disp.cantidad_entregable > 0) return { tono: 'parcial', texto: `Entrega parcial — faltan ${disp.faltante}` }

  // Un kit sin unidades completas igual entrega los componentes que sí tienen stock
  const algunComponente = (disp.componentes ?? []).some(c => c.cantidad_entregable > 0)
  if (algunComponente) return { tono: 'parcial', texto: 'Entrega parcial — faltan componentes' }

  return { tono: 'pendiente', texto: 'Queda pendiente de entrega' }
}

/** Estado de un componente de kit dentro del desplegable del carrito. */
export function estadoEntregaComponente(comp) {
  if (comp.requiere_variante && !comp.producto_entregado_id) return { tono: 'variante', texto: 'Elige variante' }
  if (comp.entregable_ahora) return { tono: 'ok', texto: 'Disponible' }
  if (comp.cantidad_entregable > 0) return { tono: 'parcial', texto: `Faltan ${comp.faltante}` }
  return { tono: 'pendiente', texto: 'Sin stock' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────

export function useDisponibilidadVenta({ items, almacenId }) {
  const disponibilidad      = ref(null)
  const verificando         = ref(false)
  const errorDisponibilidad = ref('')

  let timer     = null
  let consultaId = 0

  const itemsValidos = computed(() => items.value.every(i => Number(i.cantidad) >= 1))

  function buildPayload() {
    return {
      almacen_id: Number(almacenId.value),
      items: items.value.map(i => {
        const linea     = { producto_id: i.producto_id, cantidad: Number(i.cantidad), entrega_completa: !!i.entrega_completa }
        const variantes = variantesSeleccionadas(i.variantes)
        if (variantes.length) linea.variantes = variantes
        return linea
      }),
    }
  }

  async function verificar() {
    if (!almacenId.value || !items.value.length || !itemsValidos.value) {
      disponibilidad.value = null
      return
    }
    const id = ++consultaId
    verificando.value         = true
    errorDisponibilidad.value = ''
    try {
      const res = await invVentaService.verificarDisponibilidad(buildPayload())
      if (id === consultaId) disponibilidad.value = res.data ?? res
    } catch (e) {
      if (id === consultaId) {
        disponibilidad.value      = null
        errorDisponibilidad.value = e?.response?.data?.message ?? 'No se pudo verificar el stock. La venta se puede registrar igual.'
      }
    } finally {
      if (id === consultaId) verificando.value = false
    }
  }

  function programarVerificacion() {
    clearTimeout(timer)
    timer = setTimeout(verificar, DEBOUNCE_MS)
  }

  // Firma de lo que afecta al cálculo de stock; `entregar` no se envía al backend
  const firmaCarrito = computed(() => JSON.stringify([
    almacenId.value,
    items.value.map(i => [i.producto_id, i.cantidad, !!i.entrega_completa, variantesSeleccionadas(i.variantes)]),
  ]))

  watch(firmaCarrito, programarVerificacion)
  onBeforeUnmount(() => clearTimeout(timer))

  /** Respuesta de disponibilidad de la línea en la posición `index` del carrito. */
  function disponibilidadDe(index) {
    // Se valida el producto para no mostrar datos de otra línea mientras llega la nueva consulta
    const productoId = items.value[index]?.producto_id
    return disponibilidad.value?.items?.find(d => d.item_index === index && d.producto_id === productoId) ?? null
  }

  return { disponibilidad, verificando, errorDisponibilidad, disponibilidadDe, verificar }
}
