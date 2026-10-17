// src/islas/BarraSuperior/BarraSuperior.jsx
//
// ISLA 1 de 7: Barra superior (header).
//
// Qué hace: muestra la marca, el estado de sesión y el botón del carrito
// con su contador. Es la única pieza que necesita estar interactiva desde
// el primer segundo (el usuario puede hacer clic en "Carrito" de inmediato),
// así que en index.astro se monta con la directiva client:load.
//
// Esta isla NO sabe nada de las demás (catálogo, carrito, checkout...).
// Solo conoce al store de navegación (navegacionStore) para avisar "quiero
// ir al carrito" o "quiero ir al inicio". Eso es lo que la hace independiente:
// se puede quitar o mover sin romper el resto de la página.
import { TopBar } from '../../components/TopBar/TopBar'

export default function BarraSuperior({ user }) {
  return <TopBar user={user} />
}
