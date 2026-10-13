import { GraphQLError } from 'graphql'
import { db } from './db.js'

const mapearPedido = (p) => ({
  id: p.id,
  clienteNombre: p.cliente_nombre,
  clienteEmail: p.cliente_email,
  fecha: p.fecha,
  estado: p.estado,
  total: p.total,
})

export function instalarPagosStripe(resolvers) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pagos_stripe (
      pedido_id INTEGER PRIMARY KEY REFERENCES pedidos(id),
      sesion_id TEXT NOT NULL UNIQUE,
      confirmado_en TEXT NOT NULL
    )
  `)

  resolvers.Mutation.confirmarPagoStripe = (
    _p, { pedidoId, sesionId, montoCentavos, moneda }, contexto
  ) => {
    if (!contexto?.autorizado) {
      throw new GraphQLError('Operación exclusiva del servidor.')
    }
    if (!/^cs_[\w]+$/.test(sesionId) ||
        !Number.isSafeInteger(montoCentavos) || montoCentavos <= 0 ||
        moneda !== 'mxn') {
      throw new GraphQLError('Datos de Stripe inválidos.')
    }

    const confirmar = db.transaction(() => {
      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId)
      if (!pedido) throw new GraphQLError('Pedido no encontrado.')

      const previo = db.prepare(`
        SELECT * FROM pagos_stripe WHERE pedido_id = ? OR sesion_id = ?
      `).get(pedidoId, sesionId)

      if (previo) {
        if (String(previo.pedido_id) !== String(pedidoId) ||
            previo.sesion_id !== sesionId || pedido.estado !== 'PAGADO') {
          throw new GraphQLError('Pago repetido con datos inconsistentes.')
        }
        return mapearPedido(pedido)
      }

      if (pedido.estado !== 'PENDIENTE') {
        throw new GraphQLError('Pedido ya procesado; revisar el cobro y posible reembolso.')
      }
      if (Math.round(pedido.total * 100) !== montoCentavos) {
        throw new GraphQLError('El monto cobrado no coincide con el pedido.')
      }

      const items = db.prepare(`
        SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = ?
      `).all(pedidoId)
      if (!items.length) throw new GraphQLError('Pedido sin artículos.')

      for (const item of items) {
        const actualizacion = db.prepare(`
          UPDATE productos SET stock = stock - ?
          WHERE id = ? AND stock >= ?
        `).run(item.cantidad, item.producto_id, item.cantidad)
        if (actualizacion.changes !== 1) {
          throw new GraphQLError('Pago recibido pero stock insuficiente: requiere atención.')
        }
      }

      db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?')
        .run('PAGADO', pedidoId)
      db.prepare(`
        INSERT INTO pagos_stripe (pedido_id, sesion_id, confirmado_en)
        VALUES (?, ?, ?)
      `).run(pedidoId, sesionId, new Date().toISOString())

      return mapearPedido(db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId))
    })

    return confirmar()
  }
}
