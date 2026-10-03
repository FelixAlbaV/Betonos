// src/components/Confirmacion/Confirmacion.jsx
import { useAppContext } from '../../context/AppContext'
import estilos from './Confirmacion.module.css'

export function Confirmacion({ pedido, onIrAHome }) {
  const { formatearPrecio } = useAppContext()

  return (
    <div className={estilos.contenedor}>
      <div className={estilos.icono}>✓</div>
      <h2 className={estilos.titulo}>¡Pedido confirmado!</h2>
      <p className={estilos.texto}>
        Guarda tu número de pedido. Te avisaremos por correo cuando cambie de estado.
      </p>

      <div className={estilos.detalle}>
        <p>
          Pedido: <strong>#{pedido.id}</strong>
        </p>
        <p>
          Estado: <strong>{pedido.estado}</strong>
        </p>
        <p>
          Total: <strong>{formatearPrecio(pedido.total)}</strong>
        </p>
      </div>

      <button className={estilos.boton} onClick={onIrAHome}>
        Volver al inicio
      </button>
    </div>
  )
}
