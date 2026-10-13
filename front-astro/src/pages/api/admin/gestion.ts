import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import { consultarBackend } from '../../../lib/betonosServer'

export const prerender = false

const texto = (dato: unknown, max: number, obligatorio = false) => {
  if (typeof dato !== 'string') throw Error('El campo de texto no es válido.')
  const valor = dato.trim()
  if (valor.length > max || (obligatorio && !valor)) throw Error('Revisa el texto ingresado.')
  return valor
}

const entero = (dato: unknown, min: number, max: number) => {
  const n = Number(dato)
  if (dato === '' || dato === null || dato === undefined || !Number.isSafeInteger(n) || n < min || n > max) {
    throw Error('Número entero inválido.')
  }
  return n
}

const dinero = (dato: unknown) => {
  const n = Number(dato)
  if (dato === '' || dato === null || dato === undefined || !Number.isFinite(n) || n < .01 || n > 10000000) {
    throw Error('Precio inválido.')
  }
  return Math.round(n * 100) / 100
}

export const POST: APIRoute = async ({ request }) => {
  const sesion = await getSession(request)
  const correo = sesion?.user?.email?.trim().toLowerCase()
  const permitidos = (import.meta.env.ADMIN_EMAILS || '')
    .split(',').map((v: string) => v.trim().toLowerCase()).filter(Boolean)

  if (!correo || !permitidos.includes(correo)) {
    return Response.json({ error: 'Acceso denegado.' }, { status: 403 })
  }
  // Comprobación de origen explícita además de la protección CSRF de Astro.
  const origin = request.headers.get('origin')
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 })
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'Se requiere JSON.' }, { status: 415 })
  }

  try {
    const raw = await request.text()
    if (raw.length > 12000) throw Error('Solicitud demasiado grande.')
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('Solicitud inválida.')

    const id = () => String(entero(body.id, 1, Number.MAX_SAFE_INTEGER))
    const categoria = () => ({
      nombre: texto(body.nombre, 80, true),
      descripcion: texto(body.descripcion, 1000),
    })
    const producto = () => ({
      nombre: texto(body.nombre, 120, true),
      descripcion: texto(body.descripcion, 3000),
      imagen: texto(body.imagen, 1500),
      precio: dinero(body.precio),
      stock: entero(body.stock, 0, 1000000),
      categoriaId: String(entero(body.categoriaId, 1, Number.MAX_SAFE_INTEGER)),
    })

    let query = ''
    let variables: Record<string, unknown> = {}
    switch (body.accion) {
      case 'producto.crear':
        query = `mutation($input: ProductoInput!) { crearProducto(input: $input) { id } }`
        variables = { input: producto() }
        break
      case 'producto.editar':
        query = `mutation($id: ID!, $input: ProductoInput!) { actualizarProducto(id: $id, input: $input) { id } }`
        variables = { id: id(), input: producto() }
        break
      case 'producto.eliminar':
        query = `mutation($id: ID!) { eliminarProducto(id: $id) }`
        variables = { id: id() }
        break
      case 'categoria.crear':
        query = `mutation($input: CategoriaInput!) { crearCategoria(input: $input) { id } }`
        variables = { input: categoria() }
        break
      case 'categoria.editar':
        query = `mutation($id: ID!, $input: CategoriaInput!) { actualizarCategoria(id: $id, input: $input) { id } }`
        variables = { id: id(), input: categoria() }
        break
      case 'categoria.eliminar':
        query = `mutation($id: ID!) { eliminarCategoria(id: $id) }`
        variables = { id: id() }
        break
      case 'pedido.envio':
        if (!['SIN_INICIAR', 'PREPARANDO', 'EN_CAMINO', 'ENTREGADO'].includes(body.estado)) {
          throw Error('Estado de envío no permitido.')
        }
        query = `mutation($pedidoId: ID!, $estado: EstadoEnvio!) { actualizarEnvio(pedidoId: $pedidoId, estado: $estado) }`
        variables = { pedidoId: id(), estado: body.estado }
        break
      default:
        return Response.json({ error: 'Acción desconocida.' }, { status: 400 })
    }

    const resultado = await consultarBackend(query, variables)
    return Response.json({ ok: true, resultado }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : 'No se pudo guardar el cambio.'
    console.error('[Admin CRUD]', mensaje)
    return Response.json({ error: mensaje }, { status: 400 })
  }
}
