import { PubSub } from 'graphql-subscriptions'

export const pubsub = new PubSub()

export const CANAL_PEDIDO_CONFIRMADO = 'PEDIDO_CONFIRMADO'

// este canal es publico
export const CANAL_PRODUCTO_ACTUALIZADO = 'PRODUCTO_ACTUALIZADO'
