// muestra el carrito (cartStore) y deja ir a pagar
// cada isla trae su propio AppProvider para no depender de otro componente
import { AppProvider } from '../../context/AppContext'
import { Carrito } from '../../components/Carrito/Carrito'
import { useNavegacionStore, VISTAS } from '../../store/navegacionStore'

export default function PanelCarrito({ user }) {
  const vista = useNavegacionStore((estado) => estado.vista)
  const irAHome = useNavegacionStore((estado) => estado.irAHome)
  const irACheckout = useNavegacionStore((estado) => estado.irACheckout)

  if (vista !== VISTAS.CARRITO) return null

  return (
    <AppProvider>
      <div className="contenedor" style={{ paddingTop: 28 }}>
        <Carrito user={user} onVolver={irAHome} onIrACheckout={irACheckout} />
      </div>
    </AppProvider>
  )
}
