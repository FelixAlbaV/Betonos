// jwt para el ws del admin, dura poco y solo sirve para el canal de notis
// (distinto a BETONOS_INTERNAL_KEY, ese nunca llega al navegador)
import jwt from 'jsonwebtoken'

const DURACION = '10m'

function secreto() {
  const valor = process.env.ADMIN_WS_SECRET
  if (!valor) throw new Error('Falta ADMIN_WS_SECRET en back/.env')
  return valor
}

export function firmarTokenAdmin(email) {
  return jwt.sign({ email }, secreto(), { expiresIn: DURACION })
}

export function verificarTokenAdmin(token) {
  const payload = jwt.verify(token, secreto())
  return payload.email
}
