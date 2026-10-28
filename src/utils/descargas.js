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

/** Iframe de la última impresión; se reutiliza para no cerrar un diálogo aún abierto. */
let iframeImpresion = null

/**
 * Abre el diálogo de impresión del navegador con un PDF, sin salir de la página.
 *
 * El PDF se carga en un iframe oculto colgado de `<body>` (fuera de la app), así que
 * sobrevive a un cambio de ruta. El iframe anterior se descarta en la siguiente
 * impresión; si el navegador no deja imprimir el iframe, el PDF se abre en otra pestaña.
 *
 * @param {Blob|ArrayBuffer} contenido
 */
export function imprimirPdf(contenido) {
  const blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: 'application/pdf' })
  const pdf  = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' })

  if (iframeImpresion) {
    URL.revokeObjectURL(iframeImpresion.src)
    iframeImpresion.remove()
  }

  const url    = URL.createObjectURL(pdf)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  iframe.onload = () => {
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch {
      window.open(url, '_blank')
    }
  }
  iframe.src = url
  document.body.appendChild(iframe)
  iframeImpresion = iframe
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
