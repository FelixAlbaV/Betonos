
import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import { consultarBackend } from '../../../lib/betonosServer'

export const POST: APIRoute = async ({ request }) => {
  const sesion = await getSession(request)

  if (!sesion?.user?.email) {
    return Response.json(
      { error: 'Inicia sesión con Google.' },
      { status: 401 }
    )
  }

  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin) {
    return Response.json(
      { error: 'Origen no autorizado.' },
      { status: 403 }
    )
  }

  try {
    const { nombre, items } = await request.json()

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      nombre.length > 120 ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 50 ||
      items.some((i: any) =>
        !/^\d+$/.test(String(i.productoId)) ||
        !Number.isSafeInteger(i.cantidad) ||
        i.cantidad < 1 ||
        i.cantidad > 100
      )
    ) {
      return Response.json(
        { error: 'Nombre o carrito inválidos.' },
        { status: 400 }
      )
    }

    if (!import.meta.env.MP_ACCESS_TOKEN) {
      throw new Error('Falta MP_ACCESS_TOKEN en front-astro/.env')
    }

    const data = await consultarBackend(`
      mutation ($input: PedidoInput!) {
        registrarPedido(input: $input) {
          id
          total
        }
      }
    `, {
      input: {
        clienteNombre: nombre.trim(),
        clienteEmail: sesion.user.email,
        items
      }
    })

    const { id, total } = data.registrarPedido

    if (
      !/^\d+$/.test(String(id)) ||
      !Number.isFinite(total) ||
      total <= 0
    ) {
      throw new Error('Pedido generado con total inválido.')
    }

    return Response.json({
      pedidoId: String(id),
      total
    })

  } catch (error) {
    console.error('[Mercado Pago: preparar]', error)

    return Response.json({
      error: import.meta.env.DEV && error instanceof Error
        ? error.message
        : 'No se pudo preparar el pago con Mercado Pago.'
    }, { status: 502 })
  }
}
