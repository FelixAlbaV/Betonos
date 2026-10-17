// src/islas/Catalogo/Catalogo.jsx
//
// ISLA 2 de 7: Catálogo (inicio).
//
// Qué hace: pide las categorías al backend (GraphQL) y muestra el Sidebar
// + el grid de categorías, usando como "relleno" el Hero/ContextBar/
// Experiencia que ya llegan renderizados en HTML estático desde Astro
// (ver front-astro/src/components/estaticos).
//
// Por qué client:visible: esta isla no es indispensable en el primer
// instante (el usuario primero ve el Hero estático, que no necesita JS).
// Por eso se hidrata solo cuando entra en la zona visible de la pantalla,
// en vez de competir por el hilo principal apenas carga la página.
//
// Solo se muestra si la vista activa en navegacionStore es "home"; si el
// usuario ya navegó a otra vista, esta isla simplemente no pinta nada.
import { useEffect, useState } from 'react'
import { Home } from '../../components/Home/Home'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { gqlRequest, OBTENER_CATEGORIAS } from '../../graphql/client'
import { useNavegacionStore, VISTAS } from '../../store/navegacionStore'

// Nota: Astro pasa el slot "context-bar" como una prop con ese mismo
// nombre literal (no lo convierte a camelCase), por eso se recibe con
// la sintaxis 'context-bar': contextBar.
export default function Catalogo({ hero, 'context-bar': contextBar, experiencia }) {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const vista = useNavegacionStore((estado) => estado.vista)
  const irACategoria = useNavegacionStore((estado) => estado.irACategoria)

  // Se piden una sola vez al montar la isla (dependencia []).
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
