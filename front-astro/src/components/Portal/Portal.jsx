import { createPortal } from 'react-dom'

// pinta los hijos directo en el body, así el overlay no se recorta por overflow de algun padre
export function Portal({ children }) {
  return createPortal(children, document.body)
}
