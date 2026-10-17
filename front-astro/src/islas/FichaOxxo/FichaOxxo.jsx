// src/islas/FichaOxxo/FichaOxxo.jsx
//
// Isla de la página /pago: si este pedido se pagó con OXXO y sigue
// PENDIENTE, vuelve a mostrar el código de barras guardado en el navegador
// (useOxxoStore, localStorage) — así el cliente puede regresar a esta
// página el tiempo que quiera sin tener que generar otra ficha.
import { CodigoBarras } from '../../components/CodigoBarras/CodigoBarras'
import { useOxxoStore } from '../../store/oxxoStore'

export default function FichaOxxo({ pedidoId }) {
  const ficha = useOxxoStore((estado) => estado.obtenerFicha(pedidoId))

  if (!ficha) return null

  return (
    <div>
      <p>Referencia: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{ficha.referencia}</strong></p>
      {ficha.codigoBarras && <CodigoBarras valor={ficha.codigoBarras} />}
    </div>
  )
}
