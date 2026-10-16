// src/islas/PanelCarrito/PanelCarrito.jsx
//
// ISLA 4 de 7: Carrito de compras.
//
// Qué hace: muestra los productos agregados (vienen de cartStore, que ya
// existía) y permite ir a pagar. Se envuelve en su propio <AppProvider>
// porque necesita formatearPrecio() del contexto de la app; cada isla
// trae su propio Provider en vez de compartir uno global, precisamente
// para no depender de ningún otro componente de la página.
//
// Por qué client:idle: el carrito no se usa hasta que el usuario decide
// revisarlo, así que no vale la pena adelantarla antes que el catálogo.
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
