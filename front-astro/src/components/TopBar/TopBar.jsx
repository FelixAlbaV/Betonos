// src/components/TopBar/TopBar.jsx
import { signOut } from 'auth-astro/client'
import { useCartStore } from '../../store/cartStore'
import estilos from './TopBar.module.css'
import { useEffect, useState } from 'react'

export function TopBar({ onIrAHome, onIrACarrito, user }) {
  // Selector de Zustand: el componente solo se re-renderiza cuando
  // cambia la cantidad total de artículos, no en cada cambio del store.
  const totalItems = useCartStore((estado) => estado.totalItems())
  const [montado, setMontado] = useState(false)
    useEffect(() => {
      setMontado(true)
    }, [])

  const cerrarSesion = async () => {
    useCartStore.getState().vaciarCarrito()
      await signOut({ callbackUrl: '/' })
  }
  return (
    <header className={estilos.barra}>
      <h1 className={estilos.marca}>
        <button onClick={onIrAHome} aria-label="Ir al inicio">
          Be<span>tonos</span>
        </button>
      </h1>
<div className={estilos.acciones}>
  {user ? (
    <>
      <span className={estilos.usuario}>
        {user.name}
      </span>

      <a
        href="/mi-cuenta"
        className={estilos.usuario}
        style={{ textDecoration: 'none', fontWeight: 700 }}
      >
        Mi cuenta
      </a>

      <button
        className={estilos.logout}
        onClick={cerrarSesion}
      >
        Cerrar sesión
      </button>

      <button
        className={estilos.botonCarrito}
        onClick={onIrACarrito}
      >
        Carrito
        {montado && totalItems > 0 && (
          <span className={estilos.contador}>
            {totalItems}
          </span>
        )}
      </button>
    </>
  ) : (
    <a href="/login" className={estilos.logout}>
      Iniciar sesión
    </a>
  )}

      </div>
    </header>
  )
}
