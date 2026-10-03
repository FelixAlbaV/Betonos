// src/resolvers.js
import { GraphQLError } from 'graphql'
import { db } from './db.js'

function noEncontrado(nombreTipo, id) {
  throw new GraphQLError(`${nombreTipo} con id "${id}" no existe.`, {
    extensions: { code: 'NOT_FOUND' },
  })
}

// ---------- Mapeadores snake_case (DB) -> camelCase (GraphQL) ----------

function mapProducto(row) {
  if (!row) return null
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: row.precio,
    stock: row.stock,
    imagen: row.imagen,
    categoriaId: row.categoria_id,
  }
}

function mapPedido(row) {
  if (!row) return null
  return {
    id: row.id,
    clienteNombre: row.cliente_nombre,
    clienteEmail: row.cliente_email,
    fecha: row.fecha,
    estado: row.estado,
    total: row.total,
  }
}

export const resolvers = {
  Query: {
    categorias: () => db.prepare('SELECT * FROM categorias').all(),

    categoria: (_p, { id }) => {
      const cat = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id)
      if (!cat) noEncontrado('Categoria', id)
      return cat
    },

    productos: (_p, { categoriaId, buscar, limit, offset }) => {
      let sql = 'SELECT * FROM productos WHERE 1=1'
      const params = []
      if (categoriaId) {
        sql += ' AND categoria_id = ?'
        params.push(categoriaId)
      }
      if (buscar) {
        sql += ' AND (nombre LIKE ? OR descripcion LIKE ?)'
        params.push(`%${buscar}%`, `%${buscar}%`)
      }
      sql += ' LIMIT ? OFFSET ?'
      params.push(limit, offset)
      return db.prepare(sql).all(...params).map(mapProducto)
    },

    producto: (_p, { id }) => {
      const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id)
      if (!row) noEncontrado('Producto', id)
      return mapProducto(row)
    },

    pedidos: (_p, { estado, limit, offset }) => {
      let sql = 'SELECT * FROM pedidos WHERE 1=1'
      const params = []
      if (estado) {
        sql += ' AND estado = ?'
        params.push(estado)
      }
      sql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)
      return db.prepare(sql).all(...params).map(mapPedido)
    },

    pedido: (_p, { id }) => {
      const row = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)
      if (!row) noEncontrado('Pedido', id)
      return mapPedido(row)
    },
  },

  Mutation: {
    crearProducto: (_p, { input }) => {
      const cat = db.prepare('SELECT id FROM categorias WHERE id = ?').get(input.categoriaId)
      if (!cat) noEncontrado('Categoria', input.categoriaId)

      const stmt = db.prepare(`
        INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria_id)
        VALUES (@nombre, @descripcion, @precio, @stock, @imagen, @categoriaId)
      `)
      const info = stmt.run(input)
      const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(info.lastInsertRowid)
      return mapProducto(row)
    },

    actualizarProducto: (_p, { id, input }) => {
      const existente = db.prepare('SELECT id FROM productos WHERE id = ?').get(id)
      if (!existente) noEncontrado('Producto', id)
      const cat = db.prepare('SELECT id FROM categorias WHERE id = ?').get(input.categoriaId)
      if (!cat) noEncontrado('Categoria', input.categoriaId)

      db.prepare(`
        UPDATE productos
        SET nombre = @nombre, descripcion = @descripcion, precio = @precio,
            stock = @stock, imagen = @imagen, categoria_id = @categoriaId
        WHERE id = @id
      `).run({ ...input, id })

      const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id)
      return mapProducto(row)
    },

    eliminarProducto: (_p, { id }) => {
      const usado = db.prepare('SELECT id FROM pedido_items WHERE producto_id = ?').get(id)
      if (usado) {
        throw new GraphQLError('No se puede eliminar: el producto ya aparece en pedidos existentes.', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }
      const info = db.prepare('DELETE FROM productos WHERE id = ?').run(id)
      return info.changes > 0
    },

    registrarPedido: (_p, { input }) => {
      if (!input.items || input.items.length === 0) {
        throw new GraphQLError('El pedido debe tener al menos un producto.', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      // Transacción: valida stock, descuenta inventario, crea pedido + items.
      const transaccion = db.transaction((datos) => {
        let total = 0
        const lineas = []

        for (const item of datos.items) {
          const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(item.productoId)
          if (!producto) noEncontrado('Producto', item.productoId)
          if (producto.stock < item.cantidad) {
            throw new GraphQLError(
              `Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock}).`,
              { extensions: { code: 'BAD_USER_INPUT' } }
            )
          }
          total += producto.precio * item.cantidad
          lineas.push({ producto, cantidad: item.cantidad, precioUnitario: producto.precio })
        }

        const infoPedido = db.prepare(`
          INSERT INTO pedidos (cliente_nombre, cliente_email, fecha, estado, total)
          VALUES (?, ?, ?, 'PENDIENTE', ?)
        `).run(datos.clienteNombre, datos.clienteEmail, new Date().toISOString().slice(0, 10), total)

        const pedidoId = infoPedido.lastInsertRowid

        for (const linea of lineas) {
          db.prepare(`
            INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?)
          `).run(pedidoId, linea.producto.id, linea.cantidad, linea.precioUnitario)

          db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?')
            .run(linea.cantidad, linea.producto.id)
        }

        return pedidoId
      })

      const pedidoId = transaccion(input)
      const row = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId)
      return mapPedido(row)
    },

    actualizarEstadoPedido: (_p, { id, estado }) => {
      const existente = db.prepare('SELECT id FROM pedidos WHERE id = ?').get(id)
      if (!existente) noEncontrado('Pedido', id)
      db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, id)
      const row = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id)
      return mapPedido(row)
    },
  },

  // ---------- Resolvers de relación ----------
  Categoria: {
    productos: (categoria) =>
      db.prepare('SELECT * FROM productos WHERE categoria_id = ?').all(categoria.id).map(mapProducto),
  },

  Producto: {
    categoria: (producto) =>
      db.prepare('SELECT * FROM categorias WHERE id = ?').get(producto.categoriaId),
  },

  Pedido: {
    items: (pedido) =>
      db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?').all(pedido.id).map((row) => ({
        id: row.id,
        productoId: row.producto_id,
        cantidad: row.cantidad,
        precioUnitario: row.precio_unitario,
        subtotal: row.cantidad * row.precio_unitario,
      })),
  },

  PedidoItem: {
    producto: (item) => mapProducto(db.prepare('SELECT * FROM productos WHERE id = ?').get(item.productoId)),
  },
}
