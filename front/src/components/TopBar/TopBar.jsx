// src/components/TopBar/TopBar.jsx
import { useCartStore } from '../../store/cartStore'
import estilos from './TopBar.module.css'

export function TopBar({ onIrAHome, onIrACarrito }) {
  // Selector de Zustand: el componente solo se re-renderiza cuando
  // cambia la cantidad total de artículos, no en cada cambio del store.
  const totalItems = useCartStore((estado) => estado.totalItems())

  return (
    <header className={estilos.barra}>
      <h1 className={estilos.marca}>
        <button onClick={onIrAHome} aria-label="Ir al inicio">
          Be<span>tonos</span>
        </button>
      </h1>

      <div className={estilos.acciones}>
        <button className={estilos.botonCarrito} onClick={onIrACarrito}>
          Carrito
          {totalItems > 0 && <span className={estilos.contador}>{totalItems}</span>}
        </button>
      </div>
    </header>
  )
}
