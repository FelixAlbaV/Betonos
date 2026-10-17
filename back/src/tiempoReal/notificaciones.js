// src/tiempoReal/notificaciones.js
// Mutation + Subscription del canal de notificaciones en vivo del panel admin.
import { GraphQLError } from 'graphql'
import { pubsub, CANAL_PEDIDO_CONFIRMADO } from './pubsub.js'
import { firmarTokenAdmin } from './tokenAdmin.js'

export function instalarNotificaciones(resolvers) {
  // Astro ya validó sesión de Google + ADMIN_EMAILS antes de llamar esto;
  // aquí solo se exige la clave interna, igual que las demás mutaciones de admin.
  resolvers.Mutation.crearTokenAdmin = (_p, { email }, contexto) => {
    if (!contexto?.autorizado) {
      throw new GraphQLError('Operación exclusiva del servidor.')
    }
    return firmarTokenAdmin(email)
  }

  resolvers.Subscription = {
    pedidoConfirmado: {
      // El context de la conexión WebSocket (ver index.js) ya autenticó el
      // token y puso adminEmail; aquí solo se autoriza el canal.
      subscribe: (_p, _args, contexto) => {
        if (!contexto?.adminEmail) {
          throw new GraphQLError('Debes autenticarte como administrador.')
        }
        return pubsub.asyncIterableIterator([CANAL_PEDIDO_CONFIRMADO])
      },
    },
  }
}
