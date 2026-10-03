// src/components/App.jsx
import { useEffect, useState } from 'react'
import { AppProvider } from '../context/AppContext'
import { useFlujoCompra } from '../hooks/useFlujoCompra'
import { gqlRequest, OBTENER_CATEGORIAS } from '../graphql/client'

import { TopBar } from './TopBar/TopBar'
import { Footer } from './Footer/Footer'
import { Home } from './Home/Home'
import { CategoriaDetalle } from './CategoriaDetalle/CategoriaDetalle'
import { ProductoDetalle } from './ProductoDetalle/ProductoDetalle'
import { Carrito } from './Carrito/Carrito'
import { Checkout } from './Checkout/Checkout'
import { Confirmacion } from './Confirmacion/Confirmacion'
import { Skeleton } from './Skeleton/Skeleton'

import '../global.css'

function AppInterna({ user }) {
  const flujo = useFlujoCompra()
  const [categorias, setCategorias] = useState([])
  const [cargandoCategorias, setCargandoCategorias] = useState(true)

  // Las categorías se cargan una sola vez al montar la app (dependencia []),
  // y se comparten entre Home y el Sidebar sin volver a pedirlas.
  useEffect(() => {
    gqlRequest(OBTENER_CATEGORIAS)
      .then((data) => setCategorias(data.categorias))
      .catch((err) => console.error('Error al cargar categorías:', err))
      .finally(() => setCargandoCategorias(false))
  }, [])

  return (
    <div>
      <TopBar onIrAHome={flujo.irAHome} onIrACarrito={flujo.irACarrito} user={user} />

      <div className="contenedor" style={{ paddingTop: 24 }}>
        {cargandoCategorias && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Skeleton width="220px" height="220px" />
            <Skeleton height="220px" />
          </div>
        )}
      </div>

      {!cargandoCategorias && flujo.vista === flujo.VISTAS.HOME && (
        <Home categorias={categorias} onSeleccionarCategoria={flujo.irACategoria} />
      )}

      {flujo.vista === flujo.VISTAS.CATEGORIA && (
        <div className="contenedor" style={{ paddingTop: 28 }}>
          <CategoriaDetalle
            categoriaId={flujo.categoriaId}
            categoriaNombre={flujo.categoriaNombre}
            onVolver={flujo.irAHome}
            onAbrirProducto={flujo.abrirProducto}
          />
        </div>
      )}

      {flujo.vista === flujo.VISTAS.CARRITO && (
        <div className="contenedor" style={{ paddingTop: 28 }}>
          <Carrito onVolver={flujo.irAHome} onIrACheckout={flujo.irACheckout} />
        </div>
      )}

      {flujo.vista === flujo.VISTAS.CHECKOUT && (
        <div className="contenedor" style={{ paddingTop: 28 }}>
          <Checkout onVolver={flujo.irACarrito} onPedidoConfirmado={flujo.confirmarPedido} user={user} />
        </div>
      )}

      {flujo.vista === flujo.VISTAS.CONFIRMACION && (
        <div className="contenedor" style={{ paddingTop: 28 }}>
          <Confirmacion pedido={flujo.ultimoPedido} onIrAHome={flujo.irAHome} />
        </div>
      )}

      {/* El modal de producto puede abrirse encima de Home o de CategoriaDetalle;
          por eso su condición es independiente de "vista". */}
      {flujo.productoId && (
        <ProductoDetalle productoId={flujo.productoId} onCerrar={flujo.cerrarProducto} />
      )}

      <Footer />
    </div>
  )
}

export default function App({ user }) {
  return (
    <AppProvider>
      <AppInterna user={user} />
    </AppProvider>
  )
}
