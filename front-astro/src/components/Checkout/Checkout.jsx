// src/components/Checkout/Checkout.jsx
import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { useAppContext } from '../../context/AppContext'
import { gqlRequest, REGISTRAR_PEDIDO } from '../../graphql/client'
import estilos from './Checkout.module.css'

export function Checkout({ onVolver, onPedidoConfirmado, user }) {
  const items = useCartStore((estado) => estado.items)
  const totalPrecio = useCartStore((estado) => estado.totalPrecio())
  const vaciarCarrito = useCartStore((estado) => estado.vaciarCarrito)
  const { formatearPrecio } = useAppContext()

  // Se prellenan con los datos de la cuenta de Google de la sesión, pero
  // siguen siendo editables por si el pedido es para otra persona.
  const [nombre, setNombre] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)

    try {
      const input = {
        clienteNombre: nombre,
        clienteEmail: email,
        items: items.map((item) => ({ productoId: item.id, cantidad: item.cantidad })),
      }
      const data = await gqlRequest(REGISTRAR_PEDIDO, { input })
      vaciarCarrito()
      onPedidoConfirmado(data.registrarPedido)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section>
      <button className={estilos.volver} onClick={onVolver}>
        ← Volver al carrito
      </button>
      <h2 className={estilos.titulo}>Checkout</h2>

      <form className={estilos.formulario} onSubmit={manejarEnvio}>
        <div className={estilos.campo}>
          <label htmlFor="nombre">Nombre completo</label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>

        <div className={estilos.campo}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
          />
        </div>

        <div className={estilos.resumen}>
          <span>{items.length} producto(s)</span>
          <strong>{formatearPrecio(totalPrecio)}</strong>
        </div>

        {error && <p className={estilos.errorTexto}>No se pudo registrar el pedido: {error}</p>}

        <button className={estilos.botonPagar} type="submit" disabled={enviando}>
          {enviando ? 'Registrando pedido…' : 'Confirmar pedido'}
        </button>
      </form>
    </section>
  )
}
