// src/tiempoReal/productosEnVivo.js
//
// Canal PÚBLICO (ningún token de admin): cuando el administrador cambia un
// producto desde /admin (precio, stock, etc.), cualquier cliente con la
// tienda abierta recibe el producto actualizado al instante, sin recargar.
import { pubsub, CANAL_PRODUCTO_ACTUALIZADO } from './pubsub.js'

export function instalarProductosEnVivo(resolvers) {
  // Envuelve actualizarProducto (ya protegido por accesoInterno en pagos.js)
  // para publicar en el canal SOLO si la actualización se guardó bien.
  const original = resolvers.Mutation.actualizarProducto
  resolvers.Mutation.actualizarProducto = (...args) => {
    const producto = original(...args)
    pubsub.publish(CANAL_PRODUCTO_ACTUALIZADO, { productoActualizado: producto })
    return producto
  }

  resolvers.Subscription.productoActualizado = {
    // Pública a propósito: no revisa contexto.adminEmail. El stock y el
    // precio ya son datos que cualquier cliente puede ver en el catálogo.
    subscribe: () => pubsub.asyncIterableIterator([CANAL_PRODUCTO_ACTUALIZADO]),
  }
}
