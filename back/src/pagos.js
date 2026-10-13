// Agrega las operaciones de pago sin reemplazar src/resolvers.js.
import { GraphQLError } from 'graphql'
import { db } from './db.js'

function accesoInterno(contexto) {
  if (!contexto?.autorizado) {
    throw new GraphQLError('Operación exclusiva del servidor.', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
}

export function instalarPagos(resolvers) {
  // Migración no destructiva: conserva todas las tablas y datos existentes.
  db.exec(`CREATE TABLE IF NOT EXISTS pagos_mercadopago (
    pedido_id INTEGER PRIMARY KEY REFERENCES pedidos(id),
    pago_id TEXT NOT NULL UNIQUE,
    confirmado_en TEXT NOT NULL
  )`)

  // Evita que un navegador cree productos, consulte pedidos ajenos o marque pagos.
  for (const nombre of ['pedido', 'pedidos']) {
    const original = resolvers.Query[nombre]
    resolvers.Query[nombre] = (...args) => {
      accesoInterno(args[2])
      return original(...args)
    }
  }
  for (const nombre of ['crearProducto', 'actualizarProducto', 'eliminarProducto', 'actualizarEstadoPedido']) {
    const original = resolvers.Mutation[nombre]
    resolvers.Mutation[nombre] = (...args) => {
      accesoInterno(args[2])
      if (nombre === 'actualizarEstadoPedido' && args[1].estado === 'PAGADO') {
        throw new GraphQLError('El pago solo se confirma desde Mercado Pago.')
      }
      if (nombre === 'actualizarEstadoPedido') {
        const existente = db.prepare('SELECT estado FROM pedidos WHERE id = ?').get(args[1].id)
        if (existente?.estado === 'PAGADO') {
          throw new GraphQLError('Un pedido pagado no puede cambiarse por esta operación.')
        }
      }
      return original(...args)
    }
  }

  // Reemplaza SOLO la mutación de compra; no toca las consultas del catálogo.
  resolvers.Mutation.registrarPedido = (_p, { input }, contexto) => {
    accesoInterno(contexto)
    if (!input.clienteNombre?.trim() || !input.clienteEmail?.trim() ||
        !Array.isArray(input.items) || input.items.length < 1 || input.items.length > 50) {
      throw new GraphQLError('Información del pedido inválida.')
    }
    const guardar = db.transaction(() => {
      const cantidades = new Map()
      for (const item of input.items) {
        const id = String(item.productoId)
        if (!/^\d+$/.test(id) || !Number.isSafeInteger(item.cantidad) ||
            item.cantidad < 1 || item.cantidad > 100) {
          throw new GraphQLError('Cantidad o producto inválido.')
        }
        cantidades.set(id, (cantidades.get(id) || 0) + item.cantidad)
      }
      let centavos = 0
      const lineas = []
      for (const [id, cantidad] of cantidades) {
        const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id)
        if (!producto || producto.stock < cantidad ||
            !Number.isFinite(producto.precio) || producto.precio <= 0) {
          throw new GraphQLError(`Producto ${id}: precio o existencias no disponibles.`)
        }
        centavos += Math.round(producto.precio * 100) * cantidad
        lineas.push({ id, cantidad, precio: producto.precio })
      }
      const info = db.prepare(`INSERT INTO pedidos
        (cliente_nombre, cliente_email, fecha, estado, total)
        VALUES (?, ?, ?, 'PENDIENTE', ?)`).run(
        input.clienteNombre.trim(), input.clienteEmail.trim().toLowerCase(),
        new Date().toISOString().slice(0, 10), centavos / 100
      )
      for (const linea of lineas) {
        db.prepare(`INSERT INTO pedido_items
          (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`)
          .run(info.lastInsertRowid, linea.id, linea.cantidad, linea.precio)
      }
      // No se descuenta inventario antes de que se apruebe el pago.
      return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(info.lastInsertRowid)
    })
    const fila = guardar()
    return {
      id: fila.id, clienteNombre: fila.cliente_nombre,
      clienteEmail: fila.cliente_email, fecha: fila.fecha,
      estado: fila.estado, total: fila.total,
    }
  }

  resolvers.Mutation.confirmarPagoMercadoPago = (_p, { pedidoId, paymentId, monto, moneda }, contexto) => {
    accesoInterno(contexto)
    if (!/^\d+$/.test(String(paymentId)) || moneda !== 'MXN' ||
        !Number.isFinite(monto)) throw new GraphQLError('Datos de pago inválidos.')

    const confirmar = db.transaction(() => {
      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId)
      if (!pedido) throw new GraphQLError('Pedido no encontrado.')
      if (Math.round(pedido.total * 100) !== Math.round(monto * 100)) {
        throw new GraphQLError('El monto del pago no coincide con el pedido.')
      }
      const anterior = db.prepare(`SELECT * FROM pagos_mercadopago
        WHERE pedido_id = ? OR pago_id = ?`).get(pedidoId, paymentId)
      if (anterior) {
        if (String(anterior.pedido_id) !== String(pedidoId) || anterior.pago_id !== paymentId) {
          throw new GraphQLError('Pago duplicado o asociado a otro pedido.')
        }
        return pedido // Reintento del mismo webhook: sin descontar dos veces.
      }
      if (pedido.estado !== 'PENDIENTE') throw new GraphQLError('Pedido no pendiente.')
      const items = db.prepare(`SELECT producto_id, cantidad FROM pedido_items
        WHERE pedido_id = ?`).all(pedidoId)
      for (const item of items) {
        const cambio = db.prepare(`UPDATE productos SET stock = stock - ?
          WHERE id = ? AND stock >= ?`).run(item.cantidad, item.producto_id, item.cantidad)
        if (!cambio.changes) {
          throw new GraphQLError('PAGO RECIBIDO sin stock: requiere revisión/devolución manual.')
        }
      }
      db.prepare("UPDATE pedidos SET estado = 'PAGADO' WHERE id = ?").run(pedidoId)
      db.prepare(`INSERT INTO pagos_mercadopago
        (pedido_id, pago_id, confirmado_en) VALUES (?, ?, ?)`)
        .run(pedidoId, paymentId, new Date().toISOString())
      return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId)
    })
    const fila = confirmar()
    return {
      id: fila.id, clienteNombre: fila.cliente_nombre,
      clienteEmail: fila.cliente_email, fecha: fila.fecha,
      estado: fila.estado, total: fila.total,
    }
  }
}
