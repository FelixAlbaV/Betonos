// si hay ficha oxxo guardada en localStorage mostramos el link a /pago
import { useOxxoStore } from '../../store/oxxoStore'

export default function VerFichaOxxo({ pedidoId }) {
  const ficha = useOxxoStore((estado) => estado.obtenerFicha(pedidoId))
  if (!ficha) return null

  return (
    <a href={`/pago?pedido=${encodeURIComponent(pedidoId)}`}>
      Ver mi ficha de pago OXXO →
    </a>
  )
}
