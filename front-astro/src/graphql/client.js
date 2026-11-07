// src/graphql/client.js
// Cliente mínimo para consultar el backend GraphQL con fetch nativo.
// No se usa Apollo Client aquí a propósito: el flujo (P2) pide practicar
// fetching manual con useEffect / eventos.

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/graphql'

// Misma URL del backend, pero en su versión WebSocket (para Subscriptions).
export const WS_URL = API_URL.replace('https://', 'wss://').replace('http://', 'ws://')

export async function gqlRequest(query, variables = {}) {
  const respuesta = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const json = await respuesta.json()

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message)
  }

  return json.data
}

// ---------- Queries ----------

export const OBTENER_CATEGORIAS = `
  query ObtenerCategorias {
    categorias {
      id
      nombre
      descripcion
    }
  }
`

export const OBTENER_PRODUCTOS_POR_CATEGORIA = `
  query ObtenerProductos($categoriaId: ID, $buscar: String) {
    productos(categoriaId: $categoriaId, buscar: $buscar, limit: 50) {
      id
      nombre
      precio
      stock
      imagen
    }
  }
`

export const OBTENER_PRODUCTO = `
  query ObtenerProducto($id: ID!) {
    producto(id: $id) {
      id
      nombre
      descripcion
      precio
      stock
      imagen
      categoria {
        id
        nombre
      }
    }
  }
`

// ---------- Subscriptions ----------
// Pública: cualquier cliente viendo la tienda puede escuchar cuándo el admin
// cambia un producto (stock, precio, etc.), sin recargar la página.

export const PRODUCTO_ACTUALIZADO_SUBSCRIPCION = `
  subscription {
    productoActualizado {
      id
      nombre
      precio
      stock
      imagen
    }
  }
`

// ---------- Mutations ----------

export const REGISTRAR_PEDIDO = `
  mutation RegistrarPedido($input: PedidoInput!) {
    registrarPedido(input: $input) {
      id
      estado
      total
      fecha
      items {
        cantidad
        subtotal
        producto {
          nombre
        }
      }
    }
  }
`
