// avisa en tiempo real cuando se confirma un pedido, via websocket (graphql subscription)
import { useEffect, useState } from 'react'
import { createClient } from 'graphql-ws'
import estilos from './NotificacionesAdmin.module.css'

const SUBSCRIPCION = `
  subscription {
    pedidoConfirmado { id estado total }
  }
`

export default function NotificacionesAdmin({ token, wsUrl }) {
  const [avisos, setAvisos] = useState([])

  useEffect(() => {
    if (!token || !wsUrl) return

    const client = createClient({ url: wsUrl, connectionParams: { token } })

    const cerrar = client.subscribe(
      { query: SUBSCRIPCION },
      {
        next: ({ data }) => {
          const pedido = data?.pedidoConfirmado
          if (!pedido) return
          setAvisos((lista) => [...lista, pedido])
          setTimeout(() => {
            setAvisos((lista) => lista.filter((p) => p.id !== pedido.id))
          }, 8000)
        },
        error: (err) => console.error('[Notificaciones admin]', err),
        complete: () => {},
      }
    )

    return () => cerrar()
  }, [token, wsUrl])

  if (avisos.length === 0) return null

  return (
    <div className={estilos.contenedor}>
      {avisos.map((pedido) => (
        <div key={pedido.id} className={estilos.aviso}>
          🔔 Pedido #{pedido.id} confirmado — ${pedido.total.toFixed(2)}
        </div>
      ))}
    </div>
  )
}
