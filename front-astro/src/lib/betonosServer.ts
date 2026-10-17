// Solo importarlo en rutas Astro del servidor, NUNCA en componentes React.
export async function consultarBackend(query: string, variables = {}) {
  const url = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/graphql'
  const clave = import.meta.env.BETONOS_INTERNAL_KEY
  if (!clave) throw new Error('Falta BETONOS_INTERNAL_KEY en front-astro/.env')

  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-betonos-internal': clave },
    body: JSON.stringify({ query, variables }),
  })
  if (!respuesta.ok) throw new Error(`Backend no disponible: ${respuesta.status}`)
  const resultado = await respuesta.json()
  if (resultado.errors?.length) throw new Error(resultado.errors[0].message)
  return resultado.data
}

export const CONSULTAR_PEDIDO = `
  query ($id: ID!) {
    pedido(id: $id) { id estado total clienteEmail }
  }
`

export const CREAR_TOKEN_ADMIN = `
  mutation ($email: String!) {
    crearTokenAdmin(email: $email)
  }
`
