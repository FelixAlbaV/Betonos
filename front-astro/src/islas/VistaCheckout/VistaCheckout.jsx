// formulario de pago con Stripe/Mercado Pago, es pesada por los SDKs
// así que mejor no cargarla hasta que haga falta
import { AppProvider } from '../../context/AppContext'
import { Checkout } from '../../components/Checkout/Checkout'
import { useNavegacionStore, VISTAS } from '../../store/navegacionStore'

export default function VistaCheckout({ user }) {
  const vista = useNavegacionStore((estado) => estado.vista)
  const irACarrito = useNavegacionStore((estado) => estado.irACarrito)
  const confirmarPedido = useNavegacionStore((estado) => estado.confirmarPedido)

  if (vista !== VISTAS.CHECKOUT) return null

  return (
    <AppProvider>
      <div className="contenedor" style={{ paddingTop: 28 }}>
        <Checkout onVolver={irACarrito} onPedidoConfirmado={confirmarPedido} user={user} />
      </div>
    </AppProvider>
  )
}
