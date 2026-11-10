// usa el store de navegación directo en vez de recibir funciones por props
import { signOut } from 'auth-astro/client'
import { useCartStore } from '../../store/cartStore'
import { useNavegacionStore } from '../../store/navegacionStore'
import estilos from './TopBar.module.css'
import { useEffect, useState } from 'react'

export function TopBar({ user }) {
  // solo re-renderiza cuando cambia el total, no con cualquier cambio del store
  const totalItems = useCartStore((estado) => estado.totalItems())
  const irAHome = useNavegacionStore((estado) => estado.irAHome)
  const irACarrito = useNavegacionStore((estado) => estado.irACarrito)
  const [montado, setMontado] = useState(false)
    useEffect(() => {
      setMontado(true)
    }, [])

  // sin sesión no debe quedar visible el carrito de una sesión anterior
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
