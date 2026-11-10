// src/mcp/servidorMcp.js
//
// Servidor MCP (Model Context Protocol) de Betonos.
// Expone el catálogo y las ventas como "herramientas" que un asistente de
// IA (Claude Desktop, por ejemplo) puede consultar, usando la misma base
// de datos SQLite que ya usa el backend de GraphQL.
//
// Se corre aparte, con: npm run mcp
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { buscarProductos, resumenVentas } from './herramientas.js'

const server = new McpServer({
  name: 'betonos-mcp',
  version: '1.0.0',
})

server.registerTool(
  'buscar_productos',
  {
    title: 'Buscar productos',
    description: 'Busca audífonos en el catálogo de Betonos por nombre o categoría.',
    inputSchema: {
      texto: z.string().optional().describe('Palabra a buscar en el nombre del producto'),
    },
  },
  async ({ texto }) => {
    const filas = buscarProductos(texto)
    const lista = filas.length
      ? filas.map((p) => `${p.nombre} — $${p.precio} (stock: ${p.stock})`).join('\n')
      : 'No se encontraron productos.'
    return { content: [{ type: 'text', text: lista }] }
  }
)

server.registerTool(
  'resumen_ventas',
  {
    title: 'Resumen de ventas',
    description: 'Da el total de pedidos pagados y el importe vendido en Betonos.',
    inputSchema: {},
  },
  async () => {
    const fila = resumenVentas()
    return {
      content: [{
        type: 'text',
        text: `Pedidos pagados: ${fila.pedidos}. Total vendido: $${fila.total}.`,
      }],
    }
  }
)

const transport = new StdioServerTransport()
await server.connect(transport)
