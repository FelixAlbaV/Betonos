// canal publico, no pide token de admin: si cambia un producto en /admin
// los clientes viendo la tienda lo ven actualizado sin recargar
import { pubsub, CANAL_PRODUCTO_ACTUALIZADO } from './pubsub.js'

export function instalarProductosEnVivo(resolvers) {
  const original = resolvers.Mutation.actualizarProducto
  resolvers.Mutation.actualizarProducto = (...args) => {
    const producto = original(...args)
    pubsub.publish(CANAL_PRODUCTO_ACTUALIZADO, { productoActualizado: producto })
    return producto
  }

  resolvers.Subscription.productoActualizado = {
    subscribe: () => pubsub.asyncIterableIterator([CANAL_PRODUCTO_ACTUALIZADO]),
  }
}
