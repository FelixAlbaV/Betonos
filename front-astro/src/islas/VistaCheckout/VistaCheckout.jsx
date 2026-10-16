// src/islas/VistaCheckout/VistaCheckout.jsx
//
// ISLA 5 de 7: Pago (Stripe / Mercado Pago).
//
// Qué hace: muestra el formulario de pago embebido. Es la isla "más
// pesada" (carga los SDKs de Stripe y Mercado Pago), así que es la que
// más se beneficia de NO cargarse hasta que realmente se necesita.
//
// Por qué client:idle: igual que PanelCarrito, no debe competir por
// recursos con el catálogo al cargar la página. Mientras vista !== "checkout"
// esta isla no pinta nada, aunque ya esté hidratada en segundo plano.
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
