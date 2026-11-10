// src/mcp/herramientas.js
//
// La lógica de las dos herramientas MCP, separada del protocolo en sí.
// Así las usa tanto el servidor MCP real (servidorMcp.js, habla por stdio
// con un asistente de IA) como el endpoint de demo del sitio (que solo es
// una manera de verlas funcionar en el navegador, sin meterse al protocolo).
import { db } from '../db.js'

export function buscarProductos(texto) {
  return texto
    ? db.prepare('SELECT nombre, precio, stock FROM productos WHERE nombre LIKE ? LIMIT 10').all(`%${texto}%`)
    : db.prepare('SELECT nombre, precio, stock FROM productos LIMIT 10').all()
}

export function resumenVentas() {
  return db.prepare(`
    SELECT COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS total
    FROM pedidos WHERE estado = 'PAGADO'
  `).get()
}
