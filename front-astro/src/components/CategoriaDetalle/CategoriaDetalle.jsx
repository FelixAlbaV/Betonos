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

  // se vuelve a pedir cuando cambia la categoria
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

  // suscripcion para que los productos se actualicen solos si el admin cambia algo
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
          {/* son placeholders nomas, no importa el key por indice */}
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
