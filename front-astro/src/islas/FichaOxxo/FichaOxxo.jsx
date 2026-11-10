// muestra de nuevo el codigo de barras de oxxo si el pedido sigue pendiente
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
