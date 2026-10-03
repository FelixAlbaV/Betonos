// src/components/Sidebar/Sidebar.jsx
import estilos from './Sidebar.module.css'

export function Sidebar({ categorias, categoriaActivaId, onSeleccionar }) {
  return (
    <aside className={estilos.aside}>
      <p className={estilos.titulo}>Categorías</p>
      <ul className={estilos.lista}>
        {categorias.map((categoria) => (
          // key requerida por React al renderizar una lista dinámica
          <li
            key={categoria.id}
            className={categoria.id === categoriaActivaId ? estilos.itemActivo : estilos.item}
          >
            <button onClick={() => onSeleccionar(categoria.id, categoria.nombre)}>
              {categoria.nombre}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
