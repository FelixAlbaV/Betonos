// src/components/ContextBar/ContextBar.jsx
import { useAppContext } from '../../context/AppContext'
import estilos from './ContextBar.module.css'

// agarra el mensaje del context para no andar pasando props de mas
export function ContextBar() {
  const { mensajeSitio } = useAppContext()

  return (
    <div className={estilos.barra}>
      <span className={estilos.punto} />
      {mensajeSitio}
    </div>
  )
}
