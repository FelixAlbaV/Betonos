// src/components/TopBar/TopBar.jsx
import { signOut } from 'auth-astro/client'
import { useCartStore } from '../../store/cartStore'
import estilos from './TopBar.module.css'

export function TopBar({ onIrAHome, onIrACarrito, user }) {
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
        {user && <span className={estilos.usuario}>{user.name}</span>}
        <button className={estilos.logout} onClick={() => signOut()}>
          Cerrar sesión
        </button>
        <button className={estilos.botonCarrito} onClick={onIrACarrito}>
          Carrito
          {totalItems > 0 && <span className={estilos.contador}>{totalItems}</span>}
        </button>
      </div>
    </header>
  )
}
