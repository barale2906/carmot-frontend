/**
 * Paleta compartida por los bloques del manual de ayudas: cada tono define
 * fondo, borde, texto y el color del círculo numerado.
 */
export const AYUDA_TONOS = {
  azul:  { caja: 'border-blue-200 bg-blue-50',     texto: 'text-blue-900',  marca: 'bg-blue-600 text-white' },
  verde: { caja: 'border-green-200 bg-green-50',   texto: 'text-green-900', marca: 'bg-green-600 text-white' },
  ambar: { caja: 'border-amber-200 bg-amber-50',   texto: 'text-amber-900', marca: 'bg-amber-500 text-white' },
  rojo:  { caja: 'border-red-200 bg-red-50',       texto: 'text-red-900',   marca: 'bg-red-600 text-white' },
  gris:  { caja: 'border-slate-200 bg-slate-50',   texto: 'text-slate-800', marca: 'bg-slate-500 text-white' },
  marca: { caja: 'border-[#213360]/20 bg-[#213360]/5', texto: 'text-[#213360]', marca: 'bg-[#213360] text-white' }
}

export const tono = (nombre) => AYUDA_TONOS[nombre] ?? AYUDA_TONOS.gris
