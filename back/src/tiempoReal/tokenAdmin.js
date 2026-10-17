// src/tiempoReal/tokenAdmin.js
// Token corto (JWT) para autorizar la conexión WebSocket del panel admin.
// Separado a propósito de BETONOS_INTERNAL_KEY: ese secreto es servidor-a-servidor
// y nunca debe llegar al navegador. Este token sí viaja al navegador, pero dura
// poco y solo sirve para escuchar el canal de notificaciones.
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
