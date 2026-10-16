// BETONOS_HIDRATACION_SELECTIVA
// src/components/Home/Home.jsx
import { Sidebar } from '../Sidebar/Sidebar'
import estilos from './Home.module.css'

// Home compone: Sidebar (categorías) + Hero + ContextBar + grid principal.
// TopBar y Footer viven en App.jsx porque son comunes a todas las vistas.
export function Home({ categorias, onSeleccionarCategoria, hero, contextBar, experiencia }) {
  return (
    <div className={estilos.layout}>
      <Sidebar categorias={categorias} categoriaActivaId={null} onSeleccionar={onSeleccionarCategoria} />

      <main className={estilos.principal}>
        {hero}
        {contextBar}
        {experiencia}

        <h3 className={estilos.destacadosTitulo}>Explora por categoría</h3>
        <div className={estilos.gridCategorias}>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              className={estilos.tarjetaCategoria}
              onClick={() => onSeleccionarCategoria(categoria.id, categoria.nombre)}
            >
              <h3>{categoria.nombre}</h3>
              <p>{categoria.descripcion}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
