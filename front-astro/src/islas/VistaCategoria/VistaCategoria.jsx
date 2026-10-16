// src/islas/VistaCategoria/VistaCategoria.jsx
//
// ISLA 3 de 7: Detalle de una categoría (lista de productos).
//
// Qué hace: cuando el usuario elige una categoría, muestra sus productos.
// Se queda "apagada" (no pinta nada) hasta que navegacionStore dice que la
// vista activa es "categoria".
//
// Por qué client:idle: no hace falta tenerla lista desde el primer
// instante, porque al cargar la página siempre se empieza en el inicio.
// Se hidrata quieta, cuando el navegador ya no está ocupado dibujando lo
// primero que el usuario ve (client:load / client:visible de las islas 1 y 2).
import { AppProvider } from '../../context/AppContext'
import { CategoriaDetalle } from '../../components/CategoriaDetalle/CategoriaDetalle'
import { useNavegacionStore, VISTAS } from '../../store/navegacionStore'

export default function VistaCategoria() {
  const vista = useNavegacionStore((estado) => estado.vista)
  const categoriaId = useNavegacionStore((estado) => estado.categoriaId)
  const categoriaNombre = useNavegacionStore((estado) => estado.categoriaNombre)
  const irAHome = useNavegacionStore((estado) => estado.irAHome)
  const abrirProducto = useNavegacionStore((estado) => estado.abrirProducto)

  if (vista !== VISTAS.CATEGORIA) return null

  // AppProvider va aquí porque CategoriaDetalle → ProductoCard usa
  // useAppContext() (formatearPrecio) para mostrar el precio de cada tarjeta.
  return (
    <AppProvider>
      <div className="contenedor" style={{ paddingTop: 28 }}>
        <CategoriaDetalle
          categoriaId={categoriaId}
          categoriaNombre={categoriaNombre}
          onVolver={irAHome}
          onAbrirProducto={abrirProducto}
        />
      </div>
    </AppProvider>
  )
}
