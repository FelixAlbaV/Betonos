// pide las categorías al backend y muestra el sidebar + grid, usando
// el Hero/ContextBar/Experiencia que ya vienen como HTML estático de Astro
// solo se muestra si la vista en navegacionStore es "home"
import { useEffect, useState } from 'react'
import { Home } from '../../components/Home/Home'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { gqlRequest, OBTENER_CATEGORIAS } from '../../graphql/client'
import { useNavegacionStore, VISTAS } from '../../store/navegacionStore'

// Astro manda el slot "context-bar" tal cual, no lo pasa a camelCase
export default function Catalogo({ hero, 'context-bar': contextBar, experiencia }) {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const vista = useNavegacionStore((estado) => estado.vista)
  const irACategoria = useNavegacionStore((estado) => estado.irACategoria)

  // solo una vez al montar
  useEffect(() => {
    gqlRequest(OBTENER_CATEGORIAS)
      .then((data) => setCategorias(data.categorias))
      .catch((err) => console.error('Error al cargar categorías:', err))
      .finally(() => setCargando(false))
  }, [])

  if (vista !== VISTAS.HOME) return null

  if (cargando) {
    return (
      <div className="contenedor" style={{ paddingTop: 24, display: 'flex', gap: 12 }}>
        <Skeleton width="220px" height="220px" />
        <Skeleton height="220px" />
      </div>
    )
  }

  return (
    <Home
      categorias={categorias}
      onSeleccionarCategoria={irACategoria}
      hero={hero}
      contextBar={contextBar}
      experiencia={experiencia}
    />
  )
}
