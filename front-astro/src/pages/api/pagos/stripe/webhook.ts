import type { APIRoute } from 'astro'
import Stripe from 'stripe'
import { consultarBackend } from '../../../../lib/betonosServer'

export const POST: APIRoute = async ({ request }) => {
  const token = import.meta.env.STRIPE_SECRET_KEY
  const secreto = import.meta.env.STRIPE_WEBHOOK_SECRET
  const firma = request.headers.get('stripe-signature')
  if (!token || !secreto) {
    return Response.json({ error: 'Webhook no configurado.' }, { status: 503 })
  }
  if (!firma) {
    return Response.json({ error: 'Falta la firma de Stripe.' }, { status: 400 })
  }

  const stripe = new Stripe(token)
  let evento: Stripe.Event
  try {
    evento = stripe.webhooks.constructEvent(await request.text(), firma, secreto)
  } catch {
    return Response.json({ error: 'Firma de Stripe inválida.' }, { status: 400 })
  }

  if (evento.type !== 'checkout.session.completed' &&
      evento.type !== 'checkout.session.async_payment_succeeded') {
    return Response.json({ recibido: true })
  }

  const checkout = evento.data.object as Stripe.Checkout.Session
  if (checkout.payment_status !== 'paid') {
    return Response.json({ recibido: true, estado: checkout.payment_status })
  }

  const pedidoId = checkout.metadata?.pedidoId
  if (!pedidoId || !/^\d+$/.test(pedidoId) ||
      checkout.client_reference_id !== pedidoId ||
      checkout.mode !== 'payment' || checkout.currency?.toLowerCase() !== 'mxn' ||
      typeof checkout.amount_total !== 'number' ||
      !Number.isSafeInteger(checkout.amount_total) || checkout.amount_total <= 0) {
    return Response.json({ error: 'Datos del pago inválidos.' }, { status: 400 })
  }

  try {
    await consultarBackend(`
      mutation ($pedidoId: ID!, $sesionId: String!, $montoCentavos: Int!, $moneda: String!) {
        confirmarPagoStripe(
          pedidoId: $pedidoId, sesionId: $sesionId,
          montoCentavos: $montoCentavos, moneda: $moneda
        ) { id estado }
      }
    `, {
      pedidoId,
      sesionId: checkout.id,
      montoCentavos: checkout.amount_total,
      moneda: 'mxn',
    })
    return Response.json({ recibido: true })
  } catch (error) {
    console.error('[Stripe: pago aprobado requiere revisión]', error)
    return Response.json({ error: 'No se pudo confirmar el pedido.' }, { status: 500 })
  }
}
