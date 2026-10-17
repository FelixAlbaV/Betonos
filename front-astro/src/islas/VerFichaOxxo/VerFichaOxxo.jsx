// src/islas/VerFichaOxxo/VerFichaOxxo.jsx
//
// Isla pequeña para "Mi cuenta": si este pedido pendiente tiene una ficha
// de OXXO guardada en el navegador (useOxxoStore), muestra un link directo
// a /pago?pedido=X para volver a ver el código de barras. Si el pedido se
// generó en otro navegador/dispositivo, no hay ficha guardada aquí y la
// isla simplemente no muestra nada.
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
