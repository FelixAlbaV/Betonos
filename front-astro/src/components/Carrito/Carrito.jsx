// src/components/Carrito/Carrito.jsx
import { useCartStore } from '../../store/cartStore'
import { useAppContext } from '../../context/AppContext'
import { obtenerImagenProducto } from '../../utils/imagenesProductos'
import estilos from './Carrito.module.css'

export function Carrito({ onVolver, onIrACheckout }) {
  const items = useCartStore((estado) => estado.items)
  const cambiarCantidad = useCartStore((estado) => estado.cambiarCantidad)
  const quitarItem = useCartStore((estado) => estado.quitarItem)
  const totalPrecio = useCartStore((estado) => estado.totalPrecio())
  const { formatearPrecio } = useAppContext()

  return (
    <section>
      <button className={estilos.volver} onClick={onVolver}>
        ← Seguir comprando
      </button>
      <h2 className={estilos.titulo}>Tu carrito</h2>

      {items.length === 0 && <p className={estilos.vacio}>Todavía no agregas productos.</p>}

      {items.length > 0 && (
        <>
          <div className={estilos.lista}>
            {items.map((item) => (
              <div className={estilos.renglon} key={item.id}>
                <div className={estilos.miniatura}>
                  {obtenerImagenProducto(item.imagen) ? (
                    <img
                      src={obtenerImagenProducto(item.imagen)}
                      alt={item.nombre}
                      className={estilos.miniaturaFoto}
                    />
                  ) : (
                    item.imagen
                  )}
                </div>
                <div>
                  <p className={estilos.nombre}>{item.nombre}</p>
                  <p className={estilos.precioUnitario}>{formatearPrecio(item.precio)} c/u</p>
                </div>
                <div className={estilos.cantidad}>
                  <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}>−</button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}>+</button>
                </div>
                <button className={estilos.quitar} onClick={() => quitarItem(item.id)}>
                  Quitar
                </button>
              </div>
            ))}
          </div>

          <div className={estilos.resumen}>
            <span className={estilos.total}>
              Total: <span className={estilos.totalNumero}>{formatearPrecio(totalPrecio)}</span>
            </span>
            <button className={estilos.botonCheckout} onClick={onIrACheckout}>
              Ir a pagar
            </button>
          </div>
        </>
      )}
    </section>
  )
}
