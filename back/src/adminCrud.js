import { GraphQLError } from 'graphql'
import { db } from './db.js'

const error = (mensaje) => new GraphQLError(mensaje, { extensions: { code: 'BAD_USER_INPUT' } })

function exigirServidor(contexto) {
  if (!contexto?.autorizado) {
    throw new GraphQLError('Operación privada: autorización del servidor requerida.', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
}

function validarCategoria(input) {
  const nombre = typeof input?.nombre === 'string' ? input.nombre.trim() : ''
  const descripcion = typeof input?.descripcion === 'string' ? input.descripcion.trim() : ''
  if (!nombre || nombre.length > 80 || descripcion.length > 1000) {
    throw error('La categoría necesita nombre (máx. 80 caracteres) y descripción válida.')
  }
  return { nombre, descripcion }
}

function validarProducto(input) {
  const nombre = typeof input?.nombre === 'string' ? input.nombre.trim() : ''
  const descripcion = typeof input?.descripcion === 'string' ? input.descripcion.trim() : ''
  const imagen = typeof input?.imagen === 'string' ? input.imagen.trim() : ''
  const precio = input?.precio
  const stock = input?.stock
  const categoriaId = Number(input?.categoriaId)
  if (!nombre || nombre.length > 120 || descripcion.length > 3000 || imagen.length > 1500 ||
      !Number.isFinite(precio) || precio < 0.01 || precio > 10000000 ||
      !Number.isSafeInteger(stock) || stock < 0 || stock > 1000000 ||
      !Number.isSafeInteger(categoriaId) || categoriaId < 1) {
    throw error('Producto inválido: revisa nombre, precio, inventario, imagen y categoría.')
  }
  return { nombre, descripcion, imagen, precio, stock, categoriaId }
}

function verCategoria(row) {
  if (!row) return null
  return { id: row.id, nombre: row.nombre, descripcion: row.descripcion }
}

export function instalarAdminCrud(resolvers) {
  // Solo crea una tabla nueva: nunca modifica ni borra pedidos, productos o pagos.
  db.exec(`CREATE TABLE IF NOT EXISTS seguimiento_envios (
    pedido_id INTEGER PRIMARY KEY REFERENCES pedidos(id),
    estado TEXT NOT NULL DEFAULT 'SIN_INICIAR',
    actualizado_en TEXT NOT NULL
  )`)

  // Seguridad adicional: protege el CRUD original aun si todavía no instalaste pagos.js.
  for (const nombre of ['crearProducto', 'actualizarProducto', 'eliminarProducto']) {
    const original = resolvers.Mutation[nombre]
    if (typeof original !== 'function') throw Error(`Falta mutation ${nombre}`)
    resolvers.Mutation[nombre] = (padre, args, contexto, info) => {
      exigirServidor(contexto)
      if (nombre !== 'eliminarProducto') {
        args = { ...args, input: validarProducto(args.input) }
      }
      return original(padre, args, contexto, info)
    }
  }

  resolvers.Mutation.crearCategoria = (_padre, { input }, contexto) => {
    exigirServidor(contexto)
    const data = validarCategoria(input)
    if (db.prepare('SELECT 1 FROM categorias WHERE LOWER(nombre) = LOWER(?)').get(data.nombre)) {
      throw error('Ya existe una categoría con ese nombre.')
    }
    const result = db.prepare('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)')
      .run(data.nombre, data.descripcion)
    return verCategoria(db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid))
  }

  resolvers.Mutation.actualizarCategoria = (_padre, { id, input }, contexto) => {
    exigirServidor(contexto)
    const data = validarCategoria(input)
    if (!db.prepare('SELECT 1 FROM categorias WHERE id = ?').get(id)) throw error('Categoría no encontrada.')
    if (db.prepare('SELECT 1 FROM categorias WHERE LOWER(nombre) = LOWER(?) AND id != ?').get(data.nombre, id)) {
      throw error('Ya existe otra categoría con ese nombre.')
    }
    db.prepare('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?')
      .run(data.nombre, data.descripcion, id)
    return verCategoria(db.prepare('SELECT * FROM categorias WHERE id = ?').get(id))
  }

  resolvers.Mutation.eliminarCategoria = (_padre, { id }, contexto) => {
    exigirServidor(contexto)
    if (db.prepare('SELECT 1 FROM productos WHERE categoria_id = ? LIMIT 1').get(id)) {
      throw error('No puedes eliminar una categoría que contiene productos. Muévelos primero.')
    }
    return db.prepare('DELETE FROM categorias WHERE id = ?').run(id).changes > 0
  }

  // El estado de envío es INDEPENDIENTE del estado del pago.
  resolvers.Pedido.estadoEnvio = (pedido) =>
    db.prepare('SELECT estado FROM seguimiento_envios WHERE pedido_id = ?').get(pedido.id)?.estado || 'SIN_INICIAR'

  resolvers.Mutation.actualizarEnvio = (_padre, { pedidoId, estado }, contexto) => {
    exigirServidor(contexto)
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId)
    if (!pedido) throw error('Pedido no encontrado.')
    if (!['PAGADO', 'ENVIADO'].includes(pedido.estado)) {
      throw error('Primero debe confirmarse el pago. No se envían pedidos pendientes o cancelados.')
    }
    if (!['SIN_INICIAR', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO'].includes(estado)) {
      throw error('Estado de envío inválido.')
    }
    db.prepare(`INSERT INTO seguimiento_envios (pedido_id, estado, actualizado_en)
      VALUES (?, ?, ?)
      ON CONFLICT(pedido_id) DO UPDATE SET estado=excluded.estado, actualizado_en=excluded.actualizado_en`)
      .run(pedidoId, estado, new Date().toISOString())
    // No cambiamos pedidos.estado: Stripe/Mercado Pago siguen siendo fuente de verdad del cobro.
    return estado
  }
}
