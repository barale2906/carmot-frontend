/**
 * Dispara la descarga de un blob en el navegador con el nombre indicado.
 *
 * @param {Blob|ArrayBuffer} contenido
 * @param {string} nombreArchivo
 * @param {string} [tipo] - MIME type cuando `contenido` no es un Blob
 */
export function descargarBlob(contenido, nombreArchivo, tipo = 'application/octet-stream') {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Extrae el mensaje de error de una respuesta con `responseType: 'blob'`,
 * donde el JSON del backend llega envuelto en un Blob.
 *
 * @param {Object} error - Error de axios
 * @param {string} fallback
 */
export async function mensajeErrorBlob(error, fallback) {
  const data = error?.response?.data
  if (data instanceof Blob) {
    try {
      return JSON.parse(await leerTextoBlob(data))?.message ?? fallback
    } catch {
      return fallback
    }
  }
  return data?.message ?? fallback
}

/** `Blob.text()` con respaldo en FileReader (no disponible en todos los entornos). */
function leerTextoBlob(blob) {
  if (typeof blob.text === 'function') return blob.text()
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload  = () => resolve(lector.result)
    lector.onerror = () => reject(lector.error)
    lector.readAsText(blob)
  })
}
