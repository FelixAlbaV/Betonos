// src/islas/ModalProducto/ModalProducto.jsx
//
// ISLA 7 de 7: Modal de detalle de producto.
//
// Qué hace: el modal puede abrirse encima del catálogo o de una categoría,
// por eso su condición (productoId !== null) es independiente de "vista".
// Usa un <Portal> para pintarse fuera del árbol de las otras islas, igual
// que hacía antes dentro de App.jsx.
//
// Por qué client:idle: solo se activa cuando el usuario hace clic en un
// producto; no hay razón para adelantar su hidratación.
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
