
import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import Stripe from 'stripe'
import { consultarBackend } from '../../../../lib/betonosServer'

type ItemPedido = {
  cantidad: number
  precioUnitario: number
  producto: {
    id: string
    nombre: string
  }
}

export const POST: APIRoute = async ({ request }) => {
  // Verificar autenticación con Google
  const sesion = await getSession(request)

  if (!sesion?.user?.email) {
    return Response.json(
      { error: 'Inicia sesión con Google.' },
      { status: 401 }
    )
  }

  try {
    // Recibir productos del carrito
    const { nombre, items } = await request.json()

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      nombre.length > 120 ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 50 ||
      items.some(i =>
        !/^\d+$/.test(String(i.productoId)) ||
        !Number.isSafeInteger(i.cantidad) ||
        i.cantidad < 1 ||
        i.cantidad > 100
      )
    ) {
      return Response.json(
        { error: 'Carrito o nombre inválidos.' },
        { status: 400 }
      )
    }

    // Configuración de Stripe
    const clave = import.meta.env.STRIPE_SECRET_KEY

    if (!clave) {
      throw new Error('Falta STRIPE_SECRET_KEY en .env')
    }

    const stripe = new Stripe(clave)

    // Registrar pedido pendiente en GraphQL
    const data = await consultarBackend(`
      mutation ($input: PedidoInput!) {
        registrarPedido(input: $input) {
          id
          total
          items {
            cantidad
            precioUnitario
            producto {
              id
              nombre
            }
          }
        }
      }
    `, {
      input: {
        clienteNombre: nombre.trim(),
        clienteEmail: sesion.user.email,
        items
      }
    })

    const pedido = data.registrarPedido
    const pedidoId = String(pedido.id)

    // Obtener precios reales desde SQLite
    const renglones: Stripe.Checkout.SessionCreateParams.LineItem[] =
      pedido.items.map((item: ItemPedido) => {
        const centavos = Math.round(
          Number(item.precioUnitario) * 100
        )

        if (!Number.isSafeInteger(centavos) || centavos <= 0) {
          throw new Error('Un artículo tiene un precio inválido.')
        }

        return {
          price_data: {
            currency: 'mxn',
            unit_amount: centavos,
            product_data: {
              name: item.producto.nombre
            }
          },
          quantity: item.cantidad
        }
      })

    // Verificar que los importes coincidan
    const totalCentavos = renglones.reduce(
      (total, item) =>
        total +
        (item.price_data?.unit_amount ?? 0) *
        (item.quantity ?? 1),
      0
    )

    if (totalCentavos !== Math.round(Number(pedido.total) * 100)) {
      throw new Error('El total del pedido no coincide.')
    }

    // Configurar las URLs de retorno
    const base = new URL(
      import.meta.env.SITE_URL || new URL(request.url).origin
    )

    if (import.meta.env.PROD && base.protocol !== 'https:') {
      throw new Error('SITE_URL debe usar HTTPS en producción.')
    }

    // Parámetros oficiales de Stripe Checkout
    const parametros: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',


      customer_email: sesion.user.email,
      client_reference_id: pedidoId,

      metadata: {
        pedidoId
      },

      line_items: renglones,

      success_url:
        `${base.origin}/pago?pedido=${encodeURIComponent(pedidoId)}&stripe=exito`,

      cancel_url:
        `${base.origin}/pago?pedido=${encodeURIComponent(pedidoId)}&stripe=cancelado`
    }

    // Diagnóstico temporal
    console.log('[STRIPE] Modo:', parametros.mode)
    console.log('[STRIPE] Artículos:', parametros.line_items?.length)
    console.log('[STRIPE] Total centavos:', totalCentavos)
    console.log('[STRIPE] Pedido:', pedidoId)

    // Crear sesión de pago
    const checkout = await stripe.checkout.sessions.create(parametros)

    if (!checkout.url) {
      throw new Error('Stripe no devolvió la URL de Checkout.')
    }

    console.log('[STRIPE] Sesión creada:', checkout.id)

    return Response.json({
      pedidoId,
      url: checkout.url
    })

  } catch (error: unknown) {
    const mensaje = error instanceof Error
      ? error.message
      : String(error)

    console.error('[STRIPE] ERROR EXACTO:', mensaje)

    return Response.json({
      error: import.meta.env.DEV
        ? mensaje
        : 'No se pudo iniciar el pago con Stripe.'
    }, { status: 502 })
  }
}
