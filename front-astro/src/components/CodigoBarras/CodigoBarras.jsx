// src/components/CodigoBarras/CodigoBarras.jsx
// Dibuja un código de barras directo en la página con JsBarcode, en vez de
// mandar al cliente a verlo en el sitio de Mercado Pago: se queda dentro de
// Betonos. Lo usan tanto el checkout (ficha recién generada) como la página
// de estado del pedido (ficha guardada de una visita anterior).
import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import estilos from './CodigoBarras.module.css'

export function CodigoBarras({ valor }) {
  const svgRef = useRef(null)
  useEffect(() => {
    if (!svgRef.current || !valor) return
    try {
      JsBarcode(svgRef.current, valor, { format: 'EAN13', width: 2, height: 70, displayValue: true })
    } catch {
      // Si el largo no calza con EAN-13, se dibuja igual con un formato genérico.
      JsBarcode(svgRef.current, valor, { format: 'CODE128', width: 2, height: 70, displayValue: true })
    }
  }, [valor])
  return <svg ref={svgRef} className={estilos.codigoBarras} />
}
