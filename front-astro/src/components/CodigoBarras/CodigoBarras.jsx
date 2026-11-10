// dibuja el codigo de barras con JsBarcode, sin mandar al usuario a otro sitio
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
      // si no calza como EAN13 usamos CODE128
      JsBarcode(svgRef.current, valor, { format: 'CODE128', width: 2, height: 70, displayValue: true })
    }
  }, [valor])
  return <svg ref={svgRef} className={estilos.codigoBarras} />
}
