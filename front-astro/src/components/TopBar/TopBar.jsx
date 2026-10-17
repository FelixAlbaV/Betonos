// src/components/TopBar/TopBar.jsx
//
// Esta pieza es la isla "BarraSuperior" (ver src/islas/BarraSuperior).
// Es independiente: ya no recibe funciones de navegación desde un padre
// (onIrAHome, onIrACarrito), sino que llama directamente al store global
// de navegación (navegacionStore). Así puede montarse sola con client:load
// sin necesitar que exista ningún otro componente en la página.
import { signOut } from 'auth-astro/client'
import { useCartStore } from '../../store/cartStore'
import { useNavegacionStore } from '../../store/navegacionStore'
import estilos from './TopBar.module.css'
import { useEffect, useState } from 'react'

export function TopBar({ user }) {
  // Selector de Zustand: el componente solo se re-renderiza cuando
  // cambia la cantidad total de artículos, no en cada cambio del store.
  const totalItems = useCartStore((estado) => estado.totalItems())
  const irAHome = useNavegacionStore((estado) => estado.irAHome)
  const irACarrito = useNavegacionStore((estado) => estado.irACarrito)
  const [montado, setMontado] = useState(false)
    useEffect(() => {
      setMontado(true)
    }, [])

  // Si no hay sesión, el carrito guardado de una sesión anterior no debe
  // seguir visible. Esta isla es la primera en montarse (client:load),
  // así que es el lugar natural para esta limpieza.
  useEffect(() => {
    if (!user) useCartStore.getState().vaciarCarrito()
  }, [user])

  const cerrarSesion = async () => {
    useCartStore.getState().vaciarCarrito()
      await signOut({ callbackUrl: '/' })
  }
  return (
    <header className={estilos.barra}>
      <h1 className={estilos.marca}>
        <button onClick={irAHome} aria-label="Ir al inicio">
          <img src="/betonos-logo.png" alt="" className={estilos.logo} />
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
        onClick={irACarrito}
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
