// src/components/ContextBar/ContextBar.jsx
import { useAppContext } from '../../context/AppContext'
import estilos from './ContextBar.module.css'

// Este componente no recibe el mensaje por props: lo toma directamente
// del AppContext, para no tener que perforar props (prop drilling) desde
// App hasta aquí solo para un dato de configuración global del sitio.
export function ContextBar() {
  const { mensajeSitio } = useAppContext()

  return (
    <div className={estilos.barra}>
      <span className={estilos.punto} />
      {mensajeSitio}
    </div>
  )
}
