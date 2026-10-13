import { GraphQLError } from 'graphql'
import { db } from './db.js'

function exigirServidor(contexto) {
  if (!contexto?.autorizado) {
    throw new GraphQLError('Consulta privada: autorización del servidor requerida.', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
}

function normalizarCorreo(correo) {
  if (typeof correo !== 'string') throw new GraphQLError('Correo inválido.')
  const valor = correo.trim().toLowerCase()
  if (!valor || valor.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    throw new GraphQLError('Correo inválido.')
  }
  return valor
}

const mapearPedido = (row) => ({
  id: row.id,
  clienteNombre: row.cliente_nombre,
  clienteEmail: row.cliente_email,
  fecha: row.fecha,
  estado: row.estado,
  total: row.total,
})

// Solo instala dos consultas nuevas. No cambia los pedidos, stock, cobros ni CRUD.
// Astro obtiene el correo de la sesión Google, NO del navegador.
export function instalarPanelUsuario(resolvers) {
  resolvers.Query.misPedidos = (_padre, { correo, limit, offset }, contexto) => {
    exigirServidor(contexto)
    const email = normalizarCorreo(correo)
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25 ||
        !Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) {
      throw new GraphQLError('Paginación inválida.')
    }
    return db.prepare(`
      SELECT * FROM pedidos
      WHERE LOWER(TRIM(cliente_email)) = ?
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `).all(email, limit, offset).map(mapearPedido)
  }

  resolvers.Query.resumenMisPedidos = (_padre, { correo }, contexto) => {
    exigirServidor(contexto)
    const email = normalizarCorreo(correo)
    const r = db.prepare(`
      SELECT
        COUNT(*) AS totalPedidos,
        SUM(CASE WHEN estado IN ('PAGADO', 'ENVIADO') THEN 1 ELSE 0 END) AS pedidosPagados,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS pedidosPendientes,
        SUM(CASE WHEN estado IN ('PAGADO', 'ENVIADO') THEN total ELSE 0 END) AS totalGastado
      FROM pedidos
      WHERE LOWER(TRIM(cliente_email)) = ?
    `).get(email)
    return {
      totalPedidos: r.totalPedidos,
      pedidosPagados: r.pedidosPagados || 0,
      pedidosPendientes: r.pedidosPendientes || 0,
      totalGastado: Math.round(Number(r.totalGastado || 0) * 100) / 100,
    }
  }
}
