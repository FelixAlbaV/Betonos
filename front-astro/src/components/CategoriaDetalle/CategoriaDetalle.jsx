// src/components/CategoriaDetalle/CategoriaDetalle.jsx
import { useEffect, useState } from 'react'
import { createClient } from 'graphql-ws'
import { gqlRequest, OBTENER_PRODUCTOS_POR_CATEGORIA, PRODUCTO_ACTUALIZADO_SUBSCRIPCION, WS_URL } from '../../graphql/client'
import { ProductoCard } from '../ProductoCard/ProductoCard'
import { SkeletonTarjetaProducto } from '../Skeleton/Skeleton'
import estilos from './CategoriaDetalle.module.css'

export function CategoriaDetalle({ categoriaId, categoriaNombre, onVolver, onAbrirProducto }) {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // useEffect: vuelve a consultar el backend cada vez que cambia la categoría
  // seleccionada (dependencia [categoriaId]).
  useEffect(() => {
    let cancelado = false

    async function cargarProductos() {
      setCargando(true)
      setError(null)
      try {
        const data = await gqlRequest(OBTENER_PRODUCTOS_POR_CATEGORIA, { categoriaId })
        if (!cancelado) setProductos(data.productos)
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargarProductos()
    return () => {
      cancelado = true
    }
  }, [categoriaId])

  // Canal en vivo (público, sin login): si el admin cambia un producto que
  // ya está en pantalla (precio, stock, etc.), se actualiza solo, al
  // instante, sin que el cliente tenga que recargar la página.
  useEffect(() => {
    const client = createClient({ url: WS_URL })

    const cerrar = client.subscribe(
      { query: PRODUCTO_ACTUALIZADO_SUBSCRIPCION },
      {
        next: ({ data }) => {
          const actualizado = data?.productoActualizado
          if (!actualizado) return
          setProductos((lista) =>
            lista.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
          )
        },
        error: (err) => console.error('[Productos en vivo]', err),
        complete: () => {},
      }
    )

    return () => cerrar()
  }, [])

  return (
    <section>
      <div className={estilos.encabezado}>
        <h2 className={estilos.titulo}>{categoriaNombre}</h2>
        <button className={estilos.volver} onClick={onVolver}>
          ← Volver al inicio
        </button>
      </div>

      {error && <p className={estilos.error}>No se pudo cargar el catálogo: {error}</p>}

      {cargando && (
        <div className={estilos.grid}>
          {/* keys por índice: son placeholders sin identidad propia, no hay
              riesgo de reordenamiento con estado. */}
          {Array.from({ length: 6 }).map((_, indice) => (
            <SkeletonTarjetaProducto key={indice} />
          ))}
        </div>
      )}

      {!cargando && !error && productos.length === 0 && (
        <p className={estilos.vacio}>No hay productos en esta categoría todavía.</p>
      )}

      {!cargando && !error && productos.length > 0 && (
        <div className={estilos.grid}>
          {productos.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} onClick={onAbrirProducto} />
          ))}
        </div>
      )}
    </section>
  )
}
