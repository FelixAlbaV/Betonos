// src/graphql/client.js
// Cliente mínimo para consultar el backend GraphQL con fetch nativo.
// No se usa Apollo Client aquí a propósito: el flujo (P2) pide practicar
// fetching manual con useEffect / eventos.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/graphql'

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
