// muestra los productos de la categoría elegida, no pinta nada hasta
// que la vista en navegacionStore sea "categoria"
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

  // AppProvider porque ProductoCard necesita useAppContext para formatear el precio
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
