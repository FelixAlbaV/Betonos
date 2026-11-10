// ojo: el pago real ahora redirige a /pago.astro (SSR) y no pasa por aquí,
// pero dejo esto porque confirmarPedido() del store todavía se usa
import { AppProvider } from '../../context/AppContext'
import { Confirmacion } from '../../components/Confirmacion/Confirmacion'
import { useNavegacionStore, VISTAS } from '../../store/navegacionStore'

export default function VistaConfirmacion() {
  const vista = useNavegacionStore((estado) => estado.vista)
  const ultimoPedido = useNavegacionStore((estado) => estado.ultimoPedido)
  const irAHome = useNavegacionStore((estado) => estado.irAHome)

  if (vista !== VISTAS.CONFIRMACION || !ultimoPedido) return null

  return (
    <AppProvider>
      <div className="contenedor" style={{ paddingTop: 28 }}>
        <Confirmacion pedido={ultimoPedido} onIrAHome={irAHome} />
      </div>
    </AppProvider>
  )
}
