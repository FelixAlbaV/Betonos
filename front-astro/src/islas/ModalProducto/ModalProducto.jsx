// modal de producto, puede abrirse sobre el catálogo o una categoría,
// por eso depende de productoId y no de "vista"
import { AppProvider } from '../../context/AppContext'
import { ProductoDetalle } from '../../components/ProductoDetalle/ProductoDetalle'
import { useNavegacionStore } from '../../store/navegacionStore'

export default function ModalProducto({ user }) {
  const productoId = useNavegacionStore((estado) => estado.productoId)
  const cerrarProducto = useNavegacionStore((estado) => estado.cerrarProducto)

  if (!productoId) return null

  return (
    <AppProvider>
      <ProductoDetalle productoId={productoId} onCerrar={cerrarProducto} user={user} />
    </AppProvider>
  )
}
