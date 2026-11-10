// header con marca, sesión y carrito. va con client:load porque se puede
// usar el botón de carrito desde el inicio
import { TopBar } from '../../components/TopBar/TopBar'

export default function BarraSuperior({ user }) {
  return <TopBar user={user} />
}
