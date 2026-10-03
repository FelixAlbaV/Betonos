// src/components/ProductoDetalle/ProductoDetalle.jsx
import { useEffect, useState } from 'react'
import { Portal } from '../Portal/Portal'
import { gqlRequest, OBTENER_PRODUCTO } from '../../graphql/client'
import { useAppContext } from '../../context/AppContext'
import { useCartStore } from '../../store/cartStore'
import { Skeleton } from '../Skeleton/Skeleton'
import { obtenerImagenProducto } from '../../utils/imagenesProductos'
import estilos from './ProductoDetalle.module.css'

export function ProductoDetalle({ productoId, onCerrar }) {
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [agregado, setAgregado] = useState(false)

  const { formatearPrecio } = useAppContext()
  const agregarItem = useCartStore((estado) => estado.agregarItem)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setAgregado(false)

    gqlRequest(OBTENER_PRODUCTO, { id: productoId })
      .then((data) => {
        if (!cancelado) setProducto(data.producto)
      })
      .catch((err) => {
        if (!cancelado) setError(err.message)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })

    return () => {
      cancelado = true
    }
  }, [productoId])

  function manejarAgregar() {
    agregarItem(producto)
    setAgregado(true)
  }

  // Cierra el modal con la tecla Escape (evento de teclado a nivel documento).
  useEffect(() => {
    function alPresionarTecla(evento) {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [onCerrar])

  return (
    <Portal>
      <div className={estilos.overlay} onClick={onCerrar}>
        <div className={estilos.modal} onClick={(e) => e.stopPropagation()}>
          <button className={estilos.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>

          {cargando && (
            <div className={estilos.cuerpo}>
              <div style={{ padding: 24 }}>
                <Skeleton height="200px" />
              </div>
              <div style={{ padding: 24 }}>
                <Skeleton height="16px" width="40%" style={{ marginBottom: 12 }} />
                <Skeleton height="26px" width="80%" style={{ marginBottom: 12 }} />
                <Skeleton height="60px" style={{ marginBottom: 12 }} />
                <Skeleton height="30px" width="50%" />
              </div>
            </div>
          )}

          {error && <p className={estilos.errorTexto}>No se pudo cargar el producto: {error}</p>}

          {!cargando && !error && producto && (
            <div className={estilos.cuerpo}>
              <div className={estilos.imagen}>
                {obtenerImagenProducto(producto.imagen) ? (
                  <img
                    src={obtenerImagenProducto(producto.imagen)}
                    alt={producto.nombre}
                    className={estilos.imagenFoto}
                  />
                ) : (
                  producto.imagen
                )}
              </div>
              <div className={estilos.detalle}>
                <span className={estilos.categoria}>{producto.categoria.nombre}</span>
                <h3 className={estilos.nombre}>{producto.nombre}</h3>
                <p className={estilos.descripcion}>{producto.descripcion}</p>
                <span className={estilos.precio}>{formatearPrecio(producto.precio)}</span>
                <button
                  className={estilos.botonAgregar}
                  onClick={manejarAgregar}
                  disabled={producto.stock === 0}
                >
                  {producto.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                </button>
                {agregado && <p className={estilos.confirmacion}>Se agregó al carrito ✓</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
