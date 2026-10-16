// src/tiempoReal/pubsub.js
// Emisor central de eventos en memoria. Los resolvers que confirman un pago
// hacen publish aquí; el resolver de Subscription hace subscribe al mismo canal.
import { PubSub } from 'graphql-subscriptions'

export const pubsub = new PubSub()

export const CANAL_PEDIDO_CONFIRMADO = 'PEDIDO_CONFIRMADO'
