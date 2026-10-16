// src/islas/VistaConfirmacion/VistaConfirmacion.jsx
//
// ISLA 6 de 7: Confirmación de pedido (dentro del flujo de una sola página).
//
// Nota para quien siga el código: hoy el pago real redirige al navegador a
// la página /pago (front-astro/src/pages/pago.astro), que consulta el
// pedido directamente en el servidor (SSR) y no pasa por aquí. Esta isla
// se conserva porque navegacionStore.confirmarPedido() sigue existiendo y
// podría usarse en un flujo sin redirección a futuro; no se borró
// funcionalidad previa.
//
// Por qué client:idle: mismo criterio que las demás vistas "bajo demanda".
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
