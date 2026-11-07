// src/tiempoReal/pubsub.js
// Emisor central de eventos en memoria. Los resolvers que confirman un pago
// hacen publish aquí; el resolver de Subscription hace subscribe al mismo canal.
import { PubSub } from 'graphql-subscriptions'

export const pubsub = new PubSub()

export const CANAL_PEDIDO_CONFIRMADO = 'PEDIDO_CONFIRMADO'

// Público (no necesita token de admin): cualquier cliente viendo la tienda
// puede escuchar cuándo cambia un producto (p. ej. su stock).
export const CANAL_PRODUCTO_ACTUALIZADO = 'PRODUCTO_ACTUALIZADO'
