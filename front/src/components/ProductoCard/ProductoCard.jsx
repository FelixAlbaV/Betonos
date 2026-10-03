// src/components/ProductoCard/ProductoCard.jsx
import { Fragment } from 'react'
import { useAppContext } from '../../context/AppContext'
import { obtenerImagenProducto } from '../../utils/imagenesProductos'
import estilos from './ProductoCard.module.css'

export function ProductoCard({ producto, onClick }) {
  const { formatearPrecio } = useAppContext()
  const stockBajo = producto.stock > 0 && producto.stock <= 5
  const urlImagen = obtenerImagenProducto(producto.imagen)

  return (
    <button className={estilos.tarjeta} onClick={() => onClick(producto.id)}>
      {/* Fragment: agrupa la imagen y la info sin envolverlas en un div extra
          (el <button> ya es el contenedor real). */}
      <Fragment>
        <div className={estilos.imagenContenedor}>
          {urlImagen ? (
            <img src={urlImagen} alt={producto.nombre} className={estilos.imagen} />
          ) : (
            producto.imagen
          )}
        </div>
        <div className={estilos.info}>
          <p className={estilos.nombre}>{producto.nombre}</p>
          <div className={estilos.precioFila}>
            <span className={estilos.precio}>{formatearPrecio(producto.precio)}</span>
            <span className={stockBajo ? `${estilos.stock} ${estilos.stockBajo}` : estilos.stock}>
              {producto.stock === 0 ? 'Agotado' : `Stock: ${producto.stock}`}
            </span>
          </div>
        </div>
      </Fragment>
    </button>
  )
}
