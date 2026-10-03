// src/components/Portal/Portal.jsx
import { createPortal } from 'react-dom'

/* Portal genérico: renderiza sus hijos directo en document.body, 
fuera del árbol normal de Home/CategoriaDetalle. Se usa para el modal 
de detalle de producto, así el overlay nunca queda recortado por el
overflow de un contenedor padre.*/
export function Portal({ children }) {
  return createPortal(children, document.body)
}
