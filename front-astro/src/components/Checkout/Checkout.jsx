// src/components/Checkout/Checkout.jsx
import { useState } from 'react'
import { useCartStore } from '../../store/cartStore'
import { useAppContext } from '../../context/AppContext'

import estilos from './Checkout.module.css'

export function Checkout({ onVolver, onPedidoConfirmado, user }) {
  const items = useCartStore((estado) => estado.items)
  const totalPrecio = useCartStore((estado) => estado.totalPrecio())

  const { formatearPrecio } = useAppContext()

  // Se prellenan con los datos de la cuenta de Google de la sesión, pero
  // siguen siendo editables por si el pedido es para otra persona.
  const [nombre, setNombre] = useState(user?.name ?? '')
  const email = user?.email ?? ''
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [metodoPago, setMetodoPago] = useState('mercadopago')


async function manejarEnvio(evento) {
  evento.preventDefault()

  if (enviando || !items.length) return

  setEnviando(true)
  setError(null)

  try {
    const ruta = metodoPago === 'stripe' ? '/api/pagos/stripe/crear' : '/api/pagos/crear'
    const respuesta = await fetch(ruta, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre,
        items: items.map(({ id, cantidad }) => ({
          productoId: id,
          cantidad,
        })),
      }),
    })

    const datos = await respuesta.json()

    if (!respuesta.ok || !datos.url) {
      throw new Error(
        datos.error || 'No se pudo generar el pago.'
      )
    }

    localStorage.setItem(
      'betonos-ultimo-pedido',
      String(datos.pedidoId)
    )

    window.location.assign(datos.url)

  } catch (error) {
    setError(error.message)
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
        <fieldset style={{ marginBottom: 16 }}>
    <legend>Elige cómo pagar</legend>

    <label>
      <input
        type="radio"
        name="metodoPago"
        value="mercadopago"
        checked={metodoPago === 'mercadopago'}
        onChange={() => setMetodoPago('mercadopago')}
      />
      Mercado Pago
    </label>

    <label style={{ marginLeft: 16 }}>
      <input
        type="radio"
        name="metodoPago"
        value="stripe"
        checked={metodoPago === 'stripe'}
        onChange={() => setMetodoPago('stripe')}
      />
      Stripe
    </label>
  </fieldset>

        <div className={estilos.campo}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            readOnly
            placeholder="tucorreo@ejemplo.com"
          />
        </div>

        <div className={estilos.resumen}>
          <span>{items.length} producto(s)</span>
          <strong>{formatearPrecio(totalPrecio)}</strong>
        </div>

        {error && <p className={estilos.errorTexto}>No se pudo iniciar el pago: {error}</p>}

        <button type="submit" disabled={enviando}>
    {enviando
      ? 'Abriendo pasarela…'
      : `Pagar con ${metodoPago === 'stripe' ? 'Stripe' : 'Mercado Pago'}`}
  </button>
      </form>
    </section>
  )
}
