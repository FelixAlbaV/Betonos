import type { APIRoute } from 'astro'
import { getSession } from 'auth-astro/server'
import Stripe from 'stripe'
import { consultarBackend } from '../../../../lib/betonosServer'

type ItemPedido = {
  cantidad: number
  precioUnitario: number
  producto: { id: string; nombre: string }
}

export const POST: APIRoute = async ({ request }) => {
  const sesion = await getSession(request)
  if (!sesion?.user?.email) return Response.json({ error: 'Inicia sesión con Google.' }, { status: 401 })

  const origen = request.headers.get('origin')
  if (origen && origen !== new URL(request.url).origin) {
    return Response.json({ error: 'Origen no autorizado.' }, { status: 403 })
  }

  try {
    const { nombre, items } = await request.json()
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 120 ||
        !Array.isArray(items) || !items.length || items.length > 50 ||
        items.some((i: any) => !/^\d+$/.test(String(i.productoId)) ||
          !Number.isSafeInteger(i.cantidad) || i.cantidad < 1 || i.cantidad > 100)) {
      return Response.json({ error: 'Nombre o carrito inválidos.' }, { status: 400 })
    }
    const clave = import.meta.env.STRIPE_SECRET_KEY
    if (!clave) throw new Error('Falta STRIPE_SECRET_KEY en front-astro/.env')

    // La fuente de precios es SQLite: el cliente nunca decide el monto.
    const data = await consultarBackend(`
      mutation ($input: PedidoInput!) {
        registrarPedido(input: $input) {
          id total items { cantidad precioUnitario producto { id nombre } }
        }
      }
    `, { input: { clienteNombre: nombre.trim(), clienteEmail: sesion.user.email, items } })
    const pedido = data.registrarPedido
    const pedidoId = String(pedido.id)
    const lineas: Stripe.Checkout.SessionCreateParams.LineItem[] = pedido.items.map((i: ItemPedido) => ({
      price_data: {
        currency: 'mxn',
        unit_amount: Math.round(i.precioUnitario * 100),
        product_data: { name: i.producto.nombre },
      },
      quantity: i.cantidad,
    }))
    const centavos = lineas.reduce((total, item) => total +
      (item.price_data?.unit_amount ?? 0) * (item.quantity ?? 1), 0)
    if (!lineas.length || lineas.some(i => !i.price_data?.unit_amount || i.price_data.unit_amount <= 0) ||
        !Number.isSafeInteger(centavos) || centavos !== Math.round(pedido.total * 100)) {
      throw new Error('El total del pedido no coincide.')
    }

    const base = new URL(import.meta.env.SITE_URL || new URL(request.url).origin)
    if (import.meta.env.PROD && base.protocol !== 'https:') {
      throw new Error('SITE_URL debe usar HTTPS en producción.')
    }
    const stripe = new Stripe(clave)
    const checkout = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      allowed_payment_method_types: ['card'],
      redirect_on_completion: 'if_required',
      return_url: `${base.origin}/pago?pedido=${encodeURIComponent(pedidoId)}&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: sesion.user.email,
      client_reference_id: pedidoId,
      metadata: { pedidoId },
      line_items: lineas,
    })
    if (!checkout.client_secret) throw new Error('Stripe no devolvió el secreto del formulario.')
    return Response.json({ pedidoId, clientSecret: checkout.client_secret })
  } catch (error) {
    console.error('[Stripe embedded: iniciar]', error)
    return Response.json({ error: import.meta.env.DEV && error instanceof Error
      ? error.message : 'No se pudo iniciar el pago con Stripe.' }, { status: 502 })
  }
}
