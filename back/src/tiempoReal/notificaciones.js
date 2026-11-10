import { GraphQLError } from 'graphql'
import { pubsub, CANAL_PEDIDO_CONFIRMADO } from './pubsub.js'
import { firmarTokenAdmin } from './tokenAdmin.js'

export function instalarNotificaciones(resolvers) {
  // astro ya checo la sesion de google y el admin email, aqui solo la clave interna
  resolvers.Mutation.crearTokenAdmin = (_p, { email }, contexto) => {
    if (!contexto?.autorizado) {
      throw new GraphQLError('Operación exclusiva del servidor.')
    }
    return firmarTokenAdmin(email)
  }

  resolvers.Subscription = {
    pedidoConfirmado: {
      subscribe: (_p, _args, contexto) => {
        if (!contexto?.adminEmail) {
          throw new GraphQLError('Debes autenticarte como administrador.')
        }
        return pubsub.asyncIterableIterator([CANAL_PEDIDO_CONFIRMADO])
      },
    },
  }
}
